import { describe, expect, it } from 'vitest'
import {
  lcrng,
  wellRng1024a,
  randStateInit,
} from '@/game/z'

describe('Rand (port of z-rand)', () => {
  it('Lcrng is deterministic and stays in uint32 range', () => {
    expect(lcrng(1)).toBe(lcrng(1))
    expect(lcrng(0)).toBeGreaterThanOrEqual(0)
    expect(lcrng(0)).toBeLessThanOrEqual(0xffffffff)
  })

  it('Same seed gives the same WELL sequence', () => {
    randStateInit(12345)
    const a = [wellRng1024a(), wellRng1024a(), wellRng1024a()]

    randStateInit(12345)
    const b = [wellRng1024a(), wellRng1024a(), wellRng1024a()]

    expect(a).toEqual(b)
  })

  it('Different seeds give different WELL values', () => {
    randStateInit(1)
    const a = wellRng1024a()

    randStateInit(2)
    const b = wellRng1024a()

    expect(a).not.toBe(b)
  })

  it('WELL values are integers in uint32 range', () => {
    randStateInit(42)

    for (let i = 0; i < 100; i++) {
      const n = wellRng1024a()
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(0xffffffff)
    }
  })
})
