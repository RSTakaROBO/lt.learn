/**
 * Простая таблица: `columns` (key, header, narrow?, highlight?, lang?), `rows`, `getRowKey`;
 * `variant`: panel — рамка, plain — только table.
 */
export function DataTable({ caption, columns, rows, getRowKey, variant = "panel" }) {
    const table = (
        <table className="data-table">
            <caption className="sr-only">{caption}</caption>
            <thead>
                <tr>
                    {columns.map((col) => (
                        <th
                            key={col.key}
                            scope="col"
                            className={[
                                "data-table__th",
                                col.narrow ? "data-table__th--narrow" : "data-table__th--leading",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        >
                            {col.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={getRowKey(row)}>
                        {columns.map((col) => (
                            <td
                                key={col.key}
                                className={[
                                    "data-table__td",
                                    col.narrow && "data-table__td--narrow",
                                    col.highlight && "data-table__td--highlight",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                {...(col.lang ? { lang: col.lang } : {})}
                            >
                                {row[col.key] ?? ""}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )

    if (variant === "plain") {
        return table
    }

    return <div className="data-table-scroll">{table}</div>
}
