import { TRAIN_MODE, VERB_FORM_BY_KEY, VOCAB_DIRECTION } from "./config.js"
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
import { wordLemma } from "./word-entry.js"
import { lemmaKey, nextTask, nextVerbTask, nextVocabTask } from "./word-selection.js"
import { vocabRuUserMatches, wordRuFeedbackLine } from "./wordTranslations.js"
import {
    applyVocabRoundAnswer,
    applyVocabRoundSkip,
    openVocabRoundSummaryOverlay,
    roundLemmaKey,
    setVocabRoundLemmaDots,
} from "./vocab-round.js"

const VOCAB_STREAK_MULT_FROM = 5
const QUIZ_DEBUG_KEY = "lt-debug-quiz"

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
    if (task.vocabHardcore) return TRAIN_MODE.VOCAB
    if (Array.isArray(task.choices) && task.choices.length >= 4) return TRAIN_MODE.VOCAB
    return TRAIN_MODE.CASES
}

export function showQuiz(task) {
    task.mode = inferQuizMode(task)
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

        if (!hardcore && (!Array.isArray(task.choices) || task.choices.length < 4)) {
            resetVocabCorrectStreak()
            setQuizFeedback({ kind: "info", message: STR.quiz.noVocabChoices })
            setVocabRoundLemmaDots(null)
            return
        }

        setVocabRoundLemmaDots(task.word)
        return
    }

    setVocabRoundLemmaDots(null)
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

export function showFeedback(ok, expected, word) {
    recordQuizOutcome(word, ok)
    setQuizFeedback({
        kind: ok ? "ok" : "bad",
        message: ok ? STR.quiz.correct : STR.quiz.wrong,
        expected: ok ? "" : expected,
        exceptionNote: exceptionNote(word),
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
    const correctNom = wordLemma(word) || expected
    const correctLemma = dir === VOCAB_DIRECTION.LT_TO_RU ? wordRuFeedbackLine(word) : correctNom
    mutateEngine((e) => {
        e.vocabChoice = {
            pickedLemma,
            correctLemma,
            ok,
        }
    })
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
            expected = wordRuFeedbackLine(word)
            ok = vocabRuUserMatches(word, userInput)
        } else {
            expected = wordLemma(word)
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
        showFeedback(ok, expected, word)
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
    const task = nextVocabTask()
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
    const task = nextTask(keys)
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
        })
        showFeedback(ok, expected, getEngine().currentTask.word)
        return
    }

    const task = nextTask(keys)
    if (!task) {
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
                : answersMatch(lem, wordLemma(word))
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
            : answersMatch(lem, wordLemma(word))
    const expected = dir === VOCAB_DIRECTION.LT_TO_RU ? wordRuFeedbackLine(word) : wordLemma(word)
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
