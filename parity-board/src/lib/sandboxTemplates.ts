export type SandboxTemplateId = 'queue' | 'loc' | 'rand' | 'blank'

export type SandboxTemplate = {
  id: SandboxTemplateId
  label: string
  description: string
  code: string
}

export const sandboxTemplates: SandboxTemplate[] = [
  {
    id: 'queue',
    label: 'Queue',
    description: 'Circular int queue — qNew / qPush / qPop',
    code: `// Helpers are in scope: qNew, qLen, qPush, qPop
const q = qNew(4)

qPush(q, 10)
qPush(q, 20)
qPush(q, 30)

console.log('len', qLen(q))
console.log('head/tail', q.head, q.tail)
console.log('ring', q.data)

const a = qPop(q)
const b = qPop(q)
console.log('popped', a, b, 'len', qLen(q))
`,
  },
  {
    id: 'loc',
    label: 'Loc',
    description: 'Grid helpers — locSum / locDiff / locOffset',
    code: `// Helpers: loc, locEq, locIsZero, locSum, locDiff, locOffset
const a = loc(2, 3)
const b = loc(5, 1)

console.log('a', a)
console.log('sum', locSum(a, b))
console.log('diff', locDiff(b, a))
console.log('offset', locOffset(a, -1, 4))
console.log('eq?', locEq(a, loc(2, 3)))
console.log('zero?', locIsZero(loc(0, 0)))
`,
  },
  {
    id: 'rand',
    label: 'Rand',
    description: 'WELL1024a + LCRNG — randStateInit / wellRng1024a / lcrng',
    code: `// Helpers: randStateInit, wellRng1024a, lcrng
randStateInit(12345)

const a = [wellRng1024a(), wellRng1024a(), wellRng1024a()]
randStateInit(12345)
const b = [wellRng1024a(), wellRng1024a(), wellRng1024a()]

console.log('same seed → same sequence?', JSON.stringify(a) === JSON.stringify(b))
console.log('seq', a)
console.log('lcrng(1)', lcrng(1))
`,
  },
  {
    id: 'blank',
    label: 'Blank',
    description: 'Empty script — free TypeScript',
    code: `// Free TypeScript playground.
// In scope: loc*, qNew/qLen/qPush/qPop, randStateInit/wellRng1024a/lcrng
// Use console.log / console.warn / console.error

console.log('ready')
`,
  },
]

export const getSandboxTemplate = (id: SandboxTemplateId): SandboxTemplate => {
  const found = sandboxTemplates.find((item) => item.id === id)
  if (!found) return sandboxTemplates[0]
  return found
}
