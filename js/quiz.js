import { CASE_ORDER, TRAIN_MODE, VOCAB_DIRECTION } from "./config.js";
import { caseRu } from "./i18n/core.js";
import { STR } from "./i18n/strings-ru.js";
import { getCheckedCaseKeys, getEngine, mutateEngine } from "./trainer-ui-state.js";
import { byId } from "./dom-ids.js";
import { bumpWordStat, loadCasesShowTranslation, saveVocabBestStreakIfHigher } from "./storage.js";
import { answersMatch, escapeHtml } from "./text-utils.js";
import { handleAnswerInputShiftCycles, insertAtCaret } from "./input-lt.js";
import { lemmaKey, nextTask, nextVocabTask } from "./word-selection.js";
import { vocabRuUserMatches, wordRuFeedbackLine, wordRuPrimary } from "./word-ru.js";
import {
  applyVocabRoundAnswer,
  applyVocabRoundSkip,
  openVocabRoundSummaryOverlay,
  roundLemmaKey,
  syncVocabRoundLemmaDots,
  syncVocabRoundProgress,
} from "./vocab-round.js";

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
  const n = getEngine().vocabCorrectStreak;
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
  mutateEngine((e) => {
    e.vocabCorrectStreak = 0;
  });
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
  const el = byId("btn-quiz-submit-cases");
  if (el) el.textContent = answeredFlag ? STR.quiz.next : STR.quiz.check;
}

export function setQuizSkipAvailable(canSkip) {
  if (byId("btn-skip")) byId("btn-skip").disabled = !canSkip;
}

export function resetQuizSkipButtonAppearance() {
  if (!byId("btn-skip")) return;
  byId("btn-skip").textContent = STR.quiz.skip;
  byId("btn-skip").classList.remove("primary", "start");
  byId("btn-skip").classList.add("ghost");
  byId("btn-skip").setAttribute("aria-label", STR.quiz.skip);
}

export function morphQuizSkipToVocabNext() {
  if (!byId("btn-skip")) return;
  byId("btn-skip").textContent = STR.quiz.next;
  byId("btn-skip").disabled = false;
  byId("btn-skip").classList.remove("ghost");
  byId("btn-skip").classList.add("primary");
  byId("btn-skip").setAttribute("aria-label", STR.quiz.next);
}

