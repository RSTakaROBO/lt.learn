import { CUSTOM_PACK_LLM_PROMPT } from "./custom-pack-llm-prompt.js";
import { els } from "./dom.js";
import { state } from "./state.js";
import { loadCasesShowTranslation, normalizeWordStatRow } from "./storage.js";
import { escapeHtml } from "./text-utils.js";
import { syncThemeRadiosFromDom } from "./theme.js";
import { getVocabRoundSummarySnapshot } from "./vocab-round.js";

export function syncSettingsTrainingCheckbox() {
  if (els.settingsCasesShowTranslation) {
    els.settingsCasesShowTranslation.checked = loadCasesShowTranslation();
  }
}

export function openSettingsOverlay() {
  closeVocabRoundSummaryOverlay();
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
  closeVocabRoundSummaryOverlay();
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
  closeVocabRoundSummaryOverlay();
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
  closeVocabRoundSummaryOverlay();
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
  closeVocabRoundSummaryOverlay();
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

export function openVocabRoundSummaryOverlay() {
  const snap = getVocabRoundSummarySnapshot();
  closeStatsOverlay();
  closeSettingsOverlay();
  closePackPromptOverlay();
  closeHelpHub();
  const overlay = document.getElementById("vocab-round-summary-overlay");
  const body = document.getElementById("vocab-round-summary-body");
  if (!overlay || !body || !snap) return;

  const accInner =
    snap.accuracyPct == null
      ? `<span class="vocab-round-summary-stat-num">—</span>`
      : `<span class="vocab-round-summary-stat-num vocab-round-summary-stat-num--accent">${snap.accuracyPct}</span><span class="vocab-round-summary-stat-unit" aria-hidden="true">%</span>`;

  const tableBlock =
    snap.topHard.length === 0
      ? `<p class="vocab-round-summary-empty sub">За раунд не было неверных ответов по словам.</p>`
      : `<div class="vocab-round-summary-table-scroll">
          <table class="vocab-round-summary-table">
            <caption class="sr-only">Топ слов по числу ошибок</caption>
            <thead>
              <tr>
                <th scope="col" class="vocab-round-summary-th vocab-round-summary-th--num">#</th>
                <th scope="col" class="vocab-round-summary-th vocab-round-summary-th--word">Слово</th>
                <th scope="col" class="vocab-round-summary-th vocab-round-summary-th--err">Ошибок</th>
              </tr>
            </thead>
            <tbody>
              ${snap.topHard
                .map(
                  (x, i) =>
                    `<tr>
                      <td class="vocab-round-summary-td vocab-round-summary-td--num">${i + 1}</td>
                      <td class="vocab-round-summary-td vocab-round-summary-td--word" lang="lt">${escapeHtml(x.lemma)}</td>
                      <td class="vocab-round-summary-td vocab-round-summary-td--err">${x.wrong}</td>
                    </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>`;

  body.innerHTML = `
    <div class="vocab-round-summary-stats-card" aria-live="polite">
      <div class="vocab-round-summary-stat-row">
        <span class="vocab-round-summary-stat-label">Точность</span>
        <div class="vocab-round-summary-stat-val">${accInner}</div>
      </div>
      <div class="vocab-round-summary-stat-row">
        <span class="vocab-round-summary-stat-label">Максимальная серия</span>
        <div class="vocab-round-summary-stat-val">
          <span class="vocab-round-summary-stat-num vocab-round-summary-stat-num--accent">${snap.maxStreak}</span>
        </div>
      </div>
    </div>
    <div class="vocab-round-summary-section">
      <p class="vocab-round-summary-section-title">Сложнее всего дались</p>
      ${tableBlock}
    </div>
  `;

  overlay.classList.remove("hidden");
  document.body.classList.add("vocab-round-summary-modal-open");
  document.getElementById("btn-vocab-round-summary-repeat")?.focus();
}

export function closeVocabRoundSummaryOverlay() {
  const overlay = document.getElementById("vocab-round-summary-overlay");
  overlay?.classList.add("hidden");
  document.body.classList.remove("vocab-round-summary-modal-open");
}

export function isVocabRoundSummaryOpen() {
  const overlay = document.getElementById("vocab-round-summary-overlay");
  return !!(overlay && !overlay.classList.contains("hidden"));
}

export function openPackPromptOverlay() {
  closeVocabRoundSummaryOverlay();
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
