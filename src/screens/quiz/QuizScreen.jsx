import { shallowEqual, useSelector } from "react-redux"

import { TRAIN_MODE } from "../../../js/config.js"
import { STR } from "../../../js/i18n/strings-ru.js"
import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx"
import { handleQuizSkipButtonClick } from "../../../js/quiz.js"
import { QuizActionButtons, QuizFeedback } from "./shared/index.js"
import { CasesQuiz } from "./cases/CasesQuiz.jsx"
import { VocabQuiz } from "./vocab/VocabQuiz.jsx"
import { VerbsQuiz } from "./verbs/VerbsQuiz.jsx"

/**
 * Экран тренажёра: падежи и словарь.
 * @param {{ heightMode?: "fill"|"scroll"; hidden?: boolean }} [props]
 */
export function QuizScreen({ heightMode = "fill", hidden = false } = {}) {
    const {
        task,
        answered,
        choiceState,
        feedback,
        roundDots,
        roundProgress,
        vocabStreak,
        vocabStreakPulseId,
    } = useSelector(
        (s) => ({
            task: s.trainer.engine.currentTask,
            answered: s.trainer.engine.answered,
            choiceState: s.trainer.engine.vocabChoice,
            feedback: s.trainer.quizFeedback,
            roundDots: s.trainer.engine.vocabRoundDots,
            vocabStreak: s.trainer.engine.vocabCorrectStreak,
            vocabStreakPulseId: s.trainer.engine.vocabStreakPulseId,
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
    const showChoices = isVocab && !isHardcore
    const submitHidden = isVocab && !isHardcore
    const footerSingle = showChoices
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

    return (
        <AppFlowScreen
            id="quiz-shell"
            heightMode={heightMode}
            className={["quiz-shell", hidden && "hidden"].filter(Boolean).join(" ")}
        >
            <section
                id="quiz"
                className={["widget panel app-screen__panel", quizModeClass]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className="app-screen__body quiz-screen-body">
                    <CasesQuiz isActive={isCases} task={task} />

                    <VocabQuiz
                        answered={answered}
                        choiceState={choiceState}
                        isActive={isVocab}
                        pulseId={vocabStreakPulseId}
                        roundDots={roundDots}
                        roundProgress={roundProgress}
                        skipDisabled={skipDisabled}
                        skipLabel={skipLabel}
                        streak={vocabStreak}
                        submitHidden={submitHidden}
                        submitLabel={submitLabel}
                        task={task}
                    />

                    <VerbsQuiz
                        isActive={isVerbs}
                        pulseId={vocabStreakPulseId}
                        roundDots={roundDots}
                        roundProgress={roundProgress}
                        streak={vocabStreak}
                        task={task}
                    />

                    {isHardcore && <QuizFeedback feedback={feedback} />}
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
                            isVerbs={isVerbs}
                            isVocab={isVocab}
                            onSkip={handleQuizSkipButtonClick}
                            skipDisabled={skipDisabled}
                            skipLabel={skipLabel}
                            submitHidden={submitHidden}
                            submitLabel={submitLabel}
                        />
                    </div>
                )}
                {!isHardcore && <QuizFeedback feedback={feedback} />}
            </section>
        </AppFlowScreen>
    )
}
