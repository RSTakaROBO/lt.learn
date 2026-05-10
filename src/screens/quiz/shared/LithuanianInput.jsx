import { forwardRef, useRef } from "react"

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

export const LithuanianInput = forwardRef(function LithuanianInput(
    { inputId, toolbarId, value, onValueChange, label = STR.quiz.answerLabel },
    ref
) {
    const skipNextToolbarClickRef = useRef(false)

    return (
        <>
            <label className="sr-only" htmlFor={inputId}>
                {label}
            </label>
            <input
                ref={ref}
                type="text"
                id={inputId}
                value={value}
                placeholder={STR.quiz.answerPlaceholder}
                spellCheck={false}
                autoCapitalize="off"
                onChange={(e) => onValueChange(e.target.value)}
                onKeyDown={(e) => handleLithuanianShiftKey(e, value, onValueChange, ref.current)}
            />
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
        </>
    )
})
