import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const parityPath = path.join(rootDir, 'parity.json')

const readVitestToken = async () => {
  if (process.env.VITEST_UI_TOKEN) return process.env.VITEST_UI_TOKEN
  const xdg = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share')
  const paths = [
    process.env.VITEST_UI_TOKEN_FILE,
    path.join(xdg, 'vitest', '.vitest-secret-token'),
    path.join(rootDir, 'node_modules', '.vitest', '.vitest-secret-token'),
  ].filter(Boolean) as string[]

  for (const tokenPath of paths) {
    try {
      const token = (await fs.readFile(tokenPath, 'utf8')).trim()
      if (token) return token
    } catch {
      // try next
    }
  }
  return ''
}

const allowedSourcePrefixes = [
  path.join(rootDir, 'vendor', 'angband', 'src') + path.sep,
  path.join(rootDir, 'src') + path.sep,
]

const resolveAllowedSource = (relativePath: string) => {
  if (!relativePath || relativePath.includes('\0')) return null
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '')
  if (normalized.startsWith('..')) return null

  const absolute = path.resolve(rootDir, normalized)
  const allowed = allowedSourcePrefixes.some(
    (prefix) => absolute === prefix.slice(0, -1) || absolute.startsWith(prefix),
  )
  if (!allowed) return null
  return absolute
}

const parityApiPlugin = (): Plugin => ({
  name: 'parity-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url) {
        next()
        return
      }

      const url = new URL(req.url, 'http://localhost')

      if (url.pathname === '/api/parity') {
        if (req.method === 'GET') {
          try {
            const raw = await fs.readFile(parityPath, 'utf8')
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(raw)
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'read failed' }))
          }
          return
        }

        if (req.method === 'PUT') {
          const chunks: Buffer[] = []
          req.on('data', (chunk) => chunks.push(chunk))
          req.on('end', async () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8')
              const parsed = JSON.parse(body)
              if (!parsed || !Array.isArray(parsed.milestones)) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid parity payload' }))
                return
              }
              await fs.writeFile(parityPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'write failed' }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end('Method not allowed')
        return
      }

      if (url.pathname === '/api/tests' && req.method === 'GET') {
        const vitestPort = Number(process.env.VITEST_UI_PORT || 51204)
        const vitestPath = process.env.VITEST_UI_PATH || '/__vitest__/'
        const hostHeader = req.headers.host || 'localhost'
        const hostname = hostHeader.split(':')[0] || 'localhost'
        const token = await readVitestToken()
        const uiUrl = new URL(`http://${hostname}:${vitestPort}${vitestPath}`)
        if (token) uiUrl.searchParams.set('token', token)

        let online = false
        try {
          const probe = await fetch(uiUrl.toString().replace(hostname, '127.0.0.1'), {
            method: 'GET',
            signal: AbortSignal.timeout(1500),
          })
          online = probe.ok || probe.status === 304
        } catch {
          online = false
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(
          JSON.stringify({
            online,
            port: vitestPort,
            path: vitestPath,
            url: uiUrl.toString(),
          }),
        )
        return
      }

      if (url.pathname === '/api/source' && req.method === 'GET') {
        const relative = url.searchParams.get('path') || ''
        const absolute = resolveAllowedSource(relative)
        if (!absolute) {
          res.statusCode = 403
          res.end(JSON.stringify({ error: 'Path not allowed' }))
          return
        }

        try {
          const raw = await fs.readFile(absolute, 'utf8')
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ path: relative.replace(/\\/g, '/'), content: raw }))
        } catch (err) {
          res.statusCode = 404
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'File not found' }))
        }
        return
      }

      next()
    })
  },
})

export default defineConfig({
  plugins: [vue(), tailwindcss(), parityApiPlugin()],
  resolve: {
    alias: {
      '@game': path.join(rootDir, 'src', 'game'),
    },
  },
})
