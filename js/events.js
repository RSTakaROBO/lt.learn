import {
  closeCasesHelpOverlay,
  closePackPromptOverlay,
  closeVerbsHelpOverlay,
  getEngine,
  isCasesHelpOpen,
  isHelpHubOpen,
  isPackPromptOverlayOpen,
  isSettingsOverlayOpen,
  isStatsOverlayOpen,
  isVerbsHelpOpen,
  isVocabRoundSummaryOpen,
  postTrainerUiAction,
} from "./trainer-ui-state.js";
import { skipCurrentWord } from "./quiz.js";
import { dismissVocabRoundSummaryToSetup } from "./vocab-round-summary-handlers.js";
import { byId } from "./dom-ids.js";

let trainerEventsBound = false;

export function bindEvents() {
  if (trainerEventsBound) return;
  trainerEventsBound = true;

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (isPackPromptOverlayOpen()) {
      e.preventDefault();
      closePackPromptOverlay();
      return;
    }
    if (isVocabRoundSummaryOpen()) {
      e.preventDefault();
      dismissVocabRoundSummaryToSetup();
      return;
    }
    if (isHelpHubOpen()) {
      e.preventDefault();
      postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "helpHub" });
      return;
    }
    if (isSettingsOverlayOpen()) {
      e.preventDefault();
      postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "settings" });
      return;
    }
    if (isStatsOverlayOpen()) {
      e.preventDefault();
      postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "stats" });
      return;
    }
    if (isCasesHelpOpen()) {
      e.preventDefault();
      closeCasesHelpOverlay();
      return;
    }
    if (isVerbsHelpOpen()) {
      e.preventDefault();
      closeVerbsHelpOverlay();
      return;
    }
    if (!getEngine().currentTask || byId("quiz-shell")?.classList.contains("hidden")) return;
    e.preventDefault();
    skipCurrentWord();
  });
}
