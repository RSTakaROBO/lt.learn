import { useEffect } from "react";
import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { useTrainerApp } from "../../context/TrainerAppContext.jsx";
import { postTrainerUiAction } from "../../../js/trainer-ui-state.js";

/**
 * Хаб «Справка»: переход к таблицам падежей / глаголам.
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function HelpHubScreen({ heightMode = "fill" } = {}) {
  const [state, dispatch] = useTrainerApp();
  const open = state.overlay.helpHub;

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => document.getElementById("btn-help-hub-close")?.focus());
  }, [open]);

  return (
    <AppFlowScreen
      id="help-hub-shell"
      heightMode={heightMode}
      className={["help-hub-shell", !open && "hidden"].filter(Boolean).join(" ")}
    >
      <section
        id="help-hub"
        className="app-screen__panel widget panel help-hub-panel"
        aria-labelledby="help-hub-title"
      >
        <h2 id="help-hub-title" tabIndex={-1} />
        <div className="app-screen__body">
          <div className="help-hub-actions">
            <Button
              type="button"
              id="btn-help-hub-cases"
              onClick={() => postTrainerUiAction({ type: "OVERLAY_OPEN", name: "casesHelp" })}
            />
            <Button
              type="button"
              id="btn-help-hub-verbs"
              onClick={() => postTrainerUiAction({ type: "OVERLAY_OPEN", name: "verbsHelp" })}
            />
          </div>
        </div>
        <div className="app-screen__footer actions app-screen__footer--single">
          <Button
            variant="primary"
            type="button"
            id="btn-help-hub-close"
            className="stats-close-btn"
            onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "helpHub" })}
          />
        </div>
      </section>
    </AppFlowScreen>
  );
}
