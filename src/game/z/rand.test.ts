import { describe, expect, it } from 'vitest'
import {
  lcrng,
  wellRng1024a,
  randStateInit,
  randDiv,
  randRange,
  damroll,
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

  describe('randDiv', () => {
    it('returns 0 when m <= 1', () => {
      expect(randDiv(0)).toBe(0)
      expect(randDiv(1)).toBe(0)
    })

    it('throws when m is too large', () => {
      expect(() => randDiv(0x10000001)).toThrow('randDiv: m too large')
    })

    it('returns values in [0, m)', () => {
      randStateInit(99)
      for (let i = 0; i < 200; i++) {
        const n = randDiv(10)
        expect(Number.isInteger(n)).toBe(true)
        expect(n).toBeGreaterThanOrEqual(0)
        expect(n).toBeLessThan(10)
      }
    })

    it('same seed gives the same sequence', () => {
      randStateInit(777)
      const a = [randDiv(6), randDiv(6), randDiv(6)]

      randStateInit(777)
      const b = [randDiv(6), randDiv(6), randDiv(6)]

      expect(a).toEqual(b)
    })
  })

  describe('randRange', () => {
    it('returns A when A === B', () => {
      expect(randRange(5, 5)).toBe(5)
    })

    it('throws when A > B', () => {
      expect(() => randRange(5, 3)).toThrow('randRange: A > B')
    })

    it('returns values in [A, B]', () => {
      randStateInit(42)
      for (let i = 0; i < 200; i++) {
        const n = randRange(3, 8)
        expect(Number.isInteger(n)).toBe(true)
        expect(n).toBeGreaterThanOrEqual(3)
        expect(n).toBeLessThanOrEqual(8)
      }
    })

    it('same seed gives the same sequence', () => {
      randStateInit(123)
      const a = [randRange(1, 10), randRange(1, 10)]

      randStateInit(123)
      const b = [randRange(1, 10), randRange(1, 10)]

      expect(a).toEqual(b)
    })
  })

  describe('damroll', () => {
    it('returns 0 when sides <= 0', () => {
      expect(damroll(3, 0)).toBe(0)
      expect(damroll(3, -1)).toBe(0)
    })

    it('returns values in [num, num * sides]', () => {
      randStateInit(7)
      for (let i = 0; i < 100; i++) {
        const n = damroll(2, 6)
        expect(Number.isInteger(n)).toBe(true)
        expect(n).toBeGreaterThanOrEqual(2)
        expect(n).toBeLessThanOrEqual(12)
      }
    })

    it('same seed gives the same result', () => {
      randStateInit(55)
      const a = damroll(3, 8)

      randStateInit(55)
      const b = damroll(3, 8)

      expect(a).toBe(b)
    })
  })

  it('CI smoke: damroll(1, 1) is always 1', () => {
    randStateInit(1)
    expect(damroll(1, 1)).toBe(1)
  })
})

