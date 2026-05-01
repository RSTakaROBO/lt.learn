import { refreshQuizElements, els } from "./dom.js";
import { bindEvents } from "./events.js";
import { loadManifestAndRenderPacks } from "./manifest-packs.js";
import { state } from "./state.js";
import { loadPersistedWordStats } from "./storage.js";
import { applyTheme, loadTheme, syncThemeRadiosFromDom } from "./theme.js";
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
  registerServiceWorker();
  refreshQuizElements();
  state.wordStats = loadPersistedWordStats();
  applyTheme(loadTheme());
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
    els.packStepStatus.textContent =
      `Ошибка: ${err.message}. Откройте сайт через локальный сервер в папке проекта (fetch к файлам с file:// часто блокируется).`;
    console.error(err);
  }
}

init();
