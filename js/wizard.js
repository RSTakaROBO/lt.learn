import { CASE_ORDER, TRAIN_MODE } from "./config.js";
import { createCheckboxTileLabel } from "./checkbox-tile.js";
import { els } from "./dom.js";
import { loadSelectedCases, loadTrainMode, loadVocabDirections, saveVocabDirections } from "./storage.js";

export function applyVocabDirectionCheckboxesFromStorage() {
  const d = loadVocabDirections();
  const ruLt = document.getElementById("vocab-dir-ru-lt");
  const ltRu = document.getElementById("vocab-dir-lt-ru");
  const hc = document.getElementById("vocab-hardcore");
  if (ruLt) ruLt.checked = d.ru_to_lt;
  if (ltRu) ltRu.checked = d.lt_to_ru;
  if (hc) hc.checked = d.hardcore;
}

export function readVocabDirectionsFromUi() {
  const ruLt = document.getElementById("vocab-dir-ru-lt");
  const ltRu = document.getElementById("vocab-dir-lt-ru");
  const hc = document.getElementById("vocab-hardcore");
  return {
    ru_to_lt: !!(ruLt && ruLt.checked),
    lt_to_ru: !!(ltRu && ltRu.checked),
    hardcore: !!(hc && hc.checked),
  };
}

export function persistVocabDirectionsFromUiIfValid() {
  const dirs = readVocabDirectionsFromUi();
  if (!dirs.ru_to_lt && !dirs.lt_to_ru) return false;
  saveVocabDirections(dirs);
  return true;
}

export function syncModeChoiceButtons(mode) {
  const bc = document.getElementById("btn-mode-cases");
  const bv = document.getElementById("btn-mode-vocab");
  if (!bc || !bv) return;
  bc.classList.toggle("mode-choice-btn--active", mode === TRAIN_MODE.CASES);
  bv.classList.toggle("mode-choice-btn--active", mode === TRAIN_MODE.VOCAB);
  bc.setAttribute("aria-pressed", mode === TRAIN_MODE.CASES ? "true" : "false");
  bv.setAttribute("aria-pressed", mode === TRAIN_MODE.VOCAB ? "true" : "false");
}

export function getTrainModeFromUi() {
  const pressed = document.querySelector('.mode-choice-btn[aria-pressed="true"]');
  const v = pressed?.getAttribute("data-train-mode");
  if (v === TRAIN_MODE.VOCAB) return TRAIN_MODE.VOCAB;
  if (v === TRAIN_MODE.CASES) return TRAIN_MODE.CASES;
  return loadTrainMode();
}

export function applyTrainModeFromStorage() {
  syncModeChoiceButtons(loadTrainMode());
}

/** Оба режима: тип упражнения → наборы → (слова: направление | падежи: падежи) — три шага. */
export function wizardDotCountForUi() {
  return 3;
}

export function wizardDotCountAfterModeChosen() {
  return 3;
}

export function renderWizardDots(count) {
  if (!els.wizardProgress) return;
  els.wizardProgress.innerHTML = "";
  els.wizardProgress.setAttribute("aria-valuemax", String(count));
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("span");
    dot.className = "wizard-dot";
    dot.setAttribute("aria-hidden", "true");
    els.wizardProgress.appendChild(dot);
  }
}

export function updateWizardProgress(step) {
  const dots = els.wizardProgress?.querySelectorAll(".wizard-dot");
  const max = dots?.length || 1;
  const n = Math.min(max, Math.max(1, step));
  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i + 1 === n);
  });
  if (els.wizardProgress) els.wizardProgress.setAttribute("aria-valuenow", String(n));
}

function elStepVocabDirection() {
  return els.stepVocabDirection ?? document.getElementById("step-vocab-direction");
}

function hideAllWizardSteps() {
  els.stepMode.classList.add("hidden");
  els.stepPacks.classList.add("hidden");
  els.stepCases.classList.add("hidden");
  elStepVocabDirection()?.classList.add("hidden");
}

export function showWizardMode() {
  hideAllWizardSteps();
  els.stepMode.classList.remove("hidden");
  renderWizardDots(wizardDotCountForUi());
  updateWizardProgress(1);
}

/** Кнопка «Далее» на шаге наборов — всегда ведёт дальше по цепочке (не старт квиза). */
export function syncWizardPacksNextPresentation() {
  const btn = els.btnPacksNext;
  if (!btn) return;
  btn.textContent = "Далее";
  btn.classList.remove("start");
  btn.classList.add("primary");
  btn.setAttribute("aria-label", "Далее");
}

export function showWizardPacks() {
  hideAllWizardSteps();
  els.stepPacks.classList.remove("hidden");
  renderWizardDots(wizardDotCountAfterModeChosen());
  updateWizardProgress(2);
  syncWizardPacksNextPresentation();
}

export function showWizardVocabDirection() {
  hideAllWizardSteps();
  const dir = elStepVocabDirection();
  if (dir) dir.classList.remove("hidden");
  renderWizardDots(3);
  updateWizardProgress(3);
}

export function showWizardCases() {
  hideAllWizardSteps();
  els.stepCases.classList.remove("hidden");
  renderWizardDots(3);
  updateWizardProgress(3);
}

export function renderCaseCheckboxes() {
  const saved = loadSelectedCases();
  const selectableCases = CASE_ORDER.filter((c) => c.key !== "nominative");
  const defaultKeys = selectableCases.map((c) => c.key);
  const selected = saved && saved.length ? saved : defaultKeys;

  els.caseCheckboxes.innerHTML = "";
  for (const c of selectableCases) {
    const id = `case-${c.key}`;
    const metaChildren = [];
    if (typeof c.lt === "string" && c.lt.trim()) {
      const ltSpan = document.createElement("span");
      ltSpan.lang = "lt";
      ltSpan.textContent = c.lt.trim();
      metaChildren.push(ltSpan);
    }
    const wrap = createCheckboxTileLabel({
      id,
      value: c.key,
      checked: selected.includes(c.key),
      titleText: c.ru,
      metaChildren,
    });
    els.caseCheckboxes.appendChild(wrap);
  }
}
