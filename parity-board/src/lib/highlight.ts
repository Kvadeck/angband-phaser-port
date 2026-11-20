import hljs from 'highlight.js/lib/core'
import c from 'highlight.js/lib/languages/c'
import typescript from 'highlight.js/lib/languages/typescript'

hljs.registerLanguage('c', c)
hljs.registerLanguage('typescript', typescript)

export const highlightCode = (code: string, language: 'c' | 'typescript') => {
  if (!code) return ''
  try {
    return hljs.highlight(code, { language }).value
  } catch {
    return hljs.highlightAuto(code).value
  }
}
