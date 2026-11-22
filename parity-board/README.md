# Parity Board / Dev Workbench

Browser workbench for the Angband Phaser port: parity ledger, TypeScript sandbox for `src/game/z`, and Vitest UI link.

## Routes

| Path | Page |
|------|------|
| `/` | redirect → `/dev/parity` |
| `/dev` | redirect → `/dev/parity` |
| `/dev/parity` | ledger editor (`parity.json`) |
| `/dev/sandbox` | Monaco TypeScript playground (Queue / Loc / Rand templates) |
| `/dev/tests` | Vitest UI status |

Sandbox runs real helpers from `src/game/z` via the `@game` alias (`loc*`, `qNew` / `qPush` / `qPop`, …). Monaco loads from CDN at runtime so the production bundle stays small.

## Dev

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

Listens on `0.0.0.0:3080` by default (`PORT` / `HOST` env vars supported).
Save writes only `parity.json` (no markdown sync).
