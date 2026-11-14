// Дымовой тест клиентской половины: грузит настоящий lib/client.js в поддельном
// окружении (React, DOM, localStorage) и рисует компонент в двух состояниях —
// прослушивание выключено и включено. Ловит опечатки и обращение к
// несуществующим переменным в ветках отрисовки, которые не видны при node --check.
//
//   node tools/test-client-render.mjs

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'lib', 'client.js'), 'utf8')

const FRAGMENT = Symbol('Fragment')
const effects = []

const React = {
  Fragment: FRAGMENT,
  createElement(type, props, ...children) {
    return { type, props: props || {}, children }
  },
  useState(initial) {
    const value = typeof initial === 'function' ? initial() : initial
    return [value, () => {}]
  },
  useRef(value) {
    return { current: value }
  },
  useEffect(fn) {
    effects.push(fn)
  },
}

const ReactDOM = {
  createPortal(node) {
    return node
  },
}

const store = new Map()
const localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
}

const head = { children: [], appendChild(node) { this.children.push(node) } }
const document = {
  visibilityState: 'visible',
  hasFocus: () => true,
  head,
  documentElement: head,
  body: {},
  getElementById: () => null,
  createElement: () => ({ id: '', textContent: '' }),
  addEventListener() {},
  removeEventListener() {},
}

const window = {
  localStorage,
  addEventListener() {},
  removeEventListener() {},
  AudioContext: function AudioContext() {},
  __ModuleLoader__: { load(module) { window.__module = module } },
}

const sandbox = {
  window,
  document,
  navigator: { mediaDevices: { getUserMedia: () => Promise.reject(new Error('no mic in test')) } },
  performance: { now: () => Date.now() },
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
  Blob: function Blob() {},
  fetch: () => Promise.reject(new Error('no network in test')),
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame() {},
  Uint8Array,
  Int16Array,
  Float32Array,
  Math,
  Date,
  JSON,
  Number,
  String,
  Boolean,
  Array,
  Object,
  Error,
  isFinite,
  parseInt,
}

const names = Object.keys(sandbox)
const runner = new Function(...names, `${source}\nreturn window.__module;`)
const module = runner(...names.map((name) => sandbox[name]))

if (!module || typeof module.factory !== 'function') throw new Error('module loader did not capture the factory')

const require = (id) => {
  if (id === 'react') return React
  if (id === 'react-dom') return ReactDOM
  throw new Error(`unexpected require(${id})`)
}

const plugin = module.factory(require)
if (!plugin || typeof plugin.apply !== 'function') throw new Error('factory returned no apply()')

let component = null
plugin.apply({
  slots: {
    inject(_name, fn) { fn() },
    register(_slot, fn) { component = fn },
  },
})
if (typeof component !== 'function') throw new Error('component was not registered')

const props = {
  inputActions: {
    insertText: () => true,
    captureInsertion: () => null,
    setDraft: () => true,
    submit: () => {},
  },
  onActiveChange: () => {},
  sessionId: 'test',
}

function render(label) {
  const tree = component(props)
  if (!tree || tree.type !== FRAGMENT) throw new Error(`${label}: component did not return a fragment`)
  const buttons = tree.children.filter((child) => child && child.type === 'button')
  const classes = buttons.map((button) => button.props.className || '')
  console.log(`${label}: ${buttons.length} buttons -> ${classes.join(' | ')}`)
  return tree
}

const off = render('wake off')
const offButtons = off.children.filter((child) => child && child.type === 'button')
const offMic = offButtons.find((child) => /dstr-btn/.test(child.props.className || '')
  && !/dstr-ear/.test(child.props.className || '') && !/dstr-tool/.test(child.props.className || ''))
if (!offMic) throw new Error('wake off: microphone button is missing')
if (offMic.props.disabled) throw new Error('wake off: microphone button must be enabled')
const offEar = offButtons.find((child) => child && child.props && /dstr-ear/.test(child.props.className || ''))
if (!offEar) throw new Error('wake off: ear button is missing')
if (/is-live/.test(offEar.props.className)) throw new Error('wake off: ear button must not be live')
// Две кнопки правки текста — отдельные компоненты, их надо вызвать руками.
const rewrite = off.children.filter((child) => child && typeof child.type === 'function')
if (rewrite.length !== 2) throw new Error(`wake off: expected two rewrite buttons, got ${rewrite.length}`)
const tools = rewrite.map((child) => child.type(child.props))
if (!tools.every((button) => button && button.type === 'button' && /dstr-tool/.test(button.props.className || ''))) {
  throw new Error('wake off: rewrite components did not render buttons')
}
if (!tools.every((button) => button.props.disabled === true)) {
  throw new Error('wake off: rewrite buttons must be disabled on an empty draft')
}
const panels = off.children.filter((child) => child && child.props && /dstr-panel/.test(child.props.className || ''))
if (panels.length) throw new Error('wake off: panel must be closed while idle')
const toasts = off.children.filter((child) => child && child.props && /dstr-toast/.test(child.props.className || ''))
if (toasts.length) throw new Error('wake off: no toast is expected on a fresh render')

store.set('dstr.wake', JSON.stringify({ enabled: true, phrase: 'окей дипсик', pauseMs: 1400 }))
const on = render('wake on')
const onEar = on.children.find((child) => child && child.props && /dstr-ear/.test(child.props.className || ''))
if (!onEar) throw new Error('wake on: ear button is missing')
if (!/is-live/.test(onEar.props.className)) throw new Error('wake on: ear button must be live (blue)')
const extra = on.children.filter((child) => child && child.props && /dstr-chip/.test(child.props.className || ''))
if (extra.length) throw new Error('wake on: no floating chip is expected any more')
console.log('wake on: ear button is live, no floating chip')

// Собранные эффекты должны быть функциями: иначе рендер «прошёл», а хуки нет.
if (!effects.length) throw new Error('no effects were registered')
if (!effects.every((fn) => typeof fn === 'function')) throw new Error('effect registration is broken')
console.log(`\neffects registered: ${effects.length}`)
console.log('all passed')
