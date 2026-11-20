# Parity Board

Browser editor for the repo-root [`parity.json`](../parity.json) ledger.

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
