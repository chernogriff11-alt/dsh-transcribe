// Проверка хост-половины lib/index.js: маршруты отвечают правильными кодами,
// тело сверх лимита даёт 413 с JSON и дочитывается (а не рвёт сокет), а пустой
// язык распознавания уходит в движок без подсказки `-l`.
//
//   node tools/test-host-route.mjs

import { readFileSync } from 'node:fs'
import { Readable, PassThrough } from 'node:stream'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(root, 'lib', 'index.js')
const source = readFileSync(sourcePath, 'utf8')

let failed = 0
function check(label, condition, detail) {
  if (!condition) failed++
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}${detail !== undefined ? ` (${detail})` : ''}`)
}

/** Вырезает тело функции по имени, считая фигурные скобки. */
function extract(name) {
  const start = source.indexOf(`function ${name}(`)
  if (start < 0) throw new Error(`function ${name} not found`)
  const open = source.indexOf('{', start)
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  throw new Error(`unbalanced braces in ${name}`)
}

// 1. Язык: пусто = автоопределение, без тихой подсказки «ru».
{
  const factory = new Function(`${extract('languageHint')}\n${extract('languageArgs')}
    return { languageHint, languageArgs }`)
  const { languageHint, languageArgs } = factory()
  check('пустой конфиг -> нет подсказки языка', languageArgs(languageHint('', '')).length === 0,
    JSON.stringify(languageArgs(languageHint('', ''))))
  check('нет параметра и конфига -> нет подсказки', languageArgs(languageHint(undefined, undefined)).length === 0)
  check('параметр lang важнее конфига', languageHint('de', 'en') === 'de', languageHint('de', 'en'))
  check('конфиг en -> -l en', JSON.stringify(languageArgs(languageHint('', 'en'))) === '["-l","en"]',
    JSON.stringify(languageArgs(languageHint('', 'en'))))
  check('explicit auto -> без -l', languageArgs(languageHint('auto', '')).length === 0)
  check('маршруты используют languageHint', (source.match(/languageHint\(url\.searchParams/g) || []).length === 2,
    String((source.match(/languageHint\(url\.searchParams/g) || []).length))
  check('жёсткой подсказки ru в маршрутах нет', !/searchParams\.get\('lang'\)[^\n]*'ru'/.test(source))
}

// 1b. Ключевая фраза на хосте — то же правило, что и у клиента.
{
  const leading = (source.match(/MAX_LEADING_WORDS = (\d+)/) || [])[1] || '2'
  const factory = new Function(`var MAX_LEADING_WORDS = ${leading}
${extract('normalizeSpeech')}
${extract('editDistance')}
${extract('phraseHeard')}
    return { phraseHeard }`)
  const { phraseHeard } = factory()
  const cases = [
    ['Окей, дипсик, открой настройки.', true],
    ['Окей, ди псик.', true],
    ['Слушай, окей дипсик', true],
    ['Раз два три окей дипсик', false],
    ['Открой настройки', false],
    ['Окей, диспетчер.', false],
    ['', false],
  ]
  for (const [text, expected] of cases) {
    check(`phraseHeard ${JSON.stringify(text)}`, phraseHeard(text, 'окей дипсик') === expected,
      String(phraseHeard(text, 'окей дипсик')))
  }
}

// 2. Маршруты: поднимаем настоящий плагин с поддельным контекстом DSH.
const mod = await import(pathToFileURL(sourcePath).href)
let handler = null
const ctx = {
  connection: { requestRejection: (req) => (req.headers['x-reject'] ? 403 : undefined) },
  webServer: {
    register(route) {
      handler = route.handler
      return () => {}
    },
  },
  effect(fn) {
    fn()
  },
  get() {
    return undefined
  },
}
mod.apply({ inject(_names, cb) { cb(ctx) } }, { language: '' })
check('маршрут зарегистрирован', typeof handler === 'function')

function makeReq(url, body, headers) {
  const chunks = body ? (Array.isArray(body) ? body : [body]) : []
  const req = Readable.from(chunks)
  req.url = url
  req.headers = headers || {}
  return req
}

function makeRes() {
  return {
    code: 0,
    headers: null,
    body: '',
    writeHead(code, headers) { this.code = code; this.headers = headers },
    end(body) { this.body = String(body || '') },
  }
}

async function call(url, body, headers) {
  const res = makeRes()
  const req = makeReq(url, body, headers)
  // Слушатель ставится до обработчика: после отказа по лимиту тело всё равно
  // должно быть дочитано до конца, иначе клиент видит обрыв вместо ответа.
  const ended = new Promise((resolve) => { req.once('end', () => resolve(true)) })
  await handler(req, res)
  const drained = await Promise.race([ended, new Promise((resolve) => setTimeout(() => resolve(false), 1000))])
  return {
    code: res.code,
    json: (() => { try { return JSON.parse(res.body) } catch { return null } })(),
    raw: res.body,
    drained,
  }
}

// 3. Проверки ответов.
{
  const r = await call('/dsh-transcribe/status', null, { 'x-reject': '1' })
  check('чужой запрос -> 403', r.code === 403 && r.json && r.json.ok === false, String(r.code))
}
{
  const r = await call('/dsh-transcribe/status', null, { origin: 'http://evil.example' })
  check('кросс-доменный Origin -> 403', r.code === 403 && r.json && r.json.error === 'cross-origin request', String(r.code))
}
{
  const r = await call('/dsh-transcribe/status', null, { 'sec-fetch-site': 'cross-site' })
  check('cross-site fetch -> 403', r.code === 403, String(r.code))
}
{
  const r = await call('/dsh-transcribe/status', null, { 'sec-fetch-site': 'same-origin' })
  check('same-origin пропускается', r.code === 200, String(r.code))
}
{
  const r = await call('/dsh-transcribe/status')
  check('status -> 200', r.code === 200 && r.json && r.json.ok === true, String(r.code))
  check('status отдаёт найденные пути', !!(r.json && r.json.cli && r.json.model && r.json.search))
}
{
  const r = await call('/dsh-transcribe/nope')
  check('неизвестный маршрут -> 404', r.code === 404, String(r.code))
}
{
  const r = await call('/dsh-transcribe/transcribe?sr=16000')
  check('пустое аудио -> 400', r.code === 400 && r.json && r.json.error === 'empty audio', String(r.code))
}
{
  const r = await call('/dsh-transcribe/transcribe?sr=-1', Buffer.from([1, 2, 3, 4]))
  check('чужой sr -> 400', r.code === 400 && /sample rate must be 16000/.test(String(r.json && r.json.error)), String(r.code))
}
{
  const r = await call('/dsh-transcribe/transcribe?sr=48000', Buffer.from([1, 2, 3, 4]))
  check('sr=48000 -> 400 без запуска движка', r.code === 400, String(r.code))
}
{
  // Без сервиса доверия маршрут обязан отказать, а не обслужить кого угодно.
  let strictHandler = null
  mod.apply({
    inject(_names, cb) {
      cb({
        webServer: { register(route) { strictHandler = route.handler; return () => {} } },
        effect(fn) { fn() },
        get() { return undefined },
      })
    },
  }, { language: '' })
  const res = makeRes()
  await strictHandler(makeReq('/dsh-transcribe/status'), res)
  const json = (() => { try { return JSON.parse(res.body) } catch { return null } })()
  check('нет requestRejection -> 403 (fail-closed)', res.code === 403 && json && /trust service/.test(String(json.error)), String(res.code))
}
{
  // Три чанка, лимит (256 КБ) пересекается на третьем: ответ должен прийти
  // сразу, а остаток тела — дочитаться, иначе сокет обрывается.
  const chunks = [Buffer.alloc(10 * 1024, 1), Buffer.alloc(150 * 1024, 2), Buffer.alloc(200 * 1024, 3)]
  const r = await call('/dsh-transcribe/fix', chunks)
  check('тело сверх лимита -> 413 JSON', r.code === 413 && r.json && r.json.ok === false, String(r.code))
  check('после 413 тело дочитано', r.drained === true, String(r.drained))
  check('413 без утечки пути', r.json && !/[A-Za-z]:\\/.test(String(r.json.error || '')), r.json && r.json.error)
}
{
  const r = await call('/dsh-transcribe/fix', Buffer.from('{not json'))
  check('битый JSON -> 400', r.code === 400 && r.json && r.json.error === 'bad json', String(r.code))
}
{
  const r = await call('/dsh-transcribe/fix', Buffer.from(JSON.stringify({ mode: 'nope', text: 'x' })))
  check('неизвестный режим -> 400', r.code === 400 && /unknown mode/.test(String(r.json && r.json.error)), String(r.code))
}
{
  const r = await call('/dsh-transcribe/fix', Buffer.from(JSON.stringify({ mode: 'grammar', text: '   ' })))
  check('пустой текст -> 400', r.code === 400 && r.json && r.json.error === 'empty text', String(r.code))
}

{
  // Оборванная загрузка не присылает 'end': маршрут обязан завершиться, а не висеть.
  const req = new PassThrough()
  req.url = '/dsh-transcribe/fix'
  req.headers = {}
  const res = makeRes()
  const pending = handler(req, res)
  req.write(Buffer.from('{"text":"при'))
  await new Promise((resolve) => setTimeout(resolve, 10))
  req.destroy()
  await Promise.race([pending, new Promise((resolve) => setTimeout(resolve, 1000))])
  check('оборванная загрузка -> 400, маршрут не завис', res.code === 400, String(res.code))
}

console.log(failed ? `\n${failed} failed` : '\nall passed')
process.exit(failed ? 1 : 0)
