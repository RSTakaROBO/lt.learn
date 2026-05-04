import { CASE_ORDER, TRAIN_MODE, VOCAB_DIRECTION } from "./config.js";
import { caseRu } from "./i18n/core.js";
import { STR } from "./i18n/strings-ru.js";
import { getCheckedCaseKeys } from "./case-selection.js";
import { els, refreshQuizElements } from "./dom.js";
import { state } from "./state.js";
import { bumpWordStat, loadCasesShowTranslation, saveVocabBestStreakIfHigher } from "./storage.js";
import { answersMatch, escapeHtml } from "./text-utils.js";
import { lemmaKey, nextTask, nextVocabTask } from "./word-selection.js";
import { vocabRuUserMatches, wordRuFeedbackLine, wordRuPrimary } from "./word-ru.js";
import {
  applyVocabRoundAnswer,
  applyVocabRoundSkip,
  roundLemmaKey,
  syncVocabRoundLemmaDots,
  syncVocabRoundProgress,
} from "./vocab-round.js";
import { openVocabRoundSummaryOverlay } from "./overlays.js";

const VOCAB_STREAK_MULT_FROM = 5;

/** Уровни по порогам 10 / 20 / 50 / 70 / 100: серый → синий → зелёный → жёлтый → красный (+ крупнее шрифт). */
const STREAK_MULT_TIER_CLASSES = [
  "vocab-streak-mult--t0",
  "vocab-streak-mult--t1",
  "vocab-streak-mult--t2",
  "vocab-streak-mult--t3",
  "vocab-streak-mult--t4",
  "vocab-streak-mult--t5",
];

function casesLemmaDisplayLine(word) {
  const nom = word?.nominative ?? "";
  const hint =
    loadCasesShowTranslation() === true && wordRuPrimary(word)
      ? ` (${wordRuPrimary(word)})`
      : "";
  return `${nom}${hint}`;
}

function streakTierClass(n) {
  if (n >= 100) return "vocab-streak-mult--t5";
  if (n >= 70) return "vocab-streak-mult--t4";
  if (n >= 50) return "vocab-streak-mult--t3";
  if (n >= 20) return "vocab-streak-mult--t2";
  if (n >= 10) return "vocab-streak-mult--t1";
  return "vocab-streak-mult--t0";
}

function pulseVocabStreakMult(wrap) {
  if (!wrap || wrap.classList.contains("hidden")) return;
  const valEl = wrap.querySelector(".vocab-streak-mult-value");
  wrap.classList.remove("vocab-streak-mult--pulse");
  void wrap.offsetWidth;
  const onEnd = () => {
    valEl?.removeEventListener("animationend", onEnd);
    wrap.classList.remove("vocab-streak-mult--pulse");
  };
  valEl?.addEventListener("animationend", onEnd);
  wrap.classList.add("vocab-streak-mult--pulse");
}

/** Обновить множитель в карточке слова; при pulse — короткая анимация (новый верный ответ при уже видимом ×N). */
function syncVocabStreakMult(opts = {}) {
  const wrap = document.getElementById("vocab-streak-mult");
  const valEl = document.getElementById("vocab-streak-mult-value");
  if (!wrap || !valEl) return;
  const n = state.vocabCorrectStreak;
  STREAK_MULT_TIER_CLASSES.forEach((c) => wrap.classList.remove(c));
  wrap.classList.remove("vocab-streak-mult--pulse");
  if (n < VOCAB_STREAK_MULT_FROM) {
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
    valEl.textContent = "";
    return;
  }
  valEl.textContent = `×${n}`;
  wrap.classList.add(streakTierClass(n));
  wrap.classList.remove("hidden");
  wrap.setAttribute("aria-hidden", "false");
  if (opts.pulse) pulseVocabStreakMult(wrap);
}

