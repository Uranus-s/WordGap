import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function tatoebaProxy(): Plugin {
  return {
    name: "tatoeba-proxy",
    configureServer(server) {
      server.middlewares.use("/api/tatoeba", async (req, res) => {
        const targetPath = req.url ?? ""
        const targetUrl = `https://tatoeba.org${targetPath}`

        try {
          const upstream = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; WordGap/1.0)",
              "Accept": "text/html,application/xhtml+xml",
            },
          })

          res.statusCode = upstream.status
          res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "text/html")
          res.setHeader("Access-Control-Allow-Origin", "*")

          const body = await upstream.text()
          res.end(body)
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: "Proxy error", detail: String(err) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tatoebaProxy()],
})
