import { shallowEqual, useSelector } from "react-redux"

import { TRAIN_MODE, VOCAB_DIRECTION } from "../../../js/config.js"
import { caseRu } from "../../../js/i18n/core.js"
import { STR } from "../../../js/i18n/strings-ru.js"
import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx"
import { ChartsToolbar } from "../../components/ui/ChartsToolbar.jsx"
import { Button } from "../../components/ui/Button.jsx"
import {
    handleAnswerFieldKeyDown,
    handleLtCharsToolbarClick,
    handleMorphCasesAnswerSubmit,
    handleQuizSkipButtonClick,
    handleVocabAnswerFieldKeyDown,
    handleVocabChoice,
    handleVocabHardcoreFormSubmit,
} from "../../../js/quiz.js"
import { answersMatch } from "../../../js/text-utils.js"
import { wordLemma } from "../../../js/word-entry.js"
import { vocabRuUserMatches, wordRuPrimary } from "../../../js/word-ru.js"

function vocabPromptForTask(task) {
    if (!task?.word) return { text: "", lang: undefined }
    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    if (dir === VOCAB_DIRECTION.LT_TO_RU) {
        return { text: wordLemma(task.word), lang: "lt" }
    }
    return { text: wordRuPrimary(task.word), lang: "ru" }
}

function casesPromptForTask(task, casesShowTranslation) {
    if (!task?.word || task.mode === TRAIN_MODE.VOCAB) {
        return { lemma: "", targetCase: "" }
    }
    const nom = wordLemma(task.word)
    const hint =
        casesShowTranslation === true && wordRuPrimary(task.word)
            ? ` (${wordRuPrimary(task.word)})`
            : ""
    return {
        lemma: `${nom}${hint}`,
        targetCase: task.targetCase ? caseRu(task.targetCase) : "",
    }
}

function vocabChoiceClass(lem, task, answered, choiceState) {
    const classes = ["btn", "vocab-choice"]
    if (!answered) classes.push("ghost")
    if (!answered || !task?.word) return classes.join(" ")

    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    const isCorrect =
        dir === VOCAB_DIRECTION.LT_TO_RU
            ? vocabRuUserMatches(task.word, lem)
            : answersMatch(lem, wordLemma(task.word))
    const picked = choiceState?.pickedLemma === lem

    if (isCorrect) classes.push("vocab-choice--correct")
    if (!isCorrect && !picked) classes.push("ghost")
    if (picked) classes.push("vocab-choice--picked")
    if (picked && !isCorrect) classes.push("vocab-choice--wrong")
    return classes.join(" ")
}

function VocabChoices({ task, answered, choiceState }) {
    const choices = Array.isArray(task?.choices) ? task.choices : []
    const dir = task?.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    const ariaLabel =
        dir === VOCAB_DIRECTION.LT_TO_RU ? STR.quiz.vocabLtToRuAria : STR.quiz.vocabRuToLtAria

    return (
        <div id="vocab-options" className="vocab-options" role="group" aria-label={ariaLabel}>
            {choices.map((lem) => {
                const correct =
                    answered && task?.word
                        ? dir === VOCAB_DIRECTION.LT_TO_RU
                            ? vocabRuUserMatches(task.word, lem)
                            : answersMatch(lem, wordLemma(task.word))
                        : false
                return (
                    <button
                        key={lem}
                        type="button"
                        className={vocabChoiceClass(lem, task, answered, choiceState)}
                        data-lemma={lem}
                        disabled={answered && !correct}
                        aria-label={lem}
                        onClick={() => handleVocabChoice(lem)}
                    >
                        {lem}
                    </button>
                )
            })}
        </div>
    )
}

function QuizActionButtons({
    answered,
    isHardcore,
    isVocab,
    skipDisabled,
    skipLabel,
    submitHidden,
    submitLabel,
}) {
    return (
        <>
            <Button
                variant={isVocab && answered && !isHardcore ? "primary" : "ghost"}
                type="button"
                id="btn-skip"
                disabled={skipDisabled}
                onClick={handleQuizSkipButtonClick}
            >
                {skipLabel}
            </Button>
            <Button
                variant="primary"
                type="submit"
                form={isHardcore ? undefined : "answer-form"}
                id="btn-quiz-submit-cases"
                className={submitHidden ? "hidden" : ""}
                hidden={submitHidden}
            >
                {submitLabel}
            </Button>
        </>
    )
}

