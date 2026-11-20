import http from 'node:http'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PARITY_PATH = path.join(ROOT, 'parity.json')
const DIST_DIR = path.join(__dirname, 'dist')
const PORT = Number(process.env.PORT || 3080)
const HOST = process.env.HOST || '0.0.0.0'
const VITEST_UI_PORT = Number(process.env.VITEST_UI_PORT || 51204)
const VITEST_UI_PATH = process.env.VITEST_UI_PATH || '/__vitest__/'

const vitestTokenPaths = () => {
  const xdg = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share')
  return [
    process.env.VITEST_UI_TOKEN_FILE,
    path.join(xdg, 'vitest', '.vitest-secret-token'),
    path.join(ROOT, 'node_modules', '.vitest', '.vitest-secret-token'),
  ].filter(Boolean)
}

const readVitestToken = async () => {
  if (process.env.VITEST_UI_TOKEN) return process.env.VITEST_UI_TOKEN
  for (const tokenPath of vitestTokenPaths()) {
    try {
      const raw = await fs.readFile(tokenPath, 'utf8')
      const token = raw.trim()
      if (token) return token
    } catch {
      // try next
    }
  }
  return ''
}

const buildVitestUiUrl = async (hostname) => {
  const url = new URL(`http://${hostname}:${VITEST_UI_PORT}${VITEST_UI_PATH}`)
  const token = await readVitestToken()
  if (token) url.searchParams.set('token', token)
  return url.toString()
}

const ALLOWED_SOURCE_PREFIXES = [
  path.join(ROOT, 'vendor', 'angband', 'src') + path.sep,
  path.join(ROOT, 'src') + path.sep,
]

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.c': 'text/plain; charset=utf-8',
  '.h': 'text/plain; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.tsx': 'text/plain; charset=utf-8',
  '.vue': 'text/plain; charset=utf-8',
}

const sendJson = (res, status, body) => {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(payload)
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })

const isValidParity = (value) => {
  if (!value || typeof value !== 'object') return false
  if (!Array.isArray(value.milestones)) return false
  return true
}

const resolveAllowedSource = (relativePath) => {
  if (!relativePath || relativePath.includes('\0')) return null
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '')
  if (normalized.startsWith('..')) return null

  const absolute = path.resolve(ROOT, normalized)
  const allowed = ALLOWED_SOURCE_PREFIXES.some(
    (prefix) => absolute === prefix.slice(0, -1) || absolute.startsWith(prefix),
  )
  if (!allowed) return null
  return absolute
}

const serveStatic = async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/') pathname = '/index.html'

  const filePath = path.normalize(path.join(DIST_DIR, pathname))
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403).end('Forbidden')
    return
  }

  try {
    const data = await fs.readFile(filePath)
    const ext = path.extname(filePath)
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
    })
    res.end(data)
  } catch {
    if (pathname !== '/index.html') {
      try {
        const fallback = await fs.readFile(path.join(DIST_DIR, 'index.html'))
        res.writeHead(200, { 'Content-Type': CONTENT_TYPES['.html'] })
        res.end(fallback)
        return
      } catch {
        // fall through
      }
    }
    res.writeHead(404).end('Not found')
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (url.pathname === '/api/parity' && req.method === 'GET') {
    try {
      const raw = await fs.readFile(PARITY_PATH, 'utf8')
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      })
      res.end(raw)
    } catch (err) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : 'Failed to read parity.json',
      })
    }
    return
  }

  if (url.pathname === '/api/parity' && req.method === 'PUT') {
    try {
      const body = await readBody(req)
      const parsed = JSON.parse(body)
      if (!isValidParity(parsed)) {
        sendJson(res, 400, { error: 'Invalid parity payload' })
        return
      }
      const formatted = `${JSON.stringify(parsed, null, 2)}\n`
      await fs.writeFile(PARITY_PATH, formatted, 'utf8')
      sendJson(res, 200, { ok: true })
    } catch (err) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : 'Failed to write parity.json',
      })
    }
    return
  }

  if (url.pathname === '/api/tests' && req.method === 'GET') {
    const hostHeader = req.headers.host || `127.0.0.1:${PORT}`
    const hostname = hostHeader.split(':')[0] || '127.0.0.1'
    const uiUrl = await buildVitestUiUrl(hostname)

    const online = await new Promise((resolve) => {
      const req = http.get(
        {
          host: '127.0.0.1',
          port: VITEST_UI_PORT,
          path: '/',
          timeout: 1500,
        },
        (probeRes) => {
          probeRes.resume()
          resolve(true)
        },
      )
      req.on('timeout', () => {
        req.destroy()
        resolve(false)
      })
      req.on('error', () => resolve(false))
    })

    sendJson(res, 200, {
      online,
      port: VITEST_UI_PORT,
      path: VITEST_UI_PATH,
      url: uiUrl,
    })
    return
  }

  if (url.pathname === '/tests' || url.pathname === '/tests/') {
    const hostHeader = req.headers.host || `127.0.0.1:${PORT}`
    const hostname = hostHeader.split(':')[0] || '127.0.0.1'
    res.writeHead(302, { Location: await buildVitestUiUrl(hostname) })
    res.end()
    return
  }

  if (url.pathname === '/api/source' && req.method === 'GET') {
    const relative = url.searchParams.get('path') || ''
    const absolute = resolveAllowedSource(relative)
    if (!absolute) {
      sendJson(res, 403, { error: 'Path not allowed' })
      return
    }

    try {
      const raw = await fs.readFile(absolute, 'utf8')
      sendJson(res, 200, {
        path: relative.replace(/\\/g, '/'),
        content: raw,
      })
    } catch (err) {
      sendJson(res, 404, {
        error: err instanceof Error ? err.message : 'File not found',
      })
    }
    return
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    await serveStatic(req, res)
    return
  }

  res.writeHead(405).end('Method not allowed')
})

server.listen(PORT, HOST, () => {
  console.log(`Parity Board listening on http://${HOST}:${PORT}`)
  console.log(`Serving ${DIST_DIR}`)
  console.log(`Editing ${PARITY_PATH}`)
})
