import { describe, expect, it } from 'vitest'
import {
  qNew,
  qPush,
  qPop,
  qLen,
} from '@/game/z'

describe('Queue (port of z-queue)', () => {
  
  it('Create new queue', () => {
    const q = qNew(0)
    expect(q.size).toBe(1)
    expect(q.head).toBe(0)
    expect(q.tail).toBe(0)
    expect(q.data).toHaveLength(1)
    expect(qLen(q)).toBe(0)
  })

  it('Push then pop in FIFO order', () => {
    const q = qNew(3)
    
    qPush(q, 1)
    qPush(q, 2)
    qPush(q, 3)

    expect(qLen(q)).toBe(3)

    expect(qPop(q)).toBe(1)
    expect(qPop(q)).toBe(2)
    expect(qPop(q)).toBe(3)

    expect(qLen(q)).toBe(0)
  })

  it('Wraps around and keeps FIFO order', () => {
    const q = qNew(3)
    qPush(q, 1)
    qPush(q, 2)
    qPush(q, 3)
    expect(qPop(q)).toBe(1)
    expect(qPop(q)).toBe(2)
    qPush(q, 4)
    expect(qLen(q)).toBe(2)
    expect(qPop(q)).toBe(3)
    expect(qPop(q)).toBe(4)
    expect(qLen(q)).toBe(0)
  })

  it('Throws on push beyond size', () => {
    const q = qNew(3)
    qPush(q, 1)
    qPush(q, 2)
    qPush(q, 3)

    expect(() => qPush(q, 4)).toThrow('Queue overflow')
  })

  it('Throws on pop from empty queue', () => {
    const q = qNew(3)

    expect(() => qPop(q)).toThrow('Queue underflow')
  })
})
