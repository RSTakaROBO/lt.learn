import {
    CASE_BY_KEY,
    TRAIN_MODE,
    VERB_FORM_BY_KEY,
    VERB_MODE,
    VOCAB_DIRECTION,
    VOCAB_MODE,
} from "./config.js"
import { STR } from "./i18n/strings-ru.js"
import {
    getActiveTrainerScreen,
    getCheckedCaseKeys,
    getEngine,
    getSimplifiedAnswerMode,
    mutateEngine,
    postTrainerUiAction,
    clearQuizFeedback,
    setQuizFeedback,
} from "./trainer-ui-state.js"
import { bumpWordStat, saveVocabBestStreakIfHigher } from "./storage.js"
import { answersMatch } from "./text-utils.js"
import {
    applyVocabRoundAnswer,
    applyVocabRoundSkip,
    excludeVocabRoundWord,
    openVocabRoundSummaryOverlay,
    roundLemmaKey,
    setVocabRoundLemmaDots,
} from "./vocab-round.js"
import { nextCasesTask } from "../src/screens/quiz/cases/casesTask.js"
import { nextVocabTask } from "../src/screens/quiz/vocab/vocabTask.js"
import {
    vocabLemma,
    vocabRuFeedbackLine,
    vocabRuUserMatches,
} from "../src/screens/quiz/vocab/vocabWords.js"
import { nextSentenceTask } from "../src/screens/quiz/sentences/sentenceTask.js"
import { nextVerbTask } from "../src/screens/quiz/verbs/verbsTask.js"
import { verbConjugationExpectedForTask } from "../src/screens/quiz/verbs/verbConjugation.js"
import { lemmaKey } from "../src/screens/quiz/shared/quizTaskSelection.js"

const VOCAB_STREAK_MULT_FROM = 5
const QUIZ_DEBUG_KEY = "lt-debug-quiz"
const MIN_RECENT_SINGLE_EXCLUDES = 5
const SINGLE_SWIPE_LOG_PREFIX = "[lt-single-swipe]"

function debugQuiz(event, data = {}) {
    try {
        if (localStorage.getItem(QUIZ_DEBUG_KEY) !== "1") return
        const state = getEngine()
        console.debug("[lt-debug-quiz]", event, {
            screen: getActiveTrainerScreen(),
            answered: state.answered,
            currentLemma: state.currentTask?.word ? roundLemmaKey(state.currentTask.word) : null,
            currentMode: state.currentTask?.mode ?? null,
            vocabRoundPoolSize: state.vocabRound?.pool?.size ?? null,
            ...data,
        })
    } catch {
        /* debug only */
    }
}

/** Сброс серии слов и скрытие множителя (пропуск, меню, новая сессия). */
export function resetVocabCorrectStreak() {
    mutateEngine((e) => {
        e.vocabCorrectStreak = 0
        e.vocabStreakPulseId = 0
    })
}

function isCurrentQuizTask(task) {
    if (!task?.word || !Object.values(TRAIN_MODE).includes(task.mode)) return false
    if (task.mode === TRAIN_MODE.CASES) return !!CASE_BY_KEY[task.targetCase]
    if (task.mode === TRAIN_MODE.SENTENCES) {
        return (
            Array.isArray(task.tokens) &&
            task.tokens.length > 0 &&
            Array.isArray(task.expectedWords) &&
            task.expectedWords.length > 0 &&
            typeof task.sentence?.ru === "string"
        )
    }
    if (task.mode === TRAIN_MODE.VERBS) {
        if (task.verbMode === VERB_MODE.CARDS) {
            return (
                task.vocabDirection === VOCAB_DIRECTION.RU_TO_LT &&
                task.vocabMode === VOCAB_MODE.SINGLE
            )
        }
        if (task.verbMode === VERB_MODE.FORM_CARDS) {
            return (
                task.vocabDirection === VOCAB_DIRECTION.LT_TO_LT &&
                task.vocabMode === VOCAB_MODE.SINGLE &&
                !!VERB_FORM_BY_KEY[task.hiddenVerbFormKey]
            )
        }
        if (task.verbMode === VERB_MODE.CONJUGATION) {
            return (
                typeof task.timeCueLt === "string" &&
                typeof task.pronounLt === "string" &&
                !!task.tenseKey &&
                !!task.personKey &&
                !!verbConjugationExpectedForTask(task)
            )
        }
        return !!VERB_FORM_BY_KEY[task.hiddenVerbFormKey]
    }
    if (
        !Object.values(VOCAB_DIRECTION).includes(task.vocabDirection) ||
        !Object.values(VOCAB_MODE).includes(task.vocabMode)
    ) {
        return false
    }
    return (
        task.vocabMode !== VOCAB_MODE.CHOICES ||
        (Array.isArray(task.choices) && task.choices.length >= 4)
    )
}

