import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import analisarVagaHandler from './api/analisar-vaga.js'

function loadJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''

    req.on('data', (chunk) => {
      data += chunk
    })

    req.on('end', () => {
      if (!data) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(data))
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', reject)
  })
}

function matchCvApiPlugin() {
  return {
    name: 'matchcv-api',
    configureServer(server) {
      server.middlewares.use('/api/analisar-vaga', async (req, res) => {
        try {
          req.body = await loadJsonBody(req)
          await analisarVagaHandler(req, res)
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'JSON invalido.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [matchCvApiPlugin(), react()],
})
