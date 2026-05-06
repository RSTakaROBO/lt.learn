import { LT_SHIFT_KEY_CYCLES } from "./config.js"

function normalizedCycleIndex(ch, cycle) {
    const n = ch.normalize("NFC").toLowerCase()
    for (let i = 0; i < cycle.length; i++) {
        if (cycle[i].normalize("NFC").toLowerCase() === n) return i
    }
    return -1
}

export function getLithuanianShiftCycleEdit(value, start, end, key) {
    if (typeof key !== "string" || key.length !== 1 || !/[a-zA-Z]/.test(key)) return null
    const cycle = LT_SHIFT_KEY_CYCLES[key.toLowerCase()]
    if (!cycle) return null
    if (end > start && end - start !== 1) return null

    const insert = (text) => ({
        value: value.slice(0, start) + text + value.slice(end),
        caret: start + text.length,
    })

    if (end > start) {
        const sel = value.slice(start, end).normalize("NFC")
        const idx = normalizedCycleIndex(sel, cycle)
        const nextChar =
            idx >= 0 ? cycle[(idx + 1) % cycle.length] : cycle.length > 1 ? cycle[1] : cycle[0]
        return {
            value: value.slice(0, start) + nextChar + value.slice(end),
            caret: start + nextChar.length,
        }
    }

    if (start > 0) {
        const left = value.slice(start - 1, start).normalize("NFC")
        const idx = normalizedCycleIndex(left, cycle)
        if (idx >= 0) {
            const nextChar = cycle[(idx + 1) % cycle.length]
            return {
                value: value.slice(0, start - 1) + nextChar + value.slice(start),
                caret: start,
            }
        }
    }

    return insert(cycle.length > 1 ? cycle[1] : cycle[0])
}
