/** Таблица «būti» для справки по глаголам. */
import { STR } from "../../../js/i18n/strings-ru.js"

export function VerbsHelpTables() {
    const rowLabels = [
        STR.help.verbsRow1,
        STR.help.verbsRow2,
        STR.help.verbsRow3,
        STR.help.verbsRow4,
        STR.help.verbsRow5,
        STR.help.verbsRow6,
    ]
    const ltPersons = ["aš", "tu", "jis / ji", "mes", "jūs", "jie / jos"]
    const affirm = ["esu", "esi", "yra", "esame", "esate", "yra"]
    const neg = ["nesu", "nesi", "nėra", "nesame", "nesate", "nėra"]

    return (
        <section className="cases-help-case-block" aria-labelledby="vh-but-present">
            <h3 className="cases-help-table-title" id="vh-but-present">
                <span className="cases-help-ru-case">{STR.help.verbsPresent}</span>
                <span lang="lt" className="cases-help-lt-sub">
                    būti
                </span>
            </h3>
            <div className="cases-help-table-wrap">
                <table className="cases-help-table cases-help-table--one-case">
                    <thead>
                        <tr>
                            <th scope="col">{STR.help.verbsColPerson}</th>
                            <th scope="col">{STR.help.verbsColAffirm}</th>
                            <th scope="col">{STR.help.verbsColNeg}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ltPersons.map((person, i) => (
                            <tr key={person}>
                                <th scope="row">
                                    {rowLabels[i]}{" "}
                                    <span lang="lt" className="cases-help-lt-sub">
                                        {person}
                                    </span>
                                </th>
                                <td>
                                    <span lang="lt">{affirm[i]}</span>
                                </td>
                                <td>
                                    <span lang="lt">{neg[i]}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="cases-help-case-note sub">
                В 3-м лице <span lang="lt">yra</span> и <span lang="lt">nėra</span> совпадают для
                единственного и множественного числа.
            </p>
        </section>
    )
}
