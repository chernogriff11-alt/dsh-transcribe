// Проверка кнопок «исправить текст» и «улучшить промпт»: пустое поле их
// выключает, клик отправляет черновик на маршрут /fix с нужным режимом и
// подменяет черновик ответом модели. Компоненты берутся из настоящего
// lib/client.js, поэтому тест ловит и регрессии в самом плагине.
//
//   node tools/test-rewrite-button.mjs

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

const React = {
  Fragment: Symbol('Fragment'),
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useRef: (value) => ({ current: value }),
  useEffect: () => {},
}
const ReactDOM = { createPortal: (node) => node }
const document = { body: {} }
const h = React.createElement

let reply = { ok: true, text: 'Привет, как дела?', changed: true }
let lastUrl = null
let lastBody = null
const fetchStub = (url, init) => {
  lastUrl = url
  lastBody = JSON.parse(init.body)
  return Promise.resolve({ json: () => Promise.resolve(reply) })
}

const code = ['GrammarIcon', 'PromptIcon', 'RewriteButton'].map(extractFunction).join('\n')
const factory = new Function('React', 'ReactDOM', 'fetch', 'document', 'h', `${code}
  return RewriteButton`)
const RewriteButton = factory(React, ReactDOM, fetchStub, document, h)

let failed = 0
function check(label, condition, detail) {
  if (!condition) failed++
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`)
}

const drafts = []
const notes = []
const inputActions = { setDraft: (text) => drafts.push(text) }
const notify = (tone, text) => notes.push(tone + ': ' + text)
const useInputWith = (draft) => (selector) => selector({ draft })

function makeButton(mode, draft) {
  return RewriteButton({
    mode,
    useInput: useInputWith(draft),
    inputActions,
    notify,
    icon: () => React.createElement('i'),
    title: 'title',
    emptyTitle: 'empty',
  })
}

// 1. Пустой черновик — обе кнопки выключены.
{
  const grammar = makeButton('grammar', '   ')
  const prompt = makeButton('prompt', '   ')
  check('пустое поле -> кнопка грамматики disabled', grammar.props.disabled === true)
  check('пустое поле -> кнопка промпта disabled', prompt.props.disabled === true)
}

// 2. Грамматика: черновик уходит с mode=grammar и подменяется ответом.
{
  reply = { ok: true, text: 'Привет, как дела?', changed: true }
  const button = makeButton('grammar', 'привет как дила')
  check('текст есть -> кнопка активна', button.props.disabled === false)
  button.props.onClick()
  await new Promise((resolve) => setTimeout(resolve, 20))
  check('запрос на /dsh-transcribe/fix', lastUrl === '/dsh-transcribe/fix', lastUrl)
  check('режим grammar в теле', lastBody && lastBody.mode === 'grammar', JSON.stringify(lastBody))
  check('черновик заменён', drafts[0] === 'Привет, как дела?', drafts[0])
  check('уведомление об исправлении', notes[0] === 'ok: Текст исправлен', notes[0])
}

// 3. Промпт: тот же маршрут, но mode=prompt и своё уведомление.
{
  reply = { ok: true, text: 'Сделай отчёт по продажам за март, только цифры и выводы.', changed: true }
  const button = makeButton('prompt', 'ну сделай там отчёт по продажам за март токо цифры и выводы')
  button.props.onClick()
  await new Promise((resolve) => setTimeout(resolve, 20))
  check('режим prompt в теле', lastBody && lastBody.mode === 'prompt', JSON.stringify(lastBody))
  check('черновик заменён промптом', /отчёт по продажам/.test(drafts[1] || ''), drafts[1])
  check('уведомление об улучшении', notes[1] === 'ok: Промпт улучшен', notes[1])
}

// 4. Модель ничего не изменила — черновик не трогаем.
{
  reply = { ok: true, text: 'привет', changed: false }
  const before = drafts.length
  const button = makeButton('grammar', 'привет')
  button.props.onClick()
  await new Promise((resolve) => setTimeout(resolve, 20))
  check('без изменений -> setDraft не зовётся', drafts.length === before, String(drafts.length))
  check('без изменений -> уведомление muted', notes[2] === 'muted: Без изменений', notes[2])
}

// 5. Ошибка маршрута показывается, черновик не трогается.
{
  reply = { ok: false, error: 'модель недоступна' }
  const before = drafts.length
  const button = makeButton('grammar', 'текст')
  button.props.onClick()
  await new Promise((resolve) => setTimeout(resolve, 20))
  check('ошибка -> setDraft не зовётся', drafts.length === before, String(drafts.length))
  check('ошибка -> уведомление err', /^err: Не удалось: модель недоступна$/.test(notes[3] || ''), notes[3])
}

console.log(failed ? `\n${failed} failed` : '\nall passed')
process.exit(failed ? 1 : 0)
