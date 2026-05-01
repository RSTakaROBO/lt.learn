/**
 * Lithuanian case trainer — loads word lists from words/manifest.json + JSON bundles.
 */

const CASE_ORDER = [
  { key: "nominative", ru: "Именительный" },
  { key: "genitive", ru: "Родительный" },
  { key: "dative", ru: "Дательный" },
  { key: "accusative", ru: "Винительный" },
  { key: "instrumental", ru: "Творительный" },
  { key: "locative", ru: "Местный" },
  { key: "vocative", ru: "Звательный" },
];

const STORAGE_KEYS = {
  cases: "lt-cases-trainer-selected-cases",
  packs: "lt-cases-trainer-selected-packs",
  wordStats: "lt-trainer-word-stats-v1",
  trainMode: "lt-trainer-train-mode-v1",
  theme: "lt-trainer-theme-v1",
};

/** Доступные профили из themes.css (атрибут data-theme на documentElement). */
const THEME_IDS = [
  "default",
  "ocean",
  "forest",
  "dusk",
  "ember",
  "day",
  "paper",
  "mist",
  "bloom",
];

/** Режим упражнения после шага «Упражнение». */
const TRAIN_MODE = {
  CASES: "cases",
  VOCAB: "vocab",
};

/** Цикл символов при Shift + эта латинская буква (нижний регистр); без Shift поведение обычное. */
const LT_SHIFT_KEY_CYCLES = {
  a: ["a", "ą"],
  c: ["c", "č"],
  e: ["e", "ę", "ė"],
  i: ["i", "į"],
  s: ["s", "š"],
  u: ["u", "ų", "ū"],
  z: ["z", "ž"],
};

const els = {
  stepMode: document.getElementById("step-mode"),
  stepPacks: document.getElementById("step-packs"),
  stepCases: document.getElementById("step-cases"),
  wizardProgress: document.getElementById("wizard-progress"),
  btnModeNext: document.getElementById("btn-mode-next"),
  modePicker: document.querySelector(".mode-picker"),
  packList: document.getElementById("pack-list"),
  btnPacksNext: document.getElementById("btn-packs-next"),
  btnPacksBack: document.getElementById("btn-packs-back"),
  btnCasesBack: document.getElementById("btn-cases-back"),
  packStepStatus: document.getElementById("pack-step-status"),
  caseCheckboxes: document.getElementById("case-checkboxes"),
  btnStart: document.getElementById("btn-start"),
  btnSubmit: document.getElementById("btn-quiz-submit-cases"),
  quizFooterActions: document.getElementById("quiz-footer-actions"),
  quizCasesUi: document.getElementById("quiz-cases-ui"),
  quizVocabUi: document.getElementById("quiz-vocab-ui"),
  vocabRuDisplay: document.getElementById("vocab-ru-display"),
  vocabOptions: document.getElementById("vocab-options"),
  caseStepStatus: document.getElementById("case-step-status"),
  setup: document.getElementById("setup"),
  quizShell: document.getElementById("quiz-shell"),
  casesHelpShell: document.getElementById("cases-help-shell"),
  casesHelpScrollBlock: document.querySelector("#cases-help .cases-help-scroll-block"),
  casesHelpTitle: document.getElementById("cases-help-title"),
  btnOpenCasesHelp: document.getElementById("btn-open-cases-help"),
  btnCasesHelpClose: document.getElementById("btn-cases-help-close"),
  verbsHelpShell: document.getElementById("verbs-help-shell"),
  verbsHelpScrollBlock: document.querySelector("#verbs-help .cases-help-scroll-block"),
  verbsHelpTitle: document.getElementById("verbs-help-title"),
  btnOpenVerbsHelp: document.getElementById("btn-open-verbs-help"),
  btnVerbsHelpClose: document.getElementById("btn-verbs-help-close"),
  lemmaDisplay: document.getElementById("lemma-display"),
  targetCaseDisplay: document.getElementById("target-case-display"),
  answerForm: document.getElementById("answer-form"),
  answerInput: document.getElementById("answer-input"),
  feedback: document.getElementById("feedback"),
  btnSkip: document.getElementById("btn-skip"),
  btnBackSetup: document.getElementById("btn-back-setup"),
  ltCharsBar: document.getElementById("lt-chars"),
  btnStats: document.getElementById("btn-stats"),
  statsOverlay: document.getElementById("stats-overlay"),
  statsSummary: document.getElementById("stats-summary"),
  statsTable: document.getElementById("stats-table"),
  statsTableBody: document.getElementById("stats-table-body"),
  statsEmpty: document.getElementById("stats-empty"),
  btnStatsClose: document.getElementById("btn-stats-close"),
  btnSettings: document.getElementById("btn-settings"),
  settingsOverlay: document.getElementById("settings-overlay"),
  btnSettingsClose: document.getElementById("btn-settings-close"),
  themePicker: document.getElementById("theme-picker"),
};

