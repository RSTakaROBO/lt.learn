import { useEffect, useMemo, useRef, useState } from "react"

import { CASE_BY_KEY, CASE_KEYS, VERB_FORM_BY_KEY, VERB_FORM_KEYS } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useManifestPacks } from "src/context/ManifestPacksContext.jsx"
import { useTrainerApp } from "src/context/TrainerAppContext.jsx"

const KNOWN_WORD_KEYS = new Set([
    "forms",
    "ru",
    "translations",
    "genitive",
    "dative",
    "accusative",
    "instrumental",
    "locative",
    "vocative",
    "infinitive",
    "present3",
    "past3",
])

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

function displayValue(value) {
    if (value == null || value === "") return ""
    if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(", ")
    if (typeof value === "boolean") return value ? STR.wordInfo.yes : STR.wordInfo.no
    if (typeof value === "number") return String(value)
    if (typeof value === "string") return value.trim()
    return ""
}

function searchKey(value) {
    return String(value || "")
        .trim()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/\u0451/g, "\u0435")
}

function wordLemma(word) {
    return cleanString(word?.lemma || word?.forms?.infinitive || word?.forms?.nominative)
}

function wordTranslations(word) {
    return Array.isArray(word?.translations)
        ? word.translations.map(cleanString).filter(Boolean)
        : []
}

function typeLabel(type) {
    return STR.packPreview.parts[type] || displayValue(type)
}

function formRowsForWord(word) {
    const source = word?.forms
    if (!source || typeof source !== "object") return []

    if (word?.type === "verb") {
        return VERB_FORM_KEYS.map((key) => ({
            key,
            label: VERB_FORM_BY_KEY[key]?.label || key,
            value: cleanString(source?.[key] || (key === "infinitive" ? word?.lemma : "")),
        })).filter((row) => row.value)
    }

    if (word?.type === "noun" || CASE_KEYS.some((key) => source?.[key])) {
        return CASE_KEYS.map((key) => ({
            key,
            label: STR.cases[key] || CASE_BY_KEY[key]?.lt || key,
            value: cleanString(source?.[key]),
        })).filter((row) => row.value)
    }

    return Object.entries(source)
        .map(([key, value]) => ({ key, label: key, value: displayValue(value) }))
        .filter((row) => row.value)
}

function extraRowsForWord(word, packTitles) {
    if (!word || typeof word !== "object") return []
    const rows = Object.entries(word)
        .filter(([key]) => !KNOWN_WORD_KEYS.has(key))
        .map(([key, value]) => {
            const label =
                key === "type"
                    ? STR.wordInfo.partOfSpeech
                    : key === "lemma"
                      ? STR.wordInfo.lemma
                      : key === "conjugation"
                        ? STR.wordInfo.conjugation
                        : key === "id"
                          ? STR.wordInfo.id
                          : key === "exception"
                            ? STR.wordInfo.exception
                            : key === "exception_note_ru"
                              ? STR.wordInfo.exceptionNote
                              : key
            return {
                key,
                label,
                value: key === "type" ? typeLabel(value) : displayValue(value),
            }
        })
        .filter((row) => row.value)

    if (packTitles.length) {
        rows.push({ key: "packs", label: "Наборы", value: packTitles.join(", ") })
    }

    return rows
}

function entryKey(word) {
    return [
        cleanString(word?.type),
        wordLemma(word),
        JSON.stringify(word?.forms || {}),
        wordTranslations(word).join("|"),
    ].join("::")
}

function fieldsForWord(word) {
    const forms = word?.forms && typeof word.forms === "object" ? Object.values(word.forms) : []
    return [wordLemma(word), ...forms, ...wordTranslations(word)].flatMap((value) => {
        const full = searchKey(value)
        const parts = full.split(/[\s,;:()\/-]+/).filter(Boolean)
        return full ? [full, ...parts] : parts
    })
}

