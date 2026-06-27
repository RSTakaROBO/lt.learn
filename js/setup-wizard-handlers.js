import { TRAIN_MODE, VERB_MODE, VOCAB_MODE } from "./config.js"
import { parseCustomPackJsonFile } from "./custom-packs.js"
import { fmt } from "./i18n/core.js"
import { STR } from "./i18n/strings-ru.js"
import {
    getCheckedPackIds,
    loadWordsFromFiles,
    reloadManifestPacks,
    resolveFilesFromPackIds,
} from "./packs.js"
import {
    getCheckedCaseKeys,
    getEngine,
    mutateEngine,
    postTrainerUiAction,
    clearWizardStatus,
    setWizardStatus,
} from "./trainer-ui-state.js"
import {
    appendCustomPackRecord,
    getResolvedVerbMode,
    getResolvedVocabDirections,
    loadSelectedPacks,
    loadTrainMode,
    saveSelectedCases,
    saveSelectedPacks,
    saveVocabDirections,
} from "./storage.js"
import { clearVocabRound, initVocabRound } from "./vocab-round.js"
import { resetVocabCorrectStreak, showQuiz } from "./quiz.js"
import { nextCasesTask } from "../src/screens/quiz/cases/casesTask.js"
import { isVocabTrainingWord } from "../src/screens/quiz/vocab/vocabWords.js"
import { nextVocabTask } from "../src/screens/quiz/vocab/vocabTask.js"
import {
    isVerbCardsTrainingWord,
    isVerbsTrainingWord,
} from "../src/screens/quiz/verbs/verbsWords.js"
import { nextVerbTask } from "../src/screens/quiz/verbs/verbsTask.js"

export async function handlePackJsonInputChange(/** @type {Event} */ ev) {
    const target = ev.target
    if (!(target instanceof HTMLInputElement)) return
    const file = target.files?.[0]
    target.value = ""
    if (!file) return
    clearWizardStatus("pack")
    try {
        const text = await file.text()
        const record = parseCustomPackJsonFile(text)
        appendCustomPackRecord(record)
        const sel = loadSelectedPacks()
        if (sel && sel.length > 0) saveSelectedPacks([...sel, record.id])
        const ok = await reloadManifestPacks()
        if (ok) {
            setWizardStatus(
                "pack",
                fmt(STR.events.packAdded, {
                    title: record.title,
                    count: record.words.length,
                })
            )
        }
    } catch (err) {
        setWizardStatus("pack", err instanceof Error ? err.message : String(err))
        console.error(err)
    }
}

export function handleVocabDirectionStartClick() {
    clearWizardStatus("vocabDirection")
    const dirsTry = getResolvedVocabDirections()
    if (!dirsTry.ru_to_lt && !dirsTry.lt_to_ru) {
        setWizardStatus("vocabDirection", STR.events.pickVocabDir)
        return
    }
    saveVocabDirections(dirsTry)
    const withHint = getEngine().wordBank.filter(isVocabTrainingWord)
    const dirsNow = getResolvedVocabDirections()
    const vocabMode = dirsNow.vocabMode
    const needChoices = vocabMode === VOCAB_MODE.CHOICES && withHint.length < 4
    const needAny = vocabMode !== VOCAB_MODE.CHOICES && withHint.length < 1
    if (needChoices || needAny) {
        setWizardStatus(
            "vocabDirection",
            vocabMode === VOCAB_MODE.CHOICES
                ? STR.events.vocabNeedRuFour
                : STR.events.vocabNeedRuOne
        )
        return
    }
    mutateEngine((e) => {
        e.shownLemmaHistory = []
    })
    resetVocabCorrectStreak()
    if (!initVocabRound()) {
        setWizardStatus("vocabDirection", STR.events.roundNoWords)
        return
    }
    const task = nextVocabTask()
    if (!task) {
        setWizardStatus(
            "vocabDirection",
            getResolvedVocabDirections().vocabMode === VOCAB_MODE.HARDCORE
                ? STR.events.vocabStartHardcoreFail
                : STR.events.vocabStartChoicesFail
        )
        return
    }
    showQuiz(task)
}

