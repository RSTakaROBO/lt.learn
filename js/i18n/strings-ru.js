/**
 * Все пользовательские строки интерфейса (RU).
 * Для шаблонов используйте fmt() из core.js и плейсхолдеры {title}, {count}, …
 */
export const STR = {
    app: {
        pageTitle: "Тренажёр падежей",
        appleWebAppTitle: "LT падежи",
    },

    wizard: {
        stagesAria: "Этапы настройки",
        homeKicker: "Ни дня без",
        homeEm: "литовского",
        exerciseTypeAria: "Тип упражнения",
        packsHeading: "Наборы слов",
        casesHeading: "Падежи",
        vocabDirectionHeading: "Направление перевода",
    },

    mode: {
        casesTitle: "Изучение падежей",
        casesDesc: "Тренируйте литовские формы существительных по выбранным падежам.",
        vocabTitle: "Изучение слов",
        vocabDesc: "Запоминайте слова и переводы в обычном или хардкор-режиме.",
        verbsTitle: "Изучение глаголов",
        verbsDesc: "Восстанавливайте инфинитив, настоящее и прошедшее 3-го лица.",
    },

    packs: {
        llmPromptAria: "Промпт для нейросети: как составить свой JSON",
        llmPromptTitle: "Промпт для нейросети",
        uploadJsonLabel: "Загрузить свой JSON…",
        uploadJsonAria: "Загрузить свой файл словаря JSON",
        wordCountMeta: "Слов: {total}. Подходящих: {suitable}",
        back: "Назад",
        next: "Далее",
        start: "Начать",
    },

    vocabDirection: {
        ruLtTitle: "С русского на литовский",
        ruLtMeta: "Подсказка по-русски — выберите слово на литовском",
        ltRuTitle: "С литовского на русский",
        ltRuMeta: "Слово на литовском — выберите русский перевод",
        hardcoreBlockAria: "Режим повышенной сложности",
        hardcoreTitle: "Хардкор",
        hardcoreMeta:
            "Ввод слова вручную: поле ответа и кнопки литовских букв (без вариантов выбора)",
    },

    quiz: {
        targetCasePrefix: "Падеж:",
        answerLabel: "Ваш ответ",
        answerPlaceholder: "Введите слово…",
        ltCharsToolbarAria: "Вставить литовскую букву",
        vocabChoicesAria: "Выберите перевод",
        skip: "Пропустить",
        check: "Проверить",
        next: "Далее",
        vocabRuToLtAria: "Выберите литовский вариант",
        vocabLtToRuAria: "Выберите русский перевод",
        verbFormsAria: "Основные формы глагола",
        hiddenVerbForm: "?",
        noVocabUi:
            "Не удалось открыть режим «Слова». Обновите страницу или очистите данные сайта / кэш приложения.",
        noVocabChoices: "Нет данных для вариантов ответа. Вернитесь в меню.",
        noWordsLeft: "Слов больше нет.",
        correct: "Верно",
        wrong: "Неверно",
        correctIs: "Правильно:",
        exceptionStrong: "Исключение:",
        emDash: "—",
    },

    help: {
        casesTitle: "Справка по падежам",
        close: "Закрыть",
        tableStem: "Основа",
        tableSg: "Ед. ч.",
        tablePl: "Мн. ч.",
        verbsPresent: "Настоящее время",
        verbsColPerson: "Лицо",
        verbsColAffirm: "Утверждение",
        verbsColNeg: "Отрицание",
        verbsRow1: "я",
        verbsRow2: "ты",
        verbsRow3: "он / она",
        verbsRow4: "мы",
        verbsRow5: "вы",
        verbsRow6: "они",
    },

    bottomBar: {
        toolbarAria: "Меню тренажёра",
        stats: "Статистика",
        statsAria: "Статистика",
        menu: "Меню",
        menuAria: "В меню",
        help: "Справка",
        helpAria: "Справка",
        settings: "Настройки",
        settingsAria: "Настройки",
    },

    helpHub: {
        title: "Справка",
        casesBtn: "Справка по падежам",
        close: "Закрыть",
    },

    vocabRound: {
        summaryTitle: "Раунд завершён",
        repeat: "Повторить",
        ok: "Ок",
        ariaDots: "Верно подряд по этому слову в раунде: {filled} из {max}",
        ariaProgress: "Убрано из пула {done} из {total} слов",
        statAccuracy: "Точность",
        statMaxStreak: "Максимальная серия",
        sectionHard: "Сложнее всего дались",
        noWrongWords: "За раунд не было неверных ответов по словам.",
        tableCaption: "Топ слов по числу ошибок",
        thNum: "#",
        thWord: "Слово",
        thErr: "Ошибок",
        percentUnit: "%",
    },

    stats: {
        title: "Статистика",
        thWord: "Слово",
        thCorrect: "Верно",
        thWrong: "Неверно",
        empty: "Пока нет данных — ответьте на несколько слов или пропустите их.",
        sumCorrect: "Верно",
        sumWrong: "Неверно",
        sumSkipped: "Пропущено",
        sumPercent: "Процент верных",
        close: "Закрыть",
    },

    settings: {
        title: "Настройки",
        themeLabel: "Цветовая тема",
        themePickerAria: "Цветовая тема",
        casesTranslationTitle: "Отображать перевод при изучении падежей",
        casesTranslationMeta: "Русский перевод в скобках под литовским словом",
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
            "Для «Изучение слов» нужно минимум 4 слова с русским переводом в выбранных наборах.",
        roundNoWords: "Не удалось начать раунд: нет слов с переводом.",
        vocabStartHardcoreFail: "Не удалось начать игру. Проверьте наборы слов.",
        vocabStartChoicesFail: "Не удалось составить четыре варианта ответа.",
        pickOnePack: "Выберите хотя бы один набор.",
        packsNoWordFiles: "В выбранных паках нет файлов со словами.",
        loadingDictionaries: "Загрузка словарей…",
        vocabAfterPackHardcore:
            "Для «Изучение слов» нужно хотя бы одно слово с русским переводом в выбранных наборах.",
        vocabAfterPackFour:
            "Для «Изучение слов» нужно минимум 4 слова с русским переводом в выбранных наборах.",
        verbsAfterPack: "Для «Изучение глаголов» нужен хотя бы один глагол с тремя формами.",
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
            "Нет ни одной подходящей статьи: для noun нужны lemma или nominative и все семь падежей; для других типов нужны type и lemma.",
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
