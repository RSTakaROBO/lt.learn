import { TRAIN_MODE, VERB_FORM_BY_KEY, VOCAB_DIRECTION, VOCAB_MODE } from "./config.js"
import { STR } from "./i18n/strings-ru.js"
import {
    getActiveTrainerScreen,
    getCheckedCaseKeys,
    getEngine,
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
import { nextVerbTask } from "../src/screens/quiz/verbs/verbsTask.js"
import { lemmaKey } from "../src/screens/quiz/shared/quizTaskSelection.js"

const VOCAB_STREAK_MULT_FROM = 5
const QUIZ_DEBUG_KEY = "lt-debug-quiz"
const MIN_RECENT_SINGLE_EXCLUDES = 5

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

export function inferQuizMode(task) {
    if (!task?.word) return TRAIN_MODE.CASES
    if (task.mode === TRAIN_MODE.VOCAB) return TRAIN_MODE.VOCAB
    if (task.mode === TRAIN_MODE.VERBS) return TRAIN_MODE.VERBS
    if (task.mode === TRAIN_MODE.CASES) return TRAIN_MODE.CASES
    if (task.vocabHardcore || task.vocabMode === VOCAB_MODE.SINGLE) return TRAIN_MODE.VOCAB
    if (Array.isArray(task.choices) && task.choices.length >= 4) return TRAIN_MODE.VOCAB
    return TRAIN_MODE.CASES
}

export function showQuiz(task) {
    task = { ...task, mode: inferQuizMode(task) }
    debugQuiz("showQuiz:start", {
        nextLemma: task?.word ? roundLemmaKey(task.word) : null,
        nextMode: task?.mode ?? null,
        choiceCount: Array.isArray(task?.choices) ? task.choices.length : null,
    })

    const histKey = roundLemmaKey(task.word) || String(lemmaKey(task.word) ?? "").trim()
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

    if (task.mode === TRAIN_MODE.VOCAB || task.mode === TRAIN_MODE.VERBS) {
        if (task.mode === TRAIN_MODE.VERBS && !VERB_FORM_BY_KEY[task.hiddenVerbFormKey]) {
            resetVocabCorrectStreak()
            setQuizFeedback({ kind: "info", message: STR.events.verbsStartFail })
            setVocabRoundLemmaDots(null)
            return
        }

        if (task.mode === TRAIN_MODE.VERBS) {
            setVocabRoundLemmaDots(task.word)
            return
        }

        const hardcore = !!task.vocabHardcore
        const isSingle = task.vocabMode === VOCAB_MODE.SINGLE

        if (!hardcore && !isSingle && (!Array.isArray(task.choices) || task.choices.length < 4)) {
            resetVocabCorrectStreak()
            setQuizFeedback({ kind: "info", message: STR.quiz.noVocabChoices })
            setVocabRoundLemmaDots(null)
            return
        }

        setVocabRoundLemmaDots(task.word)
        if (isSingle) {
            prepareVocabSingleNextTask(task.word)
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
    const dir = getEngine().currentTask?.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
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

function expectedVocabAnswerForTask(task, fallback = "") {
    const dir = task?.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    if (dir === VOCAB_DIRECTION.LT_TO_RU) return vocabRuFeedbackLine(task?.word) || fallback
    return vocabLemma(task?.word) || fallback
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

function recentSingleExcludeLemmas(word) {
    const current = roundLemmaKey(word)
    const recent = getEngine().shownLemmaHistory.slice(-MIN_RECENT_SINGLE_EXCLUDES)
    return [...new Set([current, ...recent].filter(Boolean))]
}

function prepareVocabSingleNextTask(word) {
    const nextTask = nextVocabTask({ excludeLemmas: recentSingleExcludeLemmas(word) })
    mutateEngine((e) => {
        e.vocabSingleNextTask = nextTask
    })
    return nextTask
}

export function requestVocabSingleNextTask() {
    const task = getEngine().currentTask
    if (!task || task.mode !== TRAIN_MODE.VOCAB || task.vocabMode !== VOCAB_MODE.SINGLE) {
        return null
    }
    if (getEngine().vocabSingleNextTask?.word) return getEngine().vocabSingleNextTask
    return prepareVocabSingleNextTask(task.word)
}

export function handleVocabSingleSwipe(direction) {
    const task = getEngine().currentTask
    if (!task || task.mode !== TRAIN_MODE.VOCAB || task.vocabMode !== VOCAB_MODE.SINGLE) return

    const swipeRight = direction === "right"
    const word = task.word
    const expected = expectedVocabAnswerForTask(task)
    const state = getEngine().vocabSingle || { revealed: false, scored: false, lockedWrong: false }

    if (!state.revealed) {
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
            prepareVocabSingleNextTask(word)
        }
        return
    }

    if (!state.scored) {
        applyVocabAnswerOutcome(swipeRight, expected, word)
    }
    advanceVocabQuiz()
}

/** Хардкор-слова: первая отправка формы — проверка; вторая — следующее слово. */
export function processVocabHardcoreSubmit(userInput) {
    if (
        !getEngine().currentTask?.vocabHardcore ||
        getEngine().currentTask.mode !== TRAIN_MODE.VOCAB
    )
        return

    if (!getEngine().answered) {
        const dir = getEngine().currentTask.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
        const word = getEngine().currentTask.word
        let expected
        let ok
        if (dir === VOCAB_DIRECTION.LT_TO_RU) {
            expected = vocabRuFeedbackLine(word)
            ok = vocabRuUserMatches(word, userInput)
        } else {
            expected = vocabLemma(word)
            ok = answersMatch(userInput, expected)
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
    if (
        !getEngine().currentTask ||
        getEngine().currentTask.mode !== TRAIN_MODE.VOCAB ||
        !getEngine().answered
    )
        return
    const queuedSingleTask =
        getEngine().currentTask?.vocabMode === VOCAB_MODE.SINGLE
            ? getEngine().vocabSingleNextTask
            : null
    const task =
        queuedSingleTask ||
        nextVocabTask(
            getEngine().currentTask?.vocabMode === VOCAB_MODE.SINGLE
                ? { excludeLemmas: recentSingleExcludeLemmas(getEngine().currentTask.word) }
                : undefined
        )
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
        getEngine().currentTask.mode !== TRAIN_MODE.VERBS ||
        !getEngine().answered
    )
        return
    if (getEngine().vocabRound && getEngine().vocabRound.pool.size === 0) {
        resetVocabCorrectStreak()
        openVocabRoundSummaryOverlay()
        return
    }
    const task = nextVerbTask()
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
    bumpWordStat(lemmaKey(getEngine().currentTask.word), "skipped")
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
        const task = nextVerbTask({ excludeLemma: skippedLemma })
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

/** Обработчики для {@link QuizScreen} (клики и отправка форм). */

export function handleMorphCasesAnswerSubmit(user) {
    if (!getEngine().currentTask) return
    if (getEngine().currentTask.mode === TRAIN_MODE.VOCAB) return
    if (getEngine().currentTask.mode === TRAIN_MODE.VERBS) return

    const keys = getCheckedCaseKeys()
    const expected = getEngine().currentTask.word[getEngine().currentTask.targetCase]

    if (!getEngine().answered) {
        const ok = answersMatch(user, expected)
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
        const dir = getEngine().currentTask.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
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
    const dir = getEngine().currentTask.vocabDirection || VOCAB_DIRECTION.RU_TO_LT
    const word = getEngine().currentTask.word
    const ok =
        dir === VOCAB_DIRECTION.LT_TO_RU
            ? vocabRuUserMatches(word, lem)
            : answersMatch(lem, vocabLemma(word))
    const expected = dir === VOCAB_DIRECTION.LT_TO_RU ? vocabRuFeedbackLine(word) : vocabLemma(word)
    finalizeVocabChoice(ok, expected, getEngine().currentTask.word, lem)
}

export function handleVocabChoicesClick(/** @type {Event} */ e) {
    const t = e.target
    if (!(t instanceof Node)) return
    const btn = t instanceof Element ? t.closest(".vocab-choice") : null
    const lem = btn?.getAttribute("data-lemma") || ""
    handleVocabChoice(lem)
}

export function handleQuizSkipButtonClick() {
    debugQuiz("handleQuizSkipButtonClick:clicked")
    if (getEngine().currentTask?.mode === TRAIN_MODE.VERBS && getEngine().answered) {
        advanceVerbQuiz()
        return
    }
    if (getEngine().currentTask?.mode === TRAIN_MODE.VOCAB && getEngine().answered) {
        if (getEngine().currentTask.vocabHardcore) {
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
    if (!getEngine().currentTask || getEngine().currentTask.mode !== TRAIN_MODE.VERBS) return

    const word = getEngine().currentTask.word
    const formKey = getEngine().currentTask.hiddenVerbFormKey
    const expected = word?.[formKey] || word?.forms?.[formKey] || ""

    if (!getEngine().answered) {
        const ok = answersMatch(userInput, expected)
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
