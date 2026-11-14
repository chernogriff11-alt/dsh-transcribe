// Общий экстрактор функций из исходников плагина для тест-скриптов.
// Терпит отступы, `async` и нестандартный перенос строки между именем и `(`,
// поэтому косметическая переформатировка кода не роняет тесты «function not found».

/**
 * Вырезает исходный текст функции по имени, считая фигурные скобки.
 * @param {string} source исходник
 * @param {string} name имя функции
 * @returns {string} текст функции вместе с её `{ ... }`
 */
export function extractFunction(source, name) {
  const re = new RegExp(`^[ \\t]*(?:async[ \\t]+)?function[ \\t]+${name}[ \\t]*\\(`, 'm')
  const match = re.exec(source)
  if (!match) throw new Error(`function ${name} not found`)
  const start = match.index + match[0].indexOf('function')
  const open = source.indexOf('{', match.index)
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
