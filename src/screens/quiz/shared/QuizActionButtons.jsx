import { useRef } from "react"

import { Button } from "src/components/ui/Button.jsx"

function isPrimaryPointer(e) {
    return e.button == null || e.button === 0
}

function submitFromButton(button) {
    const form = button.form
    if (!(form instanceof HTMLFormElement)) return
    if (typeof form.requestSubmit === "function") {
        if (button.form === form) {
            form.requestSubmit(button)
        } else {
            form.requestSubmit()
        }
        return
    }
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
}

export function QuizActionButtons({
    answered,
    isHardcore,
    isVerbs,
    isVocab,
    finishLabel,
    onFinish,
    onSkip,
    showFinish,
    showSkip = true,
    skipDisabled,
    skipLabel,
    submitHidden,
    submitLabel,
}) {
    const skipNextSkipClickRef = useRef(false)
    const skipNextSubmitClickRef = useRef(false)
    const submitFormId = isVerbs
        ? "verb-answer-form"
        : isVocab
          ? "vocab-answer-form"
          : "answer-form"
    return (
        <>
            {showFinish ? (
                <Button variant="ghost" type="button" onClick={onFinish}>
                    {finishLabel}
                </Button>
            ) : null}
            {showSkip ? (
                <Button
                    variant={
                        (isVocab && answered && !isHardcore) || (isVerbs && answered)
                            ? "primary"
                            : "ghost"
                    }
                    type="button"
                    disabled={skipDisabled}
                    onPointerDown={(e) => {
                        if (!isPrimaryPointer(e)) return
                        e.preventDefault()
                        skipNextSkipClickRef.current = true
                        onSkip()
                    }}
                    onClick={(e) => {
                        if (skipNextSkipClickRef.current) {
                            skipNextSkipClickRef.current = false
                            e.preventDefault()
                            return
                        }
                        onSkip()
                    }}
                >
                    {skipLabel}
                </Button>
            ) : null}
            <Button
                variant="primary"
                type="submit"
                form={isHardcore ? undefined : submitFormId}
                className={submitHidden ? "hidden" : ""}
                hidden={submitHidden}
                onPointerDown={(e) => {
                    if (!isPrimaryPointer(e) || submitHidden) return
                    e.preventDefault()
                    skipNextSubmitClickRef.current = true
                    submitFromButton(e.currentTarget)
                }}
                onClick={(e) => {
                    if (!skipNextSubmitClickRef.current) return
                    skipNextSubmitClickRef.current = false
                    e.preventDefault()
                }}
            >
                {submitLabel}
            </Button>
        </>
    )
}
