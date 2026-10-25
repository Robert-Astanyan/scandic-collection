# SCANDIC VAULT ✳

A responsive, Armenian-language personal SCANDIC mint tin collection tracker.

## What's included

- Photo-first cards for 47 preliminary SCANDIC tin variations across 9 lines
- Search and collection/status filters
- Distinguishes **not yet marked**, **don't have**, **have sealed**, **have open**, **have both**
- Progress counters, notes, and add-your-own tin
- Locally saved progress (no account needed) and JSON backup/import
- Optional cross-device GitHub sync to `data/collection-state.json` (fine-grained PAT)
- Offline-friendly PWA shell for phone home screens
- Product catalog in `data/catalog.json`, updated separately from progress

**Accuracy note:** This is a preliminary catalog, not a claim to cover every SCANDIC tin ever released. The source file distinguishes group photos from individually confirmed pictures; some third-party images can stop loading. The site shows a placeholder instead of a broken image. Follow the brand's catalog and verify each new tin before marking an individual image as confirmed.

## Publish on GitHub Pages

1. Log in to GitHub and create a **new public** repository named `scandic-collection`. Do not put this site in an unrelated existing private repository.
2. Upload **the contents** of this project (the `index.html`, `styles.css`, `app.js`, `data/`, `assets/` etc.) to the repository root and commit. You can upload extracted files from the ZIP or let ChatGPT's GitHub connector commit the files after the repository exists.
3. In the repository open **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
4. Visit `https://<github-user>.github.io/scandic-collection/` once GitHub Pages reports it published.
5. Optionally use iPhone Safari **Share → Add to Home Screen** to open it like an app.

## Sync phone and laptop via GitHub

Without sync, progress stays *only in each browser*. Export/import JSON from Settings is a no-token manual transfer option.

To enable optional GitHub sync:

1. In GitHub **Settings → Developer settings → Personal access tokens → Fine-grained tokens**, create a short-lived token scoped only to `scandic-collection`, with **Contents: Read and write** permission. Avoid all-repository / administration permissions.
2. In the site select ⚙ Settings, enter `owner/scandic-collection` and the token and press **Sync with GitHub**. Do the same on your other device.
3. Make changes locally, then sync before switching devices. The site merges records by per-item timestamp. GitHub API does not offer a background push to another browser; press sync to pull updates.
4. The token is kept in session storage only, not in repo or site code. For a public repo, the synced state JSON may be publicly viewable.

Warning: do not paste a GitHub token in any publicly shared document or repo. Using a browser token on a public static site requires caution; do not reuse tokens with broad permissions.

## Updating new flavors

Edit `data/catalog.json` in GitHub and add a unique `id` product object. Because statuses are keyed by IDs, do **not** reuse or change existing IDs. The website refreshes the catalog on page load, and user statuses remain unchanged. `data/collection-state.json` is managed only by the optional sync feature.

## Preview locally

Use a local HTTP server (for example `python -m http.server 8080`) in this folder, then open `http://localhost:8080/`. Opening `index.html` as a file cannot fetch JSON reliably.

No build step, dependencies, tracking, cookies, or external JavaScript libraries are needed. Product photos are fetched from external source URLs; otherwise, the app uses bundled local assets only.