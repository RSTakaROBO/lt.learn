import { useEffect } from "react";

import { THEME_IDS } from "../../../js/config.js";
import { STR } from "../../../js/i18n/strings-ru.js";
import { refreshCasesLemmaDisplayIfActive } from "../../../js/quiz.js";
import { saveCasesShowTranslation } from "../../../js/storage.js";
import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx";
import { CheckboxButton } from "../../components/ui/CheckboxButton.jsx";
import { ListHolder } from "../../components/ui/ListHolder.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { useTrainerApp } from "../../context/TrainerAppContext.jsx";

/**
 * Настройки: тема и опции тренировки.
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function SettingsScreen({ heightMode = "fill" } = {}) {
  const [state, dispatch] = useTrainerApp();
  const open = state.overlay.settings;
  const { themeId, casesShowTranslation } = state.persisted;

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => document.getElementById("btn-settings-close")?.focus());
  }, [open]);

  return (
    <AppFlowScreen
      id="settings-shell"
      heightMode={heightMode}
      className={["settings-shell", !open && "hidden"].filter(Boolean).join(" ")}
    >
      <section id="settings" className="app-screen__panel widget panel" aria-labelledby="settings-title">
        <h2 id="settings-title" tabIndex={-1} />
        <div className="app-screen__body">
          <div className="settings-theme-block">
            <p className="sub" />
            <div id="theme-picker" className="theme-picker case-grid" role="radiogroup">
              {THEME_IDS.map((value) => (
                <label key={value} className="case-option theme-option">
                  <input
                    type="radio"
                    name="app-theme"
                    value={value}
                    checked={themeId === value}
                    onChange={() => {
                      dispatch({ type: "SET_THEME", value });
                    }}
                  />
                  <div>
                    <div className="case-title" />
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="settings-training-block">
            <ListHolder className="settings-training-options-list">
              <CheckboxButton
                id="settings-cases-show-translation"
                title={STR.settings.casesTranslationTitle}
                meta={STR.settings.casesTranslationMeta}
                checked={casesShowTranslation}
                onChange={(e) => {
                  const v = e.target.checked;
                  dispatch({ type: "SET_CASES_SHOW_TRANSLATION", value: v });
                  saveCasesShowTranslation(v);
                  refreshCasesLemmaDisplayIfActive();
                }}
              />
            </ListHolder>
          </div>
        </div>
        <div className="app-screen__footer actions app-screen__footer--single">
          <Button
            variant="primary"
            type="button"
            id="btn-settings-close"
            className="stats-close-btn"
            onClick={() => dispatch({ type: "OVERLAY_CLOSE", name: "settings" })}
          />
        </div>
      </section>
    </AppFlowScreen>
  );
}
