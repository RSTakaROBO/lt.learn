import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { LT_DIACRITIC_TOOLBAR_CHARS } from "js/lt-diacritic-toolbar-chars.js"
import { STR } from "js/i18n/strings-ru.js"

/** Портал: иначе #quiz.panel имеет animation с transform → fixed считается от карточки, не от экрана. */
const LT_KEYBOARD_PORTAL_TARGET = typeof document !== "undefined" ? document.body : null

/** Примерно синхронно с CSS transition (fallback размонтирования). */
const SHEET_LEAVE_MS = 360

const KEY_ROWS = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["shift", "z", "c", "v", "b", "n", "m", "backspace"],
    ["hide", "space", "enter"],
]

const SHIFT_KEY_MAP = {
    a: "ą",
    c: "č",
    e: "ė",
    i: "į",
    s: "š",
    u: "ū",
    z: "ž",
}

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

/** Режим «литовские буквы» — символ Shift без Unicode ⇧ */
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

function isIgnoredOutsideTarget(
    target,
    /** @type {React.RefObject<HTMLInputElement | null>} */ inputRef
) {
    if (!(target instanceof Element)) return true
    if (target.closest(".lt-keyboard")) return true
    if (target.closest(".lithuanian-input")) return true
    /* Кнопки квиза: основной футер `#quiz-footer-actions` и инлайн (hardcore словарь). */
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
    if (key === "shift") return "Переключить литовские буквы"
    if (key === "space") return "Вставить пробел"
    if (key === "backspace") return "Удалить символ"
    if (key === "enter") return "Отправить ответ"
    return `Вставить ${key}`
}

function displayKey(key, shifted) {
    if (!shifted) return key
    return SHIFT_KEY_MAP[key] || key
}

function submitInputForm(input) {
    if (!(input instanceof HTMLInputElement)) return
    const form = input.form
    if (!(form instanceof HTMLFormElement)) return
    const formId = form.getAttribute("id")
    /** Кнопка с `form=id` висит во внешнем футере (падежи / глаголы). */
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

/**
 * @param {{
 *   inputRef: React.RefObject<HTMLInputElement | null>
 *   value: string
 *   onValueChange: (next: string) => void
 *   visible: boolean
 *   onRequestHide: () => void
 *   onPresenceChange?: (mounted: boolean) => void
 * }} props
 */
export function LithuanianKeyboard({
    inputRef,
    value,
    onValueChange,
    visible,
    onRequestHide,
    onPresenceChange,
}) {
    const [shifted, setShifted] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [entered, setEntered] = useState(false)
    const panelRef = useRef(null)

    useEffect(() => {
        if (!visible) setShifted(false)
    }, [visible])

    useEffect(() => {
        if (!LT_KEYBOARD_PORTAL_TARGET) return undefined
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
        if (!LT_KEYBOARD_PORTAL_TARGET) return undefined
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
        if (!mounted || !entered) return undefined

        function onPointerDownCapture(e) {
            if (e.button !== undefined && e.button !== 0) return
            if (isIgnoredOutsideTarget(e.target, inputRef)) return
            onRequestHide()
        }

        document.addEventListener("pointerdown", onPointerDownCapture, true)
        return () => document.removeEventListener("pointerdown", onPointerDownCapture, true)
    }, [mounted, entered, inputRef, onRequestHide])

    if (!mounted || !LT_KEYBOARD_PORTAL_TARGET) return null

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
        const text = key === "space" ? " " : displayKey(key, shifted)
        const edit =
            key === "backspace"
                ? removeBeforeCaret(input, value)
                : replaceSelection(input, value, text)
        onValueChange(edit.value)
        setCaret(input, edit.caret)

        if (
            shifted &&
            key !== "backspace" &&
            Object.prototype.hasOwnProperty.call(SHIFT_KEY_MAP, key)
        ) {
            setShifted(false)
        }
    }

    function handlePointerPrep() {
        focusInput(inputRef.current)
    }

    function insertDiacriticLetter(ch) {
        const input = inputRef.current
        const edit = replaceSelection(input, value, ch)
        onValueChange(edit.value)
        setCaret(input, edit.caret)
    }

    function renderDiacriticRow() {
        return (
            <div className="lt-keyboard-diacritic-block">
                <div
                    className="lt-keyboard-row lt-keyboard-row--diacritics"
                    role="group"
                    aria-label={STR.quiz.ltCharsToolbarAria}
                >
                    {LT_DIACRITIC_TOOLBAR_CHARS.map((ch) => (
                        <button
                            key={ch}
                            type="button"
                            className="lt-keyboard-key lt-keyboard-key--diacritic"
                            aria-label={`Вставить ${ch}`}
                            onPointerDown={(e) => {
                                e.preventDefault()
                                handlePointerPrep()
                            }}
                            onClick={() => insertDiacriticLetter(ch)}
                        >
                            {ch}
                        </button>
                    ))}
                </div>
                <div className="lt-keyboard-diacritic-fade-rule" aria-hidden="true" />
            </div>
        )
    }

    function renderLetterRow(rowKeys, rowIndex, stagger) {
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
                    e.preventDefault()
                    handlePointerPrep()
                }}
                onClick={() => applyKey(key)}
            >
                {key === "enter" ? (
                    <IconCheck />
                ) : key === "shift" ? (
                    <IconShift />
                ) : key === "backspace" || key === "space" ? (
                    keyLabel(key)
                ) : (
                    displayKey(key, shifted)
                )}
            </button>
        )
    }

    const layer = (
        <div
            ref={panelRef}
            className={["lt-keyboard", entered && "lt-keyboard--shown"].filter(Boolean).join(" ")}
            aria-label="Литовская клавиатура"
            aria-hidden={!entered}
        >
            {renderDiacriticRow()}
            {KEY_ROWS.map((rowKeys, rowIndex) => {
                if (rowIndex < 2) {
                    return renderLetterRow(rowKeys, rowIndex, rowIndex === 1)
                }
                return (
                    <div
                        key={rowIndex}
                        className={[
                            "lt-keyboard-row",
                            rowIndex === 2 && "lt-keyboard-row--letters-tail",
                            rowIndex === KEY_ROWS.length - 1 && "lt-keyboard-row--bottom",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        {rowKeys.map((rowKey) =>
                            renderKeyCell(rowKey, {
                                bottomRow: rowIndex === KEY_ROWS.length - 1,
                            })
                        )}
                    </div>
                )
            })}
        </div>
    )

    return createPortal(layer, LT_KEYBOARD_PORTAL_TARGET)
}
