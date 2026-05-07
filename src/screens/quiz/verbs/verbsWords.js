import { VERB_FORM_KEYS } from "../../../../js/config.js"

export function isVerbsTrainingWord(word) {
    return (
        word?.type === "verb" &&
        VERB_FORM_KEYS.every((key) => typeof word[key] === "string" && word[key])
    )
}
