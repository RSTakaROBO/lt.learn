import { migrateStorage } from "js/storage-migrations.js"

async function bootstrap() {
    migrateStorage(localStorage)
    await import("./App.jsx")
}

bootstrap()
