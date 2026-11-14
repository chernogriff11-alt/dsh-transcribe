// dsh-transcribe — host half.
//
// Turns microphone audio from the composer into text with the local
// transcribe.cpp runtime (Parakeet Ultra GGUF). No cloud, no API key.
//
// Routes (same-origin, behind the harness auth fence):
//   GET  /dsh-transcribe/status      runtime + model readiness and resolved paths
//   POST /dsh-transcribe/transcribe  raw PCM16LE mono body -> { text }
//   POST /dsh-transcribe/partial     same body, used for the live preview strip
//   POST /dsh-transcribe/wake        short utterance -> { hit, text } for the wake phrase
//   POST /dsh-transcribe/fix         { text } -> { text } spelling/grammar fixed by the chat model
//   GET  /dsh-transcribe/sound?f=warm-start   bundled UI cue (scheme-event or voice-*)
//
// The client records 16 kHz mono PCM16 and posts the whole utterance once,
// so there is no session state here: one request, one temp WAV, one process.

import { spawn } from 'node:child_process'
import { existsSync, readdirSync, createReadStream, statSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-transcribe'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PREFIX = '/dsh-transcribe'
const MAX_BODY_BYTES = 64 * 1024 * 1024
const MAX_WAKE_BYTES = 4 * 1024 * 1024
const MAX_FIX_BYTES = 256 * 1024
const MAX_FIX_CHARS = 8000
const FIX_TIMEOUT_MS = 45000
const SAMPLE_RATE = 16000
const DEFAULT_WAKE_PHRASE = 'окей дипсик'
/** The documented tolerance: at most two words may precede the phrase. */
const MAX_LEADING_WORDS = 2

const GRAMMAR_SYSTEM = [
  'Ты корректор текста. Исправь орфографические, пунктуационные и грамматические ошибки на языке текста.',
  'Отвечай на языке исходного текста: не переводи и не пересказывай.',
  'Не меняй смысл, порядок слов, стиль и оформление. Не добавляй и не удаляй содержание.',
  'Не меняй тип предложения: утверждение остаётся утверждением, вопрос — вопросом.',
  'Если текст уже корректен, верни его без изменений.',
  'Верни только исправленный текст: без пояснений, без кавычек, без markdown и без префиксов.',
].join('\n')

const PROMPT_SYSTEM = [
  'Ты редактор промптов. Преврати сказанное в ясный и точный промпт для ИИ-ассистента.',
  'Сохрани намерение автора. Не добавляй факты, числа, имена, ссылки и требования, которых не было.',
  'Убери слова-заполнители, повторы и оговорки вроде «ну», «типа», «вот», «как бы».',
  'Сделай задачу явной — что сделать, при каких условиях, что считать результатом, — но только из сказанного.',
  'Если просьба короткая, оставь промпт коротким: одно-три предложения. Не превращай его в шаблон с заголовками.',
  'Пиши на языке автора. Верни только промпт: без пояснений, без markdown-заголовков, без кавычек.',
].join('\n')

const REWRITE_MODES = { grammar: GRAMMAR_SYSTEM, prompt: PROMPT_SYSTEM }

const DEFAULTS = {
  cliPath: '',
  modelPath: '',
  language: '',
  timeoutMs: 180000,
  llmProvider: '',
  llmModel: '',
  // Схема звуков по умолчанию для тех браузеров, где пользователь ещё не выбирал.
  // Пустая строка — звук выключен. Клиент хранит свой выбор локально и перекрывает это.
  soundScheme: '',
}

/** Разрешённые имена звуковых файлов: схема-событие либо голосовая подсказка. */
const SOUND_NAME = /^(?:(?:warm|wooden|airy|muted)-(?:start|stop|done|error)|voice-(?:start|done))$/

/**
 * Same-origin fence on top of the harness trust check: a cross-site page must
 * not drive a 64 MB upload or spend the user's model tokens.
 */
function sameOrigin(req) {
  const site = String(req.headers['sec-fetch-site'] || '')
  if (site && site !== 'same-origin' && site !== 'none') return false
  const origin = req.headers.origin
  // "null" and exotic schemes are not proof of a cross-site page, and a reverse
  // proxy may rewrite Host — the harness trust fence still guards those.
  if (!origin || origin === 'null') return true
  try {
    return new URL(origin).host === String(req.headers.host || '')
  } catch {
    return true
  }
}

function sendJson(res, code, body) {
  const text = JSON.stringify(body)
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(text)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const parts = []
    let size = 0
    let settled = false
    // The request is still drained after the limit, so the client gets a real
    // 413 instead of a reset socket; the extra bytes are read and dropped.
    req.on('data', (chunk) => {
      if (settled) return
      size += chunk.length
      if (size > limit) {
        settled = true
        reject(Object.assign(new Error('payload too large'), { code: 'payload-too-large' }))
        return
      }
      parts.push(chunk)
    })
    req.on('end', () => {
      if (settled) return
      settled = true
      resolve(Buffer.concat(parts))
    })
    req.on('error', (err) => {
      if (settled) return
      settled = true
      reject(err)
    })
    // An aborted upload never emits 'end': without this the route waits forever.
    req.on('close', () => {
      if (settled) return
      settled = true
      reject(Object.assign(new Error('request aborted'), { code: 'request-aborted' }))
    })
  })
}

