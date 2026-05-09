import { STR } from "../../../../js/i18n/strings-ru.js"

export function QuizFeedback({ className = "", feedback, id = "feedback", reserveSpace = false }) {
    if (!feedback) {
        if (reserveSpace) {
            return (
                <div
                    id={id}
                    className={["feedback", className, "feedback--placeholder"]
                        .filter(Boolean)
                        .join(" ")}
                    aria-hidden="true"
                >
                    <p>✅</p>
                    <p className="correct-form">
                        {STR.quiz.correctIs} <strong>&nbsp;</strong>
                    </p>
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
            className={["feedback", className, feedback.kind === "info" ? "" : feedback.kind]
                .filter(Boolean)
                .join(" ")}
            aria-live="polite"
        >
            <p>{feedback.message}</p>
            {feedback.expected ? (
                <p className="correct-form">
                    {STR.quiz.correctIs} <strong>{feedback.expected}</strong>
                </p>
            ) : null}
            {feedback.exceptionNote ? (
                <p className="exception-hint">
                    <strong>{STR.quiz.exceptionStrong}</strong> {feedback.exceptionNote}
                </p>
            ) : null}
        </div>
    )
}
