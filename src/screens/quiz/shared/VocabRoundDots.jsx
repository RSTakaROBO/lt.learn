import { fmt } from "js/i18n/core.js"
import { STR } from "js/i18n/strings-ru.js"
import { VOCAB_ROUND_STREAK_TO_REMOVE } from "js/vocab-round.js"

export function VocabRoundDots({ dots }) {
    if (!dots) {
        return (
            <div
                id="vocab-round-lemma-dots"
                className="vocab-round-lemma-dots hidden"
                aria-hidden="true"
                role="img"
            >
                <span className="vocab-round-lemma-dot" aria-hidden="true" />
                <span className="vocab-round-lemma-dot" aria-hidden="true" />
                <span className="vocab-round-lemma-dot" aria-hidden="true" />
            </div>
        )
    }

    return (
        <div
            id="vocab-round-lemma-dots"
            className="vocab-round-lemma-dots"
            aria-hidden="false"
            aria-label={fmt(STR.vocabRound.ariaDots, {
                filled: dots.filled,
                max: VOCAB_ROUND_STREAK_TO_REMOVE,
            })}
            role="img"
        >
            {Array.from({ length: VOCAB_ROUND_STREAK_TO_REMOVE }, (_, i) => (
                <span
                    key={i}
                    className={["vocab-round-lemma-dot", i < dots.filled && "is-filled"]
                        .filter(Boolean)
                        .join(" ")}
                    aria-hidden="true"
                />
            ))}
        </div>
    )
}
