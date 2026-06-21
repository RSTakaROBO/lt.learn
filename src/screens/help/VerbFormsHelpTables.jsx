import { STR } from "js/i18n/strings-ru.js"

const ROW_LABELS = [
    STR.help.verbsRow1,
    STR.help.verbsRow2,
    STR.help.verbsRow3,
    STR.help.verbsRow4,
    STR.help.verbsRow5,
    STR.help.verbsRow6,
]
const LT_PERSONS = ["aš", "tu", "jis / ji", "mes", "jūs", "jie / jos"]

const CONJUGATIONS = [
    {
        id: "vfh-conjugation-one",
        title: "I спряжение",
        marker: "3-е лицо оканчивается на -a или -ia",
        principalForms: "dirbti — dirba — dirbo",
        translation: "работать",
        endings: ["-u", "-i", "-a", "-ame", "-ate", "-a"],
        forms: ["dirbu", "dirbi", "dirba", "dirbame", "dirbate", "dirba"],
    },
    {
        id: "vfh-conjugation-two",
        title: "II спряжение",
        marker: "3-е лицо оканчивается на -i",
        principalForms: "mylėti — myli — mylėjo",
        translation: "любить",
        endings: ["-iu", "-i", "-i", "-ime", "-ite", "-i"],
        forms: ["myliu", "myli", "myli", "mylime", "mylite", "myli"],
    },
    {
        id: "vfh-conjugation-three",
        title: "III спряжение",
        marker: "3-е лицо оканчивается на -o",
        principalForms: "skaityti — skaito — skaitė",
        translation: "читать",
        endings: ["-au", "-ai", "-o", "-ome", "-ote", "-o"],
        forms: ["skaitau", "skaitai", "skaito", "skaitome", "skaitote", "skaito"],
    },
]

function ConjugationTable({ conjugation }) {
    return (
        <section className="cases-help-case-block" aria-labelledby={conjugation.id}>
            <h3 className="cases-help-table-title" id={conjugation.id}>
                <span className="cases-help-ru-case">{conjugation.title}</span>
                <span className="cases-help-lt-sub">{conjugation.marker}</span>
            </h3>
            <p className="verb-forms-help-example">
                <span lang="lt">{conjugation.principalForms}</span> — {conjugation.translation}
            </p>
            <div className="cases-help-table-wrap">
                <table className="cases-help-table cases-help-table--one-case">
                    <thead>
                        <tr>
                            <th scope="col">Лицо (РУ)</th>
                            <th scope="col">Лицо (LT)</th>
                            <th scope="col">Окончание</th>
                            <th scope="col">Пример</th>
                        </tr>
                    </thead>
                    <tbody>
                        {LT_PERSONS.map((person, i) => (
                            <tr key={person}>
                                <th scope="row">{ROW_LABELS[i]}</th>
                                <td>
                                    <span lang="lt">{person}</span>
                                </td>
                                <td>
                                    <span className="verb-forms-help-ending">
                                        {conjugation.endings[i]}
                                    </span>
                                </td>
                                <td>
                                    <span lang="lt">{conjugation.forms[i]}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export function VerbFormsHelpTables() {
    return (
        <>
            <section className="cases-help-case-block" aria-labelledby="vfh-conjugations-intro">
                <h3 className="cases-help-table-title" id="vfh-conjugations-intro">
                    Три спряжения литовских глаголов
                </h3>
                <p className="cases-help-case-note verb-forms-help-lead">
                    Спряжение определяют по окончанию формы 3-го лица настоящего времени. В 3-м лице
                    одна форма используется и для единственного, и для множественного числа.
                </p>
            </section>
            {CONJUGATIONS.map((conjugation) => (
                <ConjugationTable conjugation={conjugation} key={conjugation.id} />
            ))}
            <p className="cases-help-case-note sub verb-forms-help-final-note">
                I, II и III спряжения описывают настоящее время. Прошедшую основу нельзя надёжно
                вывести только из номера спряжения, поэтому глагол лучше учить в трёх формах:
                инфинитив, 3-е лицо настоящего и 3-е лицо прошедшего времени.
            </p>
        </>
    )
}