/** Сброс серии слов и скрытие множителя (пропуск, меню, новая сессия). */
export function resetVocabCorrectStreak() {
  state.vocabCorrectStreak = 0;
  const wrap = document.getElementById("vocab-streak-mult");
  const valEl = document.getElementById("vocab-streak-mult-value");
  wrap?.classList.add("hidden");
  wrap?.classList.remove("vocab-streak-mult--pulse");
  STREAK_MULT_TIER_CLASSES.forEach((c) => wrap?.classList.remove(c));
  wrap?.setAttribute("aria-hidden", "true");
  if (valEl) valEl.textContent = "";
}

export function inferQuizMode(task) {
  if (!task?.word) return TRAIN_MODE.CASES;
  if (task.mode === TRAIN_MODE.VOCAB) return TRAIN_MODE.VOCAB;
  if (task.mode === TRAIN_MODE.CASES) return TRAIN_MODE.CASES;
  if (task.vocabHardcore) return TRAIN_MODE.VOCAB;
  if (Array.isArray(task.choices) && task.choices.length >= 4) return TRAIN_MODE.VOCAB;
  return TRAIN_MODE.CASES;
}

export function setSubmitLabel(answeredFlag) {
  if (els.btnSubmit) els.btnSubmit.textContent = answeredFlag ? STR.quiz.next : STR.quiz.check;
}

export function setQuizSkipAvailable(canSkip) {
  if (els.btnSkip) els.btnSkip.disabled = !canSkip;
}

export function resetQuizSkipButtonAppearance() {
  if (!els.btnSkip) return;
  els.btnSkip.textContent = STR.quiz.skip;
  els.btnSkip.classList.remove("primary", "start");
  els.btnSkip.classList.add("ghost");
  els.btnSkip.setAttribute("aria-label", STR.quiz.skip);
}

export function morphQuizSkipToVocabNext() {
  if (!els.btnSkip) return;
  els.btnSkip.textContent = STR.quiz.next;
  els.btnSkip.disabled = false;
  els.btnSkip.classList.remove("ghost");
  els.btnSkip.classList.add("primary");
  els.btnSkip.setAttribute("aria-label", STR.quiz.next);
}

export function renderVocabChoices(choices) {
  if (!els.vocabOptions) return;
  els.vocabOptions.innerHTML = "";
  const list = Array.isArray(choices) ? choices : [];
  for (const lem of list) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn ghost vocab-choice";
    btn.setAttribute("data-lemma", lem);
    btn.textContent = lem;
    btn.setAttribute("aria-label", lem);
    els.vocabOptions.appendChild(btn);
  }
}

function syncQuizCardLayoutMode(mode, vocabHardcore = false) {
  const qp = document.getElementById("quiz");
  if (!qp) return;
  qp.classList.remove("quiz--cases", "quiz--vocab", "quiz--vocab-hardcore");
  if (mode === "cases") qp.classList.add("quiz--cases");
  if (mode === "vocab") {
    qp.classList.add("quiz--vocab");
    if (vocabHardcore) qp.classList.add("quiz--vocab-hardcore");
  }
}

