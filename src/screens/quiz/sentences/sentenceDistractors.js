import { CASE_KEYS } from "js/config.js"
import { shuffleArray } from "js/random.js"

export const SENTENCE_FAKE_POOLS = {
    time: [
        "vakar",
        "šiandien",
        "rytoj",
        "dabar",
        "ryte",
        "vakare",
        "anksti",
        "vėlai",
        "dažnai",
        "retai",
        "kartais",
        "jau",
        "dar",
    ],
    particles: [
        "iš",
        "į",
        "ant",
        "po",
        "prie",
        "pas",
        "su",
        "be",
        "už",
        "per",
        "apie",
        "iki",
        "nuo",
        "dėl",
        "pagal",
        "ar",
        "ir",
        "bet",
        "kad",
        "tai",
        "čia",
        "ten",
        "ne",
    ],
    questions: ["kas", "kur", "kada", "kiek", "kaip", "kodėl", "kuris", "kuri", "ar"],
    pronouns: [
        "aš",
        "tu",
        "jis",
        "ji",
        "mes",
        "jūs",
        "jie",
        "jos",
        "man",
        "tau",
        "mane",
        "tave",
        "mano",
        "tavo",
        "savo",
    ],
    places: [
        "namuose",
        "lauke",
        "mieste",
        "mokykloje",
        "parduotuvėje",
        "vilniuje",
        "kaune",
        "namo",
    ],
    verbs: [
        "yra",
        "nėra",
        "eina",
        "važiuoja",
        "gyvena",
        "dirba",
        "skaito",
        "rašo",
        "geria",
        "valgo",
        "turi",
        "nori",
        "gali",
        "reikia",
    ],
    objects: [
        "namas",
        "namą",
        "namo",
        "knyga",
        "knygą",
        "knygos",
        "vanduo",
        "vandenį",
        "vandens",
        "duona",
        "duoną",
        "duonos",
        "miestas",
        "miestą",
        "mieste",
        "laikas",
        "laiko",
    ],
}

const DEFAULT_POOL_COUNT = 3
const DEFAULT_NOUN_FORM_COUNT = 2

function cleanToken(value) {
    return typeof value === "string" ? value.trim().toLocaleLowerCase("lt") : ""
}

function cleanTokens(values) {
    return Array.isArray(values) ? values.map(cleanToken).filter(Boolean) : []
}

function numberOption(value, fallback) {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback
}

function addUnique(out, blocked, token) {
    const text = cleanToken(token)
    if (!text || blocked.has(text)) return false
    blocked.add(text)
    out.push(text)
    return true
}

function poolCandidates(poolNames) {
    const out = []
    for (const poolName of cleanTokens(poolNames)) {
        const pool = SENTENCE_FAKE_POOLS[poolName]
        if (Array.isArray(pool)) out.push(...pool)
    }
    return cleanTokens(out)
}

function pickFromFakePools(sentence, blocked) {
    const poolNames = Array.isArray(sentence?.fakePools) ? sentence.fakePools : []
    const count = numberOption(sentence?.fakePoolCount, DEFAULT_POOL_COUNT)
    if (!poolNames.length || count <= 0) return []

    const picked = []
    for (const poolName of shuffleArray(poolNames)) {
        if (picked.length >= count) break
        const pool = cleanTokens(SENTENCE_FAKE_POOLS[cleanToken(poolName)])
        const token = shuffleArray(pool).find((candidate) => !blocked.has(candidate))
        if (token) addUnique(picked, blocked, token)
    }

    for (const token of shuffleArray(poolCandidates(poolNames))) {
        if (picked.length >= count) break
        addUnique(picked, blocked, token)
    }

    return picked
}

function nounFormDistractors(sentence, wordBank, blocked) {
    const count = numberOption(sentence?.fakeNounFormCount, DEFAULT_NOUN_FORM_COUNT)
    if (count <= 0 || !Array.isArray(wordBank) || !wordBank.length) return []

    const answerWords = new Set(cleanTokens(sentence?.answer))
    const picked = []
    for (const answerWord of shuffleArray([...answerWords])) {
        if (picked.length >= count) break
        const matchingNouns = wordBank.filter((word) => {
            if (word?.type !== "noun" || !word.forms || typeof word.forms !== "object") return false
            return CASE_KEYS.some((key) => cleanToken(word.forms[key]) === answerWord)
        })
        for (const noun of shuffleArray(matchingNouns)) {
            const forms = CASE_KEYS.map((key) => cleanToken(noun.forms[key])).filter(
                (form) => form && form !== answerWord && !answerWords.has(form)
            )
            const token = shuffleArray(forms).find((form) => !blocked.has(form))
            if (token && addUnique(picked, blocked, token)) break
        }
    }
    return picked
}

export function sentenceFakeWords(sentence, { wordBank = [] } = {}) {
    const blocked = new Set(cleanTokens(sentence?.answer))
    const out = []

    for (const token of cleanTokens(sentence?.fakeWords)) {
        addUnique(out, blocked, token)
    }
    for (const token of nounFormDistractors(sentence, wordBank, blocked)) {
        addUnique(out, blocked, token)
    }
    for (const token of pickFromFakePools(sentence, blocked)) {
        addUnique(out, blocked, token)
    }

    return out
}
