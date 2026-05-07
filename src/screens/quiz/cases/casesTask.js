import { TRAIN_MODE } from "../../../../js/config.js"
import { pickRandom, pickWeightedRandom } from "../../../../js/random.js"
import { getEngine } from "../../../../js/trainer-ui-state.js"
import { computeWordSelectionWeight, usableAfterLemmaGap } from "../shared/quizTaskSelection.js"
import { isCasesTrainingWord } from "./casesWords.js"

export function nextCasesTask(selectedKeys) {
    const usable = getEngine().wordBank.filter((word) => isCasesTrainingWord(word, selectedKeys))
    if (!usable.length) return null

    const candidates = usableAfterLemmaGap(usable)
    const word = pickWeightedRandom(candidates, computeWordSelectionWeight)
    const targetCase = pickRandom(selectedKeys)
    return { mode: TRAIN_MODE.CASES, word, targetCase }
}