function buildSearchEntries(packRows) {
    const byKey = new Map()
    for (const row of packRows) {
        const packTitle = cleanString(row.title || row.pack?.title || row.pack?.id)
        for (const word of row.words || []) {
            const key = entryKey(word)
            const current = byKey.get(key)
            if (current) {
                if (packTitle && !current.packTitles.includes(packTitle)) {
                    current.packTitles.push(packTitle)
                }
                continue
            }
            byKey.set(key, {
                key,
                word,
                lemma: wordLemma(word),
                translations: wordTranslations(word),
                packTitles: packTitle ? [packTitle] : [],
                fields: fieldsForWord(word),
            })
        }
    }
    return [...byKey.values()].sort((a, b) =>
        a.lemma.localeCompare(b.lemma, "lt", { sensitivity: "base" })
    )
}

function WordSearchResult({ entry }) {
    const formRows = formRowsForWord(entry.word)
    const extraRows = extraRowsForWord(entry.word, entry.packTitles)

    return (
        <details className="word-search-result">
            <summary className="word-search-summary">
                <span className="word-search-summary-main">
                    <span className="word-search-lemma" lang="lt">
                        {entry.lemma || STR.wordInfo.titleFallback}
                    </span>
                    <span className="word-search-type">{typeLabel(entry.word?.type)}</span>
                </span>
                {entry.translations.length ? (
                    <span className="word-search-translations">
                        {entry.translations.slice(0, 2).join(", ")}
                    </span>
                ) : null}
            </summary>
            <div className="word-search-details">
                {entry.translations.length ? (
                    <section className="word-search-section">
                        <h3>{STR.wordInfo.translations}</h3>
                        <div className="word-search-chips">
                            {entry.translations.map((translation) => (
                                <span key={translation}>{translation}</span>
                            ))}
                        </div>
                    </section>
                ) : null}

                {formRows.length ? (
                    <section className="word-search-section">
                        <h3>{STR.wordInfo.forms}</h3>
                        <dl className="word-search-rows">
                            {formRows.map((row) => (
                                <div key={row.key} className="word-search-row">
                                    <dt>{row.label}</dt>
                                    <dd lang="lt">{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ) : null}

                {extraRows.length ? (
                    <section className="word-search-section">
                        <h3>{STR.wordInfo.details}</h3>
                        <dl className="word-search-rows">
                            {extraRows.map((row) => (
                                <div key={row.key} className="word-search-row">
                                    <dt>{row.label}</dt>
                                    <dd>{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ) : null}
            </div>
        </details>
    )
}

export function WordSearchScreen({ heightMode = "fill" } = {}) {
    const [, dispatch] = useTrainerApp()
    const { packRows } = useManifestPacks()
    const inputRef = useRef(null)
    const [query, setQuery] = useState("")
    const entries = useMemo(() => buildSearchEntries(packRows), [packRows])
    const normalizedQuery = searchKey(query)
    const results = useMemo(() => {
        if (normalizedQuery.length < 2) return []
        return entries.filter((entry) =>
            entry.fields.some((field) => field.startsWith(normalizedQuery))
        )
    }, [entries, normalizedQuery])
    const visibleResults = results.slice(0, 80)
    const status =
        normalizedQuery.length < 2
            ? "Введите минимум 2 буквы"
            : results.length
              ? `Найдено: ${results.length}`
              : "Ничего не найдено"

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    return (
        <AppFlowScreen id="word-search-shell" heightMode={heightMode}>
            <section id="word-search" className="widget panel app-screen__panel">
                <h2>Поиск слов</h2>
                <div className="app-screen__body word-search-body u-scrollbar-hidden">
                    <label className="word-search-field">
                        <span>Слово</span>
                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck="false"
                            placeholder="pvz. ge, kep, zod..."
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </label>
                    <p className="word-search-status" aria-live="polite">
                        {status}
                    </p>
                    {visibleResults.length ? (
                        <div className="word-search-results">
                            {visibleResults.map((entry) => (
                                <WordSearchResult entry={entry} key={entry.key} />
                            ))}
                        </div>
                    ) : null}
                    {results.length > visibleResults.length ? (
                        <p className="word-search-status">
                            Показаны первые {visibleResults.length}
                        </p>
                    ) : null}
                </div>
                <div className="app-screen__footer actions app-screen__footer--single">
                    <Button
                        variant="primary"
                        type="button"
                        onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "wordSearch" })}
                    >
                        Закрыть
                    </Button>
                </div>
            </section>
        </AppFlowScreen>
    )
}
