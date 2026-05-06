/**
 * Кэширует оболочку и JSON-словари для офлайна и быстрого старта после установки PWA.
 * При смене списка файлов увеличьте CACHE_VERSION.
 */
const CACHE_VERSION = "lt-trainer-v221"

/** Пути относительно scope (папка, где лежит sw.js). */
function precacheUrls(scopeUrl) {
    const base = scopeUrl.endsWith("/") ? scopeUrl : `${scopeUrl}/`
    const rel = (path) => new URL(path.replace(/^\//, ""), base).href
    return [
        rel("index.html"),
        rel("themes.css"),
        rel("css/tokens.css"),
        rel("css/base.css"),
        rel("css/layout.css"),
        rel("css/surfaces-panel.css"),
        rel("css/lists-actions.css"),
        rel("css/reference-help.css"),
        rel("css/quiz-training.css"),
        rel("css/buttons.css"),
        rel("css/overlays.css"),
        rel("css/motion.css"),
        rel("js/config.js"),
        rel("js/trainer-ui-state.js"),
        rel("js/text-utils.js"),
        rel("js/word-entry.js"),
        rel("js/storage.js"),
        rel("js/random.js"),
        rel("js/theme.js"),
        rel("js/InputHelper.js"),
        rel("js/packs.js"),
        rel("js/custom-packs.js"),
        rel("js/setup-wizard-handlers.js"),
        rel("js/i18n/strings-ru.js"),
        rel("js/i18n/core.js"),
        rel("js/i18n/llm-prompt-ru.js"),
        rel("js/word-selection.js"),
        rel("js/vocab-round.js"),
        rel("js/wordTranslations.js"),
        rel("js/quiz.js"),
        rel("site.webmanifest"),
        rel("icons/icon-180.png"),
        rel("icons/icon-192.png"),
        rel("icons/icon-512.png"),
        rel("icons/icon-512-maskable.png"),
        rel("words/manifest.json"),
        rel("words/common.json"),
        rel("words/home.json"),
        rel("words/time.json"),
        rel("words/food.json"),
        rel("words/basic-verbs.json"),
    ]
}

async function matchCached(cache, request) {
    return cache.match(request)
}

/** Словари и manifest — сначала сеть, иначе после переименования полей остаётся старый precache. */
function isWordsJsonRequest(request) {
    try {
        const pathname = new URL(request.url).pathname
        return pathname.endsWith(".json") && pathname.includes("/words/")
    } catch {
        return false
    }
}

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_VERSION)
            .then((cache) => cache.addAll(precacheUrls(self.registration.scope)))
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.warn("[sw] precache failed", err)
            })
    )
})

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
            )
            .then(() => self.clients.claim())
    )
})

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_VERSION)

            /* HTML-оболочка: сначала сеть (обновления UI), при офлайне — кэш precache */
            if (event.request.mode === "navigate") {
                try {
                    const networkRes = await fetch(event.request)
                    if (networkRes.ok) {
                        const scope = self.registration.scope
                        const indexHref = new URL("index.html", scope).href
                        await cache.put(event.request, networkRes.clone())
                        await cache.put(indexHref, networkRes.clone())
                        return networkRes
                    }
                } catch {
                    /* offline */
                }
                const fromCache = await matchCached(cache, event.request)
                if (fromCache) return fromCache
            }

            /* CSS/темы: сначала сеть — иначе после смены вёрстки остаётся старый layout.css при свежем index.html */
            if (event.request.destination === "style") {
                try {
                    const networkRes = await fetch(event.request)
                    if (networkRes.ok) {
                        await cache.put(event.request, networkRes.clone())
                        return networkRes
                    }
                } catch {
                    /* offline */
                }
                const cachedStyle = await cache.match(event.request)
                if (cachedStyle) return cachedStyle
            }

            if (isWordsJsonRequest(event.request)) {
                try {
                    const networkRes = await fetch(event.request)
                    if (networkRes.ok) {
                        await cache.put(event.request, networkRes.clone())
                        return networkRes
                    }
                } catch {
                    /* offline → кеш */
                }
                const stale = await cache.match(event.request)
                if (stale) return stale
                try {
                    return await fetch(event.request)
                } catch {
                    return Response.error()
                }
            }

            const cached = await matchCached(cache, event.request)
            if (cached) return cached

            try {
                return await fetch(event.request)
            } catch {
                return Response.error()
            }
        })()
    )
})
