import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const parityPath = path.join(rootDir, 'parity.json')

const parityApiPlugin = (): Plugin => ({
  name: 'parity-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/parity')) {
        next()
        return
      }

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
    })
  },
})

export default defineConfig({
  plugins: [vue(), tailwindcss(), parityApiPlugin()],
})
