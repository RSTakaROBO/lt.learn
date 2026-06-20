export function StressedWord({ stress, text }) {
    const letters = Array.from(text)
    if (!Number.isInteger(stress) || stress < 0 || stress >= letters.length) return text

    return (
        <>
            {letters.slice(0, stress).join("")}
            <span className="vocab-word-stress">{letters[stress]}</span>
            {letters.slice(stress + 1).join("")}
        </>
    )
}