let wordBank = [];
let currentTask = null;
let answered = false;

/** Леммы по порядку показа (одно и то же слово не раньше чем через MIN_GAP_BEFORE_SAME_LEMMA других). */
let shownLemmaHistory = [];

const MIN_GAP_BEFORE_SAME_LEMMA = 5;

/** Вес выбора слова: ошибки увеличивают, верные уменьшают (не ниже WEIGHT_MIN). */
const WEIGHT_MIN = 0.28;
const WEIGHT_BASE = 1;
const WEIGHT_PER_WRONG = 0.92;
const WEIGHT_PER_SKIP = 0.38;
const WEIGHT_PER_CORRECT = 0.3;

/** После загрузки manifest.json */
let manifestCache = null;

/** По ключу nominative: { correct, wrong, skipped } */
let wordStats = {};

function refreshQuizElements() {
  els.quizCasesUi = document.getElementById("quiz-cases-ui");
  els.quizVocabUi = document.getElementById("quiz-vocab-ui");
  els.vocabRuDisplay = document.getElementById("vocab-ru-display");
  els.vocabOptions = document.getElementById("vocab-options");
  els.quizFooterActions = document.getElementById("quiz-footer-actions");
  els.btnQuizSubmitCases = document.getElementById("btn-quiz-submit-cases");
  els.btnSkip = document.getElementById("btn-skip");
  els.btnSubmit = els.btnQuizSubmitCases;
  els.answerForm = document.getElementById("answer-form");
  els.answerInput = document.getElementById("answer-input");
  els.feedback = document.getElementById("feedback");
  els.ltCharsBar = document.getElementById("lt-chars");
  els.lemmaDisplay = document.getElementById("lemma-display");
  els.targetCaseDisplay = document.getElementById("target-case-display");
}

function inferQuizMode(task) {
  if (!task?.word) return TRAIN_MODE.CASES;
  if (task.mode === TRAIN_MODE.VOCAB) return TRAIN_MODE.VOCAB;
  if (task.mode === TRAIN_MODE.CASES) return TRAIN_MODE.CASES;
  if (Array.isArray(task.choices) && task.choices.length >= 4) return TRAIN_MODE.VOCAB;
  return TRAIN_MODE.CASES;
}

