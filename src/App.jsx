import { useEffect } from "react";
import { createRoot } from "react-dom/client";

import { applyDomI18n } from "../js/i18n/dom.js";
import { bindEvents } from "../js/events.js";
import { mutateEngine, postTrainerUiAction } from "../js/trainer-ui-state.js";
import { initTrainerStorage, loadPersistedWordStats } from "../js/storage.js";

import { QuizBottomBar } from "./components/layout/QuizBottomBar.jsx";
import { ManifestPacksProvider } from "./context/ManifestPacksContext.jsx";
import { TrainerAppProvider } from "./context/TrainerAppContext.jsx";
import { CasesHelpScreen } from "./screens/help/CasesHelpScreen.jsx";
import { HelpHubScreen } from "./screens/help/HelpHubScreen.jsx";
import { VerbsHelpScreen } from "./screens/help/VerbsHelpScreen.jsx";
import { PackPromptOverlay } from "./screens/overlays/PackPromptOverlay.jsx";
import { StatsOverlay } from "./screens/overlays/StatsOverlay.jsx";
import { VocabRoundSummaryOverlay } from "./screens/overlays/VocabRoundSummaryOverlay.jsx";
import { QuizScreen } from "./screens/quiz/QuizScreen.jsx";
import { SettingsScreen } from "./screens/settings/SettingsScreen.jsx";
import { SetupScreen } from "./screens/setup/SetupScreen.jsx";

import "./styles.css";

let serviceWorkerLoadHookRegistered = false;

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const hostOk =
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";
  if (!hostOk) return;
  if (serviceWorkerLoadHookRegistered) return;
  serviceWorkerLoadHookRegistered = true;

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

export default function App() {
  useEffect(() => {
    applyDomI18n();
    registerServiceWorker();
    initTrainerStorage();
    mutateEngine((e) => {
      e.wordStats = loadPersistedWordStats();
    });
    bindEvents();
    postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 1 });
  }, []);

  return (
    <TrainerAppProvider>
      <ManifestPacksProvider>
        <div className="app">
          <SetupScreen />
          <QuizScreen />
          <CasesHelpScreen />
          <VerbsHelpScreen />
          <QuizBottomBar />
          <HelpHubScreen />
          <VocabRoundSummaryOverlay />
          <StatsOverlay />
          <SettingsScreen />
          <PackPromptOverlay heightMode="scroll" />
        </div>
      </ManifestPacksProvider>
    </TrainerAppProvider>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
