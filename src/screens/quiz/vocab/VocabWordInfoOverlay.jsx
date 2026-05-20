import { useMemo, useRef } from "react"
import { createPortal } from "react-dom"

import { CASE_BY_KEY, CASE_KEYS, VERB_FORM_BY_KEY, VERB_FORM_KEYS } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { AppModalOverlay } from "src/components/layout/AppModalOverlay.jsx"
import { Button } from "src/components/ui/Button.jsx"
import { useAutoFocusOnOpen } from "src/hooks/useAutoFocusOnOpen.js"
import { vocabLemma, vocabRuAcceptedList } from "src/screens/quiz/vocab/vocabWords.js"

const KNOWN_WORD_KEYS = new Set([
    "forms",
    "ru",
    "ru_alt",
    "ru_list",
    "nominative",
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

function formRowsForWord(word) {
    const source = word?.forms && typeof word.forms === "object" ? word.forms : word
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
        .map(([key, value]) => ({
            key,
            label: key,
            value: displayValue(value),
        }))
        .filter((row) => row.value)
}

function extraRowsForWord(word) {
    if (!word || typeof word !== "object") return []
    return Object.entries(word)
        .filter(([key]) => !KNOWN_WORD_KEYS.has(key))
        .map(([key, value]) => {
            const label =
                key === "type"
                    ? STR.wordInfo.partOfSpeech
                    : key === "lemma"
                      ? STR.wordInfo.lemma
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
                value:
                    key === "type"
                        ? STR.packPreview.parts[value] || displayValue(value)
                        : displayValue(value),
            }
        })
        .filter((row) => row.value)
}

export function VocabWordInfoOverlay({ open, word, onClose }) {
    const closeButtonRef = useRef(null)
    const titleId = "vocab-word-info-title"
    const lemma = vocabLemma(word)
    const translations = useMemo(() => vocabRuAcceptedList(word), [word])
    const formRows = useMemo(() => formRowsForWord(word), [word])
    const extraRows = useMemo(() => extraRowsForWord(word), [word])

    useAutoFocusOnOpen(closeButtonRef, open)

    const overlay = (
        <AppModalOverlay
            id="vocab-word-info-overlay"
            open={open}
            ariaLabelledBy={titleId}
            shellClassName="vocab-word-info-overlay"
            panelClassName="vocab-word-info-panel"
            onBackdropClick={onClose}
            title={
                <header className="vocab-word-info-head">
                    <p className="vocab-word-info-kicker">{STR.wordInfo.kicker}</p>
                    <h2 id={titleId}>{lemma || STR.wordInfo.titleFallback}</h2>
                </header>
            }
            footer={
                <div className="app-screen__footer actions app-screen__footer--single vocab-word-info-actions">
                    <Button ref={closeButtonRef} variant="primary" type="button" onClick={onClose}>
                        {STR.wordInfo.close}
                    </Button>
                </div>
            }
        >
            <div className="app-screen__body vocab-word-info-body u-scrollbar-hidden">
                {translations.length ? (
                    <section className="vocab-word-info-section">
                        <h3>{STR.wordInfo.translations}</h3>
                        <div className="vocab-word-info-chips">
                            {translations.map((translation) => (
                                <span key={translation}>{translation}</span>
                            ))}
                        </div>
                    </section>
                ) : null}

                {formRows.length ? (
                    <section className="vocab-word-info-section">
                        <h3>{STR.wordInfo.forms}</h3>
                        <dl className="vocab-word-info-rows vocab-word-info-rows--forms">
                            {formRows.map((row) => (
                                <div key={row.key} className="vocab-word-info-row">
                                    <dt>{row.label}</dt>
                                    <dd lang="lt">{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ) : null}

                {extraRows.length ? (
                    <section className="vocab-word-info-section">
                        <h3>{STR.wordInfo.details}</h3>
                        <dl className="vocab-word-info-rows">
                            {extraRows.map((row) => (
                                <div key={row.key} className="vocab-word-info-row">
                                    <dt>{row.label}</dt>
                                    <dd>{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ) : null}
            </div>
        </AppModalOverlay>
    )

    return typeof document === "undefined" ? overlay : createPortal(overlay, document.body)
}