function isSingleCardTask(task) {
    return (
        task?.vocabMode === VOCAB_MODE.SINGLE &&
        (task.mode === TRAIN_MODE.VOCAB ||
            (task.mode === TRAIN_MODE.VERBS &&
                (task.verbMode === VERB_MODE.CARDS || task.verbMode === VERB_MODE.FORM_CARDS)))
    )
}

function singleCardTaskKey(task) {
    if (!isSingleCardTask(task)) return ""
    return [
        task.mode || "",
        task.verbMode || "",
        task.vocabDirection || "",
        task.vocabMode || "",
        task.hiddenVerbFormKey || "",
        roundLemmaKey(task.word),
    ].join(":")
}

function singleTaskDebug(task) {
    if (!task) return null
    return {
        key: singleCardTaskKey(task),
        lemma: task.word?.lemma || "",
        mode: task.mode || "",
        verbMode: task.verbMode || "",
        dir: task.vocabDirection || "",
        vocabMode: task.vocabMode || "",
        hiddenVerbFormKey: task.hiddenVerbFormKey || "",
    }
}

function singleStateDebug() {
    const state = getEngine()
    return {
        current: singleTaskDebug(state.currentTask),
        next: singleTaskDebug(state.vocabSingleNextTask),
        future: singleTaskDebug(state.vocabSingleFutureTask),
        single: state.vocabSingle,
        answered: state.answered,
        poolSize: state.vocabRound?.pool?.size ?? null,
        reserveSize: state.vocabRound?.reserve?.length ?? null,
    }
}

function logSingleSwipe(event, payload = {}) {
    try {
        console.log(SINGLE_SWIPE_LOG_PREFIX, event, {
            ...payload,
            engine: singleStateDebug(),
        })
    } catch {
        /* diagnostics only */
    }
}

function isVerbFormsTask(task) {
    return (
        task?.mode === TRAIN_MODE.VERBS &&
        task.verbMode !== VERB_MODE.CARDS &&
        task.verbMode !== VERB_MODE.FORM_CARDS
    )
}

function expectedVerbAnswerForTask(task) {
    if (task?.verbMode === VERB_MODE.CONJUGATION) {
        return task.expected || verbConjugationExpectedForTask(task)
    }
    return task?.word?.forms?.[task?.hiddenVerbFormKey] || ""
}

function typedAnswerMatch(user, expected) {
    return answersMatch(user, expected, {
        simplifyLtDiacritics: getSimplifiedAnswerMode(),
    })
}

function nextSingleCardTask(sourceTask, opts) {
    if (sourceTask?.mode === TRAIN_MODE.VERBS) {
        return nextVerbTask({ ...opts, verbMode: sourceTask.verbMode || VERB_MODE.CARDS })
    }
    return nextVocabTask(opts)
}

