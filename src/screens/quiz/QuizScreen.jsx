import { useEffect, useRef, useState } from "react"
import { shallowEqual, useSelector } from "react-redux"

import { TRAIN_MODE, VOCAB_DIRECTION, VOCAB_MODE } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { handleQuizSkipButtonClick } from "js/quiz.js"
import { openVocabRoundSummaryOverlay } from "js/vocab-round.js"
import { ConfirmDialogOverlay } from "src/components/ui/ConfirmDialogOverlay.jsx"
import {
    KEYBOARD_LAYOUT_LT,
    KEYBOARD_LAYOUT_RU,
    LithuanianKeyboard,
    QuizActionButtons,
    QuizFeedback,
} from "src/screens/quiz/shared/index.js"
import { CasesQuiz } from "src/screens/quiz/cases/CasesQuiz.jsx"
import { usePreferCoarsePointer } from "src/hooks/usePreferCoarsePointer.js"
import { VocabQuiz } from "src/screens/quiz/vocab/VocabQuiz.jsx"
import { VerbsQuiz } from "src/screens/quiz/verbs/VerbsQuiz.jsx"

/**
 * Экран тренажёра: падежи и словарь.
 * @param {{ heightMode?: "fill"|"scroll"; hidden?: boolean }} [props]
 */
