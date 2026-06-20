import {
    LEARNED_WORD_CORRECT_WRONG_DELTA,
    STORAGE_KEYS,
    STORAGE_SCHEMA_VERSION,
    VOCAB_MODE,
} from "./config.js"
import { migrateWordPackDocument, WORD_PACK_SCHEMA_VERSION } from "./word-entry.js"

const STORAGE_MIGRATIONS = {
    2(store) {
        const raw = store.getItem(STORAGE_KEYS.wordStats)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return

        for (const row of Object.values(parsed)) {
            if (!row || typeof row !== "object" || Array.isArray(row)) continue
            const savedProgress = Number(row.progress)
            const correct = Number(row.correct)
            const wrong = Number(row.wrong)
            const progress = Number.isFinite(savedProgress) ? savedProgress : correct - wrong
            row.progress = Math.max(
                0,
                Math.min(LEARNED_WORD_CORRECT_WRONG_DELTA, Math.floor(progress) || 0)
            )
        }

        store.setItem(STORAGE_KEYS.wordStats, JSON.stringify(parsed))
    },
    3(store) {
        const rawDirections = store.getItem(STORAGE_KEYS.vocabDirections)
        if (rawDirections) {
            const directions = JSON.parse(rawDirections)
            if (directions && typeof directions === "object" && !Array.isArray(directions)) {
                const vocabMode = Object.values(VOCAB_MODE).includes(directions.vocabMode)
                    ? directions.vocabMode
                    : directions.hardcore
                      ? VOCAB_MODE.HARDCORE
                      : VOCAB_MODE.CHOICES
                store.setItem(
                    STORAGE_KEYS.vocabDirections,
                    JSON.stringify({
                        ru_to_lt: !!directions.ru_to_lt,
                        lt_to_ru: !!directions.lt_to_ru,
                        vocabMode,
                    })
                )
            }
        }

        const rawPacks = store.getItem(STORAGE_KEYS.customPacks)
        if (!rawPacks) return
        const records = JSON.parse(rawPacks)
        if (!Array.isArray(records)) return
        const migratedRecords = []
        for (const record of records) {
            if (!record || typeof record !== "object" || Array.isArray(record)) continue
            const migrated = migrateWordPackDocument({
                title: record.title,
                words: record.words,
            })
            if (!migrated?.words.length) continue
            migratedRecords.push({
                id: record.id,
                title: record.title,
                schemaVersion: WORD_PACK_SCHEMA_VERSION,
                words: migrated.words,
            })
        }
        store.setItem(STORAGE_KEYS.customPacks, JSON.stringify(migratedRecords))
    },
}

function readSchemaVersion(store) {
    const raw = store.getItem(STORAGE_KEYS.schemaVersion)
    if (raw == null || raw === "") return 1
    const version = Number(raw)
    return Number.isInteger(version) && version >= 1 ? version : 1
}

export function migrateStorage(store) {
    let version = readSchemaVersion(store)
    while (version < STORAGE_SCHEMA_VERSION) {
        const nextVersion = version + 1
        const migrate = STORAGE_MIGRATIONS[nextVersion]
        if (typeof migrate !== "function") {
            throw new Error(`Missing storage migration to version ${nextVersion}`)
        }
        migrate(store)
        store.setItem(STORAGE_KEYS.schemaVersion, String(nextVersion))
        version = nextVersion
    }
}
