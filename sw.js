/**
 * Кэширует оболочку и JSON-словари для офлайна и быстрого старта после установки PWA.
 * При смене списка файлов увеличьте CACHE_VERSION.
 */
const CACHE_VERSION = "lt-trainer-v104";

/** Пути относительно scope (папка, где лежит sw.js). */
function precacheUrls(scopeUrl) {
  const base = scopeUrl.endsWith("/") ? scopeUrl : `${scopeUrl}/`;
  const rel = (path) => new URL(path.replace(/^\//, ""), base).href;
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
    rel("js/main.js"),
    rel("js/config.js"),
    rel("js/state.js"),
    rel("js/dom.js"),
    rel("js/text-utils.js"),
    rel("js/word-validation.js"),
    rel("js/storage.js"),
    rel("js/random.js"),
    rel("js/theme.js"),
    rel("js/input-lt.js"),
    rel("js/manifest-packs.js"),
    rel("js/word-selection.js"),
    rel("js/case-selection.js"),
    rel("js/quiz.js"),
    rel("js/wizard.js"),
    rel("js/overlays.js"),
    rel("js/events.js"),
    rel("site.webmanifest"),
    rel("icons/icon-180.png"),
    rel("icons/icon-192.png"),
    rel("icons/icon-512.png"),
    rel("icons/icon-512-maskable.png"),
    rel("words/manifest.json"),
    rel("words/common.json"),
    rel("words/home.json"),
    rel("words/food_a1.json"),
    rel("words/food_a2.json"),
  ];
}

async function matchCached(cache, request) {
  let res = await cache.match(request);
  if (res) return res;
  if (request.mode === "navigate") {
    res = await cache.match(new URL("index.html", self.registration.scope).href);
  }
  return res || null;
}

/** Список паков должен подтягиваться с сервера без «залипания» старого precache. */
function isWordsManifestRequest(request) {
  try {
    const pathname = new URL(request.url).pathname;
    return pathname.endsWith("/words/manifest.json");
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(precacheUrls(self.registration.scope)))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[sw] precache failed", err);
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);

      if (isWordsManifestRequest(event.request)) {
        try {
          const networkRes = await fetch(event.request);
          if (networkRes.ok) {
            await cache.put(event.request, networkRes.clone());
            return networkRes;
          }
        } catch {
          /* offline → кеш */
        }
        const stale = await cache.match(event.request);
        if (stale) return stale;
        try {
          return await fetch(event.request);
        } catch {
          return Response.error();
        }
      }

      const cached = await matchCached(cache, event.request);
      if (cached) return cached;

      try {
        return await fetch(event.request);
      } catch {
        if (event.request.mode === "navigate") {
          const fallback = await cache.match(new URL("index.html", self.registration.scope).href);
          if (fallback) return fallback;
        }
        return Response.error();
      }
    })(),
  );
});
