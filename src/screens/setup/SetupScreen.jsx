/** Экран настройки (мастер): режим → наборы → (направление слов | падежи). */
import { TRAIN_MODE } from "js/config.js"
import { APP_VERSION } from "js/app-version.js"
import { STR } from "js/i18n/strings-ru.js"
import {
    handlePacksNextClick,
    handleStartCasesTrainingClick,
    handleVocabDirectionStartClick,
} from "js/setup-wizard-handlers.js"
import { loadTrainMode, saveExcludeLearnedWords, saveTrainMode } from "js/storage.js"
import { AppFlowScreen } from "src/components/layout/AppFlowScreen.jsx"
import { WizardCaseCheckboxes } from "src/components/setup/WizardCaseCheckboxes.jsx"
import { WizardVocabDirectionForm } from "src/components/setup/WizardVocabDirectionForm.jsx"
import { WizardPackList } from "src/components/pack-card"
import { Button } from "src/components/ui/Button.jsx"
import { CheckboxButton } from "src/components/ui/CheckboxButton.jsx"
import { useTrainerApp } from "src/context/TrainerAppContext.jsx"

function wizardStepClass(visible) {
    return ["wizard-step", !visible && "hidden"].filter(Boolean).join(" ")
}

/**
 * @param {{ heightMode?: "fill"|"scroll"; hidden?: boolean }} [props]
 */
