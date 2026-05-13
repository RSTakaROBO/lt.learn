import { forwardRef, useEffect, useRef, useState } from "react"

import { getLithuanianShiftCycleEdit } from "js/InputHelper.js"
import { STR } from "js/i18n/strings-ru.js"
import { ChartsToolbar } from "src/components/ui/ChartsToolbar.jsx"

function setCaretOnNextFrame(input, caret) {
    requestAnimationFrame(() => {
        input.focus()
        input.setSelectionRange(caret, caret)
    })
}

function insertTextAtInput(input, value, setValue, text) {
    if (!(input instanceof HTMLInputElement)) return
    const start = input.selectionStart ?? value.length
    const end = input.selectionEnd ?? value.length
    const next = value.slice(0, start) + text + value.slice(end)
    const caret = start + text.length
    setValue(next)
    setCaretOnNextFrame(input, caret)
}

function toolbarCharFromEvent(e) {
    const target = e.target
    const btn = target instanceof Element ? target.closest(".lt-char") : null
    return btn?.getAttribute("data-char") || ""
}

function handleToolbarPointerDown(e, value, setValue, input, skipNextClickRef) {
    const ch = toolbarCharFromEvent(e)
    if (!ch) return
    e.preventDefault()
    skipNextClickRef.current = true
    insertTextAtInput(input, value, setValue, ch)
}

function handleToolbarClick(e, value, setValue, input, skipNextClickRef) {
    const ch = toolbarCharFromEvent(e)
    if (!ch) return
    if (skipNextClickRef.current) {
        skipNextClickRef.current = false
        e.preventDefault()
        return
    }
    insertTextAtInput(input, value, setValue, ch)
}

function handleLithuanianShiftKey(e, value, setValue, input) {
    if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return
    if (!(input instanceof HTMLInputElement)) return
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const edit = getLithuanianShiftCycleEdit(value, start, end, e.key)
    if (!edit) return
    e.preventDefault()
    setValue(edit.value)
    setCaretOnNextFrame(input, edit.caret)
}

function refocusInput(input) {
    if (!(input instanceof HTMLInputElement)) return
    requestAnimationFrame(() => input.focus())
}

export const LithuanianInput = forwardRef(function LithuanianInput(
    {
        inputId,
        toolbarId,
        value,
        onValueChange,
        label = STR.quiz.answerLabel,
        useCustomKeyboard = false,
        /** Сенсорный режим без ОС-клавы: пользовательский тап по полю показывает оверлей-клаву (родитель поднимает). */
        onRevealCustomKeyboard,
    },
    ref
) {
    const skipNextToolbarClickRef = useRef(false)
    const [toolbarOpen, setToolbarOpen] = useState(true)
    const [preferCustomKeyboard, setPreferCustomKeyboard] = useState(false)

    useEffect(() => {
        if (useCustomKeyboard) {
            setPreferCustomKeyboard(
                window.matchMedia?.("(pointer: coarse)").matches || navigator.maxTouchPoints > 0
            )
        } else {
            setPreferCustomKeyboard(false)
        }
    }, [useCustomKeyboard])

    useEffect(() => {
        if (preferCustomKeyboard) return undefined
        const visualViewport = window.visualViewport
        if (!visualViewport) return undefined

        function handleViewportResize() {
            const keyboardLikelyOpen = window.innerHeight - visualViewport.height > 120
            if (keyboardLikelyOpen) setToolbarOpen(false)
        }

        visualViewport.addEventListener("resize", handleViewportResize)
        visualViewport.addEventListener("scroll", handleViewportResize)
        handleViewportResize()
        return () => {
            visualViewport.removeEventListener("resize", handleViewportResize)
            visualViewport.removeEventListener("scroll", handleViewportResize)
        }
    }, [preferCustomKeyboard])

    return (
        <div className="lithuanian-input">
            <label className="sr-only" htmlFor={inputId}>
                {label}
            </label>
            <div
                className={[
                    "lithuanian-input-row",
                    useCustomKeyboard && "lithuanian-input-row--single",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <input
                    ref={ref}
                    type="text"
                    id={inputId}
                    value={value}
                    placeholder={STR.quiz.answerPlaceholder}
                    spellCheck={false}
                    autoCapitalize="off"
                    inputMode={preferCustomKeyboard ? "none" : undefined}
                    readOnly={preferCustomKeyboard}
                    onPointerDown={() => {
                        if (preferCustomKeyboard && onRevealCustomKeyboard) {
                            onRevealCustomKeyboard()
                            refocusInput(ref.current)
                        }
                    }}
                    onChange={(e) => onValueChange(e.target.value)}
                    onKeyDown={(e) =>
                        handleLithuanianShiftKey(e, value, onValueChange, ref.current)
                    }
                />
                {!useCustomKeyboard ? (
                    <button
                        type="button"
                        className={["lt-chars-toggle", toolbarOpen && "lt-chars-toggle--open"]
                            .filter(Boolean)
                            .join(" ")}
                        aria-controls={toolbarId}
                        aria-expanded={toolbarOpen}
                        aria-label={
                            toolbarOpen ? STR.quiz.ltCharsToggleHide : STR.quiz.ltCharsToggleShow
                        }
                        title={
                            toolbarOpen ? STR.quiz.ltCharsToggleHide : STR.quiz.ltCharsToggleShow
                        }
                        onPointerDown={(e) => {
                            e.preventDefault()
                        }}
                        onClick={() => {
                            setToolbarOpen((open) => !open)
                            refocusInput(ref.current)
                        }}
                    >
                        <span aria-hidden="true">š</span>
                    </button>
                ) : null}
            </div>
            {!useCustomKeyboard && toolbarOpen ? (
                <ChartsToolbar
                    id={toolbarId}
                    onClick={(e) =>
                        handleToolbarClick(
                            e,
                            value,
                            onValueChange,
                            ref.current,
                            skipNextToolbarClickRef
                        )
                    }
                    onPointerDown={(e) =>
                        handleToolbarPointerDown(
                            e,
                            value,
                            onValueChange,
                            ref.current,
                            skipNextToolbarClickRef
                        )
                    }
                />
            ) : null}
        </div>
    )
})
