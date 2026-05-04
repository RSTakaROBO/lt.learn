import { caseRu } from "./core.js";
import { STR } from "./strings-ru.js";

function setAria(el, label) {
  if (el && label) el.setAttribute("aria-label", label);
}

function setTitleAttr(el, t) {
  if (el && t) el.setAttribute("title", t);
}

function fillPackCard(inputId, title, meta) {
  const input = document.getElementById(inputId);
  const label = input?.closest("label.pack-card");
  if (!label) return;
  const tEl = label.querySelector(".pack-card-title");
  const mEl = label.querySelector(".pack-card-meta");
  if (tEl) tEl.textContent = title;
  if (mEl) mEl.textContent = meta;
}

function setCasesHelpTableHeaders() {
  const H = STR.help;
  document.querySelectorAll("#cases-help .cases-help-table--one-case thead tr th:nth-child(1)").forEach((th) => {
    th.textContent = H.tableStem;
  });
  document.querySelectorAll("#cases-help .cases-help-table--one-case thead tr th:nth-child(2)").forEach((th) => {
    th.textContent = H.tableSg;
  });
  document.querySelectorAll("#cases-help .cases-help-table--one-case thead tr th:nth-child(3)").forEach((th) => {
    th.textContent = H.tablePl;
  });
}

function setVerbsHelpTable() {
  const H = STR.help;
  const table = document.querySelector("#verbs-help table.cases-help-table");
  if (!table) return;
  const ths = table.querySelectorAll("thead th");
  if (ths[0]) ths[0].textContent = H.verbsColPerson;
  if (ths[1]) ths[1].textContent = H.verbsColAffirm;
  if (ths[2]) ths[2].textContent = H.verbsColNeg;
  const labels = [H.verbsRow1, H.verbsRow2, H.verbsRow3, H.verbsRow4, H.verbsRow5, H.verbsRow6];
  table.querySelectorAll("tbody tr").forEach((tr, i) => {
    const th = tr.querySelector("th");
    if (!th || !labels[i]) return;
    const sub = th.querySelector(".cases-help-lt-sub");
    if (!sub) return;
    const first = th.childNodes[0];
    if (first && first.nodeType === Node.TEXT_NODE) {
      first.textContent = `${labels[i]} `;
    } else {
      th.insertBefore(document.createTextNode(`${labels[i]} `), sub);
    }
  });
}