function loadSelectedCases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cases);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveSelectedCases(keys) {
  try {
    localStorage.setItem(STORAGE_KEYS.cases, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

function loadSelectedPacks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.packs);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveSelectedPacks(ids) {
  try {
    localStorage.setItem(STORAGE_KEYS.packs, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function normalizeManifest(raw) {
  if (raw.packs && Array.isArray(raw.packs) && raw.packs.length) {
    return raw;
  }
  if (raw.files && Array.isArray(raw.files) && raw.files.length) {
    return {
      ...raw,
      packs: [{ id: "default", title_ru: "Основной набор", files: [...raw.files] }],
    };
  }
  throw new Error("В manifest.json нужны поля packs или files");
}

function safePackInputId(packId) {
  return `pack-${String(packId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function renderPackList(packs) {
  const saved = loadSelectedPacks();
  const defaultAll = !saved || !saved.length;

  els.packList.innerHTML = "";
  for (const p of packs) {
    if (!p || typeof p.id !== "string" || !p.id || !Array.isArray(p.files)) continue;

    const inputId = safePackInputId(p.id);
    const wrap = document.createElement("label");
    wrap.className = "case-option";
    wrap.htmlFor = inputId;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = inputId;
    cb.value = p.id;
    cb.checked = defaultAll ? true : saved.includes(p.id);

    const title =
      typeof p.title_ru === "string" && p.title_ru.trim() ? p.title_ru.trim() : p.id;

    const text = document.createElement("div");
    const titleDiv = document.createElement("div");
    titleDiv.className = "case-title";
    titleDiv.textContent = title;

    const countDiv = document.createElement("div");
    countDiv.className = "case-lt pack-word-count";
    countDiv.textContent = "…";

    text.appendChild(titleDiv);
    text.appendChild(countDiv);

    wrap.appendChild(cb);
    wrap.appendChild(text);
    els.packList.appendChild(wrap);
  }
}

function getCheckedPackIds() {
  return Array.from(els.packList.querySelectorAll('input[type="checkbox"]:checked')).map(
    (input) => input.value,
  );
}

function resolveFilesFromPackIds(packIds) {
  if (!manifestCache?.packs) return [];
  const out = [];
  const seen = new Set();
  for (const id of packIds) {
    const pack = manifestCache.packs.find((p) => p.id === id);
    if (!pack?.files) continue;
    for (const file of pack.files) {
      if (typeof file !== "string" || !file || seen.has(file)) continue;
      seen.add(file);
      out.push(file);
    }
  }
  return out;
}

function loadTrainMode() {
  try {
    const m = localStorage.getItem(STORAGE_KEYS.trainMode);
    if (m === TRAIN_MODE.VOCAB || m === TRAIN_MODE.CASES) return m;
  } catch {
    /* ignore */
  }
  return TRAIN_MODE.CASES;
}

function saveTrainMode(mode) {
  try {
    if (mode === TRAIN_MODE.VOCAB || mode === TRAIN_MODE.CASES) {
      localStorage.setItem(STORAGE_KEYS.trainMode, mode);
    }
  } catch {
    /* ignore */
  }
}

function loadTheme() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr && THEME_IDS.includes(attr)) return attr;
  try {
    const t = localStorage.getItem(STORAGE_KEYS.theme);
    if (t && THEME_IDS.includes(t)) return t;
  } catch {
    /* ignore */
  }
  return "default";
}

function applyTheme(themeId) {
  const id = THEME_IDS.includes(themeId) ? themeId : "default";
  if (id === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", id);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.theme, id);
  } catch {
    /* ignore */
  }
  updateThemeColorMeta();
}

function updateThemeColorMeta() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  if (bg) meta.setAttribute("content", bg);
}

function syncThemeRadiosFromDom() {
  if (!els.themePicker) return;
  const id = loadTheme();
  const input = els.themePicker.querySelector(`input[name="app-theme"][value="${id}"]`);
  if (input) input.checked = true;
}

function openSettingsOverlay() {
  closeStatsOverlay();
  syncThemeRadiosFromDom();
  els.settingsOverlay?.classList.remove("hidden");
  document.body.classList.add("settings-modal-open");
  els.btnSettingsClose?.focus();
}

function closeSettingsOverlay() {
  els.settingsOverlay?.classList.add("hidden");
  document.body.classList.remove("settings-modal-open");
}

function isSettingsOverlayOpen() {
  return els.settingsOverlay && !els.settingsOverlay.classList.contains("hidden");
}

function isCasesHelpOpen() {
  return els.casesHelpShell && !els.casesHelpShell.classList.contains("hidden");
}

function isVerbsHelpOpen() {
  return els.verbsHelpShell && !els.verbsHelpShell.classList.contains("hidden");
}

function openCasesHelp() {
  closeStatsOverlay();
  closeSettingsOverlay();
  if (!els.casesHelpShell) return;
  els.verbsHelpShell?.classList.add("hidden");
  els.setup.classList.add("hidden");
  els.quizShell.classList.add("hidden");
  els.casesHelpShell.classList.remove("hidden");
  if (els.casesHelpScrollBlock) els.casesHelpScrollBlock.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  requestAnimationFrame(() => {
    els.casesHelpTitle?.focus({ preventScroll: true });
  });
}

function closeCasesHelp() {
  if (!els.casesHelpShell) return;
  els.casesHelpShell.classList.add("hidden");
  els.setup.classList.remove("hidden");
}

function openVerbsHelp() {
  closeStatsOverlay();
  closeSettingsOverlay();
  if (!els.verbsHelpShell) return;
  els.casesHelpShell?.classList.add("hidden");
  els.setup.classList.add("hidden");
  els.quizShell.classList.add("hidden");
  els.verbsHelpShell.classList.remove("hidden");
  if (els.verbsHelpScrollBlock) els.verbsHelpScrollBlock.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  requestAnimationFrame(() => {
    els.verbsHelpTitle?.focus({ preventScroll: true });
  });
}

function closeVerbsHelp() {
  if (!els.verbsHelpShell) return;
  els.verbsHelpShell.classList.add("hidden");
  els.setup.classList.remove("hidden");
}

function getTrainModeFromUi() {
  const el = document.querySelector('input[name="train-mode"]:checked');
  return el?.value === TRAIN_MODE.VOCAB ? TRAIN_MODE.VOCAB : TRAIN_MODE.CASES;
}

function applyTrainModeFromStorage() {
  const m = loadTrainMode();
  const input = document.querySelector(`input[name="train-mode"][value="${m}"]`);
  if (input) input.checked = true;
}

function wizardDotCountForUi() {
  return getTrainModeFromUi() === TRAIN_MODE.VOCAB ? 2 : 3;
}

function wizardDotCountAfterModeChosen() {
  return loadTrainMode() === TRAIN_MODE.VOCAB ? 2 : 3;
}

function renderWizardDots(count) {
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

function updateWizardProgress(step) {
  const dots = els.wizardProgress?.querySelectorAll(".wizard-dot");
  const max = dots?.length || 1;
  const n = Math.min(max, Math.max(1, step));
  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i + 1 === n);
  });
  if (els.wizardProgress) els.wizardProgress.setAttribute("aria-valuenow", String(n));
}

function showWizardMode() {
  els.stepMode.classList.remove("hidden");
  els.stepPacks.classList.add("hidden");
  els.stepCases.classList.add("hidden");
  renderWizardDots(wizardDotCountForUi());
  updateWizardProgress(1);
}

function syncWizardPacksNextPresentation() {
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

function showWizardPacks() {
  els.stepMode.classList.add("hidden");
  els.stepPacks.classList.remove("hidden");
  els.stepCases.classList.add("hidden");
  renderWizardDots(wizardDotCountAfterModeChosen());
  updateWizardProgress(2);
  syncWizardPacksNextPresentation();
}

function showWizardCases() {
  els.stepMode.classList.add("hidden");
  els.stepPacks.classList.add("hidden");
  els.stepCases.classList.remove("hidden");
  renderWizardDots(3);
  updateWizardProgress(3);
}

function renderCaseCheckboxes() {
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCheckedCaseKeys() {
  return Array.from(els.caseCheckboxes.querySelectorAll('input[type="checkbox"]:checked')).map(
    (input) => input.value,
  );
}

function normalizeAnswer(s) {
  return s.trim().normalize("NFC");
}

function answersMatch(user, expected) {
  const u = normalizeAnswer(user).toLowerCase();
  const e = normalizeAnswer(expected).toLowerCase();
  return u === e;
}

function insertAtCaret(input, text) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const v = input.value;
  input.value = v.slice(0, start) + text + v.slice(end);
  const pos = start + text.length;
  input.setSelectionRange(pos, pos);
  input.focus();
}

function replaceRange(input, start, end, text) {
  const v = input.value;
  input.value = v.slice(0, start) + text + v.slice(end);
  const pos = start + text.length;
  input.setSelectionRange(pos, pos);
  input.focus();
}

function normalizedCycleIndex(ch, cycle) {
  const n = ch.normalize("NFC").toLowerCase();
  for (let i = 0; i < cycle.length; i++) {
    if (cycle[i].normalize("NFC").toLowerCase() === n) return i;
  }
  return -1;
}

/** Shift + буква с литовскими вариантами: цикл диакритик вместо заглавной; после отпускания Shift символ не меняется. */
function handleAnswerInputShiftCycles(e) {
  if (e.target !== els.answerInput) return;
  if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.isComposing) return;
  if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;

  const k = e.key.toLowerCase();
  const cycle = LT_SHIFT_KEY_CYCLES[k];
  if (!cycle) return;

  const input = els.answerInput;
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;

  if (end > start && end - start !== 1) return;

  const insertFallback = () => insertAtCaret(input, cycle.length > 1 ? cycle[1] : cycle[0]);

  let apply = null;

  if (end > start) {
    const sel = input.value.slice(start, end).normalize("NFC");
    const idx = normalizedCycleIndex(sel, cycle);
    const nextChar = idx >= 0 ? cycle[(idx + 1) % cycle.length] : cycle.length > 1 ? cycle[1] : cycle[0];
    apply = () => replaceRange(input, start, end, nextChar);
  } else if (start > 0) {
    const left = input.value.slice(start - 1, start).normalize("NFC");
    const idx = normalizedCycleIndex(left, cycle);
    if (idx >= 0) {
      const nextChar = cycle[(idx + 1) % cycle.length];
      apply = () => {
        replaceRange(input, start - 1, start, nextChar);
        input.setSelectionRange(start, start);
      };
    }
  }

  if (!apply) {
    apply = insertFallback;
  }

  e.preventDefault();
  apply();
}

function isWordEntryComplete(w) {
  if (!w || typeof w.nominative !== "string") return false;
  for (const { key } of CASE_ORDER) {
    if (typeof w[key] !== "string" || !w[key]) return false;
  }
  return true;
}

function countValidWordsInData(data) {
  const words = data.words;
  if (!Array.isArray(words)) return 0;
  let n = 0;
  for (const w of words) {
    if (isWordEntryComplete(w)) n++;
  }
  return n;
}

/** Склонение: «N слов» по-русски. */
function formatWordCountRu(n) {
  if (typeof n !== "number" || n < 0) return "";
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${n} слов`;
  if (mod10 === 1) return `${n} слово`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} слова`;
  return `${n} слов`;
}

async function fetchFileWordCount(base, file) {
  const url = `${base}${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  const data = await res.json();
  return countValidWordsInData(data);
}

async function fillPackWordCountsInUi() {
  if (!manifestCache?.packs?.length) return;

  const base = "words/";
  const uniqueFiles = new Set();
  for (const p of manifestCache.packs) {
    if (!p.files) continue;
    for (const f of p.files) {
      if (typeof f === "string" && f) uniqueFiles.add(f);
    }
  }

  const fileCounts = new Map();
  try {
    await Promise.all(
      [...uniqueFiles].map(async (file) => {
        try {
          fileCounts.set(file, await fetchFileWordCount(base, file));
        } catch {
          fileCounts.set(file, null);
        }
      }),
    );
  } catch {
    /* отдельные файлы уже помечены null */
  }

  for (const p of manifestCache.packs) {
    const input = [...els.packList.querySelectorAll('input[type="checkbox"]')].find((i) => i.value === p.id);
    const countEl = input?.closest(".case-option")?.querySelector(".pack-word-count");
    if (!countEl || !p.files?.length) continue;

    let sum = 0;
    let ok = true;
    for (const f of p.files) {
      const c = fileCounts.get(f);
      if (c == null) {
        ok = false;
        break;
      }
      sum += c;
    }
    countEl.textContent = ok ? formatWordCountRu(sum) : "не удалось посчитать";
  }
}

async function loadWordsFromFiles(files) {
  if (!Array.isArray(files) || !files.length) throw new Error("Нет файлов для загрузки");

  const base = "words/";
  const all = [];
  for (const file of files) {
    const url = `${base}${file}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${file}: ${res.status}`);
    const data = await res.json();
    const words = data.words;
    if (!Array.isArray(words)) throw new Error(`${file}: нет массива words`);
    for (const w of words) {
      if (isWordEntryComplete(w)) all.push(w);
    }
  }

  wordBank = all;
}

async function loadManifestAndRenderPacks() {
  const base = "words/";
  const manifestRes = await fetch(`${base}manifest.json`, { cache: "no-store" });
  if (!manifestRes.ok) throw new Error(`manifest.json: ${manifestRes.status}`);
  const raw = await manifestRes.json();
  manifestCache = normalizeManifest(raw);
  renderPackList(manifestCache.packs);
  if (!els.packList.querySelector("input")) {
    throw new Error("В manifest нет ни одного корректного пака");
  }
  await fillPackWordCountsInUi();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lemmaKey(word) {
  return word.nominative;
}

function normalizeWordStatRow(raw) {
  return {
    correct: Math.max(0, Math.floor(Number(raw?.correct) || 0)),
    wrong: Math.max(0, Math.floor(Number(raw?.wrong) || 0)),
    skipped: Math.max(0, Math.floor(Number(raw?.skipped) || 0)),
  };
}

function loadPersistedWordStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.wordStats);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[k] = normalizeWordStatRow(v);
    }
    return out;
  } catch {
    return {};
  }
}

function saveWordStatsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.wordStats, JSON.stringify(wordStats));
  } catch {
    /* ignore */
  }
}

