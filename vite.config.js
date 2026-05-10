import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(path.join(__dirname, "package.json"), "utf-8"))

// GitHub Pages: https://<user>.github.io/<repo>/
export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(typeof pkg.version === "string" ? pkg.version : "0.0.0"),
    },
    plugins: [react()],
    resolve: {
        alias: {
            src: path.resolve(__dirname, "src"),
            js: path.resolve(__dirname, "js"),
        },
    },
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