/** 44-byte RIFF header + PCM16LE mono payload. */
function wavFromPcm(pcm, sampleRate) {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

/** Letters and digits only, lowercased — the same normalisation the client uses. */
function normalizeSpeech(text) {
  return String(text || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

function editDistance(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = new Array(b.length + 1)
  let cur = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    const swap = prev
    prev = cur
    cur = swap
  }
  return prev[b.length]
}

/**
 * True when the phrase is heard at the start of the transcript.
 *
 * Recognition splits and mangles short phrases ("окей, ди псик"), so the
 * comparison is fuzzy: words of the transcript are accumulated from the start
 * (allowing at most two words before the phrase, as documented) and accepted
 * when the running prefix is within a small edit distance of the phrase.
 */
function phraseHeard(text, phrase) {
  const p = normalizeSpeech(phrase)
  if (!p) return false
  const words = String(text || '').match(/[\p{L}\p{N}]+/gu) || []
  if (!words.length) return false
  const tolerance = p.length >= 8 ? 2 : 1
  const minLen = Math.max(1, p.length - tolerance)
  const maxLen = p.length + tolerance
  const starts = Math.min(MAX_LEADING_WORDS + 1, words.length)
  for (let start = 0; start < starts; start++) {
    let acc = ''
    for (let i = start; i < words.length; i++) {
      acc += normalizeSpeech(words[i])
      if (acc.length < minLen) continue
      if (acc.length > maxLen) break
      if (editDistance(acc, p) <= tolerance) return true
    }
  }
  return false
}

/** Strip the wrappers a chat model likes to add around a corrected paragraph. */
function cleanFixedText(raw) {
  let text = String(raw || '').trim()
  text = text.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim()
  text = text.replace(/^(?:исправленный|отредактированный|готовый)\s+текст\s*:\s*/i, '').trim()
  if (text.length >= 2) {
    const first = text[0]
    const last = text[text.length - 1]
    if ((first === '"' && last === '"') || (first === '«' && last === '»')) text = text.slice(1, -1).trim()
  }
  return text
}

/**
 * The engine has no "auto" value: leaving `-l` out is what makes it detect the
 * language itself, so an empty or unknown hint is passed as no hint at all.
 */
function languageArgs(language) {
  const code = String(language || '').trim().toLowerCase()
  if (!code || code === 'auto' || code === 'any') return []
  return ['-l', code]
}

/**
 * The request may carry a `lang` hint, otherwise the plugin config decides.
 * Empty means "no hint at all", so the engine detects the language itself —
 * the documented default; it must not silently become a Russian hint.
 */
function languageHint(param, configured) {
  return String(param || configured || '').trim()
}

/**
 * The engine only accepts 16 kHz mono PCM. A foreign `sr` means the caller has
 * to resample first, so it is a client error (400), never a crash in the WAV
 * header writer and never a silently wrong duration in the response.
 */
function readSampleRate(url) {
  const raw = url.searchParams.get('sr')
  if (raw === null || raw === '') return SAMPLE_RATE
  const value = Number(raw)
  if (!Number.isFinite(value) || Math.round(value) !== value || value !== SAMPLE_RATE) return null
  return SAMPLE_RATE
}

/** Run transcribe-cli once and return the plain transcript. */
function runCli(cliPath, modelPath, language, wavPath, timeoutMs) {
  return new Promise((resolve, reject) => {
    const args = ['-m', modelPath, ...languageArgs(language), '--timestamps', 'none', wavPath]
    let child
    try {
      child = spawn(cliPath, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (err) {
      reject(err)
      return
    }
    let out = ''
    let err = ''
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try { child.kill() } catch {}
      reject(new Error(`transcribe timed out after ${timeoutMs} ms`))
    }, timeoutMs)

    child.stdout.on('data', (d) => { out += d.toString('utf8') })
    child.stderr.on('data', (d) => { err += d.toString('utf8') })
    child.on('error', (e) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(e)
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error(err.trim() || `transcribe-cli exited with ${code}`))
        return
      }
      const line = out.split(/\r?\n/).find((l) => l.startsWith('text:'))
      resolve(line ? line.slice(5).trim() : '')
    })
  })
}