export function SetupScreen({ heightMode = "fill", hidden = false } = {}) {
    const [uiState, dispatch] = useTrainerApp()
    const step = uiState.wizard.step
    const status = uiState.wizard.status
    const excludeLearnedWords = uiState.persisted.excludeLearnedWords
    const trainMode = loadTrainMode() || TRAIN_MODE.CASES

    const showMode = step === 1
    const showPacks = step === 2
    const showVocabDir = step === 3 && trainMode === TRAIN_MODE.VOCAB
    const showCases = step === 3 && trainMode === TRAIN_MODE.CASES

    function goWizardStep(next) {
        dispatch({ type: "WIZARD_SET_STEP", step: next })
    }

    return (
        <AppFlowScreen id="setup-shell" heightMode={heightMode} className={hidden ? "hidden" : ""}>
            <section id="setup" className="widget panel app-screen__panel">
                <div id="step-mode" className={wizardStepClass(showMode)}>
                    <header className="wizard-app-head">
                        <h2 className="wizard-home-title">
                            <span className="wizard-home-title-kicker">
                                {STR.wizard.homeKicker}
                            </span>
                            <span className="wizard-home-title-em">{STR.wizard.homeEm}</span>
                        </h2>
                    </header>
                    <div className="mode-picker">
                        <div
                            className="mode-choice-grid"
                            role="group"
                            aria-label={STR.wizard.exerciseTypeAria}
                        >
                            <Button
                                variant="modeChoice"
                                type="button"
                                data-train-mode="vocab"
                                className={
                                    trainMode === TRAIN_MODE.VOCAB
                                        ? "mode-choice-btn--active"
                                        : undefined
                                }
                                aria-pressed={trainMode === TRAIN_MODE.VOCAB}
                                onClick={() => {
                                    saveTrainMode(TRAIN_MODE.VOCAB)
                                    dispatch({ type: "WIZARD_CLEAR_STATUS" })
                                    goWizardStep(2)
                                }}
                            >
                                <span className="mode-choice-title">{STR.mode.vocabTitle}</span>
                                <span className="mode-choice-desc">{STR.mode.vocabDesc}</span>
                            </Button>
                            <Button
                                variant="modeChoice"
                                type="button"
                                data-train-mode="cases"
                                className={
                                    trainMode === TRAIN_MODE.CASES
                                        ? "mode-choice-btn--active"
                                        : undefined
                                }
                                aria-pressed={trainMode === TRAIN_MODE.CASES}
                                onClick={() => {
                                    saveTrainMode(TRAIN_MODE.CASES)
                                    dispatch({ type: "WIZARD_CLEAR_STATUS" })
                                    goWizardStep(2)
                                }}
                            >
                                <span className="mode-choice-title">{STR.mode.casesTitle}</span>
                                <span className="mode-choice-desc">{STR.mode.casesDesc}</span>
                            </Button>
                            <Button
                                variant="modeChoice"
                                type="button"
                                data-train-mode="verbs"
                                className={
                                    trainMode === TRAIN_MODE.VERBS
                                        ? "mode-choice-btn--active"
                                        : undefined
                                }
                                aria-pressed={trainMode === TRAIN_MODE.VERBS}
                                onClick={() => {
                                    saveTrainMode(TRAIN_MODE.VERBS)
                                    dispatch({ type: "WIZARD_CLEAR_STATUS" })
                                    goWizardStep(2)
                                }}
                            >
                                <span className="mode-choice-title">{STR.mode.verbsTitle}</span>
                                <span className="mode-choice-desc">{STR.mode.verbsDesc}</span>
                            </Button>
                        </div>
                    </div>
                    <p className="wizard-home-version">
                        <span className="wizard-home-version__label">{STR.app.versionLabel}</span>{" "}
                        <span className="wizard-home-version__value">{APP_VERSION}</span>
                    </p>
                </div>

                <div id="step-packs" className={wizardStepClass(showPacks)}>
                    <h2>{STR.wizard.packsHeading}</h2>
                    <WizardPackList scrollWell />
                    <CheckboxButton
                        id="exclude-learned-words"
                        className="pack-learned-filter"
                        title={STR.packs.excludeLearnedTitle}
                        meta={STR.packs.excludeLearnedMeta}
                        checked={excludeLearnedWords}
                        onChange={(e) => {
                            const next = e.target.checked
                            saveExcludeLearnedWords(next)
                            dispatch({ type: "SET_EXCLUDE_LEARNED_WORDS", value: next })
                        }}
                    />
                    <p id="pack-step-status" className="status" aria-live="polite">
                        {status.pack}
                    </p>
                    <div className="actions wizard-pack-actions">
                        <Button
                            type="button"
                            onClick={() => {
                                dispatch({ type: "WIZARD_CLEAR_STATUS", name: "pack" })
                                goWizardStep(1)
                            }}
                        >
                            {STR.packs.back}
                        </Button>
                        <Button
                            variant="primary"
                            type="button"
                            aria-label={STR.packs.next}
                            onClick={() => void handlePacksNextClick()}
                        >
                            {STR.packs.next}
                        </Button>
                    </div>
                </div>

                <div id="step-vocab-direction" className={wizardStepClass(showVocabDir)}>
                    <h2 id="vocab-direction-step-title">{STR.wizard.vocabDirectionHeading}</h2>
                    <WizardVocabDirectionForm />
                    <p id="vocab-direction-step-status" className="status" aria-live="polite">
                        {status.vocabDirection}
                    </p>
                    <div className="actions wizard-pack-actions">
                        <Button
                            type="button"
                            onClick={() => {
                                dispatch({ type: "WIZARD_CLEAR_STATUS", name: "vocabDirection" })
                                goWizardStep(2)
                            }}
                        >
                            {STR.packs.back}
                        </Button>
                        <Button
                            variant="primary"
                            type="button"
                            aria-label={STR.packs.start}
                            onClick={handleVocabDirectionStartClick}
                        >
                            {STR.packs.start}
                        </Button>
                    </div>
                </div>

                <div id="step-cases" className={wizardStepClass(showCases)}>
                    <h2>{STR.wizard.casesHeading}</h2>
                    <WizardCaseCheckboxes scrollWell />
                    <p id="case-step-status" className="status case-step-msg" aria-live="polite">
                        {status.case}
                    </p>
                    <div className="actions wizard-case-actions">
                        <Button
                            type="button"
                            onClick={() => {
                                dispatch({ type: "WIZARD_CLEAR_STATUS", name: "case" })
                                goWizardStep(2)
                            }}
                        >
                            {STR.packs.back}
                        </Button>
                        <Button
                            variant="primary"
                            type="button"
                            onClick={handleStartCasesTrainingClick}
                        >
                            {STR.packs.start}
                        </Button>
                    </div>
                </div>
            </section>
        </AppFlowScreen>
    )
}
