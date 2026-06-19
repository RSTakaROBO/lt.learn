import { CASE_BY_KEY } from "js/config.js"
import { caseRu } from "js/i18n/core.js"

const ENDINGS = ["−as", "−is", "−ys", "−us", "−a", "−ė"]

const CASE_ENDINGS = [
    {
        key: "genitive",
        id: "ch-kil",
        singular: ["−o", "−io", "−io", "−aus", "−os", "−ės"],
        plural: ["−ų", "−ių", "−ių", "−ų", "−ų", "−ių"],
    },
    {
        key: "dative",
        id: "ch-naud",
        singular: ["−ui", "−iui", "−iui", "−ui", "−ai", "−ei"],
        plural: ["−ams", "−iams", "−iams", "−ums", "−oms", "−ėms"],
    },
    {
        key: "accusative",
        id: "ch-gal",
        singular: ["−ą", "−į", "−į", "−ų", "−ą", "−ę"],
        plural: ["−us", "−ius", "−ius", "−us", "−as", "−es"],
    },
    {
        key: "instrumental",
        id: "ch-inag",
        singular: ["−u", "−iu", "−iu", "−umi", "−a", "−e"],
        plural: ["−ais", "−iais", "−iais", "−umis", "−omis", "−ėmis"],
    },
    {
        key: "locative",
        id: "ch-viet",
        singular: ["−e", "−yje", "−yje", "−uje", "−oje", "−ėje"],
        plural: ["−uose", "−iuose", "−iuose", "−uose", "−ose", "−ėse"],
    },
    {
        key: "vocative",
        id: "ch-sauk",
        singular: ["−ai", "−i", "−iau", "−au", "−a", "−e"],
        plural: ["−ai", "−iai", "−iai", "−ūs", "−os", "−ės"],
        note: (
            <>
                Мн. ч. звательного часто совпадает с именительным мн. ч. У −ys звательный ед. ч.
                часто на −iau (<i lang="lt">arklys</i> — <i lang="lt">arkliau</i>), но бывают слова
                на <span lang="lt">−y</span>.
            </>
        ),
    },
]

function CaseTitle({ caseKey }) {
    const lt = CASE_BY_KEY[caseKey]?.lt ?? caseKey

    return (
        <>
            <span className="cases-help-ru-case">{caseRu(caseKey)}</span>
            <span lang="lt" className="cases-help-lt-sub">
                {lt}
            </span>
        </>
    )
}

function EndingsRow({ label, endings }) {
    return (
        <tr>
            <th scope="row">{label}</th>
            {endings.map((ending, index) => (
                <td key={`${index}-${ending}`}>
                    <span lang="lt">{ending}</span>
                </td>
            ))}
        </tr>
    )
}

/** Окончания по падежам: исходная форма, единственное и множественное число. */
export function CasesHelpTables() {
    return CASE_ENDINGS.map(({ key, id, singular, plural, note }) => (
        <section className="cases-help-case-block" aria-labelledby={id} key={key}>
            <h3 className="cases-help-table-title" id={id}>
                <CaseTitle caseKey={key} />
            </h3>
            <div className="cases-help-table-wrap">
                <table className="cases-help-table cases-help-table--endings">
                    <tbody>
                        <EndingsRow label="Окончания" endings={ENDINGS} />
                        <EndingsRow label="Ед. число" endings={singular} />
                        <EndingsRow label="Мн. число" endings={plural} />
                    </tbody>
                </table>
            </div>
            {note && <p className="cases-help-case-note sub">{note}</p>}
        </section>
    ))
}
