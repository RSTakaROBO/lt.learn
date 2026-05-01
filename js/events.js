import { TRAIN_MODE } from "./config.js";
import { getCheckedCaseKeys } from "./case-selection.js";
import { els } from "./dom.js";
import { handleAnswerInputShiftCycles, insertAtCaret } from "./input-lt.js";
import {
  getCheckedPackIds,
  loadWordsFromFiles,
  resolveFilesFromPackIds,
} from "./manifest-packs.js";
import {
  advanceVocabQuiz,
  finalizeVocabChoice,
  morphQuizSkipToVocabNext,
  setQuizSkipAvailable,
  setSubmitLabel,
  showFeedback,
  showQuiz,
  skipCurrentWord,
} from "./quiz.js";
import {
  closeCasesHelp,
  closeSettingsOverlay,
  closeStatsOverlay,
  closeVerbsHelp,
  isCasesHelpOpen,
  isSettingsOverlayOpen,
  isStatsOverlayOpen,
  isVerbsHelpOpen,
  openCasesHelp,
  openSettingsOverlay,
  openStatsOverlay,
  openVerbsHelp,
} from "./overlays.js";
import { state } from "./state.js";
import {
  loadTrainMode,
  saveSelectedCases,
  saveSelectedPacks,
  saveTrainMode,
} from "./storage.js";
import { answersMatch } from "./text-utils.js";
import { applyTheme } from "./theme.js";
import { nextTask, nextVocabTask } from "./word-selection.js";
import {
  getTrainModeFromUi,
  renderWizardDots,
  showWizardCases,
  showWizardMode,
  showWizardPacks,
  syncWizardPacksNextPresentation,
  updateWizardProgress,
} from "./wizard.js";

export function bindEvents() {
  els.modePicker?.addEventListener("change", () => {
    if (!els.stepMode.classList.contains("hidden")) {
      renderWizardDots(getTrainModeFromUi() === TRAIN_MODE.VOCAB ? 2 : 3);
      updateWizardProgress(1);
    }
    if (!els.stepPacks.classList.contains("hidden")) {
      syncWizardPacksNextPresentation();
    }
  });

  els.btnModeNext.addEventListener("click", () => {
    saveTrainMode(getTrainModeFromUi());
    showWizardPacks();
  });

  els.packList.addEventListener("change", () => {
    saveSelectedPacks(getCheckedPackIds());
  });

  els.caseCheckboxes.addEventListener("change", () => {
    saveSelectedCases(getCheckedCaseKeys());
    els.caseStepStatus.textContent = "";
  });

  els.btnPacksBack.addEventListener("click", () => {
    els.packStepStatus.textContent = "";
    showWizardMode();
  });

  els.btnPacksNext.addEventListener("click", async () => {
    const ids = getCheckedPackIds();
    if (!ids.length) {
      els.packStepStatus.textContent = "Выберите хотя бы один набор.";
      return;
    }
    const files = resolveFilesFromPackIds(ids);
    if (!files.length) {
      els.packStepStatus.textContent = "В выбранных паках нет файлов со словами.";
      return;
    }
    els.packStepStatus.textContent = "Загрузка словарей…";
    try {
      await loadWordsFromFiles(files);
      saveSelectedPacks(ids);
      els.packStepStatus.textContent = "";
      els.caseStepStatus.textContent = "";
      if (loadTrainMode() === TRAIN_MODE.VOCAB) {
        const withHint = state.wordBank.filter(
          (w) => typeof w.hint_ru === "string" && w.hint_ru.trim() && w.nominative,
        );
        if (withHint.length < 4) {
          els.packStepStatus.textContent =
            "Для «Изучение слов» нужно минимум 4 слова с русской подсказкой в выбранных наборах.";
          return;
        }
        state.shownLemmaHistory = [];
        const task = nextVocabTask();
        if (!task) {
          els.packStepStatus.textContent = "Не удалось составить четыре варианта ответа.";
          return;
        }
        showQuiz(task);
        return;
      }
      showWizardCases();
    } catch (err) {
      els.packStepStatus.textContent =
        `Ошибка загрузки: ${err.message}. Откройте сайт через локальный сервер в папке проекта (fetch к файлам с file:// часто блокируется).`;
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

  els.answerInput.addEventListener("keydown", handleAnswerInputShiftCycles);

  els.btnStart.addEventListener("click", () => {
    els.caseStepStatus.textContent = "";
    const keys = getCheckedCaseKeys();
    if (!keys.length) {
      els.caseStepStatus.textContent = "Выберите хотя бы один падеж.";
      return;
    }
    if (!state.wordBank.length) {
      els.caseStepStatus.textContent = "Нет загруженных слов.";
      return;
    }
    saveSelectedCases(keys);
    state.shownLemmaHistory = [];
    const task = nextTask(keys);
    if (!task) {
      els.caseStepStatus.textContent = "Нет подходящих слов для выбранных падежей.";
      return;
    }
    els.caseStepStatus.textContent = "";
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
      els.feedback.textContent = "Слов больше нет.";
      return;
    }
    showQuiz(task);
  });

  els.vocabOptions.addEventListener("click", (e) => {
    const btn = e.target.closest(".vocab-choice");
    if (!btn || !state.currentTask || state.currentTask.mode !== TRAIN_MODE.VOCAB) return;
    if (state.answered) return;

    state.answered = true;
    const expected = state.currentTask.word.nominative;
    const ok = answersMatch(btn.getAttribute("data-lemma") || "", expected);
    finalizeVocabChoice(ok, expected, state.currentTask.word, btn);
    morphQuizSkipToVocabNext();
  });

  els.btnSkip.addEventListener("click", () => {
    if (state.currentTask?.mode === TRAIN_MODE.VOCAB && state.answered) {
      advanceVocabQuiz();
      return;
    }
    skipCurrentWord();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
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

  els.themePicker?.addEventListener("change", (ev) => {
    const input = ev.target;
    if (!(input instanceof HTMLInputElement) || input.name !== "app-theme") return;
    applyTheme(input.value);
  });

  els.btnOpenCasesHelp?.addEventListener("click", () => openCasesHelp());
  els.btnCasesHelpClose?.addEventListener("click", () => closeCasesHelp());
  els.btnOpenVerbsHelp?.addEventListener("click", () => openVerbsHelp());
  els.btnVerbsHelpClose?.addEventListener("click", () => closeVerbsHelp());

  els.btnBackSetup.addEventListener("click", () => {
    closeStatsOverlay();
    closeSettingsOverlay();
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
    showWizardMode();
    els.packStepStatus.textContent = "";
    els.caseStepStatus.textContent = "";
    state.currentTask = null;
    state.shownLemmaHistory = [];
  });
}
