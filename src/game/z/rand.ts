/* A Random Number Generator for Angband Port */

export const MAX_RAND_DEPTH = 128 as const
export const RAND_DEG = 32 as const

export const M1 = 3 as const
export const M2 = 24 as const
export const M3 = 10 as const 

export type RandomValue = Readonly<{
  base: number
  dice: number
  sides: number
  mBonus: number
}>

export type RandomChance = Readonly<{
  numerator: number
  denominator: number
}>

export type Aspect =
  | 'minimise'
  | 'average'
  | 'maximise'
  | 'extremify'
  | 'randomise'

/**
 * Один шаг Linear Congruential RNG.
 * В C арифметика сама идёт в uint32; в JS — нет.
 * Math.imul + >>> 0 эмулируют те же 32-bit операции, иначе при том же seed
 * последовательность не совпадёт с Angband.
 */
export const lcrng = (x: number): number =>
 (Math.imul(x, 1103515245) + 12345) >>> 0

const mat0pos = (t: number, v: number) => (v ^ (v >>> t)) >>> 0
const mat0neg = (shift: number, v: number) => (v ^ (v << shift)) >>> 0

let stateI = 0
const state = new Array<number>(RAND_DEG).fill(0)


/**
 * Один шаг сложного RNG Angband (WELL1024a).
 * Берёт числа из внутреннего массива state, перемешивает их и возвращает
 * следующее «случайное» uint32.
 */
export const wellRng1024a = (): number => {
  const i = stateI
  const v0 = state[i]!
  const vm1 = state[(i + M1) & 0x1f]!
  const vm2 = state[(i + M2) & 0x1f]!
  const vm3 = state[(i + M3) & 0x1f]!
  const z0 = state[(i + 31) & 0x1f]!
  const z1 = (v0 ^ mat0pos(8, vm1)) >>> 0
  const z2 = (mat0neg(19, vm2) ^ mat0neg(14, vm3)) >>> 0
  state[i] = (z1 ^ z2) >>> 0
  state[(i + 31) & 0x1f] =
    (mat0neg(11, z0) ^ mat0neg(7, z1) ^ mat0neg(13, z2)) >>> 0
  stateI = (i + 31) & 0x1f
  return state[stateI]!
}

/**
 * Заполнить state из seed, чтобы WELL RNG был готов к работе.
 * Без этого массив из нулей, и «случайные» числа будут одни и те же / плохие.
 */
export const randStateInit = (seed: number): void => {
  // Сбрасываем индекс, чтобы один и тот же seed всегда давал ту же последовательность.
  // (В C старый state_i сохраняется; повторный init после использования разошёлся бы с нами.)
  stateI = 0
  state[0] = seed >>> 0

  for (let i = 1; i < RAND_DEG; i++) {
    state[i] = lcrng(state[i - 1]!)
  }

  for (let n = 0; n < RAND_DEG * 10; n++) {
    const j = (stateI + 1) % RAND_DEG
    state[j] = (state[j]! + state[stateI]!) >>> 0
    stateI = j
  }
}

export const randDiv = (m: number): number => {
  if (m > 0x10000000) throw new Error('randDiv: m too large')
  if (m <= 1) return (0);

  const n = Math.floor(0x10000000 / m)
  let r = 0;

  while(true) {
    r = wellRng1024a();
    r = Math.floor(((r >>> 4) & 0x0fffffff) / n);
    if (r < m) break;
  }

  return r;
}

export const randRange = (A: number, B: number): number => {
  if (A === B) return A;
  if (A > B) throw new Error('randRange: A > B') 
  return A + randDiv(1 + B - A);
}

export const randint0 = (m: number): number => randDiv(m)
export const randint1 = (m: number): number => randDiv(m) + 1

/** Port of damroll — NdS dice (e.g. 2d6). CI smoke touch. */
export const damroll = (num: number, sides: number): number => {
  if (sides <= 0) return 0
  let sum = 0
  for (let i = 0; i < num; i++) sum += randint1(sides)
  return sum
}