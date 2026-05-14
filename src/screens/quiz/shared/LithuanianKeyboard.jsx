import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { LT_DIACRITIC_TOOLBAR_CHARS } from "js/lt-diacritic-toolbar-chars.js"
import { STR } from "js/i18n/strings-ru.js"

const KEYBOARD_PORTAL_TARGET = typeof document !== "undefined" ? document.body : null

const SHEET_LEAVE_MS = 360
const KEY_PREVIEW_RELEASE_MS = 130

/* ─── Раскладки ─── */

const LT_KEY_ROWS = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["shift", "z", "c", "v", "b", "n", "m", "backspace"],
    ["hide", "space", "enter"],
]

const LT_SHIFT_MAP = {
    a: "ą",
    c: "č",
    e: "ė",
    i: "į",
    s: "š",
    u: "ū",
    z: "ž",
}

export const KEYBOARD_LAYOUT_LT = {
    id: "lt",
    keyRows: LT_KEY_ROWS,
    shiftMap: LT_SHIFT_MAP,
    diacritics: LT_DIACRITIC_TOOLBAR_CHARS,
    ariaLabel: "Литовская клавиатура",
    shiftAutoOff: true,
    staggerRow: 1,
}

const RU_KEY_ROWS = [
    ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х"],
    ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
    ["shift", "я", "ч", "с", "м", "и", "т", "ь", "б", "ю", "backspace"],
    ["hide", "space", "enter"],
]

const RU_SHIFT_MAP = { ь: "ъ" }

export const KEYBOARD_LAYOUT_RU = {
    id: "ru",
    keyRows: RU_KEY_ROWS,
    shiftMap: RU_SHIFT_MAP,
    diacritics: null,
    ariaLabel: "Русская клавиатура",
    shiftAutoOff: true,
    staggerRow: -1,
}

/* ─── Иконки ─── */

