import { configureStore, createSlice } from "@reduxjs/toolkit"
import { enableMapSet } from "immer"
import { normalizeLearningScopeSize, STORAGE_KEYS, THEME_IDS } from "./config.js"

enableMapSet()

function isValidThemeId(id) {
    return typeof id === "string" && THEME_IDS.includes(id)
}

function readInitialThemeId() {
    try {
        const t = localStorage.getItem(STORAGE_KEYS.theme)
        if (isValidThemeId(t)) return t
    } catch {
        /* ignore */
    }
    return "paper"
}

function readInitialCasesShowTranslation() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.casesShowTranslation)
        if (raw === "1") return true
        if (raw === "0") return false
    } catch {
        /* ignore */
    }
    return true
}

function readInitialVocabShowWrongTranslation() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.vocabShowWrongTranslation)
        if (raw === "1") return true
        if (raw === "0") return false
    } catch {
        /* ignore */
    }
    return false
}

function readInitialVocabShowVerbForms() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.vocabShowVerbForms)
        if (raw === "1") return true
        if (raw === "0") return false
    } catch {
        /* ignore */
    }
    return false
}

function readInitialExcludeLearnedWords() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.excludeLearnedWords)
        if (raw === "1") return true
        if (raw === "0") return false
    } catch {
        /* ignore */
    }
    return false
}

function readInitialLearningScopeSize() {
    try {
        return normalizeLearningScopeSize(localStorage.getItem(STORAGE_KEYS.learningScopeSize))
    } catch {
        return normalizeLearningScopeSize(null)
    }
}

function readInitialCasesUseNativeKeyboard() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.casesUseNativeKeyboard)
        if (raw === "1") return true
        if (raw === "0") return false
    } catch {
        /* ignore */
    }
    return false
}

function readInitialSelectedPackIds() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.packs)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? [...parsed] : []
    } catch {
        return []
    }
}

/** @typedef {"setup" | "quiz"} TrainerScreen */

/**
 * @typedef {Object} TrainerUiOverlay
 * @property {boolean} stats
 * @property {boolean} settings
 * @property {boolean} helpHub
 * @property {boolean} packPrompt
 * @property {boolean} vocabRound
 * @property {boolean} casesHelp
 * @property {boolean} verbsHelp
 * @property {boolean} verbFormsHelp
 */

/**
 * @typedef {Object} TrainerUiPersisted
 * @property {string} themeId
 * @property {boolean} casesShowTranslation
 * @property {boolean} casesUseNativeKeyboard
 * @property {boolean} vocabShowWrongTranslation
 * @property {boolean} vocabShowVerbForms
 * @property {number} learningScopeSize
 * @property {boolean} excludeLearnedWords
 */

/**
 * @typedef {Object} VocabRoundSummarySnapshot
 * @property {number | null} accuracyPct
 * @property {number} stages
 * @property {number} correct
 * @property {number} wrong
 * @property {number} maxStreak
 * @property {{ lemma: string; wrong: number }[]} topHard
 * @property {number} initialSize
 * @property {number} poolLeft
 */

/**
 * @typedef {Object} TrainerUiWizard
 * @property {number} step
 * @property {{ pack: string; case: string; vocabDirection: string }} status
 */

/**
 * @typedef {Object} QuizFeedback
 * @property {"ok" | "bad" | "info"} kind
 * @property {string} message
 * @property {string} [expected]
 * @property {string} [exceptionNote]
 */

/**
 * @typedef {Object} TrainerEngine
 * @property {unknown[]} wordBank
 * @property {unknown | null} currentTask
 * @property {boolean} answered
 * @property {string[]} shownLemmaHistory
 * @property {unknown | null} manifestCache
 * @property {Record<string, { correct: number; wrong: number; skipped: number; progress: number }>} wordStats
 * @property {number} vocabCorrectStreak
 * @property {number} vocabStreakPulseId
 * @property {unknown | null} vocabRound
 * @property {{ lemma: string; filled: number } | null} vocabRoundDots
 * @property {{ pickedLemma: string; correctLemma: string; ok: boolean | null } | null} vocabChoice
 * @property {{ revealed: boolean; scored: boolean; lockedWrong: boolean; ok: boolean | null } | null} vocabSingle
 * @property {unknown | null} vocabSingleNextTask
 * @property {string[]} selectedCaseKeys
 */

