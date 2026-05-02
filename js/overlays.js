import { CUSTOM_PACK_LLM_PROMPT } from "./custom-pack-llm-prompt.js";
import { els } from "./dom.js";
import { state } from "./state.js";
import { loadCasesShowTranslation, normalizeWordStatRow } from "./storage.js";
import { escapeHtml } from "./text-utils.js";
import { syncThemeRadiosFromDom } from "./theme.js";

export function syncSettingsTrainingCheckbox() {
  if (els.settingsCasesShowTranslation) {
    els.settingsCasesShowTranslation.checked = loadCasesShowTranslation();
  }
}

export function openSettingsOverlay() {
  closeStatsOverlay();
  closePackPromptOverlay();
  closeHelpHub();
  syncThemeRadiosFromDom();
  syncSettingsTrainingCheckbox();
  els.settingsOverlay?.classList.remove("hidden");
  document.body.classList.add("settings-modal-open");
  els.btnSettingsClose?.focus();
}

export function closeSettingsOverlay() {
  els.settingsOverlay?.classList.add("hidden");
  document.body.classList.remove("settings-modal-open");
}

export function closeHelpHub() {
  els.helpHubOverlay?.classList.add("hidden");
  document.body.classList.remove("help-hub-modal-open");
}

export function openHelpHub() {
  closeStatsOverlay();
  closeSettingsOverlay();
  closePackPromptOverlay();
  els.helpHubOverlay?.classList.remove("hidden");
  document.body.classList.add("help-hub-modal-open");
  els.btnHelpHubClose?.focus();
}

export function isHelpHubOpen() {
  return !!(els.helpHubOverlay && !els.helpHubOverlay.classList.contains("hidden"));
}

export function isSettingsOverlayOpen() {
  return els.settingsOverlay && !els.settingsOverlay.classList.contains("hidden");
}

export function isCasesHelpOpen() {
  return els.casesHelpShell && !els.casesHelpShell.classList.contains("hidden");
}

export function isVerbsHelpOpen() {
  return els.verbsHelpShell && !els.verbsHelpShell.classList.contains("hidden");
}

export function openCasesHelp() {
  closeHelpHub();
  closeStatsOverlay();
  closeSettingsOverlay();
  closePackPromptOverlay();
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

export function closeCasesHelp() {
  if (!els.casesHelpShell) return;
  els.casesHelpShell.classList.add("hidden");
  els.setup.classList.remove("hidden");
}

export function openVerbsHelp() {
  closeHelpHub();
  closeStatsOverlay();
  closeSettingsOverlay();
  closePackPromptOverlay();
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

export function closeVerbsHelp() {
  if (!els.verbsHelpShell) return;
  els.verbsHelpShell.classList.add("hidden");
  els.setup.classList.remove("hidden");
}

function aggregateWordStatsTotals() {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  for (const row of Object.values(state.wordStats)) {
    const n = normalizeWordStatRow(row);
    correct += n.correct;
    wrong += n.wrong;
    skipped += n.skipped;
  }
  return { correct, wrong, skipped };
}

function buildSortedWordStatRows() {
  return Object.entries(state.wordStats)
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

export function openStatsOverlay() {
  closePackPromptOverlay();
  closeSettingsOverlay();
  closeHelpHub();
  renderStatsScreen();
  els.statsOverlay.classList.remove("hidden");
  document.body.classList.add("stats-modal-open");
  els.btnStatsClose.focus();
}

export function closeStatsOverlay() {
  els.statsOverlay.classList.add("hidden");
  document.body.classList.remove("stats-modal-open");
}

export function isStatsOverlayOpen() {
  return els.statsOverlay && !els.statsOverlay.classList.contains("hidden");
}

export function openPackPromptOverlay() {
  closeStatsOverlay();
  closeSettingsOverlay();
  closeHelpHub();
  if (els.packPromptTextarea) els.packPromptTextarea.value = CUSTOM_PACK_LLM_PROMPT;
  els.packPromptOverlay?.classList.remove("hidden");
  document.body.classList.add("pack-prompt-modal-open");
  if (els.btnPackPromptCopy) els.btnPackPromptCopy.textContent = "Скопировать";
  requestAnimationFrame(() => {
    els.packPromptTitle?.focus({ preventScroll: true });
  });
}

export function closePackPromptOverlay() {
  els.packPromptOverlay?.classList.add("hidden");
  document.body.classList.remove("pack-prompt-modal-open");
}

export function isPackPromptOverlayOpen() {
  return els.packPromptOverlay && !els.packPromptOverlay.classList.contains("hidden");
}
