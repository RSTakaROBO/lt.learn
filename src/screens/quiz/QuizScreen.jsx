import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx";
import { ChartsToolbar } from "../../components/ui/ChartsToolbar.jsx";
import { Button } from "../../components/ui/Button.jsx";
import {
  handleAnswerFieldKeyDown,
  handleLtCharsToolbarClick,
  handleMorphCasesAnswerSubmit,
  handleQuizSkipButtonClick,
  handleVocabAnswerFieldKeyDown,
  handleVocabChoicesClick,
  handleVocabHardcoreFormSubmit,
} from "../../../js/quiz.js";

/**
 * Экран тренажёра: падежи и словарь.
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function QuizScreen({ heightMode = "fill" } = {}) {
  return (
    <AppFlowScreen id="quiz-shell" heightMode={heightMode} className="quiz-shell hidden">
      <section id="quiz" className="widget panel app-screen__panel">
        <div className="app-screen__body quiz-screen-body">
          <div id="quiz-cases-ui">
            <div className="prompt">
              <div className="vocab-ru-card">
                <p className="lemma vocab-ru-display" id="lemma-display" />
              </div>
              <p className="target-line">
                <span className="target-prefix" />
                <span id="target-case-display" />
              </p>
            </div>
            <form id="answer-form" autoComplete="off" onSubmit={handleMorphCasesAnswerSubmit}>
              <label className="sr-only" htmlFor="answer-input" />
              <input
                type="text"
                id="answer-input"
                placeholder=""
                spellCheck={false}
                autoCapitalize="off"
                onKeyDown={(e) => handleAnswerFieldKeyDown(e.nativeEvent)}
              />
              <ChartsToolbar
                id="lt-chars"
                onClick={(e) => handleLtCharsToolbarClick(e.nativeEvent, "answer-input")}
              />
            </form>
          </div>

          <div id="quiz-vocab-ui" className="hidden">
            <div className="vocab-ru-card">
              <div className="vocab-ru-card-body">
                <p className="lemma vocab-ru-display" id="vocab-ru-display" />
              </div>
              <div id="vocab-streak-mult" className="vocab-streak-mult hidden" aria-hidden="true">
                <span id="vocab-streak-mult-value" className="vocab-streak-mult-value" />
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
                <div id="vocab-round-progress-fill" className="vocab-round-progress-fill" />
              </div>
            </div>
            <div
              id="vocab-options"
              className="vocab-options"
              role="group"
              onClick={(e) => handleVocabChoicesClick(e.nativeEvent)}
            />
            <form
              id="vocab-answer-form"
              className="vocab-answer-form hidden"
              autoComplete="off"
              onSubmit={handleVocabHardcoreFormSubmit}
            >
              <label className="sr-only" htmlFor="vocab-answer-input" />
              <input
                type="text"
                id="vocab-answer-input"
                placeholder=""
                spellCheck={false}
                autoCapitalize="off"
                onKeyDown={(e) => handleVocabAnswerFieldKeyDown(e.nativeEvent)}
              />
              <ChartsToolbar
                id="vocab-lt-chars"
                onClick={(e) => handleLtCharsToolbarClick(e.nativeEvent, "vocab-answer-input")}
              />
            </form>
          </div>

          <div id="feedback" className="feedback hidden" aria-live="polite" />
        </div>

        <div
          className="app-screen__footer actions quiz-answer-actions quiz-footer-actions"
          id="quiz-footer-actions"
        >
          <Button type="button" id="btn-skip" onClick={handleQuizSkipButtonClick} />
          <Button
            variant="primary"
            type="submit"
            form="answer-form"
            id="btn-quiz-submit-cases"
          />
        </div>
      </section>
    </AppFlowScreen>
  );
}
