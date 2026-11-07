// Проверка чистых функций клиента, которые режут ключевую фразу из текста.
// Функции берутся из настоящего lib/client.js (не копия), поэтому тест ловит
// и регрессии в самом плагине.
//
//   node tools/test-wake-match.mjs

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'lib', 'client.js'), 'utf8')

/** Вырезает тело функции по имени, считая фигурные скобки. */
function extract(name) {
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

const code = ['normalizeText', 'editDistance', 'stripLeadingPhrase', 'endsWithPhrase', 'stripPhrase']
  .map(extract).join('\n')
const factory = new Function(`${code}
  return { normalizeText, editDistance, stripLeadingPhrase, endsWithPhrase, stripPhrase }`)
const { normalizeText, stripLeadingPhrase, endsWithPhrase, stripPhrase } = factory()

const cases = [
  ['Окей,ди псик.', ''],
  ['Окей, дипсик.', ''],
  ['Окей, дипсик, открой настройки.', 'открой настройки.'],
  ['Окей, Дипсик, скажи что-нибудь.', 'скажи что-нибудь.'],
  ['Ну окей, Дипсик.', ''],
  ['Окей, диспетчер.', 'Окей, диспетчер.'],
  ['Привет, как дела?', 'Привет, как дела?'],
  ['', ''],
]

let failed = 0
for (const [input, expected] of cases) {
  const actual = stripLeadingPhrase(input, 'окей дипсик')
  const ok = actual === expected
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${JSON.stringify(input)} -> ${JSON.stringify(actual)}`)
}

const norm = normalizeText('Окей, ди псик!')
if (norm !== 'окейдипсик') {
  failed++
  console.log(`FAIL normalizeText -> ${norm}`)
}

// Стоп-слово: фраза в конце обрезается, текст до неё остаётся.
const stopCases = [
  ['Сделай то-то, стоп чат.', 'Сделай то-то'],
  ['стоп чат', ''],
  ['Стоп чат!', ''],
  ['Открой настройки стоп чат', 'Открой настройки'],
  ['стоп внутри предложения, стоп чат', 'стоп внутри предложения'],
]
for (const [input, expected] of stopCases) {
  const heard = endsWithPhrase(input, 'стоп чат')
  const actual = stripPhrase(input, 'стоп чат')
  const ok = heard && actual === expected
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} stop ${JSON.stringify(input)} -> ${JSON.stringify(actual)} (heard=${heard})`)
}

const notStop = ['Стоп, подожди.', 'Останови запись']
for (const input of notStop) {
  const heard = endsWithPhrase(input, 'стоп чат')
  if (heard) failed++
  console.log(`${heard ? 'FAIL' : 'ok  '} stop ${JSON.stringify(input)} -> not heard`)
}

console.log(failed ? `\n${failed} failed` : '\nall passed')
process.exit(failed ? 1 : 0)