/** Подставляет строки из STR в статическую разметку (один источник — strings-ru.js). */
export function applyDomI18n() {
  const T = STR;
  document.title = T.app.pageTitle;
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute("content", T.app.appleWebAppTitle);

  const wz = T.wizard;
  setAria(document.getElementById("wizard-progress"), wz.stagesAria);
  const kicker = document.querySelector(".wizard-home-title-kicker");
  const homeEm = document.querySelector(".wizard-home-title-em");
  if (kicker) kicker.textContent = wz.homeKicker;
  if (homeEm) homeEm.textContent = wz.homeEm;

  const modeGrid = document.querySelector("#step-mode .mode-choice-grid");
  setAria(modeGrid, wz.exerciseTypeAria);

  const bcases = document.getElementById("btn-mode-cases");
  const bvocab = document.getElementById("btn-mode-vocab");
  if (bcases) {
    const te = bcases.querySelector(".mode-choice-title");
    const de = bcases.querySelector(".mode-choice-desc");
    if (te) te.textContent = T.mode.casesTitle;
    if (de) de.textContent = T.mode.casesDesc;
  }
  if (bvocab) {
    const te = bvocab.querySelector(".mode-choice-title");
    const de = bvocab.querySelector(".mode-choice-desc");
    if (te) te.textContent = T.mode.vocabTitle;
    if (de) de.textContent = T.mode.vocabDesc;
  }

  const stepPacks = document.getElementById("step-packs");
  const packsH2 = stepPacks?.querySelector("h2");
  if (packsH2) packsH2.textContent = wz.packsHeading;

  const ph = T.packs;
  const packPromptBtn = document.getElementById("btn-pack-prompt-help");
  setAria(packPromptBtn, ph.llmPromptAria);
  setTitleAttr(packPromptBtn, ph.llmPromptTitle);
  const uploadLbl = document.querySelector(".pack-json-upload-label-text");
  if (uploadLbl) uploadLbl.textContent = ph.uploadJsonLabel;
  setAria(document.getElementById("pack-json-input"), ph.uploadJsonAria);
  const btnPacksBack = document.getElementById("btn-packs-back");
  const btnPacksNext = document.getElementById("btn-packs-next");
  if (btnPacksBack) btnPacksBack.textContent = ph.back;
  if (btnPacksNext) {
    btnPacksNext.textContent = ph.next;
    setAria(btnPacksNext, ph.next);
  }

  const vd = T.vocabDirection;
  const vdirTitle = document.getElementById("vocab-direction-step-title");
  if (vdirTitle) vdirTitle.textContent = wz.vocabDirectionHeading;
  fillPackCard("vocab-dir-ru-lt", vd.ruLtTitle, vd.ruLtMeta);
  fillPackCard("vocab-dir-lt-ru", vd.ltRuTitle, vd.ltRuMeta);
  const hcBlock = document.querySelector(".vocab-hardcore-block");
  setAria(hcBlock, vd.hardcoreBlockAria);
  fillPackCard("vocab-hardcore", vd.hardcoreTitle, vd.hardcoreMeta);
  const btnVdBack = document.getElementById("btn-vocab-direction-back");
  const btnVdStart = document.getElementById("btn-vocab-direction-start");
  if (btnVdBack) btnVdBack.textContent = ph.back;
  if (btnVdStart) {
    btnVdStart.textContent = ph.start;
    setAria(btnVdStart, ph.start);
  }

  const stepCases = document.getElementById("step-cases");
  const casesH2 = stepCases?.querySelector("h2");
  if (casesH2) casesH2.textContent = wz.casesHeading;
  const btnCasesBack = document.getElementById("btn-cases-back");
  const btnStart = document.getElementById("btn-start");
  if (btnCasesBack) btnCasesBack.textContent = ph.back;
  if (btnStart) btnStart.textContent = ph.start;

  const Q = T.quiz;
  const targetPrefix = document.querySelector(".target-prefix");
  if (targetPrefix) targetPrefix.textContent = Q.targetCasePrefix;
  const ansLabel = document.querySelector('label[for="answer-input"]');
  if (ansLabel) ansLabel.textContent = Q.answerLabel;
  const answerInput = document.getElementById("answer-input");
  if (answerInput) answerInput.placeholder = Q.answerPlaceholder;
  setAria(document.getElementById("lt-chars"), Q.ltCharsToolbarAria);
  setAria(document.getElementById("vocab-options"), Q.vocabChoicesAria);
  const vaLabel = document.querySelector('label[for="vocab-answer-input"]');
  if (vaLabel) vaLabel.textContent = Q.answerLabel;
  const vocabAns = document.getElementById("vocab-answer-input");
  if (vocabAns) vocabAns.placeholder = Q.answerPlaceholder;
  setAria(document.getElementById("vocab-lt-chars"), Q.ltCharsToolbarAria);
  const btnSkip = document.getElementById("btn-skip");
  if (btnSkip) {
    btnSkip.textContent = Q.skip;
    setAria(btnSkip, Q.skip);
  }
  const btnSubmitCases = document.getElementById("btn-quiz-submit-cases");
  if (btnSubmitCases) btnSubmitCases.textContent = Q.check;

  const H = T.help;
  const casesHelpTitle = document.getElementById("cases-help-title");
  if (casesHelpTitle) casesHelpTitle.textContent = H.casesTitle;
  document.querySelectorAll(".cases-help-ru-case").forEach((span) => {
    const key = span.dataset.caseKey;
    if (key) span.textContent = caseRu(key);
  });
  setCasesHelpTableHeaders();
  const vocNote = document.querySelector("#cases-help-shell .cases-help-case-note.sub");
  if (vocNote) vocNote.innerHTML = H.vocativeNote;

  const verbsTitle = document.getElementById("verbs-help-title");
  if (verbsTitle) verbsTitle.innerHTML = H.verbsTitleHtml;
  const vhPresent = document.getElementById("vh-but-present");
  if (vhPresent) {
    const ru = vhPresent.querySelector(".cases-help-ru-case");
    if (ru) ru.textContent = H.verbsPresent;
  }
  setVerbsHelpTable();
  const verbsNote = document.querySelector("#verbs-help .cases-help-case-note.sub");
  if (verbsNote) verbsNote.innerHTML = H.verbsNoteHtml;

  document.getElementById("btn-cases-help-close") &&
    (document.getElementById("btn-cases-help-close").textContent = H.close);
  document.getElementById("btn-verbs-help-close") &&
    (document.getElementById("btn-verbs-help-close").textContent = H.close);

  const B = T.bottomBar;
  const bb = document.querySelector(".quiz-bottom-bar");
  setAria(bb, B.toolbarAria);
  const btnStats = document.getElementById("btn-stats");
  if (btnStats) {
    setAria(btnStats, B.statsAria);
    const lbl = btnStats.querySelector(".quiz-bar-label");
    if (lbl) lbl.textContent = B.stats;
  }
  const btnBack = document.getElementById("btn-back-setup");
  if (btnBack) {
    setAria(btnBack, B.menuAria);
    const lbl = btnBack.querySelector(".quiz-bar-label");
    if (lbl) lbl.textContent = B.menu;
  }
  const btnHub = document.getElementById("btn-help-hub");
  if (btnHub) {
    setAria(btnHub, B.helpAria);
    const lbl = btnHub.querySelector(".quiz-bar-label");
    if (lbl) lbl.textContent = B.help;
  }
  const btnSet = document.getElementById("btn-settings");
  if (btnSet) {
    setAria(btnSet, B.settingsAria);
    const lbl = btnSet.querySelector(".quiz-bar-label");
    if (lbl) lbl.textContent = B.settings;
  }

  const HH = T.helpHub;
  const hubTitle = document.getElementById("help-hub-title");
  if (hubTitle) hubTitle.textContent = HH.title;
  const btnHubCases = document.getElementById("btn-help-hub-cases");
  if (btnHubCases) btnHubCases.textContent = HH.casesBtn;
  const btnHubVerbs = document.getElementById("btn-help-hub-verbs");
  if (btnHubVerbs) btnHubVerbs.innerHTML = HH.verbsBtnHtml;
  const btnHubClose = document.getElementById("btn-help-hub-close");
  if (btnHubClose) btnHubClose.textContent = HH.close;

  const VR = T.vocabRound;
  const vrs = document.getElementById("vocab-round-summary-title");
  if (vrs) vrs.textContent = VR.summaryTitle;
  const btnRep = document.getElementById("btn-vocab-round-summary-repeat");
  const btnVrOk = document.getElementById("btn-vocab-round-summary-ok");
  if (btnRep) btnRep.textContent = VR.repeat;
  if (btnVrOk) btnVrOk.textContent = VR.ok;

  const ST = T.stats;
  const statsTitle = document.getElementById("stats-title");
  if (statsTitle) statsTitle.textContent = ST.title;
  const stTable = document.getElementById("stats-table");
  if (stTable) {
    const ths = stTable.querySelectorAll("thead th");
    if (ths[0]) ths[0].textContent = ST.thWord;
    if (ths[1]) ths[1].textContent = ST.thCorrect;
    if (ths[2]) ths[2].textContent = ST.thWrong;
  }
  const stEmpty = document.getElementById("stats-empty");
  if (stEmpty) stEmpty.textContent = ST.empty;
  const btnStatsClose = document.getElementById("btn-stats-close");
  if (btnStatsClose) btnStatsClose.textContent = ST.close;

  const SE = T.settings;
  const settingsH = document.getElementById("settings-title");
  if (settingsH) settingsH.textContent = SE.title;
  const themeBlockP = document.querySelector(".settings-theme-block .sub");
  if (themeBlockP) themeBlockP.textContent = SE.themeLabel;
  setAria(document.getElementById("theme-picker"), SE.themePickerAria);
  document.querySelectorAll('#theme-picker label.case-option input[name="app-theme"]').forEach((input) => {
    const val = input.value;
    const titleEl = input.closest("label")?.querySelector(".case-title");
    if (titleEl && T.themes[val]) titleEl.textContent = T.themes[val];
  });
  const transLabel = document.querySelector('label.pack-card[for="settings-cases-show-translation"]');
  if (transLabel) {
    const tEl = transLabel.querySelector(".pack-card-title");
    const mEl = transLabel.querySelector(".pack-card-meta");
    if (tEl) tEl.textContent = SE.casesTranslationTitle;
    if (mEl) mEl.textContent = SE.casesTranslationMeta;
  }
  const btnSetClose = document.getElementById("btn-settings-close");
  if (btnSetClose) btnSetClose.textContent = SE.close;

  const PP = T.packPrompt;
  const ppt = document.getElementById("pack-prompt-title");
  if (ppt) ppt.textContent = PP.title;
  const ppl = document.querySelector(".pack-prompt-lead");
  if (ppl) ppl.textContent = PP.lead;
  const ppta = document.querySelector('label[for="pack-prompt-text"]');
  if (ppta) ppta.textContent = PP.textareaLabel;
  const btnPpCopy = document.getElementById("btn-pack-prompt-copy");
  const btnPpClose = document.getElementById("btn-pack-prompt-close");
  if (btnPpCopy) btnPpCopy.textContent = PP.copy;
  if (btnPpClose) btnPpClose.textContent = PP.close;
}