function firstExisting(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      if (existsSync(candidate)) return candidate
    } catch { /* ignore */ }
  }
  return null
}

/** Any *.gguf inside a directory, preferring Q8_0 then Q4_K_M. */
function ggufIn(dir) {
  try {
    if (!existsSync(dir)) return []
    const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.gguf'))
    const rank = (f) => (f.includes('Q8_0') ? 0 : f.includes('Q6_K') ? 1 : f.includes('Q5_K') ? 2 : f.includes('Q4_K') ? 3 : 4)
    return files.sort((a, b) => rank(a) - rank(b)).map((f) => path.join(dir, f))
  } catch {
    return []
  }
}

/** Hugging Face cache snapshots for the parakeet-ultra GGUF repo. */
function hfCacheModels() {
  const home = os.homedir()
  const roots = [
    path.join(home, '.cache', 'huggingface', 'hub'),
    path.join(home, 'AppData', 'Local', 'huggingface', 'hub'),
  ]
  const found = []
  for (const root of roots) {
    try {
      if (!existsSync(root)) continue
      for (const entry of readdirSync(root)) {
        if (!entry.startsWith('models--handy-computer--parakeet-ultra-gguf')) continue
        const snapshots = path.join(root, entry, 'snapshots')
        if (!existsSync(snapshots)) continue
        for (const snap of readdirSync(snapshots)) {
          found.push(...ggufIn(path.join(snapshots, snap)))
        }
      }
    } catch { /* ignore */ }
  }
  return found
}

/** Deliberately no PATH lookup: a writable directory on PATH could swap the engine. */
function resolveCli(config) {
  return firstExisting([
    config.cliPath,
    path.join(os.homedir(), '.dsh', 'bin', 'transcribe-cli.exe'),
    path.join(PACKAGE_ROOT, 'bin', 'transcribe-cli.exe'),
  ])
}

function resolveModel(config) {
  const home = os.homedir()
  return firstExisting([
    config.modelPath,
    ...ggufIn(path.join(home, '.dsh', 'models', 'parakeet-ultra')),
    ...ggufIn(path.join(PACKAGE_ROOT, 'models')),
    ...hfCacheModels(),
  ])
}

