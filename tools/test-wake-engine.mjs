// Проверка нарезчика речи (VAD) из lib/client.js: тишина не даёт сегментов,
// фраза даёт ровно один сегмент с запасом до начала, длинная речь отбрасывается.
//
//   node tools/test-wake-engine.mjs

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'lib', 'client.js'), 'utf8')

function extractFunction(name) {
  const start = source.indexOf(`    function ${name}(`)
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

const regionStart = source.indexOf('    //#region wake')
const regionEnd = source.indexOf('    //#endregion', regionStart)
if (regionStart < 0 || regionEnd < 0) throw new Error('wake region not found')
const region = source.slice(regionStart, regionEnd)

const code = [extractFunction('normalizeText'), region].join('\n')
const factory = new Function('window', 'performance', 'Uint8Array', `${code}
  return { WakeEngine, LevelTracker }`)

let clock = 0
const performance = { now: () => clock }
const window = { localStorage: { getItem: () => null, setItem() {} } }
const { WakeEngine } = factory(window, performance, Uint8Array)

const FRAME_MS = 20
const FRAME_BYTES = 640 // 320 сэмплов PCM16 = 20 мс при 16 кГц

function feed(engine, seconds, rms) {
  const frames = Math.round((seconds * 1000) / FRAME_MS)
  const out = []
  for (let i = 0; i < frames; i++) {
    clock += FRAME_MS
    const segment = engine.feed(new Uint8Array(FRAME_BYTES), rms)
    if (segment) out.push(segment)
  }
  return out
}

let failed = 0
function check(label, condition, detail) {
  if (!condition) failed++
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`)
}

// 1. Тишина не должна давать сегментов.
{
  const engine = new WakeEngine()
  const segments = feed(engine, 5, 0.002)
  check('5 s тишины -> 0 сегментов', segments.length === 0, `got ${segments.length}`)
}

// 2. Фраза 0,5 с после тишины -> один сегмент с запасом до начала.
{
  const engine = new WakeEngine()
  feed(engine, 1, 0.002)
  const during = feed(engine, 0.5, 0.2)
  check('во время речи сегмента ещё нет', during.length === 0, `got ${during.length}`)
  const after = feed(engine, 0.4, 0.002)
  check('после паузы ровно один сегмент', after.length === 1, `got ${after.length}`)
  if (after.length === 1) {
    const seconds = after[0].pcm.byteLength / 2 / 16000
    check('длина сегмента 0,7–1,1 с', seconds >= 0.7 && seconds <= 1.1, `${seconds.toFixed(2)} s`)
    check('сегмент начинается раньше речи', after[0].start < clock - 500, `start=${Math.round(after[0].start)}`)
  }
}

// 3. Две фразы подряд -> два сегмента.
{
  const engine = new WakeEngine()
  feed(engine, 0.5, 0.002)
  feed(engine, 0.4, 0.2)
  const first = feed(engine, 0.5, 0.002)
  feed(engine, 0.4, 0.2)
  const second = feed(engine, 0.5, 0.002)
  check('две фразы -> два сегмента', first.length === 1 && second.length === 1,
    `${first.length} + ${second.length}`)
}

// 4. Непрерывная речь дольше 8 с отбрасывается, а не режется на куски.
{
  const engine = new WakeEngine()
  feed(engine, 0.5, 0.002)
  const segments = feed(engine, 9, 0.2)
  check('9 s непрерывной речи -> 0 сегментов', segments.length === 0, `got ${segments.length}`)
}

// 5. Ровный громкий фон не считается речью, а после калибровки фраза ловится.
{
  const engine = new WakeEngine()
  const noise = feed(engine, 25, 0.05)
  check('25 s ровного фона 0,05 -> 0 сегментов', noise.length === 0, `got ${noise.length}`)
  feed(engine, 0.5, 0.3)
  const after = feed(engine, 0.5, 0.05)
  check('фраза на фоне 0,05 после калибровки -> 1 сегмент', after.length === 1, `got ${after.length}`)
}

console.log(failed ? `\n${failed} failed` : '\nall passed')
process.exit(failed ? 1 : 0)
