import { CASE_ORDER, TRAIN_MODE } from "./config.js";
import { els } from "./dom.js";
import { loadSelectedCases, loadTrainMode } from "./storage.js";
import { escapeHtml } from "./text-utils.js";

export function getTrainModeFromUi() {
  const el = document.querySelector('input[name="train-mode"]:checked');
  return el?.value === TRAIN_MODE.VOCAB ? TRAIN_MODE.VOCAB : TRAIN_MODE.CASES;
}

export function applyTrainModeFromStorage() {
  const m = loadTrainMode();
  const input = document.querySelector(`input[name="train-mode"][value="${m}"]`);
  if (input) input.checked = true;
}

export function wizardDotCountForUi() {
  return getTrainModeFromUi() === TRAIN_MODE.VOCAB ? 2 : 3;
}

export function wizardDotCountAfterModeChosen() {
  return loadTrainMode() === TRAIN_MODE.VOCAB ? 2 : 3;
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

export function showWizardMode() {
  els.stepMode.classList.remove("hidden");
  els.stepPacks.classList.add("hidden");
  els.stepCases.classList.add("hidden");
  renderWizardDots(wizardDotCountForUi());
  updateWizardProgress(1);
}

export function syncWizardPacksNextPresentation() {
  const btn = els.btnPacksNext;
  if (!btn) return;
  if (loadTrainMode() === TRAIN_MODE.VOCAB) {
    btn.textContent = "Начать";
    btn.classList.remove("primary");
    btn.classList.add("start");
    btn.setAttribute("aria-label", "Начать");
  } else {
    btn.textContent = "Далее";
    btn.classList.remove("start");
    btn.classList.add("primary");
    btn.setAttribute("aria-label", "Далее");
  }
}

export function showWizardPacks() {
  els.stepMode.classList.add("hidden");
  els.stepPacks.classList.remove("hidden");
  els.stepCases.classList.add("hidden");
  renderWizardDots(wizardDotCountAfterModeChosen());
  updateWizardProgress(2);
  syncWizardPacksNextPresentation();
}

export function showWizardCases() {
  els.stepMode.classList.add("hidden");
  els.stepPacks.classList.add("hidden");
  els.stepCases.classList.remove("hidden");
  renderWizardDots(3);
  updateWizardProgress(3);
}

export function renderCaseCheckboxes() {
  const saved = loadSelectedCases();
  const defaultKeys = CASE_ORDER.filter((c) => c.key !== "nominative").map((c) => c.key);
  const selected = saved && saved.length ? saved : defaultKeys;

  els.caseCheckboxes.innerHTML = "";
  for (const c of CASE_ORDER) {
    const id = `case-${c.key}`;
    const wrap = document.createElement("label");
    wrap.className = "case-option";
    wrap.htmlFor = id;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = id;
    cb.value = c.key;
    cb.checked = selected.includes(c.key);

    const text = document.createElement("div");
    text.innerHTML = `<div class="case-title">${escapeHtml(c.ru)}</div>`;

    wrap.appendChild(cb);
    wrap.appendChild(text);
    els.caseCheckboxes.appendChild(wrap);
  }
}
