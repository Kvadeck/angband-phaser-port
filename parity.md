# Parity ledger

Tracks how closely TypeScript modules match upstream Angband.

- **Upstream pin:** `vendor/angband` @ tag **4.2.5** (`69e24dbb0`)
- **Statuses:** `stub` (placeholder) · `partial` (works, known gaps) · `parity` (in-scope behaviour matches)

When a module is `partial`, list the intentional differences under Notes.

## Milestone 1 — Dungeon loop

| Upstream (C) | TypeScript | Status | Notes |
|---|---|---|---|
| `src/z-type.h` / `src/z-type.c` | `src/game/z/` | stub | `loc` and basic types |
| `src/z-rand.h` / `src/z-rand.c` | `src/game/z/` | stub | RNG for gen/combat |
| `src/z-queue.h` / `src/z-queue.c` | `src/game/z/` | stub | as needed by FOV / cmds |
| `src/cave.h` / `src/cave.c` | `src/game/cave/` | stub | `chunk`, `square`, feats |
| `src/cave-square.c` | `src/game/cave/` | stub | square predicates / accessors |
| `src/cave-view.c` | `src/game/cave/` | stub | `update_view` / LOS |
| `src/cave-map.c` | `src/game/cave/` | stub | `map_info`, noise/scent (simplified OK at first) |
| `src/generate.c` / `src/generate.h` | `src/game/generate/` | stub | level orchestration |
| `src/gen-cave.c` | `src/game/generate/` | stub | classic-like rooms + corridors |
| `src/gen-room.c` | `src/game/generate/` | stub | simple rooms first |
| `src/gen-util.c` | `src/game/generate/` | stub | helpers |
| `src/cmd-core.c` | `src/game/cmd/` | stub | command queue |
| `src/cmd-cave.c` | `src/game/cmd/` | stub | move / descend |
| `src/game-world.c` | `src/game/world/` | stub | energy `runGameLoop` |
| `src/game-event.c` | `src/game/event/` | stub | UI/renderer notifications |
| `src/player.h` / `src/player.c` | `src/game/player/` | stub | minimal player for M1 (no full birth) |
| `src/player-attack.c` | `src/game/player/` | stub | melee vs monsters |
| `src/player-calcs.c` | `src/game/player/` | stub | only what M1 needs (`handle_stuff` / vision flags) |
| `src/mon-make.c` | `src/game/mon/` | stub | place 1–2 monster kinds |
| `src/mon-move.c` | `src/game/mon/` | stub | approach player |
| `src/mon-attack.c` | `src/game/mon/` | stub | monster melee |

## Milestone 2+ (not started)

| Upstream (C) | TypeScript | Status | Notes |
|---|---|---|---|
| `src/player-birth.c` | `src/game/player/` | stub | character creation + Vue wizard |
| town / stores / inventory | TBD | stub | after dungeon loop |
| `lib/gamedata/*.txt` | TBD | stub | colon-file parser |
| tileset renderer | `src/render/phaser/` | stub | after ASCII map |

## How to update

1. Port or deepen a module.
2. Set Status to `partial` or `parity`.
3. For `partial`, write Notes (what is still missing vs 4.2.5).
4. Keep `// port of src/foo.c` at the top of the TS file.