function IconChevronDown() {
    return (
        <svg className="lt-keyboard-chevron" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function IconShift() {
    return (
        <svg className="lt-keyboard-shift" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M12 4l7 10H5l7-10z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <path
                d="M9 17h6v3H9v-3z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    )
}

function IconCheck() {
    return (
        <svg className="lt-keyboard-check" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/* ─── Утилиты ─── */

function isIgnoredOutsideTarget(target, inputRef) {
    if (!(target instanceof Element)) return true
    if (target.closest(".lt-keyboard")) return true
    if (target.closest(".lithuanian-input")) return true
    if (target.closest(".quiz-footer-actions")) return true
    const input = inputRef.current
    if (input && (target === input || input.contains(target))) return true
    return false
}

function focusInput(input) {
    if (!(input instanceof HTMLInputElement)) return
    requestAnimationFrame(() => input.focus())
}

function replaceSelection(input, value, text) {
    const start = input?.selectionStart ?? value.length
    const end = input?.selectionEnd ?? value.length
    return {
        value: value.slice(0, start) + text + value.slice(end),
        caret: start + text.length,
    }
}

function removeBeforeCaret(input, value) {
    const start = input?.selectionStart ?? value.length
    const end = input?.selectionEnd ?? value.length
    if (end > start) {
        return { value: value.slice(0, start) + value.slice(end), caret: start }
    }
    if (start <= 0) return { value, caret: 0 }
    return { value: value.slice(0, start - 1) + value.slice(start), caret: start - 1 }
}

function setCaret(input, caret) {
    if (!(input instanceof HTMLInputElement)) return
    requestAnimationFrame(() => {
        input.focus()
        input.setSelectionRange(caret, caret)
    })
}

function keyLabel(key) {
    if (key === "space") return "_"
    if (key === "backspace") return "⌫"
    return key
}

function keyAriaLabel(key) {
    if (key === "shift") return "Переключить регистр"
    if (key === "space") return "Вставить пробел"
    if (key === "backspace") return "Удалить символ"
    if (key === "enter") return "Отправить ответ"
    return `Вставить ${key}`
}

function displayKey(key, shifted, shiftMap) {
    if (!shifted) return key
    if (shiftMap) return shiftMap[key] || key
    return key.toUpperCase()
}

function submitInputForm(input) {
    if (!(input instanceof HTMLInputElement)) return
    const form = input.form
    if (!(form instanceof HTMLFormElement)) return
    const formId = form.getAttribute("id")
    let submitter = null
    if (formId) {
        const sel = `button[type="submit"][form="${CSS.escape(formId)}"]:not(:disabled)`
        submitter = document.querySelector(sel)
    }
    if (!submitter) submitter = form.querySelector('button[type="submit"]:not(:disabled)')
    try {
        if (submitter) form.requestSubmit(submitter)
        else form.requestSubmit()
    } catch {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    }
}

/* ─── Компонент ─── */

/**
 * @param {{
 *   inputRef: React.RefObject<HTMLInputElement | null>
 *   value: string
 *   onValueChange: (next: string) => void
 *   visible: boolean
 *   onRequestHide: () => void
 *   onPresenceChange?: (mounted: boolean) => void
 *   layout?: typeof KEYBOARD_LAYOUT_LT
 * }} props
 */
export function LithuanianKeyboard({
    inputRef,
    value,
    onValueChange,
    visible,
    onRequestHide,
    onPresenceChange,
    layout = KEYBOARD_LAYOUT_LT,
}) {
    const [shifted, setShifted] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [entered, setEntered] = useState(false)
    const [pressedPreviewId, setPressedPreviewId] = useState(null)
    const panelRef = useRef(null)
    const previewReleaseTimerRef = useRef(0)

    const keyRows = layout.keyRows
    const shiftMap = layout.shiftMap
    const diacritics = layout.diacritics
    const shiftAutoOff = layout.shiftAutoOff !== false
    const staggerRow = layout.staggerRow ?? -1

    useEffect(() => {
        if (!visible) setShifted(false)
    }, [visible])

    useEffect(
        () => () => {
            window.clearTimeout(previewReleaseTimerRef.current)
        },
        []
    )

    useEffect(() => {
        if (!KEYBOARD_PORTAL_TARGET) return undefined
        if (visible) {
            setMounted(true)
            const id = requestAnimationFrame(() => {
                requestAnimationFrame(() => setEntered(true))
            })
            return () => cancelAnimationFrame(id)
        }
        setEntered(false)
        return undefined
    }, [visible])

    useEffect(() => {
        if (!KEYBOARD_PORTAL_TARGET) return undefined
        if (visible || entered || !mounted) return undefined

        const el = panelRef.current
        if (!el) {
            setMounted(false)
            return undefined
        }

        const done = () => setMounted(false)
        const fb = window.setTimeout(done, SHEET_LEAVE_MS)

        function onTransitionEnd(e) {
            if (e.target !== el) return
            window.clearTimeout(fb)
            el.removeEventListener("transitionend", onTransitionEnd)
            done()
        }

        el.addEventListener("transitionend", onTransitionEnd)
        return () => {
            window.clearTimeout(fb)
            el.removeEventListener("transitionend", onTransitionEnd)
        }
    }, [visible, entered, mounted])

    useEffect(() => {
        onPresenceChange?.(mounted)
    }, [mounted, onPresenceChange])

    useEffect(() => {
        document.body.classList.toggle("lt-keyboard-open", mounted)
        return () => {
            document.body.classList.remove("lt-keyboard-open")
        }
    }, [mounted])

    useEffect(() => {
        if (!mounted || !entered) return undefined

        function onPointerDownCapture(e) {
            if (e.button !== undefined && e.button !== 0) return
            if (isIgnoredOutsideTarget(e.target, inputRef)) return
            onRequestHide()
        }

        document.addEventListener("pointerdown", onPointerDownCapture, true)
        return () => document.removeEventListener("pointerdown", onPointerDownCapture, true)
    }, [mounted, entered, inputRef, onRequestHide])

    if (!mounted || !KEYBOARD_PORTAL_TARGET) return null

    function applyKey(key) {
        if (key === "shift") {
            setShifted((v) => !v)
            return
        }
        const input = inputRef.current
        if (key === "enter") {
            submitInputForm(input)
            focusInput(input)
            return
        }
        const text = key === "space" ? " " : displayKey(key, shifted, shiftMap)
        const edit =
            key === "backspace"
                ? removeBeforeCaret(input, value)
                : replaceSelection(input, value, text)
        onValueChange(edit.value)
        setCaret(input, edit.caret)

        if (shifted && shiftAutoOff && key !== "backspace") {
            if (shiftMap ? Object.prototype.hasOwnProperty.call(shiftMap, key) : true) {
                setShifted(false)
            }
        }
    }

    function handlePointerPrep() {
        focusInput(inputRef.current)
    }

    function handleKeyPointerDown(e, previewId) {
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        window.clearTimeout(previewReleaseTimerRef.current)
        setPressedPreviewId(previewId)
        handlePointerPrep()
    }

    function handleKeyPointerEnd(e) {
        e.currentTarget.releasePointerCapture?.(e.pointerId)
        schedulePreviewRelease()
    }

    function schedulePreviewRelease() {
        window.clearTimeout(previewReleaseTimerRef.current)
        previewReleaseTimerRef.current = window.setTimeout(
            () => setPressedPreviewId(null),
            KEY_PREVIEW_RELEASE_MS
        )
    }

    function insertDiacriticLetter(ch) {
        const input = inputRef.current
        const edit = replaceSelection(input, value, ch)
        onValueChange(edit.value)
        setCaret(input, edit.caret)
    }

    function renderDiacriticRow() {
        if (!diacritics || diacritics.length === 0) return null
        return (
            <div className="lt-keyboard-diacritic-block">
                <div
                    className="lt-keyboard-row lt-keyboard-row--diacritics"
                    role="group"
                    aria-label={STR.quiz.ltCharsToolbarAria}
                >
                    {diacritics.map((ch) => (
                        <button
                            key={ch}
                            type="button"
                            className="lt-keyboard-key lt-keyboard-key--diacritic"
                            aria-label={`Вставить ${ch}`}
                            onPointerDown={(e) => {
                                handleKeyPointerDown(e, `diacritic-${ch}`)
                            }}
                            onPointerUp={handleKeyPointerEnd}
                            onPointerCancel={handleKeyPointerEnd}
                            onLostPointerCapture={schedulePreviewRelease}
                            onClick={() => insertDiacriticLetter(ch)}
                        >
                            {pressedPreviewId === `diacritic-${ch}` ? (
                                <span className="lt-keyboard-key-pop" aria-hidden="true">
                                    {ch}
                                </span>
                            ) : null}
                            {ch}
                        </button>
                    ))}
                </div>
                <div className="lt-keyboard-diacritic-fade-rule" aria-hidden="true" />
            </div>
        )
    }

    function renderLetterRow(rowKeys, rowIndex) {
        const stagger = rowIndex === staggerRow
        if (stagger) {
            return (
                <div
                    key={rowIndex}
                    className="lt-keyboard-row lt-keyboard-row--letters lt-keyboard-row--stagger"
                >
                    <span className="lt-keyboard-half-stub" aria-hidden="true" />
                    <div className="lt-keyboard-row-letter-run">
                        {rowKeys.map((letterKey) => renderKeyCell(letterKey))}
                    </div>
                    <span className="lt-keyboard-half-stub" aria-hidden="true" />
                </div>
            )
        }
        return (
            <div key={rowIndex} className="lt-keyboard-row lt-keyboard-row--letters">
                {rowKeys.map((letterKey) => renderKeyCell(letterKey))}
            </div>
        )
    }

    function renderKeyCell(key, { bottomRow = false } = {}) {
        const bottomCls = bottomRow ? " lt-keyboard-key--bottom-row" : ""
        if (key === "hide") {
            return (
                <button
                    key="hide"
                    type="button"
                    className={`lt-keyboard-key lt-keyboard-key--hide${bottomCls}`}
                    aria-label={STR.quiz.lithuanianKeyboardHideAria}
                    onPointerDown={(e) => {
                        e.preventDefault()
                        handlePointerPrep()
                    }}
                    onClick={() => onRequestHide()}
                >
                    <IconChevronDown />
                </button>
            )
        }
        const previewLabel =
            key === "shift" || key === "space" || key === "backspace" || key === "enter"
                ? ""
                : displayKey(key, shifted, shiftMap)
        const previewId = previewLabel ? `key-${key}` : null
        return (
            <button
                key={key}
                type="button"
                className={[
                    "lt-keyboard-key",
                    bottomRow && "lt-keyboard-key--bottom-row",
                    key === "shift" && shifted && "lt-keyboard-key--active",
                    key === "shift" && "lt-keyboard-key--shift",
                    key === "space" && "lt-keyboard-key--space",
                    key === "backspace" && "lt-keyboard-key--backspace",
                    key === "enter" && "lt-keyboard-key--enter",
                ]
                    .filter(Boolean)
                    .join(" ")}
                aria-label={keyAriaLabel(key)}
                onPointerDown={(e) => {
                    if (previewId) {
                        handleKeyPointerDown(e, previewId)
                    } else {
                        e.preventDefault()
                        handlePointerPrep()
                    }
                }}
                onPointerUp={previewId ? handleKeyPointerEnd : undefined}
                onPointerCancel={previewId ? handleKeyPointerEnd : undefined}
                onLostPointerCapture={previewId ? schedulePreviewRelease : undefined}
                onClick={() => applyKey(key)}
            >
                {previewId && pressedPreviewId === previewId ? (
                    <span className="lt-keyboard-key-pop" aria-hidden="true">
                        {previewLabel}
                    </span>
                ) : null}
                {key === "enter" ? (
                    <IconCheck />
                ) : key === "shift" ? (
                    <IconShift />
                ) : key === "backspace" || key === "space" ? (
                    keyLabel(key)
                ) : (
                    displayKey(key, shifted, shiftMap)
                )}
            </button>
        )
    }

    const layer = (
        <div
            ref={panelRef}
            className={[
                "lt-keyboard",
                entered && "lt-keyboard--shown",
                layout.id === "ru" && "lt-keyboard--ru",
            ]
                .filter(Boolean)
                .join(" ")}
            aria-label={layout.ariaLabel}
            aria-hidden={!entered}
        >
            {renderDiacriticRow()}
            {keyRows.map((rowKeys, rowIndex) => {
                const isBottom = rowIndex === keyRows.length - 1
                const isTail = rowIndex === keyRows.length - 2
                if (isBottom) {
                    return (
                        <div key={rowIndex} className="lt-keyboard-row lt-keyboard-row--bottom">
                            {rowKeys.map((rowKey) => renderKeyCell(rowKey, { bottomRow: true }))}
                        </div>
                    )
                }
                if (isTail) {
                    return (
                        <div
                            key={rowIndex}
                            className="lt-keyboard-row lt-keyboard-row--letters-tail"
                        >
                            {rowKeys.map((rowKey) => renderKeyCell(rowKey))}
                        </div>
                    )
                }
                return renderLetterRow(rowKeys, rowIndex)
            })}
        </div>
    )

    return createPortal(layer, KEYBOARD_PORTAL_TARGET)
}