export function showQuiz(task) {
    if (!isCurrentQuizTask(task)) return
    if (isSingleCardTask(task)) {
        logSingleSwipe("showQuiz:before", { task: singleTaskDebug(task) })
    }
    debugQuiz("showQuiz:start", {
        nextLemma: task?.word ? roundLemmaKey(task.word) : null,
        nextMode: task?.mode ?? null,
        choiceCount: Array.isArray(task?.choices) ? task.choices.length : null,
    })

    const histKey = roundLemmaKey(task.word)
    mutateEngine((e) => {
        e.currentTask = task
        if (histKey) e.shownLemmaHistory.push(histKey)
        e.answered = false
        e.vocabChoice = null
        e.vocabSingle = null
        e.vocabSingleNextTask = null
    })
    postTrainerUiAction({ type: "SCREEN_SET", screen: "quiz" })
    clearQuizFeedback()

    if (
        task.mode === TRAIN_MODE.VOCAB ||
        task.mode === TRAIN_MODE.VERBS ||
        task.mode === TRAIN_MODE.SENTENCES
    ) {
        setVocabRoundLemmaDots(task.word)
        if (isSingleCardTask(task)) {
            prepareVocabSingleNextTask(task)
            logSingleSwipe("showQuiz:after-prepare-single", { task: singleTaskDebug(task) })
        }
        return
    }

    setVocabRoundLemmaDots(getEngine().vocabRound ? task.word : null)
}

function exceptionNote(word) {
    const note =
        typeof word?.exception_note_ru === "string" && word.exception_note_ru.trim()
            ? word.exception_note_ru.trim()
            : ""
    return note
}

function recordQuizOutcome(word, ok) {
    if (word?.type === "sentence") return
    bumpWordStat(lemmaKey(word), ok ? "correct" : "wrong")
}

export function showFeedback(ok, expected, word, { showExceptionNote = true } = {}) {
    recordQuizOutcome(word, ok)
    setQuizFeedback({
        kind: ok ? "ok" : "bad",
        message: ok ? STR.quiz.correct : STR.quiz.wrong,
        expected: ok ? "" : expected,
        exceptionNote: showExceptionNote ? exceptionNote(word) : "",
    })
}

/** Режим «слова»: только подсветка кнопок; подсказки про исключения не показываем. */
export function finalizeVocabChoice(ok, expected, word, pickedLemma = "") {
    recordQuizOutcome(word, ok)
    if (ok) {
        mutateEngine((e) => {
            e.vocabCorrectStreak += 1
            if (e.vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM) e.vocabStreakPulseId += 1
        })
        saveVocabBestStreakIfHigher(getEngine().vocabCorrectStreak)
    } else {
        mutateEngine((e) => {
            if (e.vocabRound) {
                e.vocabRound.maxStreak = Math.max(e.vocabRound.maxStreak, e.vocabCorrectStreak)
            }
            e.vocabCorrectStreak = 0
            e.vocabStreakPulseId = 0
        })
    }
    applyVocabRoundAnswer(word, ok)
    clearQuizFeedback()
    const dir = getEngine().currentTask?.vocabDirection
    const correctNom = vocabLemma(word) || expected
    const correctLemma = dir === VOCAB_DIRECTION.LT_TO_RU ? vocabRuFeedbackLine(word) : correctNom
    mutateEngine((e) => {
        e.vocabChoice = {
            pickedLemma,
            correctLemma,
            ok,
        }
    })
}

function expectedVocabAnswerForTask(task) {
    if (task?.mode === TRAIN_MODE.VERBS && task.verbMode === VERB_MODE.FORM_CARDS) {
        return task.word?.forms?.[task.hiddenVerbFormKey] || ""
    }
    const dir = task?.vocabDirection
    if (dir === VOCAB_DIRECTION.LT_TO_RU) return vocabRuFeedbackLine(task?.word)
    return vocabLemma(task?.word)
}

function applyVocabAnswerOutcome(ok, expected, word) {
    mutateEngine((e) => {
        e.answered = true
        if (ok) {
            e.vocabCorrectStreak += 1
            if (e.vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM) e.vocabStreakPulseId += 1
        } else {
            if (e.vocabRound) {
                e.vocabRound.maxStreak = Math.max(e.vocabRound.maxStreak, e.vocabCorrectStreak)
            }
            e.vocabCorrectStreak = 0
            e.vocabStreakPulseId = 0
        }
    })
    if (ok) {
        saveVocabBestStreakIfHigher(getEngine().vocabCorrectStreak)
    }
    showFeedback(ok, expected, word, { showExceptionNote: false })
    applyVocabRoundAnswer(word, ok)
}

