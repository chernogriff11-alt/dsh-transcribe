// Проверка чистых функций клиента, которые режут ключевую фразу из текста.
// Функции берутся из настоящего lib/client.js (не копия), поэтому тест ловит
// и регрессии в самом плагине.
//
//   node tools/test-wake-match.mjs

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractFunction } from './extract-function.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'lib', 'client.js'), 'utf8')

const code = ['wordStarts', 'normalizeText', 'editDistance', 'stripLeadingPhrase', 'endsWithPhrase', 'stripPhrase']
  .map((name) => extractFunction(source, name)).join('\n')
const leadingWords = (source.match(/var MAX_LEADING_WORDS = (\d+)/) || [])[1] || '2'
const factory = new Function(`var MAX_LEADING_WORDS = ${leadingWords};
${code}
  return { normalizeText, editDistance, stripLeadingPhrase, endsWithPhrase, stripPhrase }`)
const { normalizeText, stripLeadingPhrase, endsWithPhrase, stripPhrase } = factory()

let failed = 0
function check(label, condition, detail) {
  if (!condition) failed++
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}${detail !== undefined ? ` (${detail})` : ''}`)
}

// Ключевая фраза: сравнение нечёткое, до двух слов перед фразой допускаются.
const cases = [
  ['Окей,ди псик.', ''],
  ['Окей, дипсик.', ''],
  ['Окей, дипсик, открой настройки.', 'открой настройки.'],
  ['Окей, Дипсик, скажи что-нибудь.', 'скажи что-нибудь.'],
  ['Ну окей, Дипсик.', ''],
  ['Слушай, окей дипсик, открой настройки.', 'открой настройки.'],
  ['Раз два три окей дипсик, открой настройки.', 'Раз два три окей дипсик, открой настройки.'],
  ['Окей, диспетчер.', 'Окей, диспетчер.'],
  ['Привет, как дела?', 'Привет, как дела?'],
  ['', ''],
]
for (const [input, expected] of cases) {
  const actual = stripLeadingPhrase(input, 'окей дипсик')
  check(`wake ${JSON.stringify(input)}`, actual === expected, JSON.stringify(actual))
}

check('normalizeText', normalizeText('Окей, ди псик!') === 'окейдипсик', normalizeText('Окей, ди псик!'))

// Фраза глубоко в середине реплики не режется: перед ней больше двух слов.
{
  const input = 'Открой окей дипсик настройки'
  check('одно слово перед фразой — режется', stripLeadingPhrase(input, 'окей дипсик') === 'настройки')
  const deep = 'Раз два три окей дипсик настройки'
  check('фраза глубже двух слов — не режется', stripLeadingPhrase(deep, 'окей дипсик') === deep)
}

// Стоп-слово: фраза в конце обрезается, текст до неё остаётся.
const stopCases = [
  ['Сделай то-то, стоп чат.', 'Сделай то-то'],
  ['стоп чат', ''],
  ['Стоп чат!', ''],
  ['Открой настройки стоп чат', 'Открой настройки'],
  ['стоп внутри предложения, стоп чат', 'стоп внутри предложения'],
  // Распознавание путает окончание — один символ прощаем.
  ['Сделай то-то, стоп чят', 'Сделай то-то'],
]
for (const [input, expected] of stopCases) {
  const heard = endsWithPhrase(input, 'стоп чат')
  const actual = stripPhrase(input, 'стоп чат')
  check(`stop ${JSON.stringify(input)}`, heard && actual === expected, `${JSON.stringify(actual)} heard=${heard}`)
}

const notStop = ['Стоп, подожди.', 'Останови запись', 'Сделай то-то, стоп']
for (const input of notStop) {
  const heard = endsWithPhrase(input, 'стоп чат')
  check(`stop ${JSON.stringify(input)} -> not heard`, heard === false, String(heard))
}

// Две команды не должны путаться между собой.
const pairs = [
  ['Сделай то-то, стоп чат', true, false],
  ['Сделай то-то, отправь', false, true],
  ['Сделай то-то', false, false],
]
for (const [input, stopExpected, sendExpected] of pairs) {
  const stopHeard = endsWithPhrase(input, 'стоп чат')
  const sendHeard = endsWithPhrase(input, 'отправь')
  check(`pair ${JSON.stringify(input)}`, stopHeard === stopExpected && sendHeard === sendExpected,
    `stop=${stopHeard} send=${sendHeard}`)
}

console.log(failed ? `\n${failed} failed` : '\nall passed')
process.exit(failed ? 1 : 0)
