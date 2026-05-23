const CONJUGATION_LEVELS = {
    I: 1,
    II: 2,
    III: 3,
}

function cleanConjugation(value) {
    return typeof value === "string" ? value.trim().toUpperCase() : ""
}

export function verbConjugationLevel(word) {
    if (word?.type !== "verb") return 0
    return CONJUGATION_LEVELS[cleanConjugation(word?.conjugation)] || 0
}

export function VerbConjugationMark({ word }) {
    const level = verbConjugationLevel(word)
    if (!level) return null

    return (
        <span
            className="verb-conjugation-mark"
            aria-label={`Спряжение ${cleanConjugation(word.conjugation)}`}
            title={`Спряжение ${cleanConjugation(word.conjugation)}`}
        >
            {Array.from({ length: level }, (_, index) => (
                <span key={index} className="verb-conjugation-mark__dash" aria-hidden="true" />
            ))}
        </span>
    )
}
