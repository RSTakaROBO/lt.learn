# LT Learn / Lithuanian trainer

Веб-тренажёр (литовский язык): падежи и словарь. Сборка — **статика** (подходит для **GitHub Pages**).

## Требования

- [Node.js](https://nodejs.org/) **18+** (для `npm` и Vite)

## Локальный запуск

```bash
npm install
npm run dev
```

Открой в браузере адрес из терминала (обычно `http://localhost:5173/lt.learn/` — см. ниже про `base`).

## Скрипты

| Команда | Назначение |
|--------|------------|
| `npm run dev` | Режим разработки (HMR) |
| `npm run build` | Production-сборка в папку `dist/` |
| `npm run preview` | Локальный просмотр содержимого `dist/` |

Словари (`public/words/`), иконки и `site.webmanifest` копируются в `dist/` автоматически из `public/`.

## Деплой на GitHub Pages

В `vite.config.js` задано `base: '/lt.learn/'` — путь к репозиторию на Pages:  
`https://<user>.github.io/lt.learn/`

Если имя репозитория другое — измени `base` на `/<repo>/` и пересобери.

Публикация: в настройках Pages укажи источник (например GitHub Actions или ветку с содержимым `dist/`). Итоговый корень сайта должен совпадать с тем, что ожидает `base`.

## Структура (важное)

- `src/` — точка входа React (Vite): `main.jsx`, `App.jsx`, агрегированные стили.
- `css/`, `themes.css` — стили приложения (подключаются из `src/styles.css`).
- `js/` — модуль логики старого SPA; перенос в React — в процессе.
- `public/` — статика как есть: `words/`, `icons/`, `site.webmanifest`.
- HTML в проекте один раз — корневой `index.html` (точка входа Vite); вся разметка приложения в `src/**/*.jsx`.
- `sw.js` — service worker прежней схемы; с хешированными бандлами Vite его нужно обновить или заменить (например на `vite-plugin-pwa`).

## Ограничения `file://`

Загрузка `words/*.json` через `fetch` при открытии файла с диска (`file://`) в браузерах часто блокируется. Для проверки используй `npm run dev` или любой локальный HTTP-сервер для каталога `dist/` после `npm run build`.
