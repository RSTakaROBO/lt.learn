import { Button } from "../../../components/ui/Button.jsx"

export function QuizActionButtons({
    answered,
    isHardcore,
    isVerbs,
    isVocab,
    onSkip,
    skipDisabled,
    skipLabel,
    submitHidden,
    submitLabel,
}) {
    const submitFormId = isVerbs ? "verb-answer-form" : "answer-form"
    return (
        <>
            <Button
                variant={
                    (isVocab && answered && !isHardcore) || (isVerbs && answered)
                        ? "primary"
                        : "ghost"
                }
                type="button"
                id="btn-skip"
                disabled={skipDisabled}
                onClick={onSkip}
            >
                {skipLabel}
            </Button>
            <Button
                variant="primary"
                type="submit"
                form={isHardcore ? undefined : submitFormId}
                id="btn-quiz-submit-cases"
                className={submitHidden ? "hidden" : ""}
                hidden={submitHidden}
            >
                {submitLabel}
            </Button>
        </>
    )
}