/**
 * @typedef {{ pack: object; title: string; wordCountsByMode: Record<string, { total: number; suitable: number } | null>; safeInputId: string }} ManifestPackRowUi
 */

/**
 * @typedef {Object} TrainerPacksUi
 * @property {ManifestPackRowUi[]} packRows Строки списка паков после загрузки манифеста.
 * @property {string[]} selectedPackIds Выбранные id (синхрон с localStorage через saveSelectedPacks).
 */

/**
 * @typedef {Object} TrainerUiState
 * @property {TrainerScreen} screen
 * @property {TrainerUiOverlay} overlay
 * @property {TrainerUiPersisted} persisted
 * @property {VocabRoundSummarySnapshot | null} vocabRoundSummary
 * @property {QuizFeedback | null} quizFeedback
 * @property {TrainerUiWizard} wizard
 * @property {TrainerEngine} engine
 * @property {TrainerPacksUi} manifestUi
 */

/**
 * @typedef {(
 *   | { type: "OVERLAY_OPEN"; name: keyof TrainerUiOverlay; snapshot?: VocabRoundSummarySnapshot | null }
 *   | { type: "OVERLAY_CLOSE"; name: keyof TrainerUiOverlay }
 *   | { type: "OVERLAY_CLOSE_ALL" }
 *   | { type: "SCREEN_SET"; screen: TrainerScreen }
 *   | { type: "SET_THEME"; value: string }
 *   | { type: "SET_CASES_SHOW_TRANSLATION"; value: boolean }
 *   | { type: "SET_CASES_USE_NATIVE_KEYBOARD"; value: boolean }
 *   | { type: "SET_VOCAB_SHOW_WRONG_TRANSLATION"; value: boolean }
 *   | { type: "SET_VOCAB_SHOW_VERB_FORMS"; value: boolean }
 *   | { type: "SET_LEARNING_SCOPE_SIZE"; value: number }
 *   | { type: "SET_EXCLUDE_LEARNED_WORDS"; value: boolean }
 *   | { type: "WIZARD_SET_STEP"; step: number }
 *   | { type: "WIZARD_SET_STATUS"; name: "pack" | "case" | "vocabDirection"; message: string }
 *   | { type: "WIZARD_CLEAR_STATUS"; name?: "pack" | "case" | "vocabDirection" }
 *   | { type: "QUIZ_SET_FEEDBACK"; feedback: QuizFeedback }
 *   | { type: "QUIZ_CLEAR_FEEDBACK" }
 * )} TrainerUiAction
 */

function buildInitialState() {
    return {
        screen: "setup",
        overlay: {
            stats: false,
            settings: false,
            helpHub: false,
            packPrompt: false,
            vocabRound: false,
            casesHelp: false,
            verbsHelp: false,
            verbFormsHelp: false,
        },
        persisted: {
            themeId: readInitialThemeId(),
            casesShowTranslation: readInitialCasesShowTranslation(),
            casesUseNativeKeyboard: readInitialCasesUseNativeKeyboard(),
            vocabShowWrongTranslation: readInitialVocabShowWrongTranslation(),
            vocabShowVerbForms: readInitialVocabShowVerbForms(),
            learningScopeSize: readInitialLearningScopeSize(),
            excludeLearnedWords: readInitialExcludeLearnedWords(),
        },
        vocabRoundSummary: null,
        quizFeedback: null,
        wizard: {
            step: 1,
            status: {
                pack: "",
                case: "",
                vocabDirection: "",
            },
        },
        engine: {
            wordBank: [],
            currentTask: null,
            answered: false,
            shownLemmaHistory: [],
            manifestCache: null,
            wordStats: {},
            vocabCorrectStreak: 0,
            vocabStreakPulseId: 0,
            vocabRound: null,
            vocabRoundDots: null,
            vocabChoice: null,
            vocabSingle: null,
            vocabSingleNextTask: null,
            selectedCaseKeys: [],
        },
        manifestUi: {
            packRows: [],
            selectedPackIds: readInitialSelectedPackIds(),
        },
    }
}

