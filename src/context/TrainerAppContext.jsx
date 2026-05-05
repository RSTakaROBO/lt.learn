import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { receiveTrainerUiAction, trainerStore } from "../../js/trainer-ui-state.js";
import { applyTheme } from "../../js/theme.js";

const TrainerAppContext = createContext(null);

/** @type {null | { setupHidden: boolean; quizHidden: boolean }} */
let referenceHelpShellSnapshot = null;

function syncReferenceHelpShells(/** @type {boolean} */ open) {
  const setup = document.getElementById("setup-shell");
  const quiz = document.getElementById("quiz-shell");
  if (!setup || !quiz) return;

  if (open) {
    referenceHelpShellSnapshot = {
      setupHidden: setup.classList.contains("hidden"),
      quizHidden: quiz.classList.contains("hidden"),
    };
    setup.classList.add("hidden");
    quiz.classList.add("hidden");
  } else if (referenceHelpShellSnapshot) {
    const s = referenceHelpShellSnapshot;
    setup.classList.toggle("hidden", s.setupHidden);
    quiz.classList.toggle("hidden", s.quizHidden);
    referenceHelpShellSnapshot = null;
  }
}

/** @type {null | { setupHidden: boolean; quizHidden: boolean; casesHidden: boolean; verbsHidden: boolean }} */
let barScreenShellSnapshot = null;

function syncBarScreensToMainShells(/** @type {boolean} */ open, /** @type {boolean} */ wasOpen) {
  const setup = document.getElementById("setup-shell");
  const quiz = document.getElementById("quiz-shell");
  const cases = document.getElementById("cases-help-shell");
  const verbs = document.getElementById("verbs-help-shell");
  if (!setup || !quiz) return;

  if (open && !wasOpen) {
    barScreenShellSnapshot = {
      setupHidden: setup.classList.contains("hidden"),
      quizHidden: quiz.classList.contains("hidden"),
      casesHidden: cases?.classList.contains("hidden") ?? true,
      verbsHidden: verbs?.classList.contains("hidden") ?? true,
    };
    setup.classList.add("hidden");
    quiz.classList.add("hidden");
    cases?.classList.add("hidden");
    verbs?.classList.add("hidden");
    document.body.classList.remove("help-reference-open");
  } else if (!open && wasOpen) {
    const skipRestore =
      document.body.classList.contains("help-reference-open") ||
      (cases && !cases.classList.contains("hidden")) ||
      (verbs && !verbs.classList.contains("hidden"));
    if (!skipRestore && barScreenShellSnapshot) {
      const s = barScreenShellSnapshot;
      setup.classList.toggle("hidden", s.setupHidden);
      quiz.classList.toggle("hidden", s.quizHidden);
      cases?.classList.toggle("hidden", s.casesHidden ?? true);
      verbs?.classList.toggle("hidden", s.verbsHidden ?? true);
    }
    barScreenShellSnapshot = null;
  }
}

/** @returns {[import("../../js/trainer-ui-state.js").TrainerUiState, import("react").Dispatch<any>]} */
export function useTrainerApp() {
  const v = useContext(TrainerAppContext);
  if (!v) throw new Error("useTrainerApp вне TrainerAppProvider");
  return v;
}

function TrainerAppBridge({ children }) {
  const state = useSelector((s) => s.trainer);
  const dispatchRedux = useDispatch();
  const dispatch = useCallback(
    (/** @type {import("../../js/trainer-ui-state.js").TrainerUiAction} */ action) => {
      dispatchRedux(receiveTrainerUiAction(action));
    },
    [dispatchRedux],
  );
  const barScreensOpenPrev = useRef(false);

  useLayoutEffect(() => {
    applyTheme(state.persisted.themeId);
  }, [state.persisted.themeId]);

  useLayoutEffect(() => {
    syncReferenceHelpShells(!!(state.overlay.casesHelp || state.overlay.verbsHelp));
  }, [state.overlay.casesHelp, state.overlay.verbsHelp]);

  useEffect(() => {
    document.body.classList.toggle(
      "help-reference-open",
      !!(state.overlay.casesHelp || state.overlay.verbsHelp),
    );
  }, [state.overlay.casesHelp, state.overlay.verbsHelp]);

  useEffect(() => {
    const o = state.overlay;
    document.body.classList.toggle("pack-prompt-modal-open", o.packPrompt);
    document.body.classList.toggle("vocab-round-summary-modal-open", o.vocabRound);
  }, [state.overlay.packPrompt, state.overlay.vocabRound]);

  useEffect(() => {
    const o = state.overlay;
    const open = !!(o.stats || o.settings || o.helpHub);
    syncBarScreensToMainShells(open, barScreensOpenPrev.current);
    barScreensOpenPrev.current = open;
  }, [state.overlay.stats, state.overlay.settings, state.overlay.helpHub]);

  return <TrainerAppContext.Provider value={[state, dispatch]}>{children}</TrainerAppContext.Provider>;
}

export function TrainerAppProvider({ children }) {
  return (
    <Provider store={trainerStore}>
      <TrainerAppBridge>{children}</TrainerAppBridge>
    </Provider>
  );
}

/**
 * Dispatch legacy UI actions into Redux without subscribing to full trainer state.
 * @returns {import("react").Dispatch<import("../../js/trainer-ui-state.js").TrainerUiAction>}
 */
export function useTrainerDispatch() {
  const dispatchRedux = useDispatch();
  return useCallback(
    (/** @type {import("../../js/trainer-ui-state.js").TrainerUiAction} */ action) => {
      dispatchRedux(receiveTrainerUiAction(action));
    },
    [dispatchRedux],
  );
}