/** @returns {boolean} false только если режим «слова» запрошен, а разметки vocab в DOM нет */
export function setQuizUiPhase(phase, opts = {}) {
  refreshQuizElements();

  const casesEl = els.quizCasesUi;
  const vocabEl = els.quizVocabUi;
  const sub = els.btnQuizSubmitCases;
  const foot = els.quizFooterActions;

  if (!casesEl || !sub || !foot) return false;

  if (phase === "cases") {
    syncQuizCardLayoutMode("cases");
    foot.classList.remove("hidden");
    vocabEl?.classList.add("hidden");
    casesEl.classList.remove("hidden");
    sub.hidden = false;
    sub.classList.remove("hidden");
    foot.classList.remove("quiz-footer--single");
    sub.setAttribute("form", "answer-form");
    return true;
  }

  if (phase === "vocab-pending") {
    const vocabHardcore = !!opts.vocabHardcore;
    if (!vocabEl || !els.vocabOptions) {
      syncQuizCardLayoutMode(null);
      casesEl.classList.add("hidden");
      vocabEl?.classList.add("hidden");
      sub.hidden = true;
      sub.classList.add("hidden");
      foot.classList.add("hidden");
      foot.classList.remove("quiz-footer--single");
      if (els.feedback) {
        els.feedback.classList.remove("hidden", "ok", "bad");
        els.feedback.textContent = STR.quiz.noVocabUi;
      }
      return false;
    }
    syncQuizCardLayoutMode("vocab", vocabHardcore);
    foot.classList.remove("hidden");
    vocabEl.classList.remove("hidden");
    casesEl.classList.add("hidden");
    if (vocabHardcore) {
      foot.classList.remove("quiz-footer--single");
      sub.hidden = false;
      sub.classList.remove("hidden");
      sub.setAttribute("form", "vocab-answer-form");
    } else {
      sub.hidden = true;
      sub.classList.add("hidden");
      foot.classList.add("quiz-footer--single");
      sub.setAttribute("form", "answer-form");
    }
    return true;
  }

  return true;
}

export function showQuiz(task) {
  refreshQuizElements();
  task.mode = inferQuizMode(task);

  state.currentTask = task;
  const histKey = roundLemmaKey(task.word) || String(lemmaKey(task.word) ?? "").trim();
  if (histKey) state.shownLemmaHistory.push(histKey);
  state.answered = false;
  resetQuizSkipButtonAppearance();
  setQuizSkipAvailable(true);
  els.setup.classList.add("hidden");
  els.quizShell.classList.remove("hidden");
  els.feedback.classList.add("hidden");
  els.feedback.textContent = "";
  els.feedback.classList.remove("ok", "bad");

  if (task.mode === TRAIN_MODE.VOCAB) {
    setSubmitLabel(false);
    const hardcore = !!task.vocabHardcore;
    if (!setQuizUiPhase("vocab-pending", { vocabHardcore: hardcore })) {
      syncVocabRoundLemmaDots(null);
      syncVocabRoundProgress();
      return;
    }

    const vocabForm = document.getElementById("vocab-answer-form");
    const vocabInput = document.getElementById("vocab-answer-input");

    if (!hardcore && (!Array.isArray(task.choices) || task.choices.length < 4)) {
      resetVocabCorrectStreak();
      renderVocabChoices([]);
      vocabForm?.classList.add("hidden");
      els.vocabOptions?.classList.remove("hidden");
      els.feedback.classList.remove("hidden", "ok", "bad");
      els.feedback.textContent = STR.quiz.noVocabChoices;
      syncVocabRoundLemmaDots(null);
      syncVocabRoundProgress();
      return;
    }

    if (hardcore) {
      vocabForm?.classList.remove("hidden");
      els.vocabOptions?.classList.add("hidden");
      renderVocabChoices([]);
      if (vocabInput) {
        vocabInput.value = "";
        vocabInput.focus();
      }
    } else {
      vocabForm?.classList.add("hidden");
      els.vocabOptions?.classList.remove("hidden");
    }

    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
    if (els.vocabRuDisplay) {
      if (dir === VOCAB_DIRECTION.LT_TO_RU) {
        els.vocabRuDisplay.textContent = (task.word.nominative || "").trim();
        els.vocabRuDisplay.setAttribute("lang", "lt");
      } else {
        els.vocabRuDisplay.textContent = wordRuPrimary(task.word);
        els.vocabRuDisplay.setAttribute("lang", "ru");
      }
    }
    if (els.vocabOptions) {
      els.vocabOptions.setAttribute(
        "aria-label",
        dir === VOCAB_DIRECTION.LT_TO_RU ? STR.quiz.vocabLtToRuAria : STR.quiz.vocabRuToLtAria,
      );
    }
    if (!hardcore) {
      renderVocabChoices(task.choices);
    }
    syncVocabStreakMult();
    syncVocabRoundLemmaDots(task.word);
    syncVocabRoundProgress();
    return;
  }

  setQuizUiPhase("cases");
  setSubmitLabel(false);
  els.lemmaDisplay.textContent = casesLemmaDisplayLine(task.word);

  const meta = CASE_ORDER.find((c) => c.key === task.targetCase);
  els.targetCaseDisplay.textContent = meta ? caseRu(meta.key) : task.targetCase;

  els.answerInput.value = "";
  els.answerInput.focus();
  syncVocabRoundLemmaDots(null);
  syncVocabRoundProgress();
}

