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
    description: 'Stub until src/game/z/rand.ts lands',
    code: `// z-rand is not ported yet (src/game/z/rand.ts missing).
// When it lands, seed / randint / percent will be injected here.

console.warn('Rand sandbox: not available yet')
console.log('Available now: Queue + Loc helpers only')
`,
  },
  {
    id: 'blank',
    label: 'Blank',
    description: 'Empty script — free TypeScript',
    code: `// Free TypeScript playground.
// In scope: loc*, qNew, qLen, qPush, qPop
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
