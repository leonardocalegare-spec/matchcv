import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import analisarVagaHandler from './api/analisar-vaga.js'
import { readJsonBody, sendRequestError } from './api/shared/http.js'

function vagaClaraApiPlugin() {
  return {
    name: 'vagaclara-api',
    configureServer(server) {
      server.middlewares.use('/api/analisar-vaga', async (req, res) => {
        try {
          req.body = await readJsonBody(req)
          await analisarVagaHandler(req, res)
        } catch (error) {
          sendRequestError(res, error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vagaClaraApiPlugin(), react()],
})