function applySentenceAnswerOutcome(ok, expected, word) {
    mutateEngine((e) => {
        e.answered = true
        if (ok) {
            e.vocabCorrectStreak += 1
            if (e.vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM) e.vocabStreakPulseId += 1
        } else {
            if (e.vocabRound) {
                e.vocabRound.maxStreak = Math.max(e.vocabRound.maxStreak, e.vocabCorrectStreak)
            }
            e.vocabCorrectStreak = 0
            e.vocabStreakPulseId = 0
        }
    })
    setQuizFeedback({
        kind: ok ? "ok" : "bad",
        message: ok ? STR.quiz.correct : STR.quiz.wrong,
        expected: ok ? "" : expected,
        exceptionNote: "",
    })
    applyVocabRoundAnswer(word, ok)
}

function recentSingleExcludeLemmas(word) {
    const current = roundLemmaKey(word)
    const recent = getEngine().shownLemmaHistory.slice(-MIN_RECENT_SINGLE_EXCLUDES)
    return [...new Set([current, ...recent].filter(Boolean))]
}

function prepareVocabSingleNextTask(sourceTask) {
    const word = sourceTask?.word
    const futureTask = getEngine().vocabSingleFutureTask
    const excludes = recentSingleExcludeLemmas(word)
    const nextTask =
        futureTask?.word && roundLemmaKey(futureTask.word) !== roundLemmaKey(word)
            ? futureTask
            : nextSingleCardTask(sourceTask, { excludeLemmas: excludes })
    mutateEngine((e) => {
        e.vocabSingleNextTask = nextTask
        if (futureTask === nextTask) e.vocabSingleFutureTask = null
    })
    logSingleSwipe("prepare-next", {
        source: singleTaskDebug(sourceTask),
        futureUsed: futureTask === nextTask,
        excludes,
        next: singleTaskDebug(nextTask),
    })
    return nextTask
}

export function requestVocabSingleNextTask() {
    const task = getEngine().currentTask
    if (!isSingleCardTask(task)) {
        logSingleSwipe("request-next:blocked", { task: singleTaskDebug(task) })
        return null
    }
    if (getEngine().vocabSingleNextTask?.word) {
        logSingleSwipe("request-next:cached", {
            task: singleTaskDebug(task),
            next: singleTaskDebug(getEngine().vocabSingleNextTask),
        })
        return getEngine().vocabSingleNextTask
    }
    logSingleSwipe("request-next:prepare", { task: singleTaskDebug(task) })
    return prepareVocabSingleNextTask(task)
}

export function requestVocabSingleFutureTask(excludeTasks = []) {
    const task = getEngine().currentTask
    if (!isSingleCardTask(task)) {
        logSingleSwipe("request-future:blocked", { task: singleTaskDebug(task) })
        return null
    }
    if (getEngine().vocabSingleFutureTask?.word) {
        logSingleSwipe("request-future:cached", {
            task: singleTaskDebug(task),
            future: singleTaskDebug(getEngine().vocabSingleFutureTask),
        })
        return getEngine().vocabSingleFutureTask
    }
    const visibleExcludes = excludeTasks.map((row) => roundLemmaKey(row?.word)).filter(Boolean)
    const nextTask = nextSingleCardTask(task, {
        excludeLemmas: [...new Set([...recentSingleExcludeLemmas(task.word), ...visibleExcludes])],
    })
    mutateEngine((e) => {
        e.vocabSingleFutureTask = nextTask
    })
    logSingleSwipe("request-future:new", {
        task: singleTaskDebug(task),
        visibleExcludes,
        future: singleTaskDebug(nextTask),
    })
    return nextTask
}

