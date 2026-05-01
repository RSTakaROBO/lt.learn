import { TRAIN_MODE, VOCAB_DIRECTION } from "./config.js";
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
  syncSettingsTrainingCheckbox,
} from "./overlays.js";
import { state } from "./state.js";
import {
  loadTrainMode,
  loadVocabDirections,
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
        els.vocabDirectionStepStatus.textContent = "Выберите хотя бы одно направление перевода.";
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
          ? "Нужно хотя бы одно слово с русским переводом в выбранных наборах."
          : "Для «Изучение слов» нужно минимум 4 слова с русским переводом в выбранных наборах.";
      }
      return;
    }
    state.shownLemmaHistory = [];
    resetVocabCorrectStreak();
    const task = nextVocabTask();
    if (!task) {
      if (els.vocabDirectionStepStatus) {
        els.vocabDirectionStepStatus.textContent = readVocabDirectionsFromUi().hardcore
          ? "Не удалось начать игру. Проверьте наборы слов."
          : "Не удалось составить четыре варианта ответа.";
      }
      return;
    }
    showQuiz(task);
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
        const withHint = state.wordBank.filter((w) => hasWordRu(w) && w.nominative);
        const hardcore = loadVocabDirections().hardcore;
        if ((!hardcore && withHint.length < 4) || (hardcore && withHint.length < 1)) {
          els.packStepStatus.textContent = hardcore
            ? "Для «Изучение слов» нужно хотя бы одно слово с русским переводом в выбранных наборах."
            : "Для «Изучение слов» нужно минимум 4 слова с русским переводом в выбранных наборах.";
          return;
        }
        showWizardVocabDirection();
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
      els.feedback.textContent = "Слов больше нет.";
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

  els.settingsCasesShowTranslation?.addEventListener("change", () => {
    saveCasesShowTranslation(!!els.settingsCasesShowTranslation?.checked);
    refreshCasesLemmaDisplayIfActive();
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
    resetVocabCorrectStreak();
    showWizardMode();
    els.packStepStatus.textContent = "";
    els.caseStepStatus.textContent = "";
    if (els.vocabDirectionStepStatus) els.vocabDirectionStepStatus.textContent = "";
    state.currentTask = null;
    state.shownLemmaHistory = [];
  });
}
