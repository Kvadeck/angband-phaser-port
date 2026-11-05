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

export const GAME_CORE_READY = false