export function handleVocabSingleSwipe(direction, swipedTask = null, swipedCardType = "") {
    let task = isSingleCardTask(swipedTask) ? swipedTask : getEngine().currentTask
    logSingleSwipe("swipe:received", {
        direction,
        swipedCardType,
        swipedTask: singleTaskDebug(swipedTask),
        chosenTask: singleTaskDebug(task),
    })
    if (!isSingleCardTask(task)) return { handled: false }
    if (singleCardTaskKey(task) !== singleCardTaskKey(getEngine().currentTask)) {
        logSingleSwipe("swipe:sync-current-task", {
            from: singleTaskDebug(getEngine().currentTask),
            to: singleTaskDebug(task),
        })
        showQuiz(task)
        task = getEngine().currentTask
        if (!isSingleCardTask(task)) return { handled: false }
    }

    const swipeRight = direction === "right"
    const word = task.word
    const expected = expectedVocabAnswerForTask(task)
    const state = getEngine().vocabSingle || { revealed: false, scored: false, lockedWrong: false }
    logSingleSwipe("swipe:state", {
        direction,
        swipedCardType,
        task: singleTaskDebug(task),
        expected,
        state,
    })

    if (swipedCardType === "prompt" || (!swipedCardType && !state.revealed)) {
        mutateEngine((e) => {
            e.vocabSingle = {
                revealed: true,
                scored: !swipeRight,
                lockedWrong: !swipeRight,
                ok: swipeRight ? null : false,
            }
        })
        if (!swipeRight) {
            applyVocabAnswerOutcome(false, expected, word)
        }
        if (!getEngine().vocabSingleNextTask) {
            prepareVocabSingleNextTask(task)
        }
        logSingleSwipe("swipe:prompt-done", {
            direction,
            task: singleTaskDebug(task),
            scoredWrongImmediately: !swipeRight,
        })
        return {
            handled: true,
            advanced: false,
            currentTask: getEngine().currentTask,
            nextTask: getEngine().vocabSingleNextTask,
        }
    }

    if (!state.scored) {
        applyVocabAnswerOutcome(swipeRight, expected, word)
    }
    logSingleSwipe("swipe:answer-before-advance", {
        direction,
        task: singleTaskDebug(task),
        scoredNow: !state.scored,
    })
    advanceVocabQuiz()
    return {
        handled: true,
        advanced: true,
        currentTask: getEngine().currentTask,
        nextTask: getEngine().vocabSingleNextTask,
    }
}

/** Хардкор-слова: первая отправка формы — проверка; вторая — следующее слово. */
export function processVocabHardcoreSubmit(userInput) {
    if (
        getEngine().currentTask?.vocabMode !== VOCAB_MODE.HARDCORE ||
        getEngine().currentTask.mode !== TRAIN_MODE.VOCAB
    )
        return

    if (!getEngine().answered) {
        const dir = getEngine().currentTask.vocabDirection
        const word = getEngine().currentTask.word
        let expected
        let ok
        if (dir === VOCAB_DIRECTION.LT_TO_RU) {
            expected = vocabRuFeedbackLine(word)
            ok = vocabRuUserMatches(word, userInput)
        } else {
            expected = vocabLemma(word)
            ok = typedAnswerMatch(userInput, expected)
        }
        mutateEngine((e) => {
            e.answered = true
            if (ok) {
                e.vocabCorrectStreak += 1
                if (e.vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM) e.vocabStreakPulseId += 1
            } else {
                if (e.vocabRound) {
                    e.vocabRound.maxStreak = Math.max(e.vocabRound.maxStreak, e.vocabCorrectStreak)
                }
                e.vocabCorrectStreak = 0
                e.vocabStreakPulseId = 0
            }
        })
        if (ok) {
            saveVocabBestStreakIfHigher(getEngine().vocabCorrectStreak)
        }
        showFeedback(ok, expected, word, { showExceptionNote: false })
        applyVocabRoundAnswer(word, ok)
        return
    }

    advanceVocabQuiz()
}

