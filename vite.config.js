import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// GitHub Pages: https://<user>.github.io/<repo>/
export default defineConfig({
    plugins: [react()],
    base: "/lt.learn/",
    server: {
        host: true,
        port: 5173,
    },
    preview: {
        host: true,
        port: 4173,
    },
})
