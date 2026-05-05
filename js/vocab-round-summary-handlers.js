/**
 * Действия после раунда «Слова»: согласованы с {@link VocabRoundSummaryOverlay}.
 */
import { STR } from "./i18n/strings-ru.js";
import {
  postTrainerUiAction,
  closeVocabRoundSummaryOverlay,
  mutateEngine,
} from "./trainer-ui-state.js";
import { byId } from "./dom-ids.js";
import { getResolvedVocabDirections } from "./storage.js";
import { resetVocabCorrectStreak, showQuiz } from "./quiz.js";
import { clearVocabRound, initVocabRound } from "./vocab-round.js";
import { nextVocabTask } from "./word-selection.js";

function clearSetupStatusLines() {
  const ps = byId("pack-step-status");
  const cs = byId("case-step-status");
  const vs = byId("vocab-direction-step-status");
  if (ps) ps.textContent = "";
  if (cs) cs.textContent = "";
  if (vs) vs.textContent = "";
}

/** «Ок» / закрытие итога: мастер, сброс раунда. */
export function runVocabRoundSummaryOkFlow() {
  closeVocabRoundSummaryOverlay();
  clearVocabRound();
  if (byId("quiz-shell")) byId("quiz-shell").classList.add("hidden");
  if (byId("setup-shell")) byId("setup-shell").classList.remove("hidden");
  resetVocabCorrectStreak();
  postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 1 });
  clearSetupStatusLines();
  mutateEngine((e) => {
    e.currentTask = null;
    e.shownLemmaHistory = [];
  });
}

/** То же, что «Ок», для Escape и клика по подложке. */
export function dismissVocabRoundSummaryToSetup() {
  runVocabRoundSummaryOkFlow();
}

/** «Повторить» — новый раунд либо сообщение об ошибке. */
export function runVocabRoundSummaryRepeatFlow() {
  closeVocabRoundSummaryOverlay();
  mutateEngine((e) => {
    e.shownLemmaHistory = [];
  });
  resetVocabCorrectStreak();
  if (!initVocabRound()) {
    clearVocabRound();
    if (byId("quiz-shell")) byId("quiz-shell").classList.add("hidden");
    if (byId("setup-shell")) byId("setup-shell").classList.remove("hidden");
    postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 });
    const dirStatus = byId("vocab-direction-step-status");
    if (dirStatus) {
      dirStatus.textContent = STR.events.roundNoWords;
    }
    return;
  }
  const task = nextVocabTask();
  if (!task) {
    clearVocabRound();
    if (byId("quiz-shell")) byId("quiz-shell").classList.add("hidden");
    if (byId("setup-shell")) byId("setup-shell").classList.remove("hidden");
    postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 });
    const dirStatus = byId("vocab-direction-step-status");
    if (dirStatus) {
      dirStatus.textContent = getResolvedVocabDirections().hardcore
        ? STR.events.roundRepeatFail
        : STR.events.roundRepeatChoices;
    }
    return;
  }
  showQuiz(task);
}
