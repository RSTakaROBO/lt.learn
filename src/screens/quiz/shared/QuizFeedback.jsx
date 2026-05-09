import { STR } from "../../../../js/i18n/strings-ru.js"

export function QuizFeedback({
    className = "",
    feedback,
    id = "feedback",
    reserveSpace = false,
    showExpected = true,
    showExceptionNote = true,
}) {
    if (!feedback) {
        if (reserveSpace) {
            return (
                <div
                    id={id}
                    className={[
                        "feedback",
                        className,
                        "feedback--placeholder",
                        !showExpected && "feedback--placeholder-icons-only",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    aria-hidden="true"
                >
                    <p>{showExpected ? "✅" : STR.quiz.correct}</p>
                    {showExpected ? (
                        <p className="correct-form">
                            {STR.quiz.correctIs} <strong>&nbsp;</strong>
                        </p>
                    ) : null}
                </div>
            )
        }

        return (
            <div
                id={id}
                className={["feedback", className, "hidden"].filter(Boolean).join(" ")}
                aria-live="polite"
            />
        )
    }

    return (
        <div
            id={id}
            className={[
                "feedback",
                className,
                feedback.kind === "info" ? "" : feedback.kind,
                !showExpected && feedback.kind !== "info" && "feedback--icons-only",
            ]
                .filter(Boolean)
                .join(" ")}
            aria-live="polite"
        >
            <p>{feedback.message}</p>
            {showExpected && feedback.expected ? (
                <p className="correct-form">
                    {STR.quiz.correctIs} <strong>{feedback.expected}</strong>
                </p>
            ) : null}
            {showExceptionNote && feedback.exceptionNote ? (
                <p className="exception-hint">
                    <strong>{STR.quiz.exceptionStrong}</strong> {feedback.exceptionNote}
                </p>
            ) : null}
        </div>
    )
}
