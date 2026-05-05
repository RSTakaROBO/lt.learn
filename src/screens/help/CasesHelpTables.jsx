/** Пустые заголовки таблицы (тексты выставляет i18n). */
function CaseTableHead() {
  return (
    <thead>
      <tr>
        <th scope="col" />
        <th scope="col" />
        <th scope="col" />
      </tr>
    </thead>
  );
}

/** Таблицы окончаний по падежам для экрана «Справка по падежам». */
export function CasesHelpTables() {
  return (
    <>
      <section className="cases-help-case-block" aria-labelledby="ch-kil">
        <h3 className="cases-help-table-title" id="ch-kil">
          <span className="cases-help-ru-case" data-case-key="genitive" />
          <span lang="lt" className="cases-help-lt-sub">
            kilmininkas
          </span>
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
          <span className="cases-help-ru-case" data-case-key="dative" />
          <span lang="lt" className="cases-help-lt-sub">
            naudininkas
          </span>
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
          <span className="cases-help-ru-case" data-case-key="accusative" />
          <span lang="lt" className="cases-help-lt-sub">
            galininkas
          </span>
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
          <span className="cases-help-ru-case" data-case-key="instrumental" />
          <span lang="lt" className="cases-help-lt-sub">
            įnagininkas
          </span>
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
          <span className="cases-help-ru-case" data-case-key="locative" />
          <span lang="lt" className="cases-help-lt-sub">
            vietininkas
          </span>
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
          <span className="cases-help-ru-case" data-case-key="vocative" />
          <span lang="lt" className="cases-help-lt-sub">
            šauksmininkas
          </span>
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
        <p className="cases-help-case-note sub" />
      </section>
    </>
  );
}