export function advanceVocabQuiz() {
    if (!getEngine().currentTask || !getEngine().answered) return
    const currentTask = getEngine().currentTask
    if (currentTask.mode !== TRAIN_MODE.VOCAB && !isSingleCardTask(currentTask)) return
    const queuedSingleTask =
        currentTask?.vocabMode === VOCAB_MODE.SINGLE ? getEngine().vocabSingleNextTask : null
    const task =
        queuedSingleTask ||
        (isSingleCardTask(currentTask)
            ? nextSingleCardTask(currentTask, {
                  excludeLemmas: recentSingleExcludeLemmas(currentTask.word),
              })
            : nextVocabTask(
                  currentTask?.vocabMode === VOCAB_MODE.SINGLE
                      ? { excludeLemmas: recentSingleExcludeLemmas(currentTask.word) }
                      : undefined
              ))
    if (isSingleCardTask(currentTask)) {
        logSingleSwipe("advance", {
            current: singleTaskDebug(currentTask),
            queued: singleTaskDebug(queuedSingleTask),
            selected: singleTaskDebug(task),
        })
    }
    if (!task) {
        resetVocabCorrectStreak()
        if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
            openVocabRoundSummaryOverlay()
            return
        }
        setQuizFeedback({ kind: "info", message: STR.quiz.noWordsLeft })
        return
    }
    showQuiz(task)
}

export function advanceVerbQuiz() {
    if (
        !getEngine().currentTask ||
        !isVerbFormsTask(getEngine().currentTask) ||
        !getEngine().answered
    )
        return
    if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
        resetVocabCorrectStreak()
        openVocabRoundSummaryOverlay()
        return
    }
    const task = nextVerbTask({ verbMode: getEngine().currentTask.verbMode || VERB_MODE.FORMS })
    if (!task) {
        resetVocabCorrectStreak()
        setQuizFeedback({ kind: "info", message: STR.quiz.noWordsLeft })
        return
    }
    showQuiz(task)
}

export function advanceSentenceQuiz() {
    if (!getEngine().currentTask || getEngine().currentTask.mode !== TRAIN_MODE.SENTENCES) return
    if (!getEngine().answered) return
    if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
        resetVocabCorrectStreak()
        openVocabRoundSummaryOverlay()
        return
    }
    const task = nextSentenceTask({ excludeLemma: roundLemmaKey(getEngine().currentTask.word) })
    if (!task) {
        resetVocabCorrectStreak()
        setQuizFeedback({ kind: "info", message: STR.quiz.noWordsLeft })
        return
    }
    showQuiz(task)
}

export function skipCurrentWord() {
    debugQuiz("skipCurrentWord:called")
    if (!getEngine().currentTask || getEngine().answered) {
        debugQuiz("skipCurrentWord:blocked", {
            hasTask: !!getEngine().currentTask,
            answered: getEngine().answered,
        })
        return
    }
    if (getEngine().currentTask.mode !== TRAIN_MODE.SENTENCES) {
        bumpWordStat(lemmaKey(getEngine().currentTask.word), "skipped")
    }
    if (getEngine().currentTask.mode === TRAIN_MODE.VOCAB) {
        const skippedLemma = roundLemmaKey(getEngine().currentTask.word)
        debugQuiz("skipCurrentWord:vocab-before-next", { skippedLemma })
        applyVocabRoundSkip(getEngine().currentTask.word)
        resetVocabCorrectStreak()
        const task = nextVocabTask({ excludeLemma: skippedLemma })
        debugQuiz("skipCurrentWord:vocab-next-result", {
            skippedLemma,
            nextLemma: task?.word ? roundLemmaKey(task.word) : null,
            foundTask: !!task,
        })
        if (!task) {
            if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
                openVocabRoundSummaryOverlay()
            }
            return
        }
        showQuiz(task)
        return
    }
    if (getEngine().currentTask.mode === TRAIN_MODE.VERBS) {
        const skippedLemma = roundLemmaKey(getEngine().currentTask.word)
        applyVocabRoundSkip(getEngine().currentTask.word)
        resetVocabCorrectStreak()
        const task = nextVerbTask({
            excludeLemma: skippedLemma,
            verbMode: getEngine().currentTask.verbMode || VERB_MODE.FORMS,
        })
        if (!task) {
            if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
                openVocabRoundSummaryOverlay()
            }
            return
        }
        showQuiz(task)
        return
    }
    if (getEngine().currentTask.mode === TRAIN_MODE.SENTENCES) {
        const skippedLemma = roundLemmaKey(getEngine().currentTask.word)
        applyVocabRoundSkip(getEngine().currentTask.word)
        resetVocabCorrectStreak()
        const task = nextSentenceTask({ excludeLemma: skippedLemma })
        if (!task) {
            if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
                openVocabRoundSummaryOverlay()
            }
            return
        }
        showQuiz(task)
        return
    }
    const keys = getCheckedCaseKeys()
    const task = nextCasesTask(keys)
    if (!task) return
    showQuiz(task)
}