export function QuizScreen({ heightMode = "fill", hidden = false } = {}) {
    const [finishConfirmOpen, setFinishConfirmOpen] = useState(false)
    const coarseTouchPreferred = usePreferCoarsePointer()
    const [quizTypingAnswer, setQuizTypingAnswer] = useState("")
    const [quizLtKeyboardOpen, setQuizLtKeyboardOpen] = useState(false)
    const [quizLtKeyboardMounted, setQuizLtKeyboardMounted] = useState(false)
    const quizTypingInputRef = useRef(null)
    const {
        task,
        answered,
        choiceState,
        vocabSingleState,
        vocabSingleNextTask,
        feedback,
        roundDots,
        roundProgress,
        roundStages,
        vocabStreak,
        vocabStreakPulseId,
        vocabShowVerbForms,
        vocabShowWrongTranslation,
        casesUseNativeKeyboard,
    } = useSelector(
        (s) => ({
            task: s.trainer.engine.currentTask,
            answered: s.trainer.engine.answered,
            choiceState: s.trainer.engine.vocabChoice,
            vocabSingleState: s.trainer.engine.vocabSingle,
            vocabSingleNextTask: s.trainer.engine.vocabSingleNextTask,
            feedback: s.trainer.quizFeedback,
            roundDots: s.trainer.engine.vocabRoundDots,
            roundStages: s.trainer.engine.vocabRound
                ? s.trainer.engine.vocabRound.gradedCorrect +
                  s.trainer.engine.vocabRound.gradedWrong +
                  Object.values(s.trainer.engine.vocabRound.roundRow).reduce(
                      (sum, row) => sum + (row.skipped || 0),
                      0
                  )
                : 0,
            vocabStreak: s.trainer.engine.vocabCorrectStreak,
            vocabStreakPulseId: s.trainer.engine.vocabStreakPulseId,
            vocabShowVerbForms: s.trainer.persisted.vocabShowVerbForms,
            vocabShowWrongTranslation: s.trainer.persisted.vocabShowWrongTranslation,
            casesUseNativeKeyboard: s.trainer.persisted.casesUseNativeKeyboard,
            roundProgress: s.trainer.engine.vocabRound
                ? {
                      done:
                          s.trainer.engine.vocabRound.initialSize -
                          (s.trainer.engine.vocabRound.pool.size +
                              s.trainer.engine.vocabRound.reserve.length),
                      total: s.trainer.engine.vocabRound.initialSize,
                      pct:
                          s.trainer.engine.vocabRound.initialSize > 0
                              ? Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        (100 *
                                            (s.trainer.engine.vocabRound.initialSize -
                                                (s.trainer.engine.vocabRound.pool.size +
                                                    s.trainer.engine.vocabRound.reserve.length))) /
                                            s.trainer.engine.vocabRound.initialSize
                                    )
                                )
                              : 0,
                  }
                : null,
        }),
        shallowEqual
    )
    const isVocab = task?.mode === TRAIN_MODE.VOCAB
    const isVerbs = task?.mode === TRAIN_MODE.VERBS
    const isCases = !isVocab && !isVerbs
    const isHardcore = !!task?.vocabHardcore
    const isSingleVocab = isVocab && task?.vocabMode === VOCAB_MODE.SINGLE
    const usesTypedLtQuiz = isCases || isVerbs || (isVocab && isHardcore)
    const showChoices = isVocab && !isHardcore && !isSingleVocab
    const showFinish = !!roundProgress
    const showSkip = isVocab && !isHardcore && !isSingleVocab
    const submitHidden = isVocab && !isHardcore
    const visibleFooterButtons = (showFinish ? 1 : 0) + (showSkip ? 1 : 0) + (!submitHidden ? 1 : 0)
    const footerSingle = visibleFooterButtons === 1
    const skipLabel =
        (isVocab && answered && !isHardcore && !isSingleVocab) || (isVerbs && answered)
            ? STR.quiz.next
            : STR.quiz.skip
    const skipDisabled =
        !task || (answered && !(isVocab && !isHardcore && !isSingleVocab) && !isVerbs)
    const submitLabel = answered ? STR.quiz.next : STR.quiz.check
    const quizModeClass = isVerbs
        ? "quiz--verbs"
        : isVocab
          ? isHardcore
              ? "quiz--vocab quiz--vocab-hardcore"
              : isSingleVocab
                ? "quiz--vocab quiz--vocab-single"
                : "quiz--vocab"
          : "quiz--cases"

    const overlayKeyboardEligible = coarseTouchPreferred && !casesUseNativeKeyboard
    const showOverlayKeyboard = overlayKeyboardEligible && usesTypedLtQuiz

    const answerInRussian =
        isVocab && isHardcore && task?.vocabDirection === VOCAB_DIRECTION.LT_TO_RU
    const keyboardLayout = answerInRussian ? KEYBOARD_LAYOUT_RU : KEYBOARD_LAYOUT_LT

    useEffect(() => {
        if (!casesUseNativeKeyboard) return
        setQuizLtKeyboardOpen(false)
    }, [casesUseNativeKeyboard])

    useEffect(() => {
        if (!usesTypedLtQuiz) setQuizLtKeyboardOpen(false)
    }, [usesTypedLtQuiz])

    useEffect(() => {
        if (!showOverlayKeyboard) setQuizLtKeyboardMounted(false)
    }, [showOverlayKeyboard])

    useEffect(() => {
        setQuizTypingAnswer("")
    }, [task])

    return (
        <>
            <AppFlowScreen
                id="quiz-shell"
                heightMode={heightMode}
                className={["quiz-shell", hidden && "hidden"].filter(Boolean).join(" ")}
            >
                <section
                    id="quiz"
                    className={[
                        "widget panel app-screen__panel",
                        quizModeClass,
                        showOverlayKeyboard &&
                            (quizLtKeyboardOpen || quizLtKeyboardMounted) &&
                            "quiz-lt-keyboard-clearance",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                >
                    <div className="app-screen__body quiz-screen-body">
                        <CasesQuiz
                            answerValue={quizTypingAnswer}
                            feedback={isCases ? feedback : null}
                            inputRef={quizTypingInputRef}
                            isActive={isCases}
                            lithuanianOverlayKeyboard={showOverlayKeyboard && isCases}
                            onAnswerValueChange={setQuizTypingAnswer}
                            onRevealLithuanianKeyboard={() => setQuizLtKeyboardOpen(true)}
                            pulseId={vocabStreakPulseId}
                            roundDots={roundDots}
                            roundProgress={roundProgress}
                            streak={vocabStreak}
                            task={task}
                        />

                        <VocabQuiz
                            answered={answered}
                            choiceState={choiceState}
                            feedback={isVocab ? feedback : null}
                            finishLabel={STR.confirm.finish}
                            isActive={isVocab}
                            onFinish={() => setFinishConfirmOpen(true)}
                            pulseId={vocabStreakPulseId}
                            roundDots={roundDots}
                            roundProgress={roundProgress}
                            skipDisabled={skipDisabled}
                            skipLabel={skipLabel}
                            streak={vocabStreak}
                            submitHidden={submitHidden}
                            submitLabel={submitLabel}
                            showFinish={showFinish}
                            showVerbForms={vocabShowVerbForms}
                            showWrongTranslation={vocabShowWrongTranslation}
                            lithuanianOverlayKeyboard={showOverlayKeyboard && isHardcore}
                            onRevealLithuanianKeyboard={() => setQuizLtKeyboardOpen(true)}
                            quizTypingAnswer={quizTypingAnswer}
                            quizTypingInputRef={quizTypingInputRef}
                            setQuizTypingAnswer={setQuizTypingAnswer}
                            task={task}
                            vocabSingleNextTask={vocabSingleNextTask}
                            vocabSingleState={vocabSingleState}
                        />

                        <VerbsQuiz
                            answered={answered}
                            answerValue={quizTypingAnswer}
                            feedback={isVerbs ? feedback : null}
                            inputRef={quizTypingInputRef}
                            isActive={isVerbs}
                            lithuanianOverlayKeyboard={showOverlayKeyboard && isVerbs}
                            onAnswerValueChange={setQuizTypingAnswer}
                            onRevealLithuanianKeyboard={() => setQuizLtKeyboardOpen(true)}
                            pulseId={vocabStreakPulseId}
                            roundDots={roundDots}
                            roundProgress={roundProgress}
                            streak={vocabStreak}
                            task={task}
                        />

                        {isHardcore && !isVocab && !isCases && <QuizFeedback feedback={feedback} />}
                    </div>

                    {!isHardcore && (
                        <div className="app-screen__footer quiz-footer-stack">
                            <div
                                className={[
                                    "actions quiz-answer-actions quiz-footer-actions",
                                    footerSingle && "quiz-footer--single",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                id="quiz-footer-actions"
                            >
                                <QuizActionButtons
                                    answered={answered}
                                    finishLabel={STR.confirm.finish}
                                    isHardcore={isHardcore}
                                    isVerbs={isVerbs}
                                    isVocab={isVocab}
                                    onFinish={() => setFinishConfirmOpen(true)}
                                    onSkip={handleQuizSkipButtonClick}
                                    showFinish={showFinish}
                                    showSkip={showSkip}
                                    skipDisabled={skipDisabled}
                                    skipLabel={skipLabel}
                                    submitHidden={submitHidden}
                                    submitLabel={submitLabel}
                                />
                            </div>
                            {(isCases || isVerbs) && showOverlayKeyboard ? (
                                <LithuanianKeyboard
                                    inputRef={quizTypingInputRef}
                                    layout={KEYBOARD_LAYOUT_LT}
                                    onPresenceChange={setQuizLtKeyboardMounted}
                                    onRequestHide={() => setQuizLtKeyboardOpen(false)}
                                    onValueChange={setQuizTypingAnswer}
                                    value={quizTypingAnswer}
                                    visible={quizLtKeyboardOpen}
                                />
                            ) : null}
                        </div>
                    )}
                    {isHardcore && isVocab ? (
                        showOverlayKeyboard ? (
                            <div className="app-screen__footer quiz-footer-stack">
                                <LithuanianKeyboard
                                    inputRef={quizTypingInputRef}
                                    layout={keyboardLayout}
                                    onPresenceChange={setQuizLtKeyboardMounted}
                                    onRequestHide={() => setQuizLtKeyboardOpen(false)}
                                    onValueChange={setQuizTypingAnswer}
                                    value={quizTypingAnswer}
                                    visible={quizLtKeyboardOpen}
                                />
                            </div>
                        ) : null
                    ) : null}
                </section>
            </AppFlowScreen>
            <ConfirmDialogOverlay
                id="finish-round-confirm"
                open={finishConfirmOpen}
                title={STR.confirm.finishRoundTitle}
                message={STR.confirm.finishRoundMessage}
                details={
                    roundProgress ? (
                        <div className="finish-round-mini-stats" aria-live="polite">
                            <div className="finish-round-mini-stat">
                                <span>{STR.confirm.finishRoundWords}</span>
                                <strong>
                                    {roundProgress.done} {STR.confirm.finishRoundOf}{" "}
                                    {roundProgress.total}
                                </strong>
                            </div>
                            <div className="finish-round-mini-stat">
                                <span>{STR.confirm.finishRoundStages}</span>
                                <strong>{roundStages}</strong>
                            </div>
                        </div>
                    ) : null
                }
                cancelLabel={STR.confirm.cancel}
                confirmLabel={STR.confirm.finish}
                onCancel={() => setFinishConfirmOpen(false)}
                onConfirm={() => {
                    setFinishConfirmOpen(false)
                    openVocabRoundSummaryOverlay()
                }}
            />
        </>
    )
}
