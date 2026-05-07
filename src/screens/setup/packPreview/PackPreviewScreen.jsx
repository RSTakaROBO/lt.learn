import { STR } from "../../../../js/i18n/strings-ru.js"
import { AppFlowScreen } from "../../../components/layout/AppFlowScreen.jsx"
import { Button } from "../../../components/ui/Button.jsx"
import { useManifestPacks } from "../../../context/ManifestPacksContext.jsx"

const PART_OF_SPEECH_ORDER = ["noun", "verb", "adjective", "other"]

function partOfSpeechLabel(type) {
    return STR.packPreview.parts[type] || STR.packPreview.parts.other
}

function groupPreviewRows(rows) {
    const groups = new Map()
    for (const row of rows) {
        const type = PART_OF_SPEECH_ORDER.includes(row.type) ? row.type : "other"
        if (!groups.has(type)) groups.set(type, [])
        groups.get(type).push(row)
    }
    return PART_OF_SPEECH_ORDER.map((type) => ({ type, rows: groups.get(type) || [] })).filter(
        (group) => group.rows.length > 0
    )
}

export function PackPreviewScreen({ heightMode = "fill" } = {}) {
    const { previewPackRow, closePackPreview } = useManifestPacks()
    const groups = groupPreviewRows(previewPackRow?.previewRows || [])

    if (!previewPackRow) return null

    return (
        <AppFlowScreen id="pack-preview-shell" heightMode={heightMode}>
            <section
                id="pack-preview"
                className="widget panel app-screen__panel pack-preview-screen"
                aria-labelledby="pack-preview-title"
            >
                <h2 id="pack-preview-title">{previewPackRow.title}</h2>
                <p className="sub pack-preview-sub">
                    {STR.packPreview.wordCount.replace(
                        "{count}",
                        String(previewPackRow.previewRows.length)
                    )}
                </p>
                <div className="app-screen__body pack-preview-body">
                    {groups.length === 0 ? (
                        <p className="pack-preview-empty">{STR.packPreview.empty}</p>
                    ) : (
                        groups.map((group) => (
                            <section
                                key={group.type}
                                className="pack-preview-section"
                                aria-labelledby={`pack-preview-${group.type}`}
                            >
                                <h3 id={`pack-preview-${group.type}`} className="pack-preview-h">
                                    {partOfSpeechLabel(group.type)}
                                </h3>
                                <div className="pack-preview-table-scroll">
                                    <table className="pack-preview-table">
                                        <thead>
                                            <tr>
                                                <th scope="col">{STR.packPreview.thLemma}</th>
                                                <th scope="col">{STR.packPreview.thTranslation}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.rows.map((row, index) => (
                                                <tr key={`${row.type}-${row.lemma}-${index}`}>
                                                    <td lang="lt">{row.lemma}</td>
                                                    <td>{row.translation || STR.quiz.emDash}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        ))
                    )}
                </div>
                <div className="app-screen__footer actions app-screen__footer--single">
                    <Button
                        variant="primary"
                        type="button"
                        id="btn-pack-preview-close"
                        onClick={closePackPreview}
                    >
                        {STR.packPreview.close}
                    </Button>
                </div>
            </section>
        </AppFlowScreen>
    )
}
