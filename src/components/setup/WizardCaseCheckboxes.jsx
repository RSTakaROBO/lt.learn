import { useLayoutEffect, useState } from "react"

import { CASE_ORDER } from "../../../js/config.js"
import { caseRu } from "../../../js/i18n/core.js"
import { applyEngine } from "../../../js/trainer-ui-state.js"
import { loadSelectedCases, saveSelectedCases } from "../../../js/storage.js"
import { useTrainerDispatch } from "../../context/TrainerAppContext.jsx"
import { CheckboxButton } from "../ui/CheckboxButton.jsx"
import { ListHolder } from "../ui/ListHolder.jsx"

const selectableCases = CASE_ORDER.filter((c) => c.key !== "nominative")

/**
 * @param {{ scrollWell?: boolean }} props
 */
export function WizardCaseCheckboxes({ scrollWell = true }) {
    const dispatch = useTrainerDispatch()
    const [selectedKeys, setSelectedKeys] = useState(() => {
        const s = loadSelectedCases()
        return Array.isArray(s) && s.length ? [...s] : []
    })

    useLayoutEffect(() => {
        applyEngine((e) => {
            e.selectedCaseKeys = [...selectedKeys]
        })
    }, [selectedKeys])

    function toggleKey(key, checked) {
        dispatch({ type: "WIZARD_CLEAR_STATUS", name: "case" })
        setSelectedKeys((prev) => {
            const next = checked
                ? prev.includes(key)
                    ? prev
                    : [...prev, key]
                : prev.filter((k) => k !== key)
            saveSelectedCases(next)
            return next
        })
    }

    return (
        <ListHolder id="case-checkboxes" scrollWell={scrollWell}>
            {selectableCases.map((c) => (
                <CheckboxButton
                    key={c.key}
                    id={`case-${c.key}`}
                    value={c.key}
                    title={caseRu(c.key)}
                    meta={c.lt?.trim() ? <span lang="lt">{c.lt.trim()}</span> : null}
                    checked={selectedKeys.includes(c.key)}
                    onChange={(e) => toggleKey(c.key, e.target.checked)}
                />
            ))}
        </ListHolder>
    )
}
