import { CASE_ORDER, TRAIN_MODE } from "./config.js";
import { getCheckedCaseKeys } from "./case-selection.js";
import { els, refreshQuizElements } from "./dom.js";
import { state } from "./state.js";
import { bumpWordStat } from "./storage.js";
import { answersMatch, escapeHtml } from "./text-utils.js";
import { lemmaKey, nextTask, nextVocabTask } from "./word-selection.js";

export function inferQuizMode(task) {
  if (!task?.word) return TRAIN_MODE.CASES;
  if (task.mode === TRAIN_MODE.VOCAB) return TRAIN_MODE.VOCAB;
  if (task.mode === TRAIN_MODE.CASES) return TRAIN_MODE.CASES;
  if (Array.isArray(task.choices) && task.choices.length >= 4) return TRAIN_MODE.VOCAB;
  return TRAIN_MODE.CASES;
}

export function setSubmitLabel(answeredFlag) {
  if (els.btnSubmit) els.btnSubmit.textContent = answeredFlag ? "Далее" : "Проверить";
}

export function setQuizSkipAvailable(canSkip) {
  if (els.btnSkip) els.btnSkip.disabled = !canSkip;
}

export function resetQuizSkipButtonAppearance() {
  if (!els.btnSkip) return;
  els.btnSkip.textContent = "Пропустить";
  els.btnSkip.classList.remove("ghost", "start");
  els.btnSkip.classList.add("primary");
  els.btnSkip.setAttribute("aria-label", "Пропустить");
}

export function morphQuizSkipToVocabNext() {
  if (!els.btnSkip) return;
  els.btnSkip.textContent = "Далее";
  els.btnSkip.disabled = false;
  els.btnSkip.setAttribute("aria-label", "Далее");
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

/** @returns {boolean} false только если режим «слова» запрошен, а разметки vocab в DOM нет */
export function setQuizUiPhase(phase) {
  refreshQuizElements();

  const casesEl = els.quizCasesUi;
  const vocabEl = els.quizVocabUi;
  const sub = els.btnQuizSubmitCases;
  const foot = els.quizFooterActions;

  if (!casesEl || !sub || !foot) return false;

  if (phase === "cases") {
    foot.classList.remove("hidden");
    vocabEl?.classList.add("hidden");
    casesEl.classList.remove("hidden");
    sub.hidden = false;
    sub.classList.remove("hidden");
    foot.classList.remove("quiz-footer--single");
    return true;
  }

  if (phase === "vocab-pending") {
    if (!vocabEl || !els.vocabOptions) {
      casesEl.classList.add("hidden");
      vocabEl?.classList.add("hidden");
      sub.hidden = true;
      sub.classList.add("hidden");
      foot.classList.add("hidden");
      foot.classList.remove("quiz-footer--single");
      if (els.feedback) {
        els.feedback.classList.remove("hidden", "ok", "bad");
        els.feedback.textContent =
          "Не удалось открыть режим «Слова». Обновите страницу или очистите данные сайта / кэш приложения.";
      }
      return false;
    }
    foot.classList.remove("hidden");
    vocabEl.classList.remove("hidden");
    casesEl.classList.add("hidden");
    sub.hidden = true;
    sub.classList.add("hidden");
    foot.classList.add("quiz-footer--single");
    return true;
  }

  return true;
}

export function showQuiz(task) {
  refreshQuizElements();
  task.mode = inferQuizMode(task);

  state.currentTask = task;
  state.shownLemmaHistory.push(lemmaKey(task.word));
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
    if (!setQuizUiPhase("vocab-pending")) return;
    if (els.vocabRuDisplay) els.vocabRuDisplay.textContent = (task.word.hint_ru || "").trim() || "—";
    if (!Array.isArray(task.choices) || task.choices.length < 4) {
      renderVocabChoices([]);
      els.feedback.classList.remove("hidden", "ok", "bad");
      els.feedback.textContent = "Нет данных для вариантов ответа. Вернитесь в меню.";
      return;
    }
    renderVocabChoices(task.choices);
    return;
  }

  setQuizUiPhase("cases");
  setSubmitLabel(false);
  const nom = task.word.nominative;
  const hint = task.word.hint_ru ? ` (${task.word.hint_ru})` : "";
  els.lemmaDisplay.textContent = nom + hint;

  const meta = CASE_ORDER.find((c) => c.key === task.targetCase);
  els.targetCaseDisplay.textContent = meta ? meta.ru : task.targetCase;

  els.answerInput.value = "";
  els.answerInput.focus();
}

function exceptionHintHtml(word) {
  if (!word || (!word.exception && !(typeof word.exception_note_ru === "string" && word.exception_note_ru.trim())))
    return "";
  const note =
    typeof word.exception_note_ru === "string" && word.exception_note_ru.trim()
      ? word.exception_note_ru.trim()
      : "Слово относится к исключениям или нестандартному склонению — формы надёжнее учить по словарю отдельно.";
  return `<p class="exception-hint"><strong>Исключение:</strong> ${escapeHtml(note)}</p>`;
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
    els.feedback.innerHTML = exc ? `<p>Верно</p>${exc}` : "<p>Верно</p>";
  } else {
    els.feedback.classList.add("bad");
    const exc = exceptionHintHtml(word);
    els.feedback.innerHTML = `<p>Неверно</p><p class="correct-form">Правильно: <strong>${escapeHtml(expected)}</strong></p>${exc}`;
  }
}

/** Режим «слова»: только подсветка кнопок; подсказки про исключения не показываем. */
export function finalizeVocabChoice(ok, expected, word, clickedBtn) {
  recordQuizOutcome(word, ok);
  els.feedback.classList.remove("ok", "bad");
  els.feedback.classList.add("hidden");
  els.feedback.textContent = "";
  if (!els.vocabOptions) return;
  const nominal =
    typeof word?.nominative === "string" && word.nominative.trim() ? word.nominative.trim() : expected;
  const clickedLemma = clickedBtn?.getAttribute("data-lemma") ?? "";
  els.vocabOptions.querySelectorAll(".vocab-choice").forEach((b) => {
    const lem = b.getAttribute("data-lemma") || "";
    const isExpected = answersMatch(lem, nominal);
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
  if (!ok && clickedLemma && !answersMatch(clickedLemma, nominal)) {
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

export function advanceVocabQuiz() {
  if (!state.currentTask || state.currentTask.mode !== TRAIN_MODE.VOCAB || !state.answered) return;
  const task = nextVocabTask();
  if (!task) {
    els.feedback.classList.remove("hidden", "ok", "bad");
    els.feedback.textContent = "Слов больше нет.";
    return;
  }
  showQuiz(task);
}

export function skipCurrentWord() {
  if (!state.currentTask || state.answered) return;
  bumpWordStat(lemmaKey(state.currentTask.word), "skipped");
  if (state.currentTask.mode === TRAIN_MODE.VOCAB) {
    const task = nextVocabTask();
    if (!task) return;
    showQuiz(task);
    return;
  }
  const keys = getCheckedCaseKeys();
  const task = nextTask(keys);
  if (!task) return;
  showQuiz(task);
}
