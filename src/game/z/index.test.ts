import { describe, expect, it } from 'vitest'
import { GAME_CORE_READY, loc } from '@/game/z'

describe('game z barrel', () => {
  it('re-exports loc helpers', () => {
    expect(loc(0, 0)).toEqual({ x: 0, y: 0 })
  })

  it('keeps the bootstrap flag until the z-layer is complete', () => {
    expect(GAME_CORE_READY).toBe(false)
  })
})
