/**
 * Z-layer: platform-independent helpers.
 * Ports of Angband `src/z-*.c` land here (z-rand, z-type, z-queue, ...).
 */
export {
  loc,
  locDiff,
  locEq,
  locIsZero,
  locOffset,
  locSum,
  type Loc,
} from './type'

export {
  qNew,
  qLen,
  qPush,
  qPop,
  type Queue,
} from './queue'

export {
  lcrng,
  wellRng1024a,
  randStateInit
} from './rand'

export const GAME_CORE_READY = false