function exceptionHintHtml(word) {
  const note =
    typeof word?.exception_note_ru === "string" && word.exception_note_ru.trim()
      ? word.exception_note_ru.trim()
      : "";
  if (!note) return "";
  return `<p class="exception-hint"><strong>${escapeHtml(STR.quiz.exceptionStrong)}</strong> ${escapeHtml(note)}</p>`;
}

function recordQuizOutcome(word, ok) {
  bumpWordStat(lemmaKey(word), ok ? "correct" : "wrong");
}

export function showFeedback(ok, expected, word) {
  recordQuizOutcome(word, ok);
  els.feedback.classList.remove("hidden", "ok", "bad");
  if (ok) {
    els.feedback.classList.add("ok");
    const exc = exceptionHintHtml(word);
    els.feedback.innerHTML = exc ? `<p>${escapeHtml(STR.quiz.correct)}</p>${exc}` : `<p>${escapeHtml(STR.quiz.correct)}</p>`;
  } else {
    els.feedback.classList.add("bad");
    const exc = exceptionHintHtml(word);
    els.feedback.innerHTML = `<p>${escapeHtml(STR.quiz.wrong)}</p><p class="correct-form">${escapeHtml(STR.quiz.correctIs)} <strong>${escapeHtml(expected)}</strong></p>${exc}`;
  }
}

/** Режим «слова»: только подсветка кнопок; подсказки про исключения не показываем. */
export function finalizeVocabChoice(ok, expected, word, clickedBtn) {
  recordQuizOutcome(word, ok);
  if (ok) {
    state.vocabCorrectStreak += 1;
    saveVocabBestStreakIfHigher(state.vocabCorrectStreak);
    syncVocabStreakMult({
      pulse: state.vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM,
    });
  } else {
    if (state.vocabRound) {
      state.vocabRound.maxStreak = Math.max(state.vocabRound.maxStreak, state.vocabCorrectStreak);
    }
    state.vocabCorrectStreak = 0;
    syncVocabStreakMult();
  }
  applyVocabRoundAnswer(word, ok);
  els.feedback.classList.remove("ok", "bad");
  els.feedback.classList.add("hidden");
  els.feedback.textContent = "";
  if (!els.vocabOptions) return;
  const dir = state.currentTask?.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
  const correctNom =
    typeof word?.nominative === "string" && word.nominative.trim()
      ? word.nominative.trim()
      : expected;
  const clickedLemma = clickedBtn?.getAttribute("data-lemma") ?? "";
  els.vocabOptions.querySelectorAll(".vocab-choice").forEach((b) => {
    const lem = b.getAttribute("data-lemma") || "";
    const isExpected =
      dir === VOCAB_DIRECTION.LT_TO_RU ? vocabRuUserMatches(word, lem) : answersMatch(lem, correctNom);
    b.classList.remove("vocab-choice--wrong", "vocab-choice--picked");
    if (isExpected) {
      b.disabled = false;
      b.classList.remove("ghost");
      b.classList.add("vocab-choice--correct");
    } else {
      b.disabled = true;
      b.classList.remove("vocab-choice--correct");
    }
  });
  if (
    !ok &&
    clickedLemma &&
    (dir === VOCAB_DIRECTION.LT_TO_RU
      ? !vocabRuUserMatches(word, clickedLemma)
      : !answersMatch(clickedLemma, correctNom))
  ) {
    const wrongBtn =
      clickedBtn?.closest?.(".vocab-choice") ||
      [...els.vocabOptions.querySelectorAll(".vocab-choice")].find((b) =>
        answersMatch(b.getAttribute("data-lemma") || "", clickedLemma),
      );
    wrongBtn?.classList.remove("ghost");
    wrongBtn?.classList.add("vocab-choice--wrong");
    if (wrongBtn) wrongBtn.disabled = true;
  }

  const picked = clickedBtn?.closest?.(".vocab-choice");
  picked?.classList.add("vocab-choice--picked");
}

