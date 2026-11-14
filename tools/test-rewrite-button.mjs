// Проверка кнопок «исправить текст» и «улучшить промпт»: пустое поле их
// выключает, клик отправляет черновик на маршрут /fix с нужным режимом и
// подменяет черновик ответом модели. Компоненты берутся из настоящего
// lib/client.js, поэтому тест ловит и регрессии в самом плагине.
//
//   node tools/test-rewrite-button.mjs

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractFunction } from './extract-function.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'lib', 'client.js'), 'utf8')

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
let calls = 0
const fetchStub = (url, init) => {
  calls++
  lastUrl = url
  lastBody = JSON.parse(init.body)
  return Promise.resolve({ json: () => Promise.resolve(reply) })
}

const code = ['GrammarIcon', 'PromptIcon', 'RewriteButton']
  .map((name) => extractFunction(source, name)).join('\n')
const factory = new Function('React', 'ReactDOM', 'fetch', 'document', 'h', `${code}
  return RewriteButton`)
const RewriteButton = factory(React, ReactDOM, fetchStub, document, h)

let failed = 0
function check(label, condition, detail) {
  if (!condition) failed++
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${label}${detail !== undefined ? ` (${detail})` : ''}`)
}

let drafts = []
let notes = []
let setDraft = (text) => drafts.push(text)
const inputActions = { setDraft: (text) => setDraft(text) }
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

function clear() {
  drafts = []
  notes = []
  calls = 0
  lastUrl = null
  lastBody = null
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

// 1. Пустой черновик — обе кнопки выключены.
{
  clear()
  const grammar = makeButton('grammar', '   ')
  const prompt = makeButton('prompt', '   ')
  check('пустое поле -> кнопка грамматики disabled', grammar.props.disabled === true)
  check('пустое поле -> кнопка промпта disabled', prompt.props.disabled === true)
}

// 2. Грамматика: черновик уходит с mode=grammar и подменяется ответом.
{
  clear()
  reply = { ok: true, text: 'Привет, как дела?', changed: true }
  const button = makeButton('grammar', 'привет как дила')
  check('текст есть -> кнопка активна', button.props.disabled === false)
  button.props.onClick()
  await settle()
  check('запрос на /dsh-transcribe/fix', lastUrl === '/dsh-transcribe/fix', lastUrl)
  check('режим grammar в теле', lastBody && lastBody.mode === 'grammar', JSON.stringify(lastBody))
  check('черновик заменён', drafts[0] === 'Привет, как дела?', drafts[0])
  check('уведомление об исправлении', notes[0] === 'ok: Текст исправлен', JSON.stringify(notes))
}

// 3. Промпт: тот же маршрут, но mode=prompt и своё уведомление.
{
  clear()
  reply = { ok: true, text: 'Сделай отчёт по продажам за март, только цифры и выводы.', changed: true }
  const button = makeButton('prompt', 'ну сделай там отчёт по продажам за март токо цифры и выводы')
  button.props.onClick()
  await settle()
  check('режим prompt в теле', lastBody && lastBody.mode === 'prompt', JSON.stringify(lastBody))
  check('черновик заменён промптом', /отчёт по продажам/.test(drafts[0] || ''), drafts[0])
  check('уведомление об улучшении', notes[0] === 'ok: Промпт улучшен', JSON.stringify(notes))
}

// 4. Модель ничего не изменила — черновик не трогаем.
{
  clear()
  reply = { ok: true, text: 'привет', changed: false }
  makeButton('grammar', 'привет').props.onClick()
  await settle()
  check('без изменений -> setDraft не зовётся', drafts.length === 0, String(drafts.length))
  check('без изменений -> уведомление muted', notes[0] === 'muted: Без изменений', JSON.stringify(notes))
}

// 5. Ошибка маршрута показывается, черновик не трогается.
{
  clear()
  reply = { ok: false, error: 'модель недоступна' }
  makeButton('grammar', 'текст').props.onClick()
  await settle()
  check('ошибка -> setDraft не зовётся', drafts.length === 0, String(drafts.length))
  check('ошибка -> уведомление err', notes[0] === 'err: Не удалось: модель недоступна', JSON.stringify(notes))
}

// 6. Слишком длинный текст (413) — та же ветка ошибки, без подмены черновика.
{
  clear()
  reply = { ok: false, error: 'Слишком длинный текст: 9000 символов, максимум 8000.' }
  makeButton('grammar', 'длинный текст').props.onClick()
  await settle()
  check('413 -> черновик цел', drafts.length === 0)
  check('413 -> ошибка показана с причиной', /^err: Не удалось: Слишком длинный/.test(notes[0] || ''), notes[0])
}

// 7. Двойной клик при занятой кнопке не шлёт второй запрос.
{
  clear()
  reply = { ok: true, text: 'исправлено', changed: true }
  const button = makeButton('grammar', 'привет')
  button.props.onClick()
  button.props.onClick()
  await settle()
  check('двойной клик -> один запрос', calls === 1, String(calls))
  check('двойной клик -> одна вставка', drafts.length === 1, String(drafts.length))
}

// 8. Исключение в setDraft не выдаёт успех.
{
  clear()
  reply = { ok: true, text: 'исправлено', changed: true }
  setDraft = () => { throw new Error('поле недоступно') }
  makeButton('grammar', 'привет').props.onClick()
  await settle()
  check('setDraft упал -> err', notes[0] === 'err: Не удалось заменить текст', JSON.stringify(notes))
  setDraft = (text) => drafts.push(text)
}

console.log(failed ? `\n${failed} failed` : '\nall passed')
process.exit(failed ? 1 : 0)
