/** Кэш ссылок на элементы DOM. */

export const els = {
  stepMode: document.getElementById("step-mode"),
  stepPacks: document.getElementById("step-packs"),
  stepVocabDirection: document.getElementById("step-vocab-direction"),
  stepCases: document.getElementById("step-cases"),
  btnModeCases: document.getElementById("btn-mode-cases"),
  btnModeVocab: document.getElementById("btn-mode-vocab"),
  wizardProgress: document.getElementById("wizard-progress"),
  packList: document.getElementById("pack-list"),
  btnPacksNext: document.getElementById("btn-packs-next"),
  btnPacksBack: document.getElementById("btn-packs-back"),
  btnCasesBack: document.getElementById("btn-cases-back"),
  packStepStatus: document.getElementById("pack-step-status"),
  vocabDirectionStepStatus: document.getElementById("vocab-direction-step-status"),
  btnVocabDirectionBack: document.getElementById("btn-vocab-direction-back"),
  btnVocabDirectionStart: document.getElementById("btn-vocab-direction-start"),
  caseCheckboxes: document.getElementById("case-checkboxes"),
  btnStart: document.getElementById("btn-start"),
  btnSubmit: document.getElementById("btn-quiz-submit-cases"),
  quizFooterActions: document.getElementById("quiz-footer-actions"),
  quizCasesUi: document.getElementById("quiz-cases-ui"),
  quizVocabUi: document.getElementById("quiz-vocab-ui"),
  vocabRuDisplay: document.getElementById("vocab-ru-display"),
  vocabOptions: document.getElementById("vocab-options"),
  caseStepStatus: document.getElementById("case-step-status"),
  setup: document.getElementById("setup"),
  quizShell: document.getElementById("quiz-shell"),
  casesHelpShell: document.getElementById("cases-help-shell"),
  casesHelpScrollBlock: document.querySelector("#cases-help .cases-help-scroll-block"),
  casesHelpTitle: document.getElementById("cases-help-title"),
  btnOpenCasesHelp: document.getElementById("btn-open-cases-help"),
  btnCasesHelpClose: document.getElementById("btn-cases-help-close"),
  verbsHelpShell: document.getElementById("verbs-help-shell"),
  verbsHelpScrollBlock: document.querySelector("#verbs-help .cases-help-scroll-block"),
  verbsHelpTitle: document.getElementById("verbs-help-title"),
  btnOpenVerbsHelp: document.getElementById("btn-open-verbs-help"),
  btnVerbsHelpClose: document.getElementById("btn-verbs-help-close"),
  lemmaDisplay: document.getElementById("lemma-display"),
  targetCaseDisplay: document.getElementById("target-case-display"),
  answerForm: document.getElementById("answer-form"),
  answerInput: document.getElementById("answer-input"),
  feedback: document.getElementById("feedback"),
  btnSkip: document.getElementById("btn-skip"),
  btnBackSetup: document.getElementById("btn-back-setup"),
  ltCharsBar: document.getElementById("lt-chars"),
  btnStats: document.getElementById("btn-stats"),
  statsOverlay: document.getElementById("stats-overlay"),
  statsSummary: document.getElementById("stats-summary"),
  statsTable: document.getElementById("stats-table"),
  statsTableBody: document.getElementById("stats-table-body"),
  statsEmpty: document.getElementById("stats-empty"),
  btnStatsClose: document.getElementById("btn-stats-close"),
  btnSettings: document.getElementById("btn-settings"),
  settingsOverlay: document.getElementById("settings-overlay"),
  btnSettingsClose: document.getElementById("btn-settings-close"),
  themePicker: document.getElementById("theme-picker"),
  settingsCasesShowTranslation: document.getElementById("settings-cases-show-translation"),
};

export function refreshQuizElements() {
  els.quizCasesUi = document.getElementById("quiz-cases-ui");
  els.quizVocabUi = document.getElementById("quiz-vocab-ui");
  els.vocabRuDisplay = document.getElementById("vocab-ru-display");
  els.vocabOptions = document.getElementById("vocab-options");
  els.quizFooterActions = document.getElementById("quiz-footer-actions");
  els.btnQuizSubmitCases = document.getElementById("btn-quiz-submit-cases");
  els.btnSkip = document.getElementById("btn-skip");
  els.btnSubmit = els.btnQuizSubmitCases;
  els.answerForm = document.getElementById("answer-form");
  els.answerInput = document.getElementById("answer-input");
  els.feedback = document.getElementById("feedback");
  els.ltCharsBar = document.getElementById("lt-chars");
  els.lemmaDisplay = document.getElementById("lemma-display");
  els.targetCaseDisplay = document.getElementById("target-case-display");
  els.stepVocabDirection = document.getElementById("step-vocab-direction");
}
