import { fmt } from "./i18n/core.js";
import { STR } from "./i18n/strings-ru.js";
import { TRAIN_MODE, VOCAB_DIRECTION } from "./config.js";
import { parseCustomPackJsonFile } from "./custom-packs.js";
import { getCheckedCaseKeys } from "./case-selection.js";
import { els } from "./dom.js";
import { handleAnswerInputShiftCycles, insertAtCaret } from "./input-lt.js";
import {
  getCheckedPackIds,
  loadManifestAndRenderPacks,
  loadWordsFromFiles,
  resolveFilesFromPackIds,
} from "./manifest-packs.js";
import {
  advanceVocabQuiz,
  finalizeVocabChoice,
  morphQuizSkipToVocabNext,
  processVocabHardcoreSubmit,
  refreshCasesLemmaDisplayIfActive,
  resetVocabCorrectStreak,
  setQuizSkipAvailable,
  setSubmitLabel,
  showFeedback,
  showQuiz,
  skipCurrentWord,
} from "./quiz.js";
import {
  closeCasesHelp,
  closeHelpHub,
  closePackPromptOverlay,
  closeSettingsOverlay,
  closeStatsOverlay,
  closeVerbsHelp,
  closeVocabRoundSummaryOverlay,
  isCasesHelpOpen,
  isHelpHubOpen,
  isPackPromptOverlayOpen,
  isSettingsOverlayOpen,
  isStatsOverlayOpen,
  isVerbsHelpOpen,
  isVocabRoundSummaryOpen,
  openCasesHelp,
  openHelpHub,
  openPackPromptOverlay,
  openSettingsOverlay,
  openStatsOverlay,
  openVerbsHelp,
  syncSettingsTrainingCheckbox,
} from "./overlays.js";
import { state } from "./state.js";
import {
  appendCustomPackRecord,
  loadSelectedPacks,
  loadTrainMode,
  loadVocabDirections,
  removeCustomPackById,
  saveCasesShowTranslation,
  saveSelectedCases,
  saveSelectedPacks,
  saveTrainMode,
  saveVocabDirections,
} from "./storage.js";
import { answersMatch } from "./text-utils.js";
import { applyTheme } from "./theme.js";
import { nextTask, nextVocabTask } from "./word-selection.js";
import { hasWordRu, vocabRuUserMatches, wordRuFeedbackLine } from "./word-ru.js";
import { clearVocabRound, initVocabRound } from "./vocab-round.js";
import {
  persistVocabDirectionsFromUiIfValid,
  readVocabDirectionsFromUi,
  showWizardCases,
  showWizardMode,
  showWizardPacks,
  showWizardVocabDirection,
  syncModeChoiceButtons,
} from "./wizard.js";

