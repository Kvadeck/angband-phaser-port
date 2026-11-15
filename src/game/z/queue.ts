/** Grid coordinate. Always create a new Loc via helpers — do not mutate fields. */

export type Loc = Readonly<{ x: number; y: number }>

export const loc = (x: number, y: number): Loc => ({ x, y })

export const locEq = (a: Loc, b: Loc): boolean => a.x === b.x && a.y === b.y

export const locIsZero = (grid: Loc): boolean => locEq(grid, loc(0, 0))

export const locSum = (a: Loc, b: Loc): Loc => loc(a.x + b.x, a.y + b.y)

export const locDiff = (a: Loc, b: Loc): Loc => loc(a.x - b.x, a.y - b.y)

export const locOffset = (grid: Loc, dx: number, dy: number): Loc =>
  loc(grid.x + dx, grid.y + dy)
