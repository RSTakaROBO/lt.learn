# LT Learn / Lithuanian trainer

Web trainer for Lithuanian (cases and vocabulary). Static **Vite** build, suitable for **GitHub Pages**.

## Requirements

- [Node.js](https://nodejs.org/) **18+**

## Install dependencies

```bash
npm install
```

## Run locally (Vite)

```bash
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173/lt.learn/`). That path matches `base` in `vite.config.js`.

## Builds

```bash
npm run build    # output → dist/
npm run preview   # serve dist/ locally (default preview port in vite.config.js)
```

Files under `public/` are copied into `dist/` during `npm run build`.

## Lint / formatting

Formatting is enforced with **Prettier** (there is no ESLint script).

Check without writing files:

```bash
npm run format:check
```

Apply formatting:

```bash
npm run format
```

## Deploy to GitHub Pages

`vite.config.js` sets `base: "/lt.learn/"`, so the app expects:

`https://<username>.github.io/lt.learn/`

If the repository name is different, change `base` to `/<repo-name>/` and rebuild.

### GitHub Actions (recommended)

This repo includes **`.github/workflows/deploy-pages.yml`**. It runs `npm ci`, `npm run build`, and uploads **`dist/`** to Pages.

1. On GitHub: **Settings → Pages → Build and deployment → Source**: choose **GitHub Actions** (not “Deploy from a branch”).
2. Remove or disable any other workflow that uses **`actions/jekyll-build-pages`**—that path publishes raw repo files (including `index.html` pointing at `/src/App.jsx`), not the Vite bundle.
3. Push to **`main`** or **`react`** (or run the workflow manually). After **build** + **deploy** jobs succeed, the site should load hashed JS/CSS under `/lt.learn/assets/`.

Local sanity check before pushing:

```bash
npm run build
npm run preview
```

The live URL path must stay consistent with `base`, or asset and route URLs will break.