export function bindEvents() {
  els.btnModeCases?.addEventListener("click", () => {
    saveTrainMode(TRAIN_MODE.CASES);
    syncModeChoiceButtons(TRAIN_MODE.CASES);
    showWizardPacks();
  });

  els.btnModeVocab?.addEventListener("click", () => {
    saveTrainMode(TRAIN_MODE.VOCAB);
    syncModeChoiceButtons(TRAIN_MODE.VOCAB);
    showWizardPacks();
  });

  els.packList.addEventListener("change", () => {
    saveSelectedPacks(getCheckedPackIds());
  });

  els.packList.addEventListener(
    "click",
    async (e) => {
      const delBtn = e.target.closest(".pack-card-delete-btn");
      if (!delBtn || !(delBtn instanceof HTMLElement)) return;
      const id = delBtn.dataset.deletePackId;
      if (!id || !id.startsWith("custom-")) return;
      e.preventDefault();
      e.stopPropagation();
      removeCustomPackById(id);
      const sel = loadSelectedPacks();
      if (sel && sel.length) saveSelectedPacks(sel.filter((x) => x !== id));
      els.packStepStatus.textContent = "";
      try {
        await loadManifestAndRenderPacks();
        els.packStepStatus.textContent = STR.events.customPackRemoved;
      } catch (err) {
        els.packStepStatus.textContent =
          err instanceof Error ? err.message : STR.events.refreshPackListFailed;
        console.error(err);
      }
    },
    true,
  );

  els.btnPackPromptHelp?.addEventListener("click", () => openPackPromptOverlay());

  els.btnPackPromptClose?.addEventListener("click", () => closePackPromptOverlay());

  els.packPromptOverlay?.addEventListener("click", (e) => {
    if (e.target === els.packPromptOverlay) closePackPromptOverlay();
  });

  els.btnPackPromptCopy?.addEventListener("click", async () => {
    const ta = els.packPromptTextarea;
    const btn = els.btnPackPromptCopy;
    if (!ta || !btn) return;
    const label = STR.clipboard.copyLabel;
    const fail = () => {
      ta.focus();
      ta.select();
      btn.textContent = STR.clipboard.selectManually;
      window.setTimeout(() => {
        btn.textContent = label;
      }, 2000);
    };
    try {
      await navigator.clipboard.writeText(ta.value);
      btn.textContent = STR.clipboard.copied;
      window.setTimeout(() => {
        btn.textContent = label;
      }, 1600);
    } catch {
      try {
        ta.select();
        document.execCommand("copy");
        btn.textContent = STR.clipboard.copied;
        window.setTimeout(() => {
          btn.textContent = label;
        }, 1600);
      } catch {
        fail();
      }
    }
  });

  els.packJsonInput?.addEventListener("change", async (ev) => {
    const input = ev.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    els.packStepStatus.textContent = "";
    try {
      const text = await file.text();
      const record = parseCustomPackJsonFile(text);
      appendCustomPackRecord(record);
      const sel = loadSelectedPacks();
      if (sel && sel.length > 0) saveSelectedPacks([...sel, record.id]);
      await loadManifestAndRenderPacks();
      els.packStepStatus.textContent = fmt(STR.events.packAdded, {
        title: record.title,
        count: record.words.length,
      });
    } catch (err) {
      els.packStepStatus.textContent = err instanceof Error ? err.message : String(err);
      console.error(err);
    }
  });

  document.getElementById("vocab-dir-ru-lt")?.addEventListener("change", () => {
    saveVocabDirections(readVocabDirectionsFromUi());
  });
  document.getElementById("vocab-dir-lt-ru")?.addEventListener("change", () => {
    saveVocabDirections(readVocabDirectionsFromUi());
  });
  document.getElementById("vocab-hardcore")?.addEventListener("change", () => {
    saveVocabDirections(readVocabDirectionsFromUi());
  });

  els.caseCheckboxes.addEventListener("change", () => {
    saveSelectedCases(getCheckedCaseKeys());
    els.caseStepStatus.textContent = "";
  });

  els.btnPacksBack.addEventListener("click", () => {
    els.packStepStatus.textContent = "";
    showWizardMode();
  });

  els.btnVocabDirectionBack?.addEventListener("click", () => {
    if (els.vocabDirectionStepStatus) els.vocabDirectionStepStatus.textContent = "";
    showWizardPacks();
  });

  els.btnVocabDirectionStart?.addEventListener("click", () => {
    if (els.vocabDirectionStepStatus) els.vocabDirectionStepStatus.textContent = "";
    if (!persistVocabDirectionsFromUiIfValid()) {
      if (els.vocabDirectionStepStatus) {
        els.vocabDirectionStepStatus.textContent = STR.events.pickVocabDir;
      }
      return;
    }
    const withHint = state.wordBank.filter((w) => hasWordRu(w) && w.nominative);
    const dirsNow = readVocabDirectionsFromUi();
    const needChoices = !dirsNow.hardcore && withHint.length < 4;
    const needAny = dirsNow.hardcore && withHint.length < 1;
    if (needChoices || needAny) {
      if (els.vocabDirectionStepStatus) {
        els.vocabDirectionStepStatus.textContent = dirsNow.hardcore
          ? STR.events.vocabNeedRuOne
          : STR.events.vocabNeedRuFour;
      }
      return;
    }
    state.shownLemmaHistory = [];
    resetVocabCorrectStreak();
    if (!initVocabRound()) {
      if (els.vocabDirectionStepStatus) {
        els.vocabDirectionStepStatus.textContent = STR.events.roundNoWords;
      }
      return;
    }
    const task = nextVocabTask();
    if (!task) {
      if (els.vocabDirectionStepStatus) {
        els.vocabDirectionStepStatus.textContent = readVocabDirectionsFromUi().hardcore
          ? STR.events.vocabStartHardcoreFail
          : STR.events.vocabStartChoicesFail;
      }
      return;
    }
    showQuiz(task);
  });

  els.btnPacksNext.addEventListener("click", async () => {
    const ids = getCheckedPackIds();
    if (!ids.length) {
      els.packStepStatus.textContent = STR.events.pickOnePack;
      return;
    }
    const files = resolveFilesFromPackIds(ids);
    if (!files.length) {
      els.packStepStatus.textContent = STR.events.packsNoWordFiles;
      return;
    }
    els.packStepStatus.textContent = STR.events.loadingDictionaries;
    try {
      await loadWordsFromFiles(files);
      saveSelectedPacks(ids);
      els.packStepStatus.textContent = "";
      els.caseStepStatus.textContent = "";
      if (loadTrainMode() === TRAIN_MODE.VOCAB) {
        const withHint = state.wordBank.filter((w) => hasWordRu(w) && w.nominative);
        const hardcore = !!loadVocabDirections()?.hardcore;
        if ((!hardcore && withHint.length < 4) || (hardcore && withHint.length < 1)) {
          els.packStepStatus.textContent = hardcore
            ? STR.events.vocabAfterPackHardcore
            : STR.events.vocabAfterPackFour;
          return;
        }
        showWizardVocabDirection();
        return;
      }
      showWizardCases();
    } catch (err) {
      els.packStepStatus.textContent = fmt(STR.events.loadFailed, {
        message: err instanceof Error ? err.message : String(err),
      });
      console.error(err);
    }
  });

  els.btnCasesBack.addEventListener("click", () => {
    els.caseStepStatus.textContent = "";
    showWizardPacks();
  });

  els.ltCharsBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".lt-char");
    if (!btn || !els.answerInput) return;
    const ch = btn.getAttribute("data-char");
    if (!ch) return;
    insertAtCaret(els.answerInput, ch);
  });

  document.getElementById("vocab-lt-chars")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".lt-char");
    const input = document.getElementById("vocab-answer-input");
    if (!btn || !input) return;
    const ch = btn.getAttribute("data-char");
    if (!ch) return;
    insertAtCaret(input, ch);
  });

  els.answerInput.addEventListener("keydown", handleAnswerInputShiftCycles);

  document.getElementById("vocab-answer-input")?.addEventListener("keydown", handleAnswerInputShiftCycles);

  document.getElementById("vocab-answer-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    processVocabHardcoreSubmit();
  });

  els.btnStart.addEventListener("click", () => {
    els.caseStepStatus.textContent = "";
    const keys = getCheckedCaseKeys();
    if (!keys.length) {
      els.caseStepStatus.textContent = STR.events.pickOneCase;
      return;
    }
    if (!state.wordBank.length) {
      els.caseStepStatus.textContent = STR.events.noWordsLoaded;
      return;
    }
    saveSelectedCases(keys);
    clearVocabRound();
    state.shownLemmaHistory = [];
    const task = nextTask(keys);
    if (!task) {
      els.caseStepStatus.textContent = STR.events.noMatchingWords;
      return;
    }
    els.caseStepStatus.textContent = "";
    resetVocabCorrectStreak();
    showQuiz(task);
  });

  els.answerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!state.currentTask) return;
    if (state.currentTask.mode === TRAIN_MODE.VOCAB) return;

    const keys = getCheckedCaseKeys();
    const expected = state.currentTask.word[state.currentTask.targetCase];
    const user = els.answerInput.value;

    if (!state.answered) {
      const ok = answersMatch(user, expected);
      state.answered = true;
      setSubmitLabel(true);
      setQuizSkipAvailable(false);
      showFeedback(ok, expected, state.currentTask.word);
      return;
    }

    const task = nextTask(keys);
    if (!task) {
      els.feedback.classList.remove("hidden", "ok", "bad");
      els.feedback.textContent = STR.quiz.noWordsLeft;
      return;
    }
    showQuiz(task);
  });

  els.vocabOptions.addEventListener("click", (e) => {
    const btn = e.target.closest(".vocab-choice");
    if (!btn || !state.currentTask || state.currentTask.mode !== TRAIN_MODE.VOCAB) return;

    if (state.answered) {
      const word = state.currentTask.word;
      const dir = state.currentTask.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
      const lem = btn.getAttribute("data-lemma") || "";
      const matches =
        dir === VOCAB_DIRECTION.LT_TO_RU ? vocabRuUserMatches(word, lem) : answersMatch(lem, (word?.nominative || "").trim());
      if (btn.classList.contains("vocab-choice--correct") && matches) {
        advanceVocabQuiz();
      }
      return;
    }

    state.answered = true;
    const dir = state.currentTask.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
    const word = state.currentTask.word;
    const lem = btn.getAttribute("data-lemma") || "";
    const ok =
      dir === VOCAB_DIRECTION.LT_TO_RU
        ? vocabRuUserMatches(word, lem)
        : answersMatch(lem, (word?.nominative || "").trim());
    const expected =
      dir === VOCAB_DIRECTION.LT_TO_RU ? wordRuFeedbackLine(word) : (word?.nominative || "").trim();
    finalizeVocabChoice(ok, expected, state.currentTask.word, btn);
    morphQuizSkipToVocabNext();
  });

  els.btnSkip.addEventListener("click", () => {
    if (state.currentTask?.mode === TRAIN_MODE.VOCAB && state.answered) {
      if (state.currentTask.vocabHardcore) return;
      advanceVocabQuiz();
      return;
    }
    skipCurrentWord();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (isPackPromptOverlayOpen()) {
      e.preventDefault();
      closePackPromptOverlay();
      return;
    }
    if (isVocabRoundSummaryOpen()) {
      e.preventDefault();
      closeVocabRoundSummaryOverlay();
      clearVocabRound();
      els.quizShell.classList.add("hidden");
      els.setup.classList.remove("hidden");
      resetVocabCorrectStreak();
      showWizardMode();
      els.packStepStatus.textContent = "";
      els.caseStepStatus.textContent = "";
      if (els.vocabDirectionStepStatus) els.vocabDirectionStepStatus.textContent = "";
      state.currentTask = null;
      state.shownLemmaHistory = [];
      return;
    }
    if (isHelpHubOpen()) {
      e.preventDefault();
      closeHelpHub();
      return;
    }
    if (isSettingsOverlayOpen()) {
      e.preventDefault();
      closeSettingsOverlay();
      return;
    }
    if (isStatsOverlayOpen()) {
      e.preventDefault();
      closeStatsOverlay();
      return;
    }
    if (isCasesHelpOpen()) {
      e.preventDefault();
      closeCasesHelp();
      return;
    }
    if (isVerbsHelpOpen()) {
      e.preventDefault();
      closeVerbsHelp();
      return;
    }
    if (!state.currentTask || els.quizShell.classList.contains("hidden")) return;
    e.preventDefault();
    skipCurrentWord();
  });

  els.btnStats.addEventListener("click", () => openStatsOverlay());
  els.btnStatsClose.addEventListener("click", () => closeStatsOverlay());
  els.statsOverlay.addEventListener("click", (e) => {
    if (e.target === els.statsOverlay) closeStatsOverlay();
  });

  els.btnSettings?.addEventListener("click", () => openSettingsOverlay());
  els.btnSettingsClose?.addEventListener("click", () => closeSettingsOverlay());
  els.settingsOverlay?.addEventListener("click", (e) => {
    if (e.target === els.settingsOverlay) closeSettingsOverlay();
  });

  els.btnHelpHub?.addEventListener("click", () => openHelpHub());
  els.helpHubOverlay?.addEventListener("click", (e) => {
    if (e.target === els.helpHubOverlay) closeHelpHub();
  });
  els.btnHelpHubClose?.addEventListener("click", () => closeHelpHub());
  els.btnHelpHubCases?.addEventListener("click", () => openCasesHelp());
  els.btnHelpHubVerbs?.addEventListener("click", () => openVerbsHelp());

  els.themePicker?.addEventListener("change", (ev) => {
    const input = ev.target;
    if (!(input instanceof HTMLInputElement) || input.name !== "app-theme") return;
    applyTheme(input.value);
  });

  els.settingsCasesShowTranslation?.addEventListener("change", () => {
    saveCasesShowTranslation(!!els.settingsCasesShowTranslation?.checked);
    refreshCasesLemmaDisplayIfActive();
  });

  els.btnCasesHelpClose?.addEventListener("click", () => closeCasesHelp());
  els.btnVerbsHelpClose?.addEventListener("click", () => closeVerbsHelp());

  els.btnBackSetup.addEventListener("click", () => {
    closeStatsOverlay();
    closeSettingsOverlay();
    closePackPromptOverlay();
    closeHelpHub();
    closeVocabRoundSummaryOverlay();
    clearVocabRound();
    if (isCasesHelpOpen()) {
      closeCasesHelp();
      return;
    }
    if (isVerbsHelpOpen()) {
      closeVerbsHelp();
      return;
    }
    els.quizShell.classList.add("hidden");
    els.setup.classList.remove("hidden");
    resetVocabCorrectStreak();
    showWizardMode();
    els.packStepStatus.textContent = "";
    els.caseStepStatus.textContent = "";
    if (els.vocabDirectionStepStatus) els.vocabDirectionStepStatus.textContent = "";
    state.currentTask = null;
    state.shownLemmaHistory = [];
  });

  document.getElementById("btn-vocab-round-summary-ok")?.addEventListener("click", () => {
    closeVocabRoundSummaryOverlay();
    clearVocabRound();
    els.quizShell.classList.add("hidden");
    els.setup.classList.remove("hidden");
    resetVocabCorrectStreak();
    showWizardMode();
    els.packStepStatus.textContent = "";
    els.caseStepStatus.textContent = "";
    if (els.vocabDirectionStepStatus) els.vocabDirectionStepStatus.textContent = "";
    state.currentTask = null;
    state.shownLemmaHistory = [];
  });

  document.getElementById("btn-vocab-round-summary-repeat")?.addEventListener("click", () => {
    closeVocabRoundSummaryOverlay();
    state.shownLemmaHistory = [];
    resetVocabCorrectStreak();
    if (!initVocabRound()) {
      clearVocabRound();
      els.quizShell.classList.add("hidden");
      els.setup.classList.remove("hidden");
      showWizardVocabDirection();
      if (els.vocabDirectionStepStatus) {
        els.vocabDirectionStepStatus.textContent = STR.events.roundNoWords;
      }
      return;
    }
    const task = nextVocabTask();
    if (!task) {
      clearVocabRound();
      els.quizShell.classList.add("hidden");
      els.setup.classList.remove("hidden");
      showWizardVocabDirection();
      if (els.vocabDirectionStepStatus) {
        els.vocabDirectionStepStatus.textContent = readVocabDirectionsFromUi().hardcore
          ? STR.events.roundRepeatFail
          : STR.events.roundRepeatChoices;
      }
      return;
    }
    showQuiz(task);
  });

  document.getElementById("vocab-round-summary-overlay")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("vocab-round-summary-overlay")) {
      document.getElementById("btn-vocab-round-summary-ok")?.click();
    }
  });
}
