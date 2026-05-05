/** Экран настройки (мастер): режим → наборы → (направление слов | падежи). */
import { useEffect } from "react";

import { TRAIN_MODE } from "../../../js/config.js";
import { STR } from "../../../js/i18n/strings-ru.js";
import {
  handlePackJsonInputChange,
  handlePacksNextClick,
  handleStartCasesTrainingClick,
  handleVocabDirectionStartClick,
} from "../../../js/setup-wizard-handlers.js";
import { loadTrainMode, saveTrainMode } from "../../../js/storage.js";
import { openPackPromptOverlay } from "../../../js/trainer-ui-state.js";
import { AppFlowScreen } from "../../components/layout/AppFlowScreen.jsx";
import { WizardCaseCheckboxes } from "../../components/setup/WizardCaseCheckboxes.jsx";
import { WizardProgressDots } from "../../components/setup/WizardProgressDots.jsx";
import { WizardVocabDirectionForm } from "../../components/setup/WizardVocabDirectionForm.jsx";
import { WizardPackList } from "../../components/pack-card";
import { Button } from "../../components/ui/Button.jsx";
import { useTrainerApp } from "../../context/TrainerAppContext.jsx";

function wizardStepClass(visible) {
  return ["wizard-step", !visible && "hidden"].filter(Boolean).join(" ");
}

function syncPacksNextButtonPresentation() {
  const btn = document.getElementById("btn-packs-next");
  if (!(btn instanceof HTMLButtonElement)) return;
  btn.textContent = STR.packs.next;
  btn.classList.remove("start");
  btn.classList.add("primary");
  btn.setAttribute("aria-label", STR.packs.next);
}

/**
 * @param {{ heightMode?: "fill"|"scroll" }} [props]
 */
export function SetupScreen({ heightMode = "fill" } = {}) {
  const [uiState, dispatch] = useTrainerApp();
  const step = uiState.wizard.step;
  const trainMode = loadTrainMode() || TRAIN_MODE.CASES;

  const showMode = step === 1;
  const showPacks = step === 2;
  const showVocabDir = step === 3 && trainMode === TRAIN_MODE.VOCAB;
  const showCases = step === 3 && trainMode === TRAIN_MODE.CASES;

  function goWizardStep(next) {
    dispatch({ type: "WIZARD_SET_STEP", step: next });
  }

  useEffect(() => {
    if (step === 2) syncPacksNextButtonPresentation();
  }, [step]);

  return (
    <AppFlowScreen id="setup-shell" heightMode={heightMode}>
      <section id="setup" className="widget panel app-screen__panel">
        <WizardProgressDots step={step} total={3} />

        <div id="step-mode" className={wizardStepClass(showMode)}>
          <header className="wizard-app-head">
            <h2 className="wizard-home-title">
              <span className="wizard-home-title-kicker" />
              <span className="wizard-home-title-em" />
            </h2>
          </header>
          <div className="mode-picker">
            <div className="mode-choice-grid" role="group">
              <Button
                variant="modeChoice"
                type="button"
                id="btn-mode-cases"
                data-train-mode="cases"
                className={trainMode === TRAIN_MODE.CASES ? "mode-choice-btn--active" : undefined}
                aria-pressed={trainMode === TRAIN_MODE.CASES}
                onClick={() => {
                  saveTrainMode(TRAIN_MODE.CASES);
                  goWizardStep(2);
                  syncPacksNextButtonPresentation();
                }}
              >
                <span className="mode-choice-title" />
                <span className="mode-choice-desc" />
              </Button>
              <Button
                variant="modeChoice"
                type="button"
                id="btn-mode-vocab"
                data-train-mode="vocab"
                className={trainMode === TRAIN_MODE.VOCAB ? "mode-choice-btn--active" : undefined}
                aria-pressed={trainMode === TRAIN_MODE.VOCAB}
                onClick={() => {
                  saveTrainMode(TRAIN_MODE.VOCAB);
                  goWizardStep(2);
                  syncPacksNextButtonPresentation();
                }}
              >
                <span className="mode-choice-title" />
                <span className="mode-choice-desc" />
              </Button>
            </div>
          </div>
        </div>

        <div id="step-packs" className={wizardStepClass(showPacks)}>
          <h2 />
          <WizardPackList scrollWell />
          <p id="pack-step-status" className="status" aria-live="polite" />
          <div className="pack-custom-upload">
            <Button
              type="button"
              id="btn-pack-prompt-help"
              className="btn-pack-prompt-help"
              onClick={() => openPackPromptOverlay()}
            >
              ?
            </Button>
            <label className="btn ghost btn-pack-json-main pack-json-upload-label">
              <span className="pack-json-upload-label-text" />
              <input
                type="file"
                id="pack-json-input"
                className="pack-json-file-input-native"
                accept="*/*"
                onChange={(e) => void handlePackJsonInputChange(e)}
              />
            </label>
          </div>
          <div className="actions wizard-pack-actions">
            <Button
              type="button"
              id="btn-packs-back"
              onClick={() => {
                const el = document.getElementById("pack-step-status");
                if (el) el.textContent = "";
                goWizardStep(1);
              }}
            />
            <Button
              variant="primary"
              type="button"
              id="btn-packs-next"
              onClick={() => void handlePacksNextClick()}
            />
          </div>
        </div>

        <div id="step-vocab-direction" className={wizardStepClass(showVocabDir)}>
          <h2 id="vocab-direction-step-title" />
          <WizardVocabDirectionForm />
          <p id="vocab-direction-step-status" className="status" aria-live="polite" />
          <div className="actions wizard-pack-actions">
            <Button
              type="button"
              id="btn-vocab-direction-back"
              onClick={() => {
                const el = document.getElementById("vocab-direction-step-status");
                if (el) el.textContent = "";
                goWizardStep(2);
                syncPacksNextButtonPresentation();
              }}
            />
            <Button
              variant="primary"
              type="button"
              id="btn-vocab-direction-start"
              onClick={handleVocabDirectionStartClick}
            />
          </div>
        </div>

        <div id="step-cases" className={wizardStepClass(showCases)}>
          <h2 />
          <WizardCaseCheckboxes scrollWell />
          <p id="case-step-status" className="status case-step-msg" aria-live="polite" />
          <div className="actions wizard-case-actions">
            <Button
              type="button"
              id="btn-cases-back"
              onClick={() => {
                const el = document.getElementById("case-step-status");
                if (el) el.textContent = "";
                goWizardStep(2);
                syncPacksNextButtonPresentation();
              }}
            />
            <Button
              variant="primary"
              type="button"
              id="btn-start"
              onClick={handleStartCasesTrainingClick}
            />
          </div>
        </div>
      </section>
    </AppFlowScreen>
  );
}