const trainerSlice = createSlice({
    name: "trainer",
    initialState: buildInitialState(),
    reducers: {
        /**
         * Императивные изменения движка (квиз, паки, хранилище) через Immer-черновик.
         * @param {import("@reduxjs/toolkit").PayloadAction<(e: import("immer").WritableDraft<TrainerEngine>) => void>} action
         */
        runEngineRecipe(state, action) {
            action.payload(state.engine)
        },
        receiveTrainerUiAction(state, action) {
            const a = /** @type {TrainerUiAction} */ (action.payload)
            switch (a.type) {
                case "OVERLAY_CLOSE_ALL":
                    state.overlay.stats = false
                    state.overlay.settings = false
                    state.overlay.helpHub = false
                    state.overlay.packPrompt = false
                    state.overlay.vocabRound = false
                    state.overlay.casesHelp = false
                    state.overlay.verbsHelp = false
                    state.overlay.verbFormsHelp = false
                    state.vocabRoundSummary = null
                    break
                case "OVERLAY_OPEN": {
                    const name = a.name
                    state.overlay.stats = name === "stats"
                    state.overlay.settings = name === "settings"
                    state.overlay.helpHub = name === "helpHub"
                    state.overlay.packPrompt = name === "packPrompt"
                    state.overlay.vocabRound = name === "vocabRound"
                    state.overlay.casesHelp = name === "casesHelp"
                    state.overlay.verbsHelp = name === "verbsHelp"
                    state.overlay.verbFormsHelp = name === "verbFormsHelp"
                    state.vocabRoundSummary =
                        name === "vocabRound"
                            ? (a.snapshot ?? state.vocabRoundSummary)
                            : state.vocabRoundSummary
                    break
                }
                case "OVERLAY_CLOSE":
                    state.overlay[a.name] = false
                    if (a.name === "vocabRound") state.vocabRoundSummary = null
                    break
                case "SCREEN_SET":
                    state.screen = a.screen === "quiz" ? "quiz" : "setup"
                    break
                case "SET_THEME":
                    state.persisted.themeId = a.value
                    break
                case "SET_CASES_SHOW_TRANSLATION":
                    state.persisted.casesShowTranslation = a.value
                    break
                case "SET_CASES_USE_NATIVE_KEYBOARD":
                    state.persisted.casesUseNativeKeyboard = a.value
                    break
                case "SET_VOCAB_SHOW_WRONG_TRANSLATION":
                    state.persisted.vocabShowWrongTranslation = a.value
                    break
                case "SET_VOCAB_SHOW_VERB_FORMS":
                    state.persisted.vocabShowVerbForms = a.value
                    break
                case "SET_LEARNING_SCOPE_SIZE":
                    state.persisted.learningScopeSize = normalizeLearningScopeSize(a.value)
                    break
                case "SET_EXCLUDE_LEARNED_WORDS":
                    state.persisted.excludeLearnedWords = a.value
                    break
                case "WIZARD_SET_STEP": {
                    const step = Math.min(3, Math.max(1, Math.floor(Number(a.step)) || 1))
                    state.wizard.step = step
                    break
                }
                case "WIZARD_SET_STATUS": {
                    state.wizard.status[a.name] = String(a.message ?? "")
                    break
                }
                case "WIZARD_CLEAR_STATUS": {
                    if (a.name) {
                        state.wizard.status[a.name] = ""
                    } else {
                        state.wizard.status.pack = ""
                        state.wizard.status.case = ""
                        state.wizard.status.vocabDirection = ""
                    }
                    break
                }
                case "QUIZ_SET_FEEDBACK":
                    state.quizFeedback = a.feedback
                    break
                case "QUIZ_CLEAR_FEEDBACK":
                    state.quizFeedback = null
                    break
                default:
                    break
            }
        },
        manifestSetPackRows(state, action) {
            state.manifestUi.packRows = action.payload
        },
        manifestSetSelectedPackIds(state, action) {
            state.manifestUi.selectedPackIds = action.payload
        },
        manifestClearPackRows(state) {
            state.manifestUi.packRows = []
        },
    },
})

