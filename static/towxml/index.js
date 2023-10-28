const md = require('./parse/markdown/index'),
  parse = require('./parse/index')

module.exports = (str, type, option) => {
  option = option || {}
  let result
  switch (type) {
    case 'markdown':
      result = parse(md(str), option)
      break
    case 'html':
      result = parse(str, option)
      break
    default:
      result = parse(md(str), option)
      break
  }
  return result
}
