// Проверка звуковых схем: маршрут отдаёт все вложенные звуки, чужое имя
// отклоняет, а содержимое действительно mp3.
//
//   node tools/test-sound-schemes.mjs

import { readFileSync, readdirSync } from 'node:fs'
import { Readable, Writable } from 'node:stream'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(root, 'lib', 'index.js')
const assetsDir = path.join(root, 'assets', 'sounds')

let failed = 0
function check(label, condition, detail) {
  if (!condition) failed++
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}${detail !== undefined ? ` (${detail})` : ''}`)
}

const SCHEMES = ['warm', 'wooden', 'airy', 'muted']
const EVENTS = ['start', 'stop', 'done', 'error']
const VOICES = ['voice-start', 'voice-done']

// 1. Файлы на месте и их ровно столько, сколько ждёт клиент.
{
  const files = readdirSync(assetsDir).filter((name) => name.endsWith('.mp3')).sort()
  const expected = []
  for (const scheme of SCHEMES) for (const event of EVENTS) expected.push(`${scheme}-${event}.mp3`)
  for (const voice of VOICES) expected.push(`${voice}.mp3`)
  expected.sort()
  check('набор файлов совпадает с ожидаемым', files.join(',') === expected.join(','),
    `${files.length} файлов`)
  for (const name of files) {
    const bytes = readFileSync(path.join(assetsDir, name)).length
    if (bytes < 2000) check(`файл ${name} не пустой`, false, `${bytes} байт`)
  }
}

// 2. Поднимаем плагин с поддельным контекстом и собираем поток в буфер.
const mod = await import(pathToFileURL(sourcePath).href)
let handler = null
const ctx = {
  connection: { requestRejection: () => undefined },
  webServer: { register(route) { handler = route.handler; return () => {} } },
  effect(fn) { fn() },
  get() { return undefined },
}
mod.apply({ inject(_names, cb) { cb(ctx) } }, {})

class CollectRes extends Writable {
  constructor() {
    super()
    this.code = 0
    this.headers = null
    this.chunks = []
  }
  writeHead(code, headers) { this.code = code; this.headers = headers }
  _write(chunk, _enc, cb) { this.chunks.push(Buffer.from(chunk)); cb() }
  get body() { return Buffer.concat(this.chunks) }
}

async function fetchSound(name) {
  const req = Readable.from([])
  req.url = `/dsh-transcribe/sound?f=${encodeURIComponent(name)}`
  req.headers = { 'sec-fetch-site': 'same-origin' }
  const res = new CollectRes()
  const finished = new Promise((resolve) => res.once('finish', resolve))
  await handler(req, res)
  await Promise.race([finished, new Promise((resolve) => setTimeout(resolve, 3000))])
  return { code: res.code, headers: res.headers || {}, body: res.body }
}

// 3. Известные имена отдаются как audio/mpeg и с валидным mp3.
{
  let served = 0
  for (const scheme of SCHEMES) {
    for (const event of EVENTS) {
      const r = await fetchSound(`${scheme}-${event}`)
      const type = String(r.headers['Content-Type'] || '')
      const head = r.body.subarray(0, 3).toString('latin1')
      const ok = r.code === 200 && /audio\/mpeg/.test(type) && head === 'ID3'
        && Number(r.headers['Content-Length']) === r.body.length
      if (ok) served++
      else check(`звук ${scheme}-${event}`, false, `code=${r.code} type=${type} head=${head} bytes=${r.body.length}`)
    }
  }
  check('все 16 звуков схем отдаются корректно', served === 16, `${served}/16`)
  for (const voice of VOICES) {
    const r = await fetchSound(voice)
    check(`голосовой звук ${voice}`, r.code === 200 && r.body.length > 2000, `code=${r.code}`)
  }
}

// 4. Чужое имя не превращается в файл.
{
  const attempts = ['../index.js', '..%2Findex.js', 'warm-start/../index', 'warm', '.env', 'voice', 'WARM-START']
  for (const attempt of attempts) {
    const r = await fetchSound(attempt)
    check(`отклонено: ${attempt}`, r.code === 404, `code=${r.code}`)
  }
}

if (failed) {
  console.log(`\n${failed} проверок провалено`)
  process.exit(1)
}
console.log('\nall passed')
