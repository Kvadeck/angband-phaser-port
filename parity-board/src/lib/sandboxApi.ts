import {
  loc,
  locDiff,
  locEq,
  locIsZero,
  locOffset,
  locSum,
  type Loc,
} from '@game/z/type'
import { qLen, qNew, qPop, qPush, type Queue } from '@game/z/queue'

/** Runtime bindings injected into sandbox scripts (no imports needed). */
export const sandboxBindings = {
  loc,
  locDiff,
  locEq,
  locIsZero,
  locOffset,
  locSum,
  qLen,
  qNew,
  qPop,
  qPush,
} as const

export type SandboxBindings = typeof sandboxBindings

/** Ambient types for Monaco IntelliSense. */
export const sandboxExtraLib = `
export type Loc = Readonly<{ x: number; y: number }>
export type Queue = {
  data: number[]
  size: number
  head: number
  tail: number
}

declare const loc: (x: number, y: number) => Loc
declare const locEq: (a: Loc, b: Loc) => boolean
declare const locIsZero: (grid: Loc) => boolean
declare const locSum: (a: Loc, b: Loc) => Loc
declare const locDiff: (a: Loc, b: Loc) => Loc
declare const locOffset: (grid: Loc, dx: number, dy: number) => Loc

declare const qNew: (size: number) => Queue
declare const qLen: (q: Queue) => number
declare const qPush: (q: Queue, item: number) => void
declare const qPop: (q: Queue) => number | undefined

export {}
`

export type { Loc, Queue }