function QuizFeedback({ feedback }) {
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

/**
 * Экран тренажёра: падежи и словарь.
 * @param {{ heightMode?: "fill"|"scroll"; hidden?: boolean }} [props]
 */
export function QuizScreen({ heightMode = "fill", hidden = false } = {}) {
    const { task, answered, choiceState, feedback } = useSelector(
        (s) => ({
            task: s.trainer.engine.currentTask,
            answered: s.trainer.engine.answered,
            choiceState: s.trainer.engine.vocabChoice,
            feedback: s.trainer.quizFeedback,
        }),
        shallowEqual
    )
    const casesShowTranslation = useSelector((s) => s.trainer.persisted.casesShowTranslation)
    const isVocab = task?.mode === TRAIN_MODE.VOCAB
    const isHardcore = !!task?.vocabHardcore
    const vocabPrompt = vocabPromptForTask(task)
    const casesPrompt = casesPromptForTask(task, casesShowTranslation)
    const showChoices = isVocab && !isHardcore
    const submitHidden = isVocab && !isHardcore
    const footerSingle = showChoices
    const skipLabel = isVocab && answered && !isHardcore ? STR.quiz.next : STR.quiz.skip
    const skipDisabled = !task || (answered && !(isVocab && !isHardcore))
    const submitLabel = answered ? STR.quiz.next : STR.quiz.check

    return (
        <AppFlowScreen
            id="quiz-shell"
            heightMode={heightMode}
            className={["quiz-shell", hidden && "hidden"].filter(Boolean).join(" ")}
        >
            <section id="quiz" className="widget panel app-screen__panel">
                <div className="app-screen__body quiz-screen-body">
                    <div id="quiz-cases-ui" className={isVocab ? "hidden" : ""}>
                        <div className="prompt">
                            <div className="vocab-ru-card">
                                <p className="lemma vocab-ru-display" id="lemma-display">
                                    {casesPrompt.lemma}
                                </p>
                            </div>
                            <p className="target-line">
                                <span className="target-prefix">{STR.quiz.targetCasePrefix}</span>
                                <span id="target-case-display">{casesPrompt.targetCase}</span>
                            </p>
                        </div>
                        <form
                            id="answer-form"
                            autoComplete="off"
                            onSubmit={handleMorphCasesAnswerSubmit}
                        >
                            <label className="sr-only" htmlFor="answer-input">
                                {STR.quiz.answerLabel}
                            </label>
                            <input
                                type="text"
                                id="answer-input"
                                placeholder={STR.quiz.answerPlaceholder}
                                spellCheck={false}
                                autoCapitalize="off"
                                onKeyDown={(e) => handleAnswerFieldKeyDown(e.nativeEvent)}
                            />
                            <ChartsToolbar
                                id="lt-chars"
                                onClick={(e) =>
                                    handleLtCharsToolbarClick(e.nativeEvent, "answer-input")
                                }
                            />
                        </form>
                    </div>

                    <div id="quiz-vocab-ui" className={isVocab ? "" : "hidden"}>
                        <div className="vocab-ru-card">
                            <div className="vocab-ru-card-body">
                                <p
                                    className="lemma vocab-ru-display"
                                    id="vocab-ru-display"
                                    lang={vocabPrompt.lang}
                                >
                                    {vocabPrompt.text}
                                </p>
                            </div>
                            <div
                                id="vocab-streak-mult"
                                className="vocab-streak-mult hidden"
                                aria-hidden="true"
                            >
                                <span
                                    id="vocab-streak-mult-value"
                                    className="vocab-streak-mult-value"
                                />
                            </div>
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
                        </div>
                        <div
                            id="vocab-round-progress"
                            className="vocab-round-progress hidden"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-hidden="true"
                        >
                            <div className="vocab-round-progress-track" aria-hidden="true">
                                <div
                                    id="vocab-round-progress-fill"
                                    className="vocab-round-progress-fill"
                                />
                            </div>
                        </div>
                        {showChoices && (
                            <VocabChoices
                                task={task}
                                answered={answered}
                                choiceState={choiceState}
                            />
                        )}
                        <form
                            id="vocab-answer-form"
                            className={["vocab-answer-form", !isHardcore && "hidden"]
                                .filter(Boolean)
                                .join(" ")}
                            autoComplete="off"
                            onSubmit={handleVocabHardcoreFormSubmit}
                        >
                            <label className="sr-only" htmlFor="vocab-answer-input">
                                {STR.quiz.answerLabel}
                            </label>
                            <input
                                type="text"
                                id="vocab-answer-input"
                                placeholder={STR.quiz.answerPlaceholder}
                                spellCheck={false}
                                autoCapitalize="off"
                                onKeyDown={(e) => handleVocabAnswerFieldKeyDown(e.nativeEvent)}
                            />
                            <ChartsToolbar
                                id="vocab-lt-chars"
                                onClick={(e) =>
                                    handleLtCharsToolbarClick(e.nativeEvent, "vocab-answer-input")
                                }
                            />
                            {isHardcore && (
                                <div className="actions quiz-answer-actions quiz-footer-actions quiz-footer-actions--inline">
                                    <QuizActionButtons
                                        answered={answered}
                                        isHardcore={isHardcore}
                                        isVocab={isVocab}
                                        skipDisabled={skipDisabled}
                                        skipLabel={skipLabel}
                                        submitHidden={submitHidden}
                                        submitLabel={submitLabel}
                                    />
                                </div>
                            )}
                        </form>
                    </div>

                    <QuizFeedback feedback={feedback} />
                </div>

                {!isHardcore && (
                    <div
                        className={[
                            "app-screen__footer actions quiz-answer-actions quiz-footer-actions",
                            footerSingle && "quiz-footer--single",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        id="quiz-footer-actions"
                    >
                        <QuizActionButtons
                            answered={answered}
                            isHardcore={isHardcore}
                            isVocab={isVocab}
                            skipDisabled={skipDisabled}
                            skipLabel={skipLabel}
                            submitHidden={submitHidden}
                            submitLabel={submitLabel}
                        />
                    </div>
                )}
            </section>
        </AppFlowScreen>
    )
}
