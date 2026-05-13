import { useEffect, useRef, useState } from "react"
import { shallowEqual, useSelector } from "react-redux"

import { TRAIN_MODE } from "js/config.js"
import { STR } from "js/i18n/strings-ru.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { handleQuizSkipButtonClick } from "js/quiz.js"
import { openVocabRoundSummaryOverlay } from "js/vocab-round.js"
import { ConfirmDialogOverlay } from "src/components/ui/ConfirmDialogOverlay.jsx"
import {
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
        feedback,
        roundDots,
        roundProgress,
        vocabStreak,
        vocabStreakPulseId,
        vocabShowWrongTranslation,
        casesUseNativeKeyboard,
    } = useSelector(
        (s) => ({
            task: s.trainer.engine.currentTask,
            answered: s.trainer.engine.answered,
            choiceState: s.trainer.engine.vocabChoice,
            feedback: s.trainer.quizFeedback,
            roundDots: s.trainer.engine.vocabRoundDots,
            vocabStreak: s.trainer.engine.vocabCorrectStreak,
            vocabStreakPulseId: s.trainer.engine.vocabStreakPulseId,
            vocabShowWrongTranslation: s.trainer.persisted.vocabShowWrongTranslation,
            casesUseNativeKeyboard: s.trainer.persisted.casesUseNativeKeyboard,
            roundProgress: s.trainer.engine.vocabRound
                ? {
                      done:
                          s.trainer.engine.vocabRound.initialSize -
                          s.trainer.engine.vocabRound.pool.size,
                      total: s.trainer.engine.vocabRound.initialSize,
                      pct:
                          s.trainer.engine.vocabRound.initialSize > 0
                              ? Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        (100 *
                                            (s.trainer.engine.vocabRound.initialSize -
                                                s.trainer.engine.vocabRound.pool.size)) /
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
    const usesTypedLtQuiz = isCases || isVerbs || (isVocab && isHardcore)
    const showChoices = isVocab && !isHardcore
    const showFinish = !!roundProgress
    const showSkip = isVocab && !isHardcore
    const submitHidden = isVocab && !isHardcore
    const visibleFooterButtons = (showFinish ? 1 : 0) + (showSkip ? 1 : 0) + (!submitHidden ? 1 : 0)
    const footerSingle = visibleFooterButtons === 1
    const skipLabel =
        (isVocab && answered && !isHardcore) || (isVerbs && answered)
            ? STR.quiz.next
            : STR.quiz.skip
    const skipDisabled = !task || (answered && !(isVocab && !isHardcore) && !isVerbs)
    const submitLabel = answered ? STR.quiz.next : STR.quiz.check
    const quizModeClass = isVerbs
        ? "quiz--verbs"
        : isVocab
          ? isHardcore
              ? "quiz--vocab quiz--vocab-hardcore"
              : "quiz--vocab"
          : "quiz--cases"

    const lithuanianOverlayEligible = coarseTouchPreferred && !casesUseNativeKeyboard
    const showLithuanianOverlayKeyboard = lithuanianOverlayEligible && usesTypedLtQuiz

    useEffect(() => {
        if (!casesUseNativeKeyboard) return
        setQuizLtKeyboardOpen(false)
    }, [casesUseNativeKeyboard])

    useEffect(() => {
        if (!usesTypedLtQuiz) setQuizLtKeyboardOpen(false)
    }, [usesTypedLtQuiz])

    useEffect(() => {
        if (!showLithuanianOverlayKeyboard) setQuizLtKeyboardMounted(false)
    }, [showLithuanianOverlayKeyboard])

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
                        showLithuanianOverlayKeyboard &&
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
                            lithuanianOverlayKeyboard={showLithuanianOverlayKeyboard && isCases}
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
                            showWrongTranslation={vocabShowWrongTranslation}
                            lithuanianOverlayKeyboard={showLithuanianOverlayKeyboard && isHardcore}
                            onRevealLithuanianKeyboard={() => setQuizLtKeyboardOpen(true)}
                            quizTypingAnswer={quizTypingAnswer}
                            quizTypingInputRef={quizTypingInputRef}
                            setQuizTypingAnswer={setQuizTypingAnswer}
                            task={task}
                        />

                        <VerbsQuiz
                            answered={answered}
                            answerValue={quizTypingAnswer}
                            feedback={isVerbs ? feedback : null}
                            inputRef={quizTypingInputRef}
                            isActive={isVerbs}
                            lithuanianOverlayKeyboard={showLithuanianOverlayKeyboard && isVerbs}
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
                            {(isCases || isVerbs) && showLithuanianOverlayKeyboard ? (
                                <LithuanianKeyboard
                                    inputRef={quizTypingInputRef}
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
                        showLithuanianOverlayKeyboard ? (
                            <div className="app-screen__footer quiz-footer-stack">
                                <LithuanianKeyboard
                                    inputRef={quizTypingInputRef}
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
