import { caseRu } from "../../../js/i18n/core.js"
import { STR } from "../../../js/i18n/strings-ru.js"

/** Заголовки таблицы окончаний. */
function CaseTableHead() {
    return (
        <thead>
            <tr>
                <th scope="col">{STR.help.tableStem}</th>
                <th scope="col">{STR.help.tableSg}</th>
                <th scope="col">{STR.help.tablePl}</th>
            </tr>
        </thead>
    )
}

function CaseTitle({ caseKey, children }) {
    return (
        <>
            <span className="cases-help-ru-case">{caseRu(caseKey)}</span>
            <span lang="lt" className="cases-help-lt-sub">
                {children}
            </span>
        </>
    )
}

/** Таблицы окончаний по падежам для экрана «Справка по падежам». */
export function CasesHelpTables() {
    return (
        <>
            <section className="cases-help-case-block" aria-labelledby="ch-kil">
                <h3 className="cases-help-table-title" id="ch-kil">
                    <CaseTitle caseKey="genitive">kilmininkas</CaseTitle>
                </h3>
                <div className="cases-help-table-wrap">
                    <table className="cases-help-table cases-help-table--one-case">
                        <CaseTableHead />
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−as</span>
                                </th>
                                <td>
                                    <span lang="lt">−o</span>
                                </td>
                                <td>
                                    <span lang="lt">−ų</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−is</span>
                                </th>
                                <td>
                                    <span lang="lt">−io</span>
                                </td>
                                <td>
                                    <span lang="lt">−ių</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ys</span>
                                </th>
                                <td>
                                    <span lang="lt">−io</span>
                                </td>
                                <td>
                                    <span lang="lt">−ių</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−us</span>
                                </th>
                                <td>
                                    <span lang="lt">−aus</span>
                                </td>
                                <td>
                                    <span lang="lt">−ų</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−a</span>
                                </th>
                                <td>
                                    <span lang="lt">−os</span>
                                </td>
                                <td>
                                    <span lang="lt">−ų</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ė</span>
                                </th>
                                <td>
                                    <span lang="lt">−ės</span>
                                </td>
                                <td>
                                    <span lang="lt">−ių</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="cases-help-case-block" aria-labelledby="ch-naud">
                <h3 className="cases-help-table-title" id="ch-naud">
                    <CaseTitle caseKey="dative">naudininkas</CaseTitle>
                </h3>
                <div className="cases-help-table-wrap">
                    <table className="cases-help-table cases-help-table--one-case">
                        <CaseTableHead />
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−as</span>
                                </th>
                                <td>
                                    <span lang="lt">−ui</span>
                                </td>
                                <td>
                                    <span lang="lt">−ams</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−is</span>
                                </th>
                                <td>
                                    <span lang="lt">−iui</span>
                                </td>
                                <td>
                                    <span lang="lt">−iams</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ys</span>
                                </th>
                                <td>
                                    <span lang="lt">−iui</span>
                                </td>
                                <td>
                                    <span lang="lt">−iams</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−us</span>
                                </th>
                                <td>
                                    <span lang="lt">−ui</span>
                                </td>
                                <td>
                                    <span lang="lt">−ums</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−a</span>
                                </th>
                                <td>
                                    <span lang="lt">−ai</span>
                                </td>
                                <td>
                                    <span lang="lt">−oms</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ė</span>
                                </th>
                                <td>
                                    <span lang="lt">−ei</span>
                                </td>
                                <td>
                                    <span lang="lt">−ėms</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="cases-help-case-block" aria-labelledby="ch-gal">
                <h3 className="cases-help-table-title" id="ch-gal">
                    <CaseTitle caseKey="accusative">galininkas</CaseTitle>
                </h3>
                <div className="cases-help-table-wrap">
                    <table className="cases-help-table cases-help-table--one-case">
                        <CaseTableHead />
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−as</span>
                                </th>
                                <td>
                                    <span lang="lt">−ą</span>
                                </td>
                                <td>
                                    <span lang="lt">−us</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−is</span>
                                </th>
                                <td>
                                    <span lang="lt">−į</span>
                                </td>
                                <td>
                                    <span lang="lt">−ius</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ys</span>
                                </th>
                                <td>
                                    <span lang="lt">−į</span>
                                </td>
                                <td>
                                    <span lang="lt">−ius</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−us</span>
                                </th>
                                <td>
                                    <span lang="lt">−ų</span>
                                </td>
                                <td>
                                    <span lang="lt">−us</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−a</span>
                                </th>
                                <td>
                                    <span lang="lt">−ą</span>
                                </td>
                                <td>
                                    <span lang="lt">−as</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ė</span>
                                </th>
                                <td>
                                    <span lang="lt">−ę</span>
                                </td>
                                <td>
                                    <span lang="lt">−es</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="cases-help-case-block" aria-labelledby="ch-inag">
                <h3 className="cases-help-table-title" id="ch-inag">
                    <CaseTitle caseKey="instrumental">įnagininkas</CaseTitle>
                </h3>
                <div className="cases-help-table-wrap">
                    <table className="cases-help-table cases-help-table--one-case">
                        <CaseTableHead />
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−as</span>
                                </th>
                                <td>
                                    <span lang="lt">−u</span>
                                </td>
                                <td>
                                    <span lang="lt">−ais</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−is</span>
                                </th>
                                <td>
                                    <span lang="lt">−iu</span>
                                </td>
                                <td>
                                    <span lang="lt">−iais</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ys</span>
                                </th>
                                <td>
                                    <span lang="lt">−iu</span>
                                </td>
                                <td>
                                    <span lang="lt">−iais</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−us</span>
                                </th>
                                <td>
                                    <span lang="lt">−umi</span>
                                </td>
                                <td>
                                    <span lang="lt">−umis</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−a</span>
                                </th>
                                <td>
                                    <span lang="lt">−a</span>
                                </td>
                                <td>
                                    <span lang="lt">−omis</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ė</span>
                                </th>
                                <td>
                                    <span lang="lt">−e</span>
                                </td>
                                <td>
                                    <span lang="lt">−ėmis</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="cases-help-case-block" aria-labelledby="ch-viet">
                <h3 className="cases-help-table-title" id="ch-viet">
                    <CaseTitle caseKey="locative">vietininkas</CaseTitle>
                </h3>
                <div className="cases-help-table-wrap">
                    <table className="cases-help-table cases-help-table--one-case">
                        <CaseTableHead />
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−as</span>
                                </th>
                                <td>
                                    <span lang="lt">−e</span>
                                </td>
                                <td>
                                    <span lang="lt">−uose</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−is</span>
                                </th>
                                <td>
                                    <span lang="lt">−yje</span>
                                </td>
                                <td>
                                    <span lang="lt">−iuose</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ys</span>
                                </th>
                                <td>
                                    <span lang="lt">−yje</span>
                                </td>
                                <td>
                                    <span lang="lt">−iuose</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−us</span>
                                </th>
                                <td>
                                    <span lang="lt">−uje</span>
                                </td>
                                <td>
                                    <span lang="lt">−uose</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−a</span>
                                </th>
                                <td>
                                    <span lang="lt">−oje</span>
                                </td>
                                <td>
                                    <span lang="lt">−ose</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ė</span>
                                </th>
                                <td>
                                    <span lang="lt">−ėje</span>
                                </td>
                                <td>
                                    <span lang="lt">−ėse</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="cases-help-case-block" aria-labelledby="ch-sauk">
                <h3 className="cases-help-table-title" id="ch-sauk">
                    <CaseTitle caseKey="vocative">šauksmininkas</CaseTitle>
                </h3>
                <div className="cases-help-table-wrap">
                    <table className="cases-help-table cases-help-table--one-case">
                        <CaseTableHead />
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−as</span>
                                </th>
                                <td>
                                    <span lang="lt">−ai</span>
                                </td>
                                <td>
                                    <span lang="lt">−ai</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−is</span>
                                </th>
                                <td>
                                    <span lang="lt">−i</span>
                                </td>
                                <td>
                                    <span lang="lt">−iai</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ys</span>
                                </th>
                                <td>
                                    <span lang="lt">−iau</span>
                                </td>
                                <td>
                                    <span lang="lt">−iai</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−us</span>
                                </th>
                                <td>
                                    <span lang="lt">−au</span>
                                </td>
                                <td>
                                    <span lang="lt">−ūs</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−a</span>
                                </th>
                                <td>
                                    <span lang="lt">−a</span>
                                </td>
                                <td>
                                    <span lang="lt">−os</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <span lang="lt">−ė</span>
                                </th>
                                <td>
                                    <span lang="lt">−e</span>
                                </td>
                                <td>
                                    <span lang="lt">−ės</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="cases-help-case-note sub">
                    Мн. ч. звательного часто совпадает с именительным мн. ч. У −ys звательный ед. ч.
                    часто на −iau (<i lang="lt">arklys</i> — <i lang="lt">arkliau</i>), но бывают
                    слова на <span lang="lt">−y</span>.
                </p>
            </section>
        </>
    )
}
