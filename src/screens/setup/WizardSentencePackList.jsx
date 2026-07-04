import { useMemo, useState } from "react"

import { fmt } from "js/i18n/core.js"
import { STR } from "js/i18n/strings-ru.js"
import { loadSelectedSentencePacks, saveSelectedSentencePacks } from "js/storage.js"
import { SENTENCE_PACKS } from "src/screens/quiz/sentences/sentenceBank.js"
import { CardList } from "src/components/ui/CardList.jsx"
import { CheckboxButton } from "src/components/ui/CheckboxButton.jsx"
import { useTrainerDispatch } from "src/context/TrainerAppContext.jsx"

function safeInputId(id) {
    return `sentence-pack-${String(id || "").replace(/[^a-z0-9_-]+/gi, "-")}`
}

/**
 * @param {{ scrollWell?: boolean }} props
 */
export function WizardSentencePackList({ scrollWell = true }) {
    const [selectedIds, setSelectedIds] = useState(() => loadSelectedSentencePacks())
    const dispatch = useTrainerDispatch()
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

    function togglePack(packId, checked) {
        const next = checked
            ? [...new Set([...selectedIds, packId])]
            : selectedIds.filter((id) => id !== packId)
        setSelectedIds(next)
        saveSelectedSentencePacks(next)
        dispatch({ type: "WIZARD_CLEAR_STATUS", name: "pack" })
    }

    return (
        <CardList id="sentence-pack-list" scrollWell={scrollWell}>
            {SENTENCE_PACKS.map((pack) => (
                <CheckboxButton
                    key={pack.id}
                    id={safeInputId(pack.id)}
                    value={pack.id}
                    title={pack.title}
                    meta={
                        <span>
                            {fmt(STR.sentencePacks.countMeta, {
                                count: Array.isArray(pack.sentences) ? pack.sentences.length : 0,
                            })}
                            {pack.description ? ` - ${pack.description}` : ""}
                        </span>
                    }
                    checked={selectedSet.has(pack.id)}
                    onChange={(e) => togglePack(pack.id, e.target.checked)}
                />
            ))}
        </CardList>
    )
}
