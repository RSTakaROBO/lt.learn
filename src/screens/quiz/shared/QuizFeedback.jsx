import { STR } from "../../../../js/i18n/strings-ru.js"

export function QuizFeedback({ feedback }) {
    if (!feedback) {
        return <div id="feedback" className="feedback hidden" aria-live="polite" />
    }

    return (
        <div
            id="feedback"
            className={["feedback", feedback.kind === "info" ? "" : feedback.kind]
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