/** Хардкор-слова: первая отправка формы — проверка; вторая — следующее слово. */
export function processVocabHardcoreSubmit() {
  if (!state.currentTask?.vocabHardcore || state.currentTask.mode !== TRAIN_MODE.VOCAB) return;
  const vocabInput = document.getElementById("vocab-answer-input");
  if (!vocabInput) return;

  if (!state.answered) {
    const dir = state.currentTask.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
    const word = state.currentTask.word;
    let expected;
    let ok;
    if (dir === VOCAB_DIRECTION.LT_TO_RU) {
      expected = wordRuFeedbackLine(word);
      ok = vocabRuUserMatches(word, vocabInput.value);
    } else {
      expected = (word?.nominative || "").trim();
      ok = answersMatch(vocabInput.value, expected);
    }
    state.answered = true;
    setSubmitLabel(true);
    setQuizSkipAvailable(false);
    if (ok) {
      state.vocabCorrectStreak += 1;
      saveVocabBestStreakIfHigher(state.vocabCorrectStreak);
    } else {
      if (state.vocabRound) {
        state.vocabRound.maxStreak = Math.max(state.vocabRound.maxStreak, state.vocabCorrectStreak);
      }
      state.vocabCorrectStreak = 0;
    }
    showFeedback(ok, expected, word);
    syncVocabStreakMult({
      pulse: ok && state.vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM,
    });
    applyVocabRoundAnswer(word, ok);
    return;
  }

  advanceVocabQuiz();
}

export function advanceVocabQuiz() {
  if (!state.currentTask || state.currentTask.mode !== TRAIN_MODE.VOCAB || !state.answered) return;
  const task = nextVocabTask();
  if (!task) {
    resetVocabCorrectStreak();
    if (state.vocabRound && state.vocabRound.pool.size === 0) {
      openVocabRoundSummaryOverlay();
      return;
    }
    els.feedback.classList.remove("hidden", "ok", "bad");
    els.feedback.textContent = STR.quiz.noWordsLeft;
    return;
  }
  showQuiz(task);
}

/** После переключения настройки перевода в модалке настроек — обновить подпись на активном экране падежей. */
export function refreshCasesLemmaDisplayIfActive() {
  if (
    !state.currentTask ||
    state.currentTask.mode !== TRAIN_MODE.CASES ||
    els.quizShell?.classList.contains("hidden") ||
    !els.lemmaDisplay
  ) {
    return;
  }
  els.lemmaDisplay.textContent = casesLemmaDisplayLine(state.currentTask.word);
}

export function skipCurrentWord() {
  if (!state.currentTask || state.answered) return;
  bumpWordStat(lemmaKey(state.currentTask.word), "skipped");
  if (state.currentTask.mode === TRAIN_MODE.VOCAB) {
    applyVocabRoundSkip(state.currentTask.word);
    resetVocabCorrectStreak();
    const task = nextVocabTask();
    if (!task) {
      if (state.vocabRound && state.vocabRound.pool.size === 0) {
        openVocabRoundSummaryOverlay();
      }
      return;
    }
    showQuiz(task);
    return;
  }
  const keys = getCheckedCaseKeys();
  const task = nextTask(keys);
  if (!task) return;
  showQuiz(task);
}