export function apply(root, config = {}) {
  const options = { ...DEFAULTS, ...(config || {}) }
  const warn = (message) => {
    try { console.log(`[dsh-transcribe] ${message}`) } catch {}
  }

  // `connection` must be injected: the trust fence below reads it, and a
  // service that is not in the inject list is not visible on the child ctx.
  // Without it the fence is null and every request is refused (fail-closed).
  root.inject(['webServer', 'connection'], (ctx) => {
    const fence = () => {
      try { return ctx.connection?.requestRejection?.bind(ctx.connection) ?? null } catch { return null }
    }

    async function transcribeBody(body, sampleRate, language) {
      const cliPath = resolveCli(options)
      const modelPath = resolveModel(options)
      if (!cliPath) {
        const err = new Error('transcribe-cli.exe не найден. Положите его в ~/.dsh/bin/ или укажите cliPath в настройках плагина.')
        err.code = 'cli-missing'
        throw err
      }
      if (!modelPath) {
        const err = new Error('Модель parakeet-ultra не найдена. Положите .gguf в ~/.dsh/models/parakeet-ultra/ или укажите modelPath.')
        err.code = 'model-missing'
        throw err
      }
      const started = Date.now()
      const dir = await mkdtemp(path.join(os.tmpdir(), 'dsh-tr-'))
      const wavPath = path.join(dir, 'speech.wav')
      try {
        await writeFile(wavPath, wavFromPcm(body, sampleRate))
        const text = await runCli(cliPath, modelPath, language, wavPath, options.timeoutMs)
        return {
          text,
          ms: Date.now() - started,
          seconds: Math.round((body.length / 2 / sampleRate) * 10) / 10,
          language,
        }
      } finally {
        // Awaited: an unawaited rm loses the race with the child's last handle
        // on Windows and leaves the WAV with the user's speech on disk.
        await rm(dir, { recursive: true, force: true }).catch(() => {})
      }
    }

    /**
     * Fix spelling, punctuation and grammar with the model the user already
     * chats with. The text therefore leaves the machine for that provider —
     * the client labels the button accordingly.
     */
    async function rewriteText(ctx, text, system) {
      const llm = typeof ctx.get === 'function' ? ctx.get('llm') : undefined
      if (!llm || typeof llm.stream !== 'function') {
        const err = new Error('Сервис моделей DSH недоступен — исправление текста работает только внутри DSH.')
        err.code = 'llm-missing'
        throw err
      }
      let provider = options.llmProvider
      let model = options.llmModel
      if (!provider || !model) {
        let selection = null
        try {
          const defaults = typeof ctx.get === 'function' ? ctx.get('agentDefaultModel') : undefined
          selection = defaults && typeof defaults.currentSelection === 'function'
            ? defaults.currentSelection()
            : null
        } catch {
          selection = null
        }
        provider = provider || (selection && selection.provider)
        model = model || (selection && selection.model)
      }
      if (!provider || !model) {
        const err = new Error('Не выбрана модель: укажите llmProvider и llmModel в настройках плагина.')
        err.code = 'llm-route'
        throw err
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), FIX_TIMEOUT_MS)
      let out = ''
      try {
        const stream = llm.stream({
          provider,
          model,
          system,
          messages: [{ role: 'user', content: [{ type: 'text', text }] }],
          maxTokens: Math.min(4096, Math.max(512, Math.ceil(text.length / 2) + 256)),
          signal: controller.signal,
        })
        for await (const chunk of stream) {
          if (!chunk) continue
          if (chunk.type === 'text-delta') out += chunk.text
          else if (chunk.type === 'finish' && chunk.reason && chunk.reason.kind === 'error') {
            throw new Error((chunk.reason.failure && chunk.reason.failure.message) || 'модель вернула ошибку')
          }
        }
      } catch (err) {
        if (err && (err.name === 'AbortError' || err.code === 'ABORT_ERR')) {
          const timeout = new Error(`Модель не ответила за ${Math.round(FIX_TIMEOUT_MS / 1000)} с.`)
          timeout.code = 'llm-timeout'
          throw timeout
        }
        throw err
      } finally {
        clearTimeout(timer)
      }
      return { text: cleanFixedText(out), provider, model }
    }

    async function route(req, res) {
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      const op = url.pathname.slice(PREFIX.length).replace(/^\/+/, '')
      const check = fence()
      if (!check) {
        // Fail closed: without the harness trust check this route cannot tell
        // its own page from a foreign one, so it serves nobody.
        sendJson(res, 403, { ok: false, error: 'connection trust service unavailable' })
        return
      }
      let code
      try { code = check(req) } catch { code = 403 }
      if (code) {
        sendJson(res, typeof code === 'number' ? code : 403, { ok: false, error: 'rejected' })
        return
      }
      if (!sameOrigin(req)) {
        sendJson(res, 403, { ok: false, error: 'cross-origin request' })
        return
      }

      try {
        if (op === 'status' || op === '') {
          const cliPath = resolveCli(options)
          const modelPath = resolveModel(options)
          sendJson(res, 200, {
            ok: true,
            ready: Boolean(cliPath && modelPath),
            cli: { path: cliPath, present: Boolean(cliPath) },
            model: { path: modelPath, present: Boolean(modelPath) },
            language: options.language,
            sound: { scheme: options.soundScheme || '' },
            search: {
              cli: ['config.cliPath', '~/.dsh/bin/transcribe-cli.exe', '<plugin>/bin/transcribe-cli.exe'],
              model: ['config.modelPath', '~/.dsh/models/parakeet-ultra/*.gguf', '<plugin>/models/*.gguf', 'HF cache'],
            },
          })
          return
        }

        if (op === 'fix') {
          const body = await readBody(req, MAX_FIX_BYTES)
          let payload
          try {
            payload = JSON.parse(body.toString('utf8') || '{}')
          } catch {
            sendJson(res, 400, { ok: false, error: 'bad json' })
            return
          }
          const mode = String((payload && payload.mode) || 'grammar').toLowerCase()
          const system = REWRITE_MODES[mode]
          if (!system) {
            sendJson(res, 400, { ok: false, error: `unknown mode ${mode}` })
            return
          }
          const text = String((payload && payload.text) || '').trim()
          if (!text) {
            sendJson(res, 400, { ok: false, error: 'empty text' })
            return
          }
          if (text.length > MAX_FIX_CHARS) {
            sendJson(res, 413, { ok: false, error: `Слишком длинный текст: ${text.length} символов, максимум ${MAX_FIX_CHARS}.` })
            return
          }
          const started = Date.now()
          const result = await rewriteText(ctx, text, system)
          sendJson(res, 200, {
            ok: true,
            mode,
            text: result.text,
            changed: result.text !== text,
            model: { provider: result.provider, model: result.model },
            ms: Date.now() - started,
          })
          return
        }

        if (op === 'wake') {
          const body = await readBody(req, MAX_WAKE_BYTES)
          if (!body.length) {
            sendJson(res, 400, { ok: false, error: 'empty audio' })
            return
          }
          const sampleRate = readSampleRate(url)
          if (!sampleRate) {
            sendJson(res, 400, { ok: false, error: `sample rate must be ${SAMPLE_RATE} Hz mono` })
            return
          }
          const language = languageHint(url.searchParams.get('lang'), options.language)
          const phrase = (url.searchParams.get('phrase') || DEFAULT_WAKE_PHRASE).trim() || DEFAULT_WAKE_PHRASE
          const result = await transcribeBody(body, sampleRate, language)
          sendJson(res, 200, { ok: true, hit: phraseHeard(result.text, phrase), phrase, ...result })
          return
        }

        if (op === 'transcribe' || op === 'partial') {
          const body = await readBody(req, MAX_BODY_BYTES)
          if (!body.length) {
            sendJson(res, 400, { ok: false, error: 'empty audio' })
            return
          }
          const sampleRate = readSampleRate(url)
          if (!sampleRate) {
            sendJson(res, 400, { ok: false, error: `sample rate must be ${SAMPLE_RATE} Hz mono` })
            return
          }
          const language = languageHint(url.searchParams.get('lang'), options.language)
          const result = await transcribeBody(body, sampleRate, language)
          sendJson(res, 200, { ok: true, ...result })
          return
        }

        if (op === 'sound') {
          // Имя файла — только из белого списка: путь из запроса никогда не
          // склеивается с каталогом напрямую.
          const file = String(url.searchParams.get('f') || '').replace(/\.mp3$/i, '')
          if (!SOUND_NAME.test(file)) {
            sendJson(res, 404, { ok: false, error: 'unknown sound' })
            return
          }
          const mp3 = path.join(PACKAGE_ROOT, 'assets', 'sounds', `${file}.mp3`)
          if (!existsSync(mp3)) {
            sendJson(res, 404, { ok: false, error: 'sound not bundled' })
            return
          }
          res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': statSync(mp3).size,
            'Cache-Control': 'public, max-age=31536000, immutable',
          })
          createReadStream(mp3).pipe(res)
          return
        }

        sendJson(res, 404, { ok: false, error: `unknown route ${op}` })
      } catch (err) {
        const code = err?.code === 'cli-missing' || err?.code === 'model-missing'
          || err?.code === 'llm-missing' || err?.code === 'llm-route' || err?.code === 'llm-timeout'
          ? 409
          : err?.code === 'payload-too-large'
            ? 413
            : err?.code === 'request-aborted'
              ? 400
              : 500
        warn(`route ${op} failed: ${err && err.message}`)
        sendJson(res, code, { ok: false, error: String((err && err.message) || err) })
      }
    }

    const dispose = ctx.webServer.register({ kind: 'prefix', path: PREFIX, handler: route })
    ctx.effect(() => () => { try { dispose() } catch {} })
  })
}