export function renderVocabChoices(choices) {
  if (!byId("vocab-options")) return;
  byId("vocab-options").innerHTML = "";
  const list = Array.isArray(choices) ? choices : [];
  for (const lem of list) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn ghost vocab-choice";
    btn.setAttribute("data-lemma", lem);
    btn.textContent = lem;
    btn.setAttribute("aria-label", lem);
    byId("vocab-options").appendChild(btn);
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
  const casesEl = byId("quiz-cases-ui");
  const vocabEl = byId("quiz-vocab-ui");
  const sub = byId("btn-quiz-submit-cases");
  const foot = byId("quiz-footer-actions");

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
    if (!vocabEl || !byId("vocab-options")) {
      syncQuizCardLayoutMode(null);
      casesEl.classList.add("hidden");
      vocabEl?.classList.add("hidden");
      sub.hidden = true;
      sub.classList.add("hidden");
      foot.classList.add("hidden");
      foot.classList.remove("quiz-footer--single");
      if (byId("feedback")) {
        byId("feedback").classList.remove("hidden", "ok", "bad");
        byId("feedback").textContent = STR.quiz.noVocabUi;
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
  task.mode = inferQuizMode(task);

  const histKey = roundLemmaKey(task.word) || String(lemmaKey(task.word) ?? "").trim();
  mutateEngine((e) => {
    e.currentTask = task;
    if (histKey) e.shownLemmaHistory.push(histKey);
    e.answered = false;
  });
  resetQuizSkipButtonAppearance();
  setQuizSkipAvailable(true);
  byId("setup-shell").classList.add("hidden");
  byId("quiz-shell").classList.remove("hidden");
  byId("feedback").classList.add("hidden");
  byId("feedback").textContent = "";
  byId("feedback").classList.remove("ok", "bad");

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
      byId("vocab-options")?.classList.remove("hidden");
      byId("feedback").classList.remove("hidden", "ok", "bad");
      byId("feedback").textContent = STR.quiz.noVocabChoices;
      syncVocabRoundLemmaDots(null);
      syncVocabRoundProgress();
      return;
    }

    if (hardcore) {
      vocabForm?.classList.remove("hidden");
      byId("vocab-options")?.classList.add("hidden");
      renderVocabChoices([]);
      if (vocabInput) {
        vocabInput.value = "";
        vocabInput.focus();
      }
    } else {
      vocabForm?.classList.add("hidden");
      byId("vocab-options")?.classList.remove("hidden");
    }

    const dir = task.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
    if (byId("vocab-ru-display")) {
      if (dir === VOCAB_DIRECTION.LT_TO_RU) {
        byId("vocab-ru-display").textContent = (task.word.nominative || "").trim();
        byId("vocab-ru-display").setAttribute("lang", "lt");
      } else {
        byId("vocab-ru-display").textContent = wordRuPrimary(task.word);
        byId("vocab-ru-display").setAttribute("lang", "ru");
      }
    }
    if (byId("vocab-options")) {
      byId("vocab-options").setAttribute(
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
  byId("lemma-display").textContent = casesLemmaDisplayLine(task.word);

  const meta = CASE_ORDER.find((c) => c.key === task.targetCase);
  byId("target-case-display").textContent = meta ? caseRu(meta.key) : task.targetCase;

  byId("answer-input").value = "";
  byId("answer-input").focus();
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
  byId("feedback").classList.remove("hidden", "ok", "bad");
  if (ok) {
    byId("feedback").classList.add("ok");
    const exc = exceptionHintHtml(word);
    byId("feedback").innerHTML = exc ? `<p>${escapeHtml(STR.quiz.correct)}</p>${exc}` : `<p>${escapeHtml(STR.quiz.correct)}</p>`;
  } else {
    byId("feedback").classList.add("bad");
    const exc = exceptionHintHtml(word);
    byId("feedback").innerHTML = `<p>${escapeHtml(STR.quiz.wrong)}</p><p class="correct-form">${escapeHtml(STR.quiz.correctIs)} <strong>${escapeHtml(expected)}</strong></p>${exc}`;
  }
}

/** Режим «слова»: только подсветка кнопок; подсказки про исключения не показываем. */
export function finalizeVocabChoice(ok, expected, word, clickedBtn) {
  recordQuizOutcome(word, ok);
  if (ok) {
    mutateEngine((e) => {
      e.vocabCorrectStreak += 1;
    });
    saveVocabBestStreakIfHigher(getEngine().vocabCorrectStreak);
    syncVocabStreakMult({
      pulse: getEngine().vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM,
    });
  } else {
    mutateEngine((e) => {
      if (e.vocabRound) {
        e.vocabRound.maxStreak = Math.max(e.vocabRound.maxStreak, e.vocabCorrectStreak);
      }
      e.vocabCorrectStreak = 0;
    });
    syncVocabStreakMult();
  }
  applyVocabRoundAnswer(word, ok);
  byId("feedback").classList.remove("ok", "bad");
  byId("feedback").classList.add("hidden");
  byId("feedback").textContent = "";
  if (!byId("vocab-options")) return;
  const dir = getEngine().currentTask?.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
  const correctNom =
    typeof word?.nominative === "string" && word.nominative.trim()
      ? word.nominative.trim()
      : expected;
  const clickedLemma = clickedBtn?.getAttribute("data-lemma") ?? "";
  byId("vocab-options").querySelectorAll(".vocab-choice").forEach((b) => {
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
    const vo = byId("vocab-options");
    const wrongBtn =
      clickedBtn?.closest?.(".vocab-choice") ||
      (vo
        ? [...vo.querySelectorAll(".vocab-choice")].find((b) =>
            answersMatch(b.getAttribute("data-lemma") || "", clickedLemma),
          )
        : undefined);
    wrongBtn?.classList.remove("ghost");
    wrongBtn?.classList.add("vocab-choice--wrong");
    if (wrongBtn) wrongBtn.disabled = true;
  }

  const picked = clickedBtn?.closest?.(".vocab-choice");
  picked?.classList.add("vocab-choice--picked");
}

/** Хардкор-слова: первая отправка формы — проверка; вторая — следующее слово. */
export function processVocabHardcoreSubmit() {
  if (!getEngine().currentTask?.vocabHardcore || getEngine().currentTask.mode !== TRAIN_MODE.VOCAB) return;
  const vocabInput = document.getElementById("vocab-answer-input");
  if (!vocabInput) return;

  if (!getEngine().answered) {
    const dir = getEngine().currentTask.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
    const word = getEngine().currentTask.word;
    let expected;
    let ok;
    if (dir === VOCAB_DIRECTION.LT_TO_RU) {
      expected = wordRuFeedbackLine(word);
      ok = vocabRuUserMatches(word, vocabInput.value);
    } else {
      expected = (word?.nominative || "").trim();
      ok = answersMatch(vocabInput.value, expected);
    }
    mutateEngine((e) => {
      e.answered = true;
      if (ok) {
        e.vocabCorrectStreak += 1;
      } else {
        if (e.vocabRound) {
          e.vocabRound.maxStreak = Math.max(e.vocabRound.maxStreak, e.vocabCorrectStreak);
        }
        e.vocabCorrectStreak = 0;
      }
    });
    setSubmitLabel(true);
    setQuizSkipAvailable(false);
    if (ok) {
      saveVocabBestStreakIfHigher(getEngine().vocabCorrectStreak);
    }
    showFeedback(ok, expected, word);
    syncVocabStreakMult({
      pulse: ok && getEngine().vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM,
    });
    applyVocabRoundAnswer(word, ok);
    return;
  }

  advanceVocabQuiz();
}

export function advanceVocabQuiz() {
  if (!getEngine().currentTask || getEngine().currentTask.mode !== TRAIN_MODE.VOCAB || !getEngine().answered) return;
  const task = nextVocabTask();
  if (!task) {
    resetVocabCorrectStreak();
    if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
      openVocabRoundSummaryOverlay();
      return;
    }
    byId("feedback").classList.remove("hidden", "ok", "bad");
    byId("feedback").textContent = STR.quiz.noWordsLeft;
    return;
  }
  showQuiz(task);
}

/** После переключения настройки перевода в модалке настроек — обновить подпись на активном экране падежей. */
export function refreshCasesLemmaDisplayIfActive() {
  if (
    !getEngine().currentTask ||
    getEngine().currentTask.mode !== TRAIN_MODE.CASES ||
    byId("quiz-shell")?.classList.contains("hidden") ||
    !byId("lemma-display")
  ) {
    return;
  }
  byId("lemma-display").textContent = casesLemmaDisplayLine(getEngine().currentTask.word);
}

export function skipCurrentWord() {
  if (!getEngine().currentTask || getEngine().answered) return;
  bumpWordStat(lemmaKey(getEngine().currentTask.word), "skipped");
  if (getEngine().currentTask.mode === TRAIN_MODE.VOCAB) {
    applyVocabRoundSkip(getEngine().currentTask.word);
    resetVocabCorrectStreak();
    const task = nextVocabTask();
    if (!task) {
      if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
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

/** Обработчики для {@link QuizScreen} (клики и отправка форм). */

export function handleLtCharsToolbarClick(/** @type {Pick<MouseEvent, "target">} */ e, /** @type {string} */ inputId) {
  const t = e.target;
  if (!(t instanceof Node)) return;
  const btn = t instanceof Element ? t.closest(".lt-char") : null;
  const input = byId(inputId);
  if (!btn || !(input instanceof HTMLInputElement)) return;
  const ch = btn.getAttribute("data-char");
  if (!ch) return;
  insertAtCaret(input, ch);
}

export function handleMorphCasesAnswerSubmit(/** @type {Event} */ e) {
  e.preventDefault();
  if (!getEngine().currentTask) return;
  if (getEngine().currentTask.mode === TRAIN_MODE.VOCAB) return;

  const keys = getCheckedCaseKeys();
  const expected = getEngine().currentTask.word[getEngine().currentTask.targetCase];
  const answerEl = byId("answer-input");
  if (!(answerEl instanceof HTMLInputElement)) return;
  const user = answerEl.value;

  if (!getEngine().answered) {
    const ok = answersMatch(user, expected);
    mutateEngine((e) => {
      e.answered = true;
    });
    setSubmitLabel(true);
    setQuizSkipAvailable(false);
    showFeedback(ok, expected, getEngine().currentTask.word);
    return;
  }

  const task = nextTask(keys);
  if (!task) {
    const fb = byId("feedback");
    if (fb) {
      fb.classList.remove("hidden", "ok", "bad");
      fb.textContent = STR.quiz.noWordsLeft;
    }
    return;
  }
  showQuiz(task);
}

export function handleVocabChoicesClick(/** @type {Event} */ e) {
  const t = e.target;
  if (!(t instanceof Node)) return;
  const btn = t instanceof Element ? t.closest(".vocab-choice") : null;
  if (!btn || !getEngine().currentTask || getEngine().currentTask.mode !== TRAIN_MODE.VOCAB) return;

  if (getEngine().answered) {
    const word = getEngine().currentTask.word;
    const dir = getEngine().currentTask.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
    const lem = btn.getAttribute("data-lemma") || "";
    const matches =
      dir === VOCAB_DIRECTION.LT_TO_RU ? vocabRuUserMatches(word, lem) : answersMatch(lem, (word?.nominative || "").trim());
    if (btn.classList.contains("vocab-choice--correct") && matches) {
      advanceVocabQuiz();
    }
    return;
  }

  mutateEngine((e) => {
    e.answered = true;
  });
  const dir = getEngine().currentTask.vocabDirection || VOCAB_DIRECTION.RU_TO_LT;
  const word = getEngine().currentTask.word;
  const lem = btn.getAttribute("data-lemma") || "";
  const ok =
    dir === VOCAB_DIRECTION.LT_TO_RU
      ? vocabRuUserMatches(word, lem)
      : answersMatch(lem, (word?.nominative || "").trim());
  const expected =
    dir === VOCAB_DIRECTION.LT_TO_RU ? wordRuFeedbackLine(word) : (word?.nominative || "").trim();
  finalizeVocabChoice(ok, expected, getEngine().currentTask.word, btn);
  morphQuizSkipToVocabNext();
}

export function handleQuizSkipButtonClick() {
  if (getEngine().currentTask?.mode === TRAIN_MODE.VOCAB && getEngine().answered) {
    if (getEngine().currentTask.vocabHardcore) return;
    advanceVocabQuiz();
    return;
  }
  skipCurrentWord();
}

export function handleAnswerFieldKeyDown(/** @type {KeyboardEvent} */ e) {
  handleAnswerInputShiftCycles(e);
}

export function handleVocabAnswerFieldKeyDown(/** @type {KeyboardEvent} */ e) {
  handleAnswerInputShiftCycles(e);
}

export function handleVocabHardcoreFormSubmit(/** @type {Event} */ e) {
  e.preventDefault();
  processVocabHardcoreSubmit();
}
