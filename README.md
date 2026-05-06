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

1. Build production assets:

    ```bash
    npm run build
    ```

2. In the GitHub repo, open **Settings → Pages** and configure the publishing source so visitors get the contents of **`dist/`** as the site (for example a workflow that uploads the `dist` artifact, or another approved Pages setup your org uses).

The live URL path must stay consistent with `base`, or asset and route URLs will break.
