import { applyDomI18n } from "./i18n/dom.js";
import { fmt } from "./i18n/core.js";
import { STR } from "./i18n/strings-ru.js";
import { refreshQuizElements, els } from "./dom.js";
import { bindEvents } from "./events.js";
import { loadManifestAndRenderPacks } from "./manifest-packs.js";
import { state } from "./state.js";
import { initTrainerStorage, loadPersistedWordStats } from "./storage.js";
import { applyTheme, loadTheme, syncThemeRadiosFromDom, updateThemeColorMeta } from "./theme.js";
import {
  applyTrainModeFromStorage,
  applyVocabDirectionCheckboxesFromStorage,
  renderCaseCheckboxes,
  showWizardMode,
} from "./wizard.js";
import { syncSettingsTrainingCheckbox } from "./overlays.js";

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
  applyDomI18n();
  registerServiceWorker();
  refreshQuizElements();
  initTrainerStorage();
  state.wordStats = loadPersistedWordStats();
  const savedTheme = loadTheme();
  if (savedTheme) applyTheme(savedTheme);
  else updateThemeColorMeta();
  syncThemeRadiosFromDom();
  syncSettingsTrainingCheckbox();
  renderCaseCheckboxes();
  applyTrainModeFromStorage();
  applyVocabDirectionCheckboxesFromStorage();
  bindEvents();
  showWizardMode();
  try {
    await loadManifestAndRenderPacks();
  } catch (err) {
    els.packStepStatus.textContent = fmt(STR.main.loadManifestError, {
      message: err instanceof Error ? err.message : String(err),
    });
    console.error(err);
  }
}

init();