export const {
    runEngineRecipe,
    receiveTrainerUiAction,
    manifestSetPackRows,
    manifestSetSelectedPackIds,
    manifestClearPackRows,
} = trainerSlice.actions

/** @returns {TrainerUiState} */
export function createTrainerUiInitialState() {
    return trainerSlice.getInitialState()
}

export const trainerStore = configureStore({
    reducer: {
        trainer: trainerSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [`${trainerSlice.name}/runEngineRecipe`],
                ignoredPaths: ["trainer.engine.vocabRound.pool"],
            },
        }),
})

/**
 * @param {(e: TrainerEngine) => void} recipe
 */
export function mutateEngine(recipe) {
    trainerStore.dispatch(runEngineRecipe(recipe))
}

/** @returns {TrainerEngine} */
export function getEngine() {
    return trainerStore.getState().trainer.engine
}

export function getLearningScopeSize() {
    return trainerStore.getState().trainer.persisted.learningScopeSize
}

/** @returns {TrainerScreen} */
export function getActiveTrainerScreen() {
    return trainerStore.getState().trainer.screen
}

/**
 * @param {TrainerUiAction} action
 */
export function postTrainerUiAction(action) {
    trainerStore.dispatch(receiveTrainerUiAction(action))
}

/**
 * @param {"pack" | "case" | "vocabDirection"} name
 * @param {string} message
 */
export function setWizardStatus(name, message) {
    postTrainerUiAction({ type: "WIZARD_SET_STATUS", name, message })
}

/**
 * @param {"pack" | "case" | "vocabDirection"} [name]
 */
export function clearWizardStatus(name) {
    postTrainerUiAction({ type: "WIZARD_CLEAR_STATUS", name })
}

/**
 * @param {QuizFeedback} feedback
 */
export function setQuizFeedback(feedback) {
    postTrainerUiAction({ type: "QUIZ_SET_FEEDBACK", feedback })
}

export function clearQuizFeedback() {
    postTrainerUiAction({ type: "QUIZ_CLEAR_FEEDBACK" })
}

export function getCheckedCaseKeys() {
    const k = trainerStore.getState().trainer.engine.selectedCaseKeys
    return Array.isArray(k) ? [...k] : []
}

export function isHelpHubOpen() {
    return !!trainerStore.getState().trainer.overlay.helpHub
}

export function isSettingsOverlayOpen() {
    return !!trainerStore.getState().trainer.overlay.settings
}

export function isCasesHelpOpen() {
    return !!trainerStore.getState().trainer.overlay.casesHelp
}

export function isVerbsHelpOpen() {
    return !!trainerStore.getState().trainer.overlay.verbsHelp
}

export function isVerbFormsHelpOpen() {
    return !!trainerStore.getState().trainer.overlay.verbFormsHelp
}

export function isStatsOverlayOpen() {
    return !!trainerStore.getState().trainer.overlay.stats
}

export function isPackPromptOverlayOpen() {
    return !!trainerStore.getState().trainer.overlay.packPrompt
}

export function isVocabRoundSummaryOpen() {
    return !!trainerStore.getState().trainer.overlay.vocabRound
}

export function closePackPromptOverlay() {
    postTrainerUiAction({ type: "OVERLAY_CLOSE", name: "packPrompt" })
}

export function openPackPromptOverlay() {
    postTrainerUiAction({ type: "OVERLAY_OPEN", name: "packPrompt" })
}
