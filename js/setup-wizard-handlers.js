import { TRAIN_MODE } from "./config.js"
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
    getResolvedVocabDirections,
    loadSelectedPacks,
    loadTrainMode,
    saveSelectedCases,
    saveSelectedPacks,
    saveVocabDirections,
} from "./storage.js"
import { clearVocabRound, initVocabRound } from "./vocab-round.js"
import { isCompleteVerbEntry, wordLemma } from "./word-entry.js"
import { hasWordRu } from "./wordTranslations.js"
import { nextTask, nextVerbTask, nextVocabTask } from "./word-selection.js"
import { resetVocabCorrectStreak, showQuiz } from "./quiz.js"

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
    const withHint = getEngine().wordBank.filter((w) => hasWordRu(w) && wordLemma(w))
    const dirsNow = getResolvedVocabDirections()
    const needChoices = !dirsNow.hardcore && withHint.length < 4
    const needAny = dirsNow.hardcore && withHint.length < 1
    if (needChoices || needAny) {
        setWizardStatus(
            "vocabDirection",
            dirsNow.hardcore ? STR.events.vocabNeedRuOne : STR.events.vocabNeedRuFour
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
            getResolvedVocabDirections().hardcore
                ? STR.events.vocabStartHardcoreFail
                : STR.events.vocabStartChoicesFail
        )
        return
    }
    showQuiz(task)
}

export async function handlePacksNextClick() {
    clearWizardStatus("pack")
    clearWizardStatus("case")
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
            const withHint = getEngine().wordBank.filter((w) => hasWordRu(w) && wordLemma(w))
            const hardcore = getResolvedVocabDirections().hardcore
            if ((!hardcore && withHint.length < 4) || (hardcore && withHint.length < 1)) {
                setWizardStatus(
                    "pack",
                    hardcore ? STR.events.vocabAfterPackHardcore : STR.events.vocabAfterPackFour
                )
                return
            }
            postTrainerUiAction({ type: "WIZARD_SET_STEP", step: 3 })
            return
        }
        if (loadTrainMode() === TRAIN_MODE.VERBS) {
            const verbs = getEngine().wordBank.filter(isCompleteVerbEntry)
            if (!verbs.length) {
                setWizardStatus("pack", STR.events.verbsAfterPack)
                return
            }
            saveSelectedPacks(ids)
            clearVocabRound()
            mutateEngine((e) => {
                e.shownLemmaHistory = []
            })
            resetVocabCorrectStreak()
            if (!initVocabRound(TRAIN_MODE.VERBS)) {
                setWizardStatus("pack", STR.events.verbsAfterPack)
                return
            }
            const task = nextVerbTask()
            if (!task) {
                setWizardStatus("pack", STR.events.verbsStartFail)
                return
            }
            showQuiz(task)
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
    clearVocabRound()
    mutateEngine((e) => {
        e.shownLemmaHistory = []
    })
    const task = nextTask(keys)
    if (!task) {
        setWizardStatus("case", STR.events.noMatchingWords)
        return
    }
    clearWizardStatus("case")
    resetVocabCorrectStreak()
    showQuiz(task)
}
