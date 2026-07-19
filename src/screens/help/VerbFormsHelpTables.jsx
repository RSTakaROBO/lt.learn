const VERB_PERSON_ROWS = [
    { lt: "aš", formIndex: 0 },
    { lt: "tu", formIndex: 1 },
    {
        lt: "jis / ji / jie / jos",
        formIndex: 2,
    },
    { lt: "mes", formIndex: 3 },
    { lt: "jūs", formIndex: 4 },
]

const FUTURE_FORMS = {
    id: "vfh-future-tense",
    title: "Будущее время",
    marker: "būsimasis laikas",
    principalForms: "dirbti — dirba — dirbo",
    translation: "работать",
    endings: ["-siu", "-si", "-s", "-sime", "-site", "-s"],
    forms: ["dirbsiu", "dirbsi", "dirbs", "dirbsime", "dirbsite", "dirbs"],
}

const PAST_TENSE_PATTERNS = [
    {
        id: "vfh-past-o",
        title: "Прошедшее: форма 3-го лица на -o",
        principalForms: "dirbti — dirba — dirbo",
        translation: "работать",
        endings: ["-au", "-ai", "-o", "-ome", "-ote", "-o"],
        forms: ["dirbau", "dirbai", "dirbo", "dirbome", "dirbote", "dirbo"],
    },
    {
        id: "vfh-past-e",
        title: "Прошедшее: форма 3-го лица на -ė",
        principalForms: "skaityti — skaito — skaitė",
        translation: "читать",
        endings: ["-iau", "-ei", "-ė", "-ėme", "-ėte", "-ė"],
        forms: ["skaičiau", "skaitei", "skaitė", "skaitėme", "skaitėte", "skaitė"],
    },
]

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

/** Одна таблица форм: используется в справке и в боковой карточке времени. */
export function VerbFormsTable({ item, controls = null, docked = false }) {
    return (
        <section
            className={docked ? "verb-tenses-reference-dock-card" : "cases-help-case-block"}
            aria-labelledby={docked ? undefined : item.id}
        >
            <div className="cases-help-case-heading">
                <h3 className="cases-help-table-title" id={docked ? undefined : item.id}>
                    <span className="cases-help-ru-case">{item.title}</span>
                    {item.marker && <span className="cases-help-lt-sub">{item.marker}</span>}
                </h3>
                {controls}
            </div>
            <p className="verb-forms-help-example">
                <span lang="lt">{item.principalForms}</span> — {item.translation}
            </p>
            {item.rule && <p className="cases-help-case-note verb-forms-help-lead">{item.rule}</p>}
            <div className="cases-help-table-wrap">
                <table className="cases-help-table cases-help-table--one-case">
                    <thead>
                        <tr>
                            <th scope="col">Лицо</th>
                            <th scope="col">Окончание</th>
                            <th scope="col">Пример</th>
                        </tr>
                    </thead>
                    <tbody>
                        {VERB_PERSON_ROWS.map(({ lt, formIndex }) => (
                            <tr key={lt}>
                                <th scope="row">
                                    <span lang="lt">{lt}</span>
                                </th>
                                <td>
                                    <span className="verb-forms-help-ending">
                                        {item.endings[formIndex]}
                                    </span>
                                </td>
                                <td>
                                    <span lang="lt">{item.forms[formIndex]}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {item.note && <p className="cases-help-case-note sub">{item.note}</p>}
        </section>
    )
}

export function PresentVerbFormsHelpTables() {
    return (
        <>
            <section className="cases-help-case-block" aria-labelledby="vfh-conjugations-intro">
                <h3 className="cases-help-table-title" id="vfh-conjugations-intro">
                    Спряжения настоящего времени
                </h3>
                <p className="cases-help-case-note verb-forms-help-lead">
                    Спряжение определяют по окончанию формы 3-го лица настоящего времени. В 3-м лице
                    одна форма используется и для единственного, и для множественного числа.
                </p>
            </section>
            {CONJUGATIONS.map((conjugation) => (
                <VerbFormsTable item={conjugation} key={conjugation.id} />
            ))}
            <p className="cases-help-case-note sub verb-forms-help-final-note">
                I, II и III спряжения здесь описывают только настоящее время. Прошедшее и будущее
                время вынесены в отдельный экран.
            </p>
        </>
    )
}

export function OtherVerbTensesHelpTables() {
    return (
        <>
            <section className="cases-help-case-block" aria-labelledby="vfh-other-tenses-intro">
                <h3 className="cases-help-table-title" id="vfh-other-tenses-intro">
                    Прошедшее и будущее время
                </h3>
                <p className="cases-help-case-note verb-forms-help-lead">
                    Прошедшее время строят от формы 3-го лица прошедшего времени. В словаре
                    тренажёра это поле «3 л. прош.». Будущее время строят от инфинитива.
                </p>
            </section>
            {PAST_TENSE_PATTERNS.map((pattern) => (
                <VerbFormsTable item={pattern} key={pattern.id} />
            ))}
            <VerbFormsTable item={FUTURE_FORMS} />
        </>
    )
}

/** Карточки прошедшего и будущего времени с необязательными управляющими кнопками. */
export function OtherVerbTensesReferenceTables({ renderControls }) {
    return (
        <>
            <section className="cases-help-case-block" aria-labelledby="vfh-other-tenses-intro">
                <h3 className="cases-help-table-title" id="vfh-other-tenses-intro">
                    Прошедшее и будущее время
                </h3>
                <p className="cases-help-case-note verb-forms-help-lead">
                    Прошедшее время строят от формы 3-го лица прошедшего времени. В словаре
                    тренажёра это поле «3 л. прош.». Будущее время строят от инфинитива.
                </p>
            </section>
            {PAST_TENSE_PATTERNS.map((pattern) => (
                <VerbFormsTable
                    item={pattern}
                    key={pattern.id}
                    controls={renderControls?.(pattern.id)}
                />
            ))}
            <VerbFormsTable item={FUTURE_FORMS} controls={renderControls?.(FUTURE_FORMS.id)} />
        </>
    )
}

export function getOtherVerbTenseItem(id) {
    return [...PAST_TENSE_PATTERNS, FUTURE_FORMS].find((item) => item.id === id) || null
}

export const OTHER_VERB_TENSE_OPTIONS = [...PAST_TENSE_PATTERNS, FUTURE_FORMS].map(
    ({ id, title }) => ({ id, title })
)

export function VerbFormsHelpTables() {
    return (
        <>
            <PresentVerbFormsHelpTables />
            <OtherVerbTensesHelpTables />
        </>
    )
}
