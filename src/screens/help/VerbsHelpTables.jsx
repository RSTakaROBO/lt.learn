/** Таблица «būti» для справки по глаголам. */
export function VerbsHelpTables() {
  return (
    <section className="cases-help-case-block" aria-labelledby="vh-but-present">
      <h3 className="cases-help-table-title" id="vh-but-present">
        <span className="cases-help-ru-case" />
        <span lang="lt" className="cases-help-lt-sub">
          būti
        </span>
      </h3>
      <div className="cases-help-table-wrap">
        <table className="cases-help-table cases-help-table--one-case">
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col" />
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <span lang="lt" className="cases-help-lt-sub">
                  aš
                </span>
              </th>
              <td>
                <span lang="lt">esu</span>
              </td>
              <td>
                <span lang="lt">nesu</span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span lang="lt" className="cases-help-lt-sub">
                  tu
                </span>
              </th>
              <td>
                <span lang="lt">esi</span>
              </td>
              <td>
                <span lang="lt">nesi</span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span lang="lt" className="cases-help-lt-sub">
                  jis / ji
                </span>
              </th>
              <td>
                <span lang="lt">yra</span>
              </td>
              <td>
                <span lang="lt">nėra</span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span lang="lt" className="cases-help-lt-sub">
                  mes
                </span>
              </th>
              <td>
                <span lang="lt">esame</span>
              </td>
              <td>
                <span lang="lt">nesame</span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span lang="lt" className="cases-help-lt-sub">
                  jūs
                </span>
              </th>
              <td>
                <span lang="lt">esate</span>
              </td>
              <td>
                <span lang="lt">nesate</span>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <span lang="lt" className="cases-help-lt-sub">
                  jie / jos
                </span>
              </th>
              <td>
                <span lang="lt">yra</span>
              </td>
              <td>
                <span lang="lt">nėra</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="cases-help-case-note sub" />
    </section>
  );
}
