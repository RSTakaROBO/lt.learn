const VOCAB_STREAK_MULT_FROM = 5

function vocabStreakTierClass(n) {
    if (n >= 100) return "vocab-streak-mult--t5"
    if (n >= 70) return "vocab-streak-mult--t4"
    if (n >= 50) return "vocab-streak-mult--t3"
    if (n >= 20) return "vocab-streak-mult--t2"
    if (n >= 10) return "vocab-streak-mult--t1"
    return "vocab-streak-mult--t0"
}

export function VocabStreakMultiplier({ streak, pulseId }) {
    if (streak < VOCAB_STREAK_MULT_FROM) {
        return (
            <div id="vocab-streak-mult" className="vocab-streak-mult hidden" aria-hidden="true">
                <span id="vocab-streak-mult-value" className="vocab-streak-mult-value" />
            </div>
        )
    }

    return (
        <div
            id="vocab-streak-mult"
            className={[
                "vocab-streak-mult",
                vocabStreakTierClass(streak),
                pulseId > 0 && "vocab-streak-mult--pulse",
            ]
                .filter(Boolean)
                .join(" ")}
            aria-hidden="false"
        >
            <span key={pulseId} id="vocab-streak-mult-value" className="vocab-streak-mult-value">
                ×{streak}
            </span>
        </div>
    )
}
