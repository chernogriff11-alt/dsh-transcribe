// @local/dsh-transcribe — host half.
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
//
// The client records 16 kHz mono PCM16 and posts the whole utterance once,
// so there is no session state here: one request, one temp WAV, one process.

import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
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

const GRAMMAR_SYSTEM = [
  'Ты корректор русского текста. Исправь орфографические, пунктуационные и грамматические ошибки.',
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
  language: 'ru',
  timeoutMs: 180000,
  llmProvider: '',
  llmModel: '',
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
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      parts.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(parts)))
    req.on('error', reject)
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
 * comparison is fuzzy: a sliding window over the normalised text, accepted
 * when it is within a small edit distance of the normalised phrase. The window
 * may start a few characters in, to survive a stray word before the phrase.
 */
function phraseHeard(text, phrase) {
  const t = normalizeSpeech(text)
  const p = normalizeSpeech(phrase)
  if (!p || !t) return false
  const tolerance = p.length >= 8 ? 2 : 1
  const minLen = Math.max(1, p.length - tolerance)
  const maxLen = p.length + tolerance
  const maxStart = Math.min(3, Math.max(0, t.length - minLen))
  for (let start = 0; start <= maxStart; start++) {
    for (let len = minLen; len <= maxLen && start + len <= t.length; len++) {
      if (editDistance(t.slice(start, start + len), p) <= tolerance) return true
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

/** Run transcribe-cli once and return the plain transcript. */
function runCli(cliPath, modelPath, language, wavPath, timeoutMs) {
  return new Promise((resolve, reject) => {
    const args = ['-m', modelPath, '-l', language, '--timestamps', 'none', wavPath]
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

function inPath(name) {
  const dirs = String(process.env.PATH || '').split(path.delimiter)
  for (const dir of dirs) {
    if (!dir) continue
    try {
      const candidate = path.join(dir, name)
      if (existsSync(candidate)) return candidate
    } catch { /* ignore */ }
  }
  return null
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

function resolveCli(config) {
  return firstExisting([
    config.cliPath,
    path.join(os.homedir(), '.dsh', 'bin', 'transcribe-cli.exe'),
    path.join(PACKAGE_ROOT, 'bin', 'transcribe-cli.exe'),
    inPath('transcribe-cli.exe'),
  ])
}

function resolveModel(config) {
  const home = os.homedir()
  return firstExisting([
    config.modelPath,
    ...ggufIn(path.join(home, '.dsh', 'models', 'parakeet-ultra')),
    ...ggufIn(path.join(PACKAGE_ROOT, 'models')),
    ...hfCacheModels(),
    ...ggufIn('G:\\llm-models\\asr\\parakeet-ultra'),
  ])
}

export function apply(root, config = {}) {
  const options = { ...DEFAULTS, ...(config || {}) }
  const warn = (message) => {
    try { console.log(`[dsh-transcribe] ${message}`) } catch {}
  }

  root.inject(['webServer'], (ctx) => {
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
        rm(dir, { recursive: true, force: true }).catch(() => {})
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
      if (check) {
        let code
        try { code = check(req) } catch { code = 403 }
        if (code) {
          sendJson(res, typeof code === 'number' ? code : 403, { ok: false, error: 'rejected' })
          return
        }
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
            search: {
              cli: ['config.cliPath', '~/.dsh/bin/transcribe-cli.exe', '<plugin>/bin/transcribe-cli.exe', 'PATH'],
              model: ['config.modelPath', '~/.dsh/models/parakeet-ultra/*.gguf', '<plugin>/models/*.gguf', 'HF cache', 'G:\\llm-models\\asr\\parakeet-ultra'],
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
          const sampleRate = Number(url.searchParams.get('sr')) || SAMPLE_RATE
          const language = (url.searchParams.get('lang') || options.language || 'ru').trim() || 'ru'
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
          const sampleRate = Number(url.searchParams.get('sr')) || SAMPLE_RATE
          const language = (url.searchParams.get('lang') || options.language || 'ru').trim() || 'ru'
          const result = await transcribeBody(body, sampleRate, language)
          sendJson(res, 200, { ok: true, ...result })
          return
        }

        sendJson(res, 404, { ok: false, error: `unknown route ${op}` })
      } catch (err) {
        const code = err?.code === 'cli-missing' || err?.code === 'model-missing'
          || err?.code === 'llm-missing' || err?.code === 'llm-route' || err?.code === 'llm-timeout'
          ? 409
          : 500
        warn(`route ${op} failed: ${err && err.message}`)
        sendJson(res, code, { ok: false, error: String((err && err.message) || err) })
      }
    }

    const dispose = ctx.webServer.register({ kind: 'prefix', path: PREFIX, handler: route })
    ctx.effect(() => () => { try { dispose() } catch {} })
  })
}
