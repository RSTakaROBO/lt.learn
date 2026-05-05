import { byId } from "./dom-ids.js";
import {
  closeCasesHelpOverlay,
  closePackPromptOverlay,
  closeVerbsHelpOverlay,
  closeVocabRoundSummaryOverlay,
  isCasesHelpOpen,
  isVerbsHelpOpen,
  postTrainerUiAction,
  mutateEngine,
} from "./trainer-ui-state.js";
import { clearVocabRound } from "./vocab-round.js";
import { resetVocabCorrectStreak } from "./quiz.js";

/** Кнопка «домой» в нижней панели: закрыть оверлеи и при необходимости выйти из квиза в мастер. */
export function handleQuizBarHomeClick() {
  postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "stats" });
  postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "settings" });
  closePackPromptOverlay();
  postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "helpHub" });
  closeVocabRoundSummaryOverlay();
  clearVocabRound();
  if (isCasesHelpOpen()) {
    closeCasesHelpOverlay();
    return;
  }
  if (isVerbsHelpOpen()) {
    closeVerbsHelpOverlay();
    return;
  }
  byId("quiz-shell")?.classList.add("hidden");
  byId("setup-shell")?.classList.remove("hidden");
  resetVocabCorrectStreak();
  postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 1 });
  const ps = byId("pack-step-status");
  const cs = byId("case-step-status");
  const vs = byId("vocab-direction-step-status");
  if (ps) ps.textContent = "";
  if (cs) cs.textContent = "";
  if (vs) vs.textContent = "";
  mutateEngine((e) => {
    e.currentTask = null;
    e.shownLemmaHistory = [];
  });
}