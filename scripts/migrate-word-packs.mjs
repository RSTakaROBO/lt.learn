import { readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { migrateWordPackDocument } from "../js/word-entry.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/words")
const files = (await readdir(root)).filter(
    (file) => file.endsWith(".json") && file !== "manifest.json"
)

for (const file of files) {
    const target = path.join(root, file)
    const source = JSON.parse(await readFile(target, "utf8"))
    const sourceCount = Array.isArray(source.words) ? source.words.length : 0
    const migrated = migrateWordPackDocument(source)
    if (!migrated || migrated.words.length !== sourceCount) {
        throw new Error(`${file}: migration would lose word entries`)
    }
    await writeFile(target, `${JSON.stringify(migrated, null, 4)}\n`, "utf8")
}