export function handleVerbModeStartClick() {
    clearWizardStatus("verbMode")
    const verbMode = getResolvedVerbMode()
    const usable = getEngine().wordBank.filter(
        verbMode === VERB_MODE.CARDS ? isVerbCardsTrainingWord : isVerbsTrainingWord
    )
    if (!usable.length) {
        setWizardStatus(
            "verbMode",
            verbMode === VERB_MODE.CARDS ? STR.events.verbCardsAfterPack : STR.events.verbsAfterPack
        )
        return
    }
    clearVocabRound()
    mutateEngine((e) => {
        e.shownLemmaHistory = []
    })
    resetVocabCorrectStreak()
    if (!initVocabRound(TRAIN_MODE.VERBS, { verbMode })) {
        setWizardStatus(
            "verbMode",
            verbMode === VERB_MODE.CARDS ? STR.events.verbCardsAfterPack : STR.events.verbsAfterPack
        )
        return
    }
    const task = nextVerbTask({ verbMode })
    if (!task) {
        setWizardStatus("verbMode", STR.events.verbsStartFail)
        return
    }
    showQuiz(task)
}

export async function handlePacksNextClick() {
    clearWizardStatus("pack")
    clearWizardStatus("case")
    clearWizardStatus("verbMode")
    const ids = getCheckedPackIds()
    if (!ids.length) {
        setWizardStatus("pack", STR.events.pickOnePack)
        return
    }
    const files = resolveFilesFromPackIds(ids)
    if (!files.length) {
        setWizardStatus("pack", STR.events.packsNoWordFiles)
        return
    }
    setWizardStatus("pack", STR.events.loadingDictionaries)
    try {
        await loadWordsFromFiles(files)
        saveSelectedPacks(ids)
        clearWizardStatus("pack")
        clearWizardStatus("case")
        if (loadTrainMode() === TRAIN_MODE.VOCAB) {
            const withHint = getEngine().wordBank.filter(isVocabTrainingWord)
            const directions = getResolvedVocabDirections()
            const vocabMode = directions.vocabMode
            if (
                (vocabMode === VOCAB_MODE.CHOICES && withHint.length < 4) ||
                (vocabMode !== VOCAB_MODE.CHOICES && withHint.length < 1)
            ) {
                setWizardStatus(
                    "pack",
                    vocabMode === VOCAB_MODE.CHOICES
                        ? STR.events.vocabAfterPackFour
                        : STR.events.vocabAfterPackHardcore
                )
                return
            }
            postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 })
            return
        }
        if (loadTrainMode() === TRAIN_MODE.VERBS) {
            const verbs = getEngine().wordBank.filter(isVerbsTrainingWord)
            if (!verbs.length) {
                setWizardStatus("pack", STR.events.verbsAfterPack)
                return
            }
            saveSelectedPacks(ids)
            postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 })
            return
        }
        postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 })
    } catch (err) {
        setWizardStatus(
            "pack",
            fmt(STR.events.loadFailed, {
                message: err instanceof Error ? err.message : String(err),
            })
        )
        console.error(err)
    }
}

export function handleStartCasesTrainingClick() {
    clearWizardStatus("case")
    const keys = getCheckedCaseKeys()
    if (!keys.length) {
        setWizardStatus("case", STR.events.pickOneCase)
        return
    }
    if (!getEngine().wordBank.length) {
        setWizardStatus("case", STR.events.noWordsLoaded)
        return
    }
    saveSelectedCases(keys)
    if (!initVocabRound(TRAIN_MODE.CASES)) {
        setWizardStatus("case", STR.events.noMatchingWords)
        return
    }
    mutateEngine((e) => {
        e.shownLemmaHistory = []
    })
    const task = nextCasesTask(keys)
    if (!task) {
        setWizardStatus("case", STR.events.noMatchingWords)
        clearVocabRound()
        return
    }
    clearWizardStatus("case")
    resetVocabCorrectStreak()
    showQuiz(task)
}
