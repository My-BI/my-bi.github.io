# my-bi.github.io

The customer-facing website for **MyBI** — a cross-platform analytics
& geospatial intelligence platform.

🔗 **Live site:** https://my-bi.github.io/

## What's here

| File | Purpose |
|------|---------|
| `index.html` | Landing page — hero, principles, features (the blocks), security/AI, plugins, tech stack, and the **Download** section. |
| `roadmap.html` | The **Roadmap** tab — phase-by-phase progress (shipped / in progress / planned). |
| `assets/styles.css` | Design system + all page styles (dark-first, responsive). |
| `assets/main.js` | Minimal progressive enhancement (footer year, nav shadow, reveal-on-scroll). |
| `.nojekyll` | Serve files as-is (skip Jekyll processing). |

This is a **static site** — no build step. Open `index.html` in a browser to preview,
or serve the folder with any static server:

```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Deploying (GitHub Pages)

This repo is named `my-bi.github.io`, so GitHub Pages serves it at the org root:

1. Push to the `My-BI` org as a **public** repo named `my-bi.github.io`.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main` / root.
3. The site goes live at `https://my-bi.github.io/`.

## Notes

- Download buttons are intentionally in a **“Coming soon”** state (macOS, Windows,
  Linux, Mac App Store, Microsoft Store) until installers are published. When the
  first tagged release lands, swap each `.dl-btn` span for a real link.
- License: Proprietary (matches the MyBI app).
