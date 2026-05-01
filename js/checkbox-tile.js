/**
 * Стандартная карточка-чекбокс для приложения (наборы слов, падежи, настройки и т.п.).
 * Разметка: label.pack-card > input.pack-card-input.sr-only + .pack-card-face > .pack-card-main + .pack-card-tick
 * Стили: css/lists-actions.css (блок «Чекбокс-карточка»).
 *
 * @param {object} opts
 * @param {string} opts.id - атрибут id инпута (label for=)
 * @param {string} [opts.value] - value инпута (если нужно для формы/списка)
 * @param {boolean} [opts.checked=false]
 * @param {string} opts.titleText - заголовок (.pack-card-title)
 * @param {string} [opts.metaClass] - доп. классы на .pack-card-meta
 * @param {(Node|null|undefined)[]} [opts.metaChildren] - узлы внутри .pack-card-meta
 */
export function createCheckboxTileLabel(opts) {
  const {
    id,
    value,
    checked = false,
    titleText,
    metaClass = "",
    metaChildren,
  } = opts;

  const wrap = document.createElement("label");
  wrap.className = "pack-card";
  wrap.htmlFor = id;

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "pack-card-input sr-only";
  cb.id = id;
  if (value !== undefined && value !== null && String(value) !== "") {
    cb.value = String(value);
  }
  cb.checked = !!checked;

  const face = document.createElement("div");
  face.className = "pack-card-face";

  const main = document.createElement("div");
  main.className = "pack-card-main";

  const titleDiv = document.createElement("div");
  titleDiv.className = "pack-card-title";
  titleDiv.textContent = titleText ?? "";

  const metaDiv = document.createElement("div");
  metaDiv.className = metaClass.trim()
    ? `pack-card-meta ${metaClass.trim()}`
    : "pack-card-meta";

  const kids =
    metaChildren == null ? [] : Array.isArray(metaChildren) ? metaChildren : [metaChildren];
  for (const node of kids) {
    if (node != null) metaDiv.appendChild(node);
  }

  const tick = document.createElement("span");
  tick.className = "pack-card-tick";
  tick.setAttribute("aria-hidden", "true");

  main.appendChild(titleDiv);
  main.appendChild(metaDiv);
  face.appendChild(main);
  face.appendChild(tick);

  wrap.appendChild(cb);
  wrap.appendChild(face);
  return wrap;
}
