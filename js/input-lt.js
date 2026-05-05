import { LT_SHIFT_KEY_CYCLES } from "./config.js"

export function insertAtCaret(input, text) {
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? input.value.length
    const v = input.value
    input.value = v.slice(0, start) + text + v.slice(end)
    const pos = start + text.length
    input.setSelectionRange(pos, pos)
    input.focus()
}

export function replaceRange(input, start, end, text) {
    const v = input.value
    input.value = v.slice(0, start) + text + v.slice(end)
    const pos = start + text.length
    input.setSelectionRange(pos, pos)
    input.focus()
}

function normalizedCycleIndex(ch, cycle) {
    const n = ch.normalize("NFC").toLowerCase()
    for (let i = 0; i < cycle.length; i++) {
        if (cycle[i].normalize("NFC").toLowerCase() === n) return i
    }
    return -1
}

/** Shift + буква с литовскими вариантами: цикл диакритик вместо заглавной. */
export function handleAnswerInputShiftCycles(e) {
    const input = e.currentTarget
    if (!(input instanceof HTMLInputElement)) return
    if (input.id !== "answer-input" && input.id !== "vocab-answer-input") return
    if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
    if (e.isComposing) return
    if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return

    const k = e.key.toLowerCase()
    const cycle = LT_SHIFT_KEY_CYCLES[k]
    if (!cycle) return

    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0

    if (end > start && end - start !== 1) return

    const insertSecondOrFirst = () => insertAtCaret(input, cycle.length > 1 ? cycle[1] : cycle[0])

    let apply = null

    if (end > start) {
        const sel = input.value.slice(start, end).normalize("NFC")
        const idx = normalizedCycleIndex(sel, cycle)
        const nextChar =
            idx >= 0 ? cycle[(idx + 1) % cycle.length] : cycle.length > 1 ? cycle[1] : cycle[0]
        apply = () => replaceRange(input, start, end, nextChar)
    } else if (start > 0) {
        const left = input.value.slice(start - 1, start).normalize("NFC")
        const idx = normalizedCycleIndex(left, cycle)
        if (idx >= 0) {
            const nextChar = cycle[(idx + 1) % cycle.length]
            apply = () => {
                replaceRange(input, start - 1, start, nextChar)
                input.setSelectionRange(start, start)
            }
        }
    }

    if (!apply) {
        apply = insertSecondOrFirst
    }

    e.preventDefault()
    apply()
}