function clearTransientVocabState() {
    clearQuizFeedback()
    mutateEngine((e) => {
        e.answered = false
        e.vocabChoice = null
        e.vocabSingle = null
        e.vocabSingleNextTask = null
        e.vocabSingleFutureTask = null
    })
}

export function excludeCurrentRoundWord() {
    const task = getEngine().currentTask
    if (!task?.word || !getEngine().vocabRound) return

    const removedLemma = roundLemmaKey(task.word)
    if (!excludeVocabRoundWord(task.word)) return

    resetVocabCorrectStreak()
    clearTransientVocabState()

    if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
        openVocabRoundSummaryOverlay()
        return
    }

    let nextTask = null
    if (task.mode === TRAIN_MODE.VOCAB) {
        nextTask = nextVocabTask({ excludeLemma: removedLemma })
    } else if (task.mode === TRAIN_MODE.VERBS) {
        nextTask = nextVerbTask({
            excludeLemma: removedLemma,
            verbMode: task.verbMode || VERB_MODE.FORMS,
        })
    } else if (task.mode === TRAIN_MODE.SENTENCES) {
        nextTask = nextSentenceTask({ excludeLemma: removedLemma })
    } else if (task.mode === TRAIN_MODE.CASES) {
        nextTask = nextCasesTask(getCheckedCaseKeys(), { excludeLemma: removedLemma })
    }

    if (!nextTask) {
        if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
            openVocabRoundSummaryOverlay()
            return
        }
        setQuizFeedback({ kind: "info", message: STR.quiz.noWordsLeft })
        return
    }

    showQuiz(nextTask)
}

/** Обработчики для {@link QuizScreen} (клики и отправка форм). */

export function handleMorphCasesAnswerSubmit(user) {
    if (!getEngine().currentTask) return
    if (getEngine().currentTask.mode === TRAIN_MODE.VOCAB) return
    if (getEngine().currentTask.mode === TRAIN_MODE.VERBS) return
    if (getEngine().currentTask.mode === TRAIN_MODE.SENTENCES) return

    const keys = getCheckedCaseKeys()
    const expected = getEngine().currentTask.word.forms[getEngine().currentTask.targetCase]

    if (!getEngine().answered) {
        const ok = typedAnswerMatch(user, expected)
        mutateEngine((e) => {
            e.answered = true
            if (ok) {
                e.vocabCorrectStreak += 1
                if (e.vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM) e.vocabStreakPulseId += 1
            } else {
                if (e.vocabRound) {
                    e.vocabRound.maxStreak = Math.max(e.vocabRound.maxStreak, e.vocabCorrectStreak)
                }
                e.vocabCorrectStreak = 0
                e.vocabStreakPulseId = 0
            }
        })
        if (ok) {
            saveVocabBestStreakIfHigher(getEngine().vocabCorrectStreak)
        }
        showFeedback(ok, expected, getEngine().currentTask.word)
        applyVocabRoundAnswer(getEngine().currentTask.word, ok)
        return
    }

    if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
        resetVocabCorrectStreak()
        openVocabRoundSummaryOverlay()
        return
    }
    const task = nextCasesTask(keys)
    if (!task) {
        resetVocabCorrectStreak()
        setQuizFeedback({ kind: "info", message: STR.quiz.noWordsLeft })
        return
    }
    showQuiz(task)
}

