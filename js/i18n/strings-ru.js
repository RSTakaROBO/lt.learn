/**
 * Все пользовательские строки интерфейса (RU).
 * Для шаблонов используйте fmt() из core.js и плейсхолдеры {title}, {count}, …
 */
const MD_FENCE = "```"

export const STR = {
    app: {
        pageTitle: "Тренажёр падежей",
        appleWebAppTitle: "LT падежи",
        versionLabel: "version",
    },

    wizard: {
        homeKicker: "Ни дня без",
        homeEm: "литовского",
        exerciseTypeAria: "Тип упражнения",
        packsHeading: "Наборы слов",
        sentencePacksHeading: "Наборы предложений",
        casesHeading: "Падежи",
        vocabDirectionHeading: "Направление перевода",
        verbModeHeading: "Режим глаголов",
    },

    mode: {
        casesTitle: "Изучение падежей",
        casesDesc: "Тренируйте литовские формы существительных по выбранным падежам.",
        vocabTitle: "Изучение слов",
        vocabDesc: "Запоминайте слова и переводы в обычном или хардкор-режиме.",
        verbsTitle: "Изучение глаголов",
        verbsDesc: "Учите глаголы карточками или восстанавливайте их основные формы.",
        sentencesTitle: "Предложения",
        sentencesDesc: "Собирайте литовский перевод из слов, среди которых есть лишние.",
    },

    packs: {
        llmPromptAria: "Промпт для нейросети: как составить свой JSON",
        llmPromptTitle: "Промпт для нейросети",
        previewAria: "Предпросмотр набора «{title}»",
        uploadJsonLabel: "Загрузить свой JSON…",
        uploadJsonAria: "Загрузить свой файл словаря JSON",
        wordCountMeta: "Слов: {total}. Подходящих: {suitable}",
        excludeLearnedTitle: "Убрать изученные слова",
        excludeLearnedMeta: "Скрывать слова, где верных ответов минимум на 5 больше, чем неверных",
        back: "Назад",
        next: "Далее",
        start: "Начать",
    },

    sentencePacks: {
        countMeta: "Предложений: {count}",
    },

    confirm: {
        cancel: "Отмена",
        finish: "Завершить",
        finishRoundTitle: "Завершить урок?",
        finishRoundMessage:
            "Раунд остановится сейчас, и откроется статистика по уже пройденным ответам.",
        finishRoundWords: "Изучено слов",
        finishRoundOf: "из",
        finishRoundStages: "Раундов пройдено",
        leaveTrainingTitle: "Закончить тренировку?",
        leaveTrainingMessage: "Вы вернётесь в меню настройки урока. Текущий раунд будет прерван.",
        leaveTrainingConfirm: "Закончить",
    },

    vocabDirection: {
        ruLtTitle: "С русского на литовский",
        ruLtMeta: "Подсказка по-русски — выберите слово на литовском",
        ltRuTitle: "С литовского на русский",
        ltRuMeta: "Слово на литовском — выберите русский перевод",
        hardcoreBlockAria: "Режим изучения слов",
        modeChoicesTitle: "4 карточки",
        modeChoicesMeta: "Обычный режим: выберите правильный вариант из четырёх",
        modeSingleTitle: "1 карточка",
        modeSingleMeta: "Смахните слово: влево — не знаю, вправо — знаю; затем оцените ответ",
        hardcoreTitle: "Хардкор",
        hardcoreMeta:
            "Ввод слова вручную: поле ответа и кнопки литовских букв (без вариантов выбора)",
    },

    verbMode: {
        cardsTitle: "Карточки",
        cardsMeta: "Русская подсказка, литовский глагол, свайпы влево и вправо",
        formCardsTitle: "Изучение форм. Карточки",
        formCardsMeta: "Три формы глагола, одна скрыта; ответ открывается следующей карточкой",
        formsTitle: "Изучение форм",
        formsMeta: "Восстанавливайте инфинитив, настоящее и прошедшее 3-го лица",
        conjugationTitle: "Спряжения",
        conjugationMeta: "vakar / šiandien / rytoj + лицо + инфинитив",
    },

    quiz: {
        targetCasePrefix: "Падеж:",
        answerLabel: "Ваш ответ",
        answerPlaceholder: "Введите слово…",
        ltCharsToolbarAria: "Вставить литовскую букву",
        ltCharsToggleShow: "Показать литовские буквы",
        ltCharsToggleHide: "Скрыть литовские буквы",
        vocabChoicesAria: "Выберите перевод",
        skip: "Пропустить",
        check: "Проверить",
        next: "Далее",
        vocabRuToLtAria: "Выберите литовский вариант",
        vocabLtToRuAria: "Выберите русский перевод",
        vocabSingleCardAria: "Словарная карточка со свайпом",
        vocabSingleAnswerLabel: "Правильно:",
        vocabSingleUnknown: "Не знаю",
        vocabSingleKnown: "Знаю",
        vocabSingleWrong: "Неверно",
        vocabSingleCorrect: "Верно",
        verbFormsAria: "Основные формы глагола",
        verbConjugationAria: "Спряжение глагола",
        hiddenVerbForm: "?",
        noVocabUi:
            "Не удалось открыть режим «Слова». Обновите страницу или очистите данные сайта / кэш приложения.",
        noVocabChoices: "Нет данных для вариантов ответа. Вернитесь в меню.",
        noWordsLeft: "Слов больше нет.",
        correct: "🐱",
        wrong: "😖",
        correctIs: "Правильно:",
        exceptionStrong: "Исключение:",
        emDash: "—",
        lithuanianKeyboardHideAria: "Скрыть клавиатуру",
        sentenceBuilderAria: "Соберите литовское предложение",
        sentenceAnswerAria: "Ваше предложение",
        sentenceWordBankAria: "Доступные литовские слова",
        sentenceEmptyAnswer: "Ответ",
        sentenceRemoveWord: "Убрать слово {word} из ответа",
        sentenceAddWord: "Добавить слово {word}",
        sentenceWordInfoAria: "Показать подсказку по слову {word}",
        sentenceWordInfoCase: "Падеж",
    },

    help: {
        casesTitle: "Правила падежей",
        close: "Закрыть",
        tableStem: "Основа",
        tableSg: "Ед. ч.",
        tablePl: "Мн. ч.",
        verbsRow1: "я",
        verbsRow2: "ты",
        verbsRow3: "он / она",
        verbsRow4: "мы",
        verbsRow5: "вы",
        verbsRow6: "они",
    },

    bottomBar: {
        toolbarAria: "Меню тренажёра",
        search: "Поиск",
        searchAria: "Поиск слов",
        stats: "Статистика",
        statsAria: "Статистика",
        changelog: "Changelog",
        changelogAria: "Changelog",
        menu: "Меню",
        menuAria: "В меню",
        help: "Правила",
        helpAria: "Правила",
        settings: "Настройки",
        settingsAria: "Настройки",
    },

    helpHub: {
        title: "Правила",
        casesBtn: "Правила падежей",
        close: "Закрыть",
    },

    vocabRound: {
        summaryTitle: "Статистика",
        repeat: "Повторить",
        ok: "Ок",
        excludeWordAria: "Убрать слово из текущего урока",
        excludeWordTitle: "Убрать из урока",
        ariaDots: "Прогресс слова до статуса «выучено»: {filled} из {max}",
        ariaProgress: "Выучено {done} из {total} слов",
        statAccuracy: "Точность",
        statAnswered: "Этапов",
        statCorrect: "Верно",
        statWrong: "Неверно",
        statMaxStreak: "Макc. серия",
        sectionHard: "Сложнее всего дались",
        noWrongWords: "За раунд не было неверных ответов по словам.",
        noSummaryData: "Данных раунда пока нет.",
        tableCaption: "Топ слов по числу ошибок",
        thNum: "#",
        thWord: "Слово",
        thErr: "Ошибок",
        percentUnit: "%",
    },

    wordInfo: {
        openAria: "Открыть информацию по слову",
        openTitle: "Информация по слову",
        kicker: "Слово",
        titleFallback: "Слово",
        translations: "Переводы",
        forms: "Формы",
        details: "Данные",
        partOfSpeech: "Часть речи",
        lemma: "Лемма",
        conjugation: "Спряжение",
        id: "ID",
        exception: "Исключение",
        exceptionNote: "Заметка",
        yes: "да",
        no: "нет",
        close: "Закрыть",
    },

    stats: {
        title: "Статистика",
        tableCaption: "Слова: верно и неверно",
        thWord: "Слово",
        thCorrect: "Верно",
        thWrong: "Неверно",
        empty: "Пока нет данных — ответьте на несколько слов или пропустите их.",
        sumCorrect: "Верно",
        sumWrong: "Неверно",
        sumSkipped: "Пропущено",
        sumTotal: "Всего",
        sumPercent: "Процент верных",
        close: "Закрыть",
        clear: "Очистить статистику",
        clearConfirm:
            "Удалить все сохранённые счётчики по словам из памяти устройства? Отменить это действие будет нельзя.",
    },

    changelog: {
        title: "Changelog",
        version: "Версия",
        close: "Закрыть",
        current: [
            {
                title: "Новый набор слов",
                text: "Добавлен набор «5. Prašau paragauti»: упаковка продуктов, блюда, покупки и цвета.",
            },
        ],
        previousVersion: "0.6.0",
        previous: [
            {
                title: "Новый режим спряжений",
                text: "В режиме «Изучение глаголов» появился вариант «Спряжения»: тренажёр случайно собирает подсказку из времени, местоимения и инфинитива, а ответ проверяется в правильной личной форме.",
            },
        ],
    },

    settings: {
        title: "Настройки",
        themeLabel: "Цветовая тема",
        themePickerAria: "Цветовая тема",
        learningScopeTitle: "Слов в активном стеке",
        learningScopeMeta:
            "Столько новых слов учится одновременно. Выученное слово заменяется следующим из словаря. Применяется к новому уроку.",
        learningScopeAria: "Количество одновременно изучаемых слов",
        learningScopeUnit: "слов",
        casesTranslationTitle: "Отображать перевод при изучении падежей",
        casesTranslationMeta: "Русский перевод в скобках под литовским словом",
        vocabWrongTranslationTitle: "Показывать неправильное слово",
        vocabWrongTranslationMeta:
            "В режиме выбора карточек показывать перевод выбранного неверного варианта",
        vocabVerbFormsTitle: "Показывать три формы глагола",
        vocabVerbFormsMeta:
            "На карточках слов показывать инфинитив, 3-е лицо настоящего и прошедшего времени",
        simplifiedAnswerModeTitle: "Упрощённый режим",
        simplifiedAnswerModeMeta:
            "При ручном вводе засчитывать e вместо ė и u вместо ū в литовских словах",
        casesNativeKeyboardTitle: "Нативная клавиатура",
        casesNativeKeyboardMeta: "Стандартная клавиатура телефона вместо встроенной в приложении",
        close: "Закрыть",
    },

    themes: {
        ocean: "Океан",
        forest: "Лес",
        ember: "Янтарь",
        paper: "Бумага",
        mist: "Туман",
    },

    packPrompt: {
        title: "Промпт для нейросети",
        lead: "Скопируйте текст и вставьте в чат с LLM. Ответ сохраните как файл .json и загрузите в тренажёр через «Загрузить свой JSON…».",
        textareaLabel: "Текст промпта для языковой модели",
        copy: "Скопировать",
        close: "Закрыть",
        llmPrompt: `ТЕМА И ОБЪЁМ НАБОРА (перед отправкой замени строку ниже на свою — модель должна опираться на неё при составлении набора):
→ [например: кухня и посуда, около 30 слов]

---

Ты составляешь один JSON-файл словаря для веб-тренажёра литовского языка (тот же формат, что у встроенных наборов приложения).

Как отдать результат пользователю (выбери лучший доступный тебе вариант):
1) Предпочтительно: приложи готовый файл с расширением .json (вложение в чат) ИЛИ дай прямую HTTPS-ссылку на скачивание сырого JSON (ответ только файл, без HTML-страницы оболочки), кодировка UTF-8.
2) Если ни файла, ни рабочей прямой ссылки ты дать не можешь: выведи весь готовый JSON одним блоком в Markdown с подсветкой языка json — между строками из тройных обратных кавычек, сразу после слова json на отдельной строке открывай объект, затем закрой блок тройными обратными кавычками. Тогда в интерфейсе многих чатов появится кнопка «Копировать» / «Copy code» для всего JSON целиком.

Пример структуры файла (мини-иллюстрация: в твоём ответе массив "words" должен быть полным по теме и объёму из начала промпта):

${MD_FENCE}json
{
  "schemaVersion": 1,
  "title": "Кухня",
  "words": [
    {
      "type": "noun",
      "lemma": "stalas",
      "stress": 2,
      "forms": {
        "nominative": "stalas",
        "genitive": "stalo",
        "dative": "stalui",
        "accusative": "stalą",
        "instrumental": "stalu",
        "locative": "stale",
        "vocative": "stale"
      },
      "translations": ["стол"]
    },
    {
      "type": "verb",
      "lemma": "eiti",
      "stress": 1,
      "forms": {
        "infinitive": "eiti",
        "present3": "eina",
        "past3": "ėjo"
      },
      "translations": ["идти", "ходить"]
    }
  ]
}
${MD_FENCE}

Требования к содержимому JSON (строго валидный JSON, UTF-8, без комментариев и без хвостовых запятых):
• Корень — объект с полями:
  – "schemaVersion": 1 — обязательная версия формата.
  – "title" (необязательно): короткое название набора для списка паков (можно отразить тему из начала промпта).
  – "words": массив словарных статей.
• Существительное — объект:
  "type": "noun", "lemma": словарная форма, "forms": { nominative, genitive, dative, accusative, instrumental, locative, vocative } — все семь падежей, строки на литовском.
• Глагол — отдельная структура (не смешивай с падежами существительного):
  "type": "verb", "lemma": инфинитив (как правило совпадает с forms.infinitive), обязательный объект "forms" с ровно тремя полями и именами ключей строго такими (латиница, camelCase, без подчёркиваний):
  – "infinitive" — инфинитив (bendratis),
  – "present3" — форма 3-го лица ед. ч. настоящего времени (esamasis laikas: jis/ji …),
  – "past3" — форма 3-го лица ед. ч. прошедшего (būtasis kartinis laikas: jis/ji …).
  Опционально можно добавить "conjugation": "I", "II" или "III" — спряжение по форме present3.
  Для режима «Спряжения» можно добавить "stems": { "infinitive": "...", "present": "...", "past": "..." } — основы для будущего, настоящего и прошедшего времени. Если отдельные формы не строятся по правилу, добавь "overrides": { "present": { "1s": "...", "2s": "...", "3": "...", "1p": "...", "2p": "..." }, "past": { ... }, "future": { ... } }.
  Эти глаголы используются в режиме «Изучение глаголов» тренажёра и попадают в общий режим слов / предпросмотр набора. Без трёх форм в "forms" статья для глаголов считается неполной.
• Прилагательное и прочие типы: "type": "adjective" (или другой помеченный тип), "lemma": литовская форма и пустой объект "forms": {}.
• Ударение — обязательное числовое поле "stress" прямо в объекте словарной статьи:
  – целое число от 0, обозначающее индекс ударной гласной в "lemma"; отсчёт начинается с нуля;
  – для существительного индекс относится к словарной форме lemma / forms.nominative, для глагола — к инфинитиву lemma / forms.infinitive;
  – считай литовскую букву с диакритикой (ą, č, ę, ė, į, š, ų, ū, ž) одной буквой; пробелы и дефисы тоже занимают позицию в строке;
  – пример: "stalas" → "stress": 2, поэтому выделяется третья буква a; "eiti" → "stress": 1, поэтому выделяется вторая буква i;
  – само слово записывай в обычной орфографии: не вставляй знак ударения, апостроф, заглавную букву или другой маркер внутрь lemma и forms;
  – обязательно проверь позицию ударения по авторитетному литовскому словарю и добавь корректный "stress" в каждую статью массива "words".
• Обязательно поле перевода:
  "translations" — массив допустимых русских переводов, даже если перевод один.
• Для особых парадигм можно добавить "exception": true и краткое "exception_note_ru" по-русски (пояснение для ученика).

Правила качества:
1. Падежные формы существительных сверь с авторитетными словарями (например žodynas.lt, VLE, Akademikas) — ошибки в формах недопустимы.
2. Формы глаголов проверяй по тем же источникам: инфинитив, наст. 3 ед., прош. 3 ед. должны соответствовать литовской норме; не подставляй «ближайшее» спряжение другого глагола.
3. Один элемент массива "words" = одна лемма (одно существительное ИЛИ один глагол и т.д.).
4. Если отдаёшь только текст без файла и без ссылки — не добавляй пояснений снаружи fenced-блока; весь полезный вывод должен быть либо одним JSON в блоке как выше, либо файлом/ссылкой.

Отдельно — образец только для статьи глагола (те же ключи, что в мини-примере выше):
{
  "type": "verb",
  "lemma": "mokytis",
  "forms": {
    "infinitive": "mokytis",
    "present3": "mokosi",
    "past3": "mokėsi"
  },
  "translations": ["учиться"]
}`,
    },

    packPreview: {
        wordCount: "Слов в наборе: {count}",
        empty: "В этом наборе нет слов для предпросмотра.",
        thLemma: "Лемма",
        thTranslation: "Перевод",
        close: "Назад",
        parts: {
            noun: "Существительные",
            verb: "Глаголы",
            adjective: "Прилагательные",
            other: "Другое",
        },
    },

    clipboard: {
        copyLabel: "Скопировать",
        copied: "Скопировано",
        selectManually: "Выделите текст",
    },

    cases: {
        nominative: "Именительный",
        genitive: "Родительный",
        dative: "Дательный",
        accusative: "Винительный",
        instrumental: "Творительный",
        locative: "Местный",
        vocative: "Звательный",
    },

    events: {
        customPackRemoved: "Пользовательский набор удалён.",
        refreshPackListFailed: "Не удалось обновить список наборов.",
        packAdded: "Набор «{title}» добавлен ({count} слов).",
        pickVocabDir: "Выберите хотя бы одно направление перевода.",
        vocabNeedRuOne: "Нужно хотя бы одно слово с русским переводом в выбранных наборах.",
        vocabNeedRuFour:
            "Для режима «4 карточки» нужно минимум 4 слова с русским переводом в выбранных наборах.",
        roundNoWords: "Не удалось начать раунд: нет слов с переводом.",
        vocabStartHardcoreFail: "Не удалось начать игру. Проверьте наборы слов.",
        vocabStartChoicesFail: "Не удалось составить четыре варианта ответа.",
        pickOnePack: "Выберите хотя бы один набор.",
        pickOneSentencePack: "Выберите хотя бы один набор предложений.",
        sentencesStartFail: "Не удалось начать урок. Проверьте наборы предложений.",
        packsNoWordFiles: "В выбранных паках нет файлов со словами.",
        loadingDictionaries: "Загрузка словарей…",
        vocabAfterPackHardcore:
            "Для «Изучение слов» нужно хотя бы одно слово с русским переводом в выбранных наборах.",
        vocabAfterPackFour:
            "Для режима «4 карточки» нужно минимум 4 слова с русским переводом в выбранных наборах.",
        verbsAfterPack: "Для «Изучение глаголов» нужен хотя бы один глагол с тремя формами.",
        verbCardsAfterPack: "Для карточек глаголов нужен хотя бы один глагол с русским переводом.",
        verbConjugationAfterPack:
            "Для режима «Спряжения» нужен хотя бы один глагол с основами и спряжением.",
        verbsStartFail: "Не удалось начать игру. Проверьте наборы глаголов.",
        loadFailed:
            "Ошибка загрузки: {message}. Откройте сайт через локальный сервер в папке проекта (fetch к файлам с file:// часто блокируется).",
        pickOneCase: "Выберите хотя бы один падеж.",
        noWordsLoaded: "Нет загруженных слов.",
        noMatchingWords: "Нет подходящих слов для выбранных падежей.",
        roundRepeatFail: "Не удалось начать раунд. Проверьте наборы слов.",
        roundRepeatChoices: "Не удалось составить четыре варианта ответа.",
    },

    errors: {
        manifestNeedsPacks: "В manifest.json нужен непустой массив packs",
        noFilesToLoad: "Нет файлов для загрузки",
        customPackMissing: "Пользовательский набор не найден или пуст.",
        jsonInvalid: "Файл не является корректным JSON.",
        jsonRootObject: "Корень JSON должен быть объектом.",
        jsonNeedWords: "Нужно поле «words» — массив словарных статей.",
        jsonNeedTitle: "В JSON нужно непустое поле «title» у набора.",
        jsonNoCompleteArticles:
            "Нет ни одной подходящей статьи актуального формата: нужны type, lemma, forms и translations.",
        countFailed: "не удалось посчитать",
        fileNoWordsArray: "{ref}: нет массива words",
        fileBadStatus: "{ref}: {status}",
        manifestNoValidPack: "В manifest нет ни одного корректного пака",
        deletePackAria: "Удалить пользовательский набор «{title}»",
        storageQuota: "Не хватило места в локальном хранилище браузера.",
    },

    main: {
        loadManifestError:
            "Ошибка: {message}. Откройте сайт через локальный сервер в папке проекта (fetch к файлам с file:// часто блокируется).",
    },
}
