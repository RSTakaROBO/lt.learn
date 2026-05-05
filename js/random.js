import { WEIGHT_MIN } from "./config.js"

export function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

export function shuffleArray(arr) {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const t = a[i]
        a[i] = a[j]
        a[j] = t
    }
    return a
}

export function pickWeightedRandom(items, weightFn) {
    if (!items.length) return null
    const weights = items.map((it) => {
        const x = weightFn(it)
        return Number.isFinite(x) && x > 0 ? x : WEIGHT_MIN
    })
    const sum = weights.reduce((a, b) => a + b, 0)
    if (sum <= 0) return pickRandom(items)
    let r = Math.random() * sum
    for (let i = 0; i < items.length; i++) {
        r -= weights[i]
        if (r <= 0) return items[i]
    }
    return items[items.length - 1]
}
