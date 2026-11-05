import { describe, expect, it } from 'vitest'
import {
  loc,
  locDiff,
  locEq,
  locIsZero,
  locOffset,
  locSum,
} from '@/game/z'

describe('loc (port of z-type)', () => {
  it('builds a coordinate pair', () => {
    expect(loc(3, 7)).toEqual({ x: 3, y: 7 })
  })

  it('compares equality', () => {
    expect(locEq(loc(1, 2), loc(1, 2))).toBe(true)
    expect(locEq(loc(1, 2), loc(2, 1))).toBe(false)
  })

  it('detects the zero grid', () => {
    expect(locIsZero(loc(0, 0))).toBe(true)
    expect(locIsZero(loc(1, 0))).toBe(false)
  })

  it('sums and diffs without mutating inputs', () => {
    const a = loc(4, 5)
    const b = loc(1, 2)

    expect(locSum(a, b)).toEqual({ x: 5, y: 7 })
    expect(locDiff(a, b)).toEqual({ x: 3, y: 3 })
    expect(a).toEqual({ x: 4, y: 5 })
    expect(b).toEqual({ x: 1, y: 2 })
  })

  it('offsets by dx/dy', () => {
    expect(locOffset(loc(10, 20), -3, 4)).toEqual({ x: 7, y: 24 })
  })
})
