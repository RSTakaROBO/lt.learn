import { VERB_FORM_KEYS } from "js/config.js"
import { isVocabTrainingWord } from "src/screens/quiz/vocab/vocabWords.js"

export function isVerbsTrainingWord(word) {
    return (
        word?.type === "verb" &&
        VERB_FORM_KEYS.every((key) => typeof word.forms?.[key] === "string" && word.forms[key])
    )
}

export function isVerbCardsTrainingWord(word) {
    return isVerbsTrainingWord(word) && isVocabTrainingWord(word)
}
