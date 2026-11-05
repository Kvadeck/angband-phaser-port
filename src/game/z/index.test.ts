import { describe, expect, it } from 'vitest'
import { GAME_CORE_READY } from '@/game/z'

describe('game core scaffold', () => {
  it('exposes a bootstrap flag until z-layer ports land', () => {
    expect(GAME_CORE_READY).toBe(false)
  })
})
