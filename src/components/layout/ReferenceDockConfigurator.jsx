import { useEffect, useRef, useState } from "react"

import { CASE_ORDER } from "js/config.js"
import { caseRu } from "js/i18n/core.js"
import { STR } from "js/i18n/strings-ru.js"
import { Button } from "src/components/ui/Button.jsx"
import { OTHER_VERB_TENSE_OPTIONS } from "src/screens/help/VerbFormsHelpTables.jsx"

const CASE_PREFIX = "case:"
const TENSE_PREFIX = "tense:"

/** Быстрое закрепление правил без перехода в справку. */
export function ReferenceDockConfigurator({
    dockedCases,
    dockedTenses,
    onPinCase,
    onPinTense,
    onUnpinCase,
    onUnpinTense,
}) {
    const [open, setOpen] = useState(false)
    const [referenceId, setReferenceId] = useState(`${CASE_PREFIX}${CASE_ORDER[0].key}`)
    const rootRef = useRef(null)

    useEffect(() => {
        if (!open) return
        function onPointerDown(event) {
            if (!rootRef.current?.contains(event.target)) setOpen(false)
        }
        function onKeyDown(event) {
            if (event.key === "Escape") setOpen(false)
        }
        document.addEventListener("pointerdown", onPointerDown)
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("pointerdown", onPointerDown)
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [open])

    const isCase = referenceId.startsWith(CASE_PREFIX)
    const selectedId = referenceId.slice(isCase ? CASE_PREFIX.length : TENSE_PREFIX.length)
    const selectedDock = isCase ? dockedCases : dockedTenses
    const selectedSide = selectedDock.left.includes(selectedId)
        ? "left"
        : selectedDock.right.includes(selectedId)
          ? "right"
          : null
    function setDockSide(side) {
        if (side === "off") {
            if (isCase) onUnpinCase(selectedId)
            else onUnpinTense(selectedId)
        } else if (selectedSide !== side) {
            if (isCase) onPinCase(selectedId, side)
            else onPinTense(selectedId, side)
        }
        setOpen(false)
    }

    return (
        <div ref={rootRef} className="reference-dock-configurator">
            <button
                type="button"
                className="reference-dock-configurator__trigger"
                aria-label={STR.help.openPinConfigurator}
                aria-expanded={open}
                aria-controls="reference-dock-configurator-popover"
                onClick={() => setOpen((value) => !value)}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 4h6l-1 5 3 3v1H7v-1l3-3-1-5Z" />
                    <path d="M12 14v6" />
                </svg>
            </button>
            {open && (
                <section
                    id="reference-dock-configurator-popover"
                    className="reference-dock-configurator__popover"
                    aria-label={STR.help.pinConfiguratorTitle}
                    role="dialog"
                >
                    <h2>{STR.help.pinConfiguratorTitle}</h2>
                    <label className="reference-dock-configurator__field">
                        <span>{STR.help.pinConfiguratorRule}</span>
                        <select
                            value={referenceId}
                            onChange={(event) => setReferenceId(event.target.value)}
                        >
                            <optgroup label={STR.help.pinConfiguratorCases}>
                                {CASE_ORDER.map(({ key, lt }) => (
                                    <option
                                        key={key}
                                        value={`${CASE_PREFIX}${key}`}
                                    >{`${caseRu(key)} — ${lt}`}</option>
                                ))}
                            </optgroup>
                            <optgroup label={STR.help.pinConfiguratorTenses}>
                                {OTHER_VERB_TENSE_OPTIONS.map(({ id, title }) => (
                                    <option key={id} value={`${TENSE_PREFIX}${id}`}>
                                        {title}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </label>
                    <div className="reference-dock-configurator__side">
                        <span>{STR.help.pinConfiguratorSide}</span>
                        <div role="group">
                            <Button
                                className={selectedSide === "left" ? "is-active" : undefined}
                                aria-pressed={selectedSide === "left"}
                                onClick={() => setDockSide("left")}
                            >
                                {STR.help.pinLeft}
                            </Button>
                            <Button
                                className={selectedSide === "right" ? "is-active" : undefined}
                                aria-pressed={selectedSide === "right"}
                                onClick={() => setDockSide("right")}
                            >
                                {STR.help.pinRight}
                            </Button>
                            <Button
                                className={!selectedSide ? "is-active" : undefined}
                                aria-pressed={!selectedSide}
                                onClick={() => setDockSide("off")}
                            >
                                {STR.help.pinOff}
                            </Button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