export function handleVocabChoice(lem) {
    if (!lem || !getEngine().currentTask || getEngine().currentTask.mode !== TRAIN_MODE.VOCAB)
        return
    if (getEngine().answered) {
        const word = getEngine().currentTask.word
        const dir = getEngine().currentTask.vocabDirection
        const matches =
            dir === VOCAB_DIRECTION.LT_TO_RU
                ? vocabRuUserMatches(word, lem)
                : answersMatch(lem, vocabLemma(word))
        if (matches) {
            advanceVocabQuiz()
        }
        return
    }

    mutateEngine((e) => {
        e.answered = true
    })
    const dir = getEngine().currentTask.vocabDirection
    const word = getEngine().currentTask.word
    const ok =
        dir === VOCAB_DIRECTION.LT_TO_RU
            ? vocabRuUserMatches(word, lem)
            : answersMatch(lem, vocabLemma(word))
    const expected = dir === VOCAB_DIRECTION.LT_TO_RU ? vocabRuFeedbackLine(word) : vocabLemma(word)
    finalizeVocabChoice(ok, expected, getEngine().currentTask.word, lem)
}

export function handleSentenceBuilderSubmit(words) {
    if (!getEngine().currentTask || getEngine().currentTask.mode !== TRAIN_MODE.SENTENCES) return

    if (getEngine().answered) {
        advanceSentenceQuiz()
        return
    }

    const picked = Array.isArray(words) ? words.map((word) => String(word || "").trim()) : []
    const expectedWords = Array.isArray(getEngine().currentTask.expectedWords)
        ? getEngine().currentTask.expectedWords
        : []
    const ok =
        picked.length === expectedWords.length &&
        expectedWords.every((word, index) => picked[index] === word)
    const expected = expectedWords.join(" ")
    applySentenceAnswerOutcome(ok, expected, getEngine().currentTask.word)
}

export function handleQuizSkipButtonClick() {
    debugQuiz("handleQuizSkipButtonClick:clicked")
    if (isVerbFormsTask(getEngine().currentTask) && getEngine().answered) {
        advanceVerbQuiz()
        return
    }
    if (getEngine().currentTask?.mode === TRAIN_MODE.SENTENCES && getEngine().answered) {
        advanceSentenceQuiz()
        return
    }
    if (getEngine().currentTask?.mode === TRAIN_MODE.VOCAB && getEngine().answered) {
        if (getEngine().currentTask.vocabMode === VOCAB_MODE.HARDCORE) {
            debugQuiz("handleQuizSkipButtonClick:blocked-hardcore-after-answer")
            return
        }
        debugQuiz("handleQuizSkipButtonClick:advance-after-answer")
        advanceVocabQuiz()
        return
    }
    skipCurrentWord()
}

export function handleVocabHardcoreFormSubmit(userInput) {
    processVocabHardcoreSubmit(userInput)
}

export function handleVerbFormSubmit(userInput) {
    if (!isVerbFormsTask(getEngine().currentTask)) return

    const word = getEngine().currentTask.word
    const expected = expectedVerbAnswerForTask(getEngine().currentTask)

    if (!getEngine().answered) {
        const ok = typedAnswerMatch(userInput, expected)
        mutateEngine((e) => {
            e.answered = true
            if (ok) {
                e.vocabCorrectStreak += 1
                if (e.vocabCorrectStreak >= VOCAB_STREAK_MULT_FROM) e.vocabStreakPulseId += 1
            } else {
                if (e.vocabRound) {
                    e.vocabRound.maxStreak = Math.max(e.vocabRound.maxStreak, e.vocabCorrectStreak)
                }
                e.vocabCorrectStreak = 0
                e.vocabStreakPulseId = 0
            }
        })
        if (ok) {
            saveVocabBestStreakIfHigher(getEngine().vocabCorrectStreak)
        }
        showFeedback(ok, expected, word)
        applyVocabRoundAnswer(word, ok)
        return
    }

    advanceVerbQuiz()
}