function getWordStat(lemma) {
  const row = wordStats[lemma];
  return row ? normalizeWordStatRow(row) : { correct: 0, wrong: 0, skipped: 0 };
}

function bumpWordStat(lemma, field) {
  if (!lemma || !["correct", "wrong", "skipped"].includes(field)) return;
  if (!wordStats[lemma]) wordStats[lemma] = { correct: 0, wrong: 0, skipped: 0 };
  wordStats[lemma][field]++;
  saveWordStatsToStorage();
}

function computeWordSelectionWeight(word) {
  const s = getWordStat(lemmaKey(word));
  const w =
    WEIGHT_BASE + s.wrong * WEIGHT_PER_WRONG + s.skipped * WEIGHT_PER_SKIP - s.correct * WEIGHT_PER_CORRECT;
  return Math.max(WEIGHT_MIN, w);
}

function pickWeightedRandom(items, weightFn) {
  if (!items.length) return null;
  const weights = items.map((it) => {
    const x = weightFn(it);
    return Number.isFinite(x) && x > 0 ? x : WEIGHT_MIN;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return pickRandom(items);
  let r = Math.random() * sum;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Сколько слов уже показано после последнего вхождения этой леммы (0 — это последнее показанное слово). */
function countWordsSinceLemma(lemma, history) {
  const lastIdx = history.lastIndexOf(lemma);
  if (lastIdx === -1) return Infinity;
  return history.length - 1 - lastIdx;
}

function nextTask(selectedKeys) {
  const usable = wordBank.filter((w) =>
    selectedKeys.every((k) => typeof w[k] === "string" && w[k]),
  );
  if (!usable.length) return null;

  let candidates = usable.filter(
    (w) => countWordsSinceLemma(lemmaKey(w), shownLemmaHistory) >= MIN_GAP_BEFORE_SAME_LEMMA,
  );

  if (!candidates.length) {
    const lastLemma =
      shownLemmaHistory.length > 0 ? shownLemmaHistory[shownLemmaHistory.length - 1] : null;
    candidates = lastLemma != null ? usable.filter((w) => lemmaKey(w) !== lastLemma) : usable.slice();
  }

  if (!candidates.length) {
    candidates = usable;
  }

  const word = pickWeightedRandom(candidates, computeWordSelectionWeight);
  const targetCase = pickRandom(selectedKeys);
  return { mode: TRAIN_MODE.CASES, word, targetCase };
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function nextVocabTask() {
  const usable = wordBank.filter(
    (w) =>
      typeof w.hint_ru === "string" &&
      w.hint_ru.trim() &&
      typeof w.nominative === "string" &&
      w.nominative,
  );
  if (usable.length < 4) return null;

  let candidates = usable.filter(
    (w) => countWordsSinceLemma(lemmaKey(w), shownLemmaHistory) >= MIN_GAP_BEFORE_SAME_LEMMA,
  );

  if (!candidates.length) {
    const lastLemma =
      shownLemmaHistory.length > 0 ? shownLemmaHistory[shownLemmaHistory.length - 1] : null;
    candidates = lastLemma != null ? usable.filter((w) => lemmaKey(w) !== lastLemma) : usable.slice();
  }

  if (!candidates.length) {
    candidates = usable;
  }

  const word = pickWeightedRandom(candidates, computeWordSelectionWeight);
  const correct = word.nominative;
  const others = usable.filter((w) => lemmaKey(w) !== lemmaKey(word));
  const picks = shuffleArray(others).slice(0, 3);
  if (picks.length < 3) return null;
  const distractors = picks.map((w) => w.nominative);
  const choices = shuffleArray([correct, ...distractors]);
  return { mode: TRAIN_MODE.VOCAB, word, choices };
}

function setSubmitLabel(answeredFlag) {
  if (els.btnSubmit) els.btnSubmit.textContent = answeredFlag ? "Далее" : "Проверить";
}

function setQuizSkipAvailable(canSkip) {
  if (els.btnSkip) els.btnSkip.disabled = !canSkip;
}

function resetQuizSkipButtonAppearance() {
  if (!els.btnSkip) return;
  els.btnSkip.textContent = "Пропустить";
  els.btnSkip.classList.remove("ghost", "start");
  els.btnSkip.classList.add("primary");
  els.btnSkip.setAttribute("aria-label", "Пропустить");
}

/** После ответа в «слова»: та же кнопка — только текст «Далее», стиль как у «Пропустить» (голубая primary). */
function morphQuizSkipToVocabNext() {
  if (!els.btnSkip) return;
  els.btnSkip.textContent = "Далее";
  els.btnSkip.disabled = false;
  els.btnSkip.setAttribute("aria-label", "Далее");
}

function renderVocabChoices(choices) {
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
function setQuizUiPhase(phase) {
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

function showQuiz(task) {
  refreshQuizElements();
  task.mode = inferQuizMode(task);

  currentTask = task;
  shownLemmaHistory.push(lemmaKey(task.word));
  answered = false;
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

function showFeedback(ok, expected, word) {
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
function finalizeVocabChoice(ok, expected, word, clickedBtn) {
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
    b.classList.remove("vocab-choice--wrong");
    if (isExpected) {
      b.disabled = false;
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
    wrongBtn?.classList.add("vocab-choice--wrong");
    if (wrongBtn) wrongBtn.disabled = true;
  }
}

function aggregateWordStatsTotals() {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  for (const row of Object.values(wordStats)) {
    const n = normalizeWordStatRow(row);
    correct += n.correct;
    wrong += n.wrong;
    skipped += n.skipped;
  }
  return { correct, wrong, skipped };
}

function buildSortedWordStatRows() {
  return Object.entries(wordStats)
    .map(([lemma, row]) => {
      const n = normalizeWordStatRow(row);
      return { lemma, correct: n.correct, wrong: n.wrong, skipped: n.skipped };
    })
    .filter((r) => r.correct + r.wrong + r.skipped > 0)
    .sort((a, b) => {
      if (b.wrong !== a.wrong) return b.wrong - a.wrong;
      if (b.skipped !== a.skipped) return b.skipped - a.skipped;
      return a.correct - b.correct;
    });
}

function renderStatsScreen() {
  const { correct, wrong, skipped } = aggregateWordStatsTotals();
  const graded = correct + wrong;
  const pctLabel = graded > 0 ? `${Math.round((100 * correct) / graded)}%` : "—";

  els.statsSummary.innerHTML = `
    <div class="stats-summary-grid">
      <div class="stats-sum-cell"><span class="stats-sum-label">Верно</span><span class="stats-sum-val">${correct}</span></div>
      <div class="stats-sum-cell"><span class="stats-sum-label">Неверно</span><span class="stats-sum-val">${wrong}</span></div>
      <div class="stats-sum-cell"><span class="stats-sum-label">Пропущено</span><span class="stats-sum-val">${skipped}</span></div>
      <div class="stats-sum-cell"><span class="stats-sum-label">Процент верных</span><span class="stats-sum-val">${pctLabel}</span></div>
    </div>
  `;

  const rows = buildSortedWordStatRows();
  els.statsTableBody.innerHTML = "";
  if (!rows.length) {
    els.statsEmpty.classList.remove("hidden");
    els.statsTable.classList.add("hidden");
  } else {
    els.statsEmpty.classList.add("hidden");
    els.statsTable.classList.remove("hidden");
    for (const r of rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(r.lemma)}</td><td>${r.correct}</td><td>${r.wrong}</td>`;
      els.statsTableBody.appendChild(tr);
    }
  }
}

function openStatsOverlay() {
  closeSettingsOverlay();
  renderStatsScreen();
  els.statsOverlay.classList.remove("hidden");
  document.body.classList.add("stats-modal-open");
  els.btnStatsClose.focus();
}

function closeStatsOverlay() {
  els.statsOverlay.classList.add("hidden");
  document.body.classList.remove("stats-modal-open");
}

function isStatsOverlayOpen() {
  return els.statsOverlay && !els.statsOverlay.classList.contains("hidden");
}

function advanceVocabQuiz() {
  if (!currentTask || currentTask.mode !== TRAIN_MODE.VOCAB || !answered) return;
  const task = nextVocabTask();
  if (!task) {
    els.feedback.classList.remove("hidden", "ok", "bad");
    els.feedback.textContent = "Слов больше нет.";
    return;
  }
  showQuiz(task);
}

function skipCurrentWord() {
  if (!currentTask || answered) return;
  bumpWordStat(lemmaKey(currentTask.word), "skipped");
  if (currentTask.mode === TRAIN_MODE.VOCAB) {
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

function bindEvents() {
  els.modePicker?.addEventListener("change", () => {
    if (!els.stepMode.classList.contains("hidden")) {
      renderWizardDots(wizardDotCountForUi());
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
        const withHint = wordBank.filter(
          (w) => typeof w.hint_ru === "string" && w.hint_ru.trim() && w.nominative,
        );
        if (withHint.length < 4) {
          els.packStepStatus.textContent =
            "Для «Изучение слов» нужно минимум 4 слова с русской подсказкой в выбранных наборах.";
          return;
        }
        shownLemmaHistory = [];
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
    if (!wordBank.length) {
      els.caseStepStatus.textContent = "Нет загруженных слов.";
      return;
    }
    saveSelectedCases(keys);
    shownLemmaHistory = [];
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
    if (!currentTask) return;
    if (currentTask.mode === TRAIN_MODE.VOCAB) return;

    const keys = getCheckedCaseKeys();
    const expected = currentTask.word[currentTask.targetCase];
    const user = els.answerInput.value;

    if (!answered) {
      const ok = answersMatch(user, expected);
      answered = true;
      setSubmitLabel(true);
      setQuizSkipAvailable(false);
      showFeedback(ok, expected, currentTask.word);
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
    if (!btn || !currentTask || currentTask.mode !== TRAIN_MODE.VOCAB) return;
    if (answered) return;

    answered = true;
    const expected = currentTask.word.nominative;
    const ok = answersMatch(btn.getAttribute("data-lemma") || "", expected);
    finalizeVocabChoice(ok, expected, currentTask.word, btn);
    morphQuizSkipToVocabNext();
  });

  els.btnSkip.addEventListener("click", () => {
    if (currentTask?.mode === TRAIN_MODE.VOCAB && answered) {
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
    if (!currentTask || els.quizShell.classList.contains("hidden")) return;
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
    currentTask = null;
    shownLemmaHistory = [];
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const hostOk =
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";
  if (!hostOk) return;

  window.addEventListener("load", () => {
    const url = new URL("sw.js", location.href).href;
    navigator.serviceWorker
      .register(url)
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn("Service worker:", err);
      });
  });
}

async function init() {
  registerServiceWorker();
  refreshQuizElements();
  wordStats = loadPersistedWordStats();
  applyTheme(loadTheme());
  syncThemeRadiosFromDom();
  renderCaseCheckboxes();
  applyTrainModeFromStorage();
  bindEvents();
  showWizardMode();
  try {
    await loadManifestAndRenderPacks();
  } catch (err) {
    els.packStepStatus.textContent =
      `Ошибка: ${err.message}. Откройте сайт через локальный сервер в папке проекта (fetch к файлам с file:// часто блокируется).`;
    console.error(err);
  }
}

init();
