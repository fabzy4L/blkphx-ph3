# BLK PHX LABS — PH3 Combat Tracker
## Project Handoff — 2026-06-08

---

## What This Is

A PWA training tracker implementing Layne Norton's PH3 13-week powerlifting program, built for a 175lb martial artist running concurrent 2-mile Zone 2 sessions post-lift. Single HTML file, localStorage, science-backed nutrition engine, auto-regulation from AMRAP inputs, Google Sheets sync via OAuth PKCE + Sheets API v4.

---

## Repo

```
https://github.com/fabzy4L/blkphx-ph3
Local: C:\Users\f4l\Documents\GitHub\blkphx-ph3
Live:  https://blkphx-ph3.pages.dev
```

---

## Current State

| Phase | Status | Notes |
|---|---|---|
| 1 — Static PWA | ✅ Live | Deployed to Cloudflare Pages. Auto-deploys on push to `main`. |
| 2 — Apps Script | ❌ Obsolete | Code in `scripts/blkphx_apps_script.js` is dead — implementation went straight to OAuth+Sheets API v4. Ignore it. |
| 3 — Google OAuth + Sheets Sync | ✅ Working | OAuth PKCE flow live. Sheets sync functional. One known issue (see below). |

---

## Infrastructure

| Component | Detail |
|---|---|
| Frontend | Cloudflare Pages — `https://blkphx-ph3.pages.dev` |
| OAuth Worker | Cloudflare Worker — `https://blkphx-oauth.fpalvarez23.workers.dev` |
| Worker secrets | `GOOGLE_CLIENT_SECRET` set via `wrangler secret put` (never in repo) |
| Worker vars | `GOOGLE_CLIENT_ID` in `workers/oauth-proxy/wrangler.toml` |
| GCP credentials | OAuth 2.0 client — authorized origin + redirect URI registered for `blkphx-ph3.pages.dev` |
| Google Sheet | `https://docs.google.com/spreadsheets/d/1Ehktj8QPGImsijTPnf5piutbd6G_B-PzaEB2wI1AwQg` |

---

## File Structure

```
blkphx-ph3/
├── index.html                          ← Full app (single file)
├── manifest.json                       ← PWA manifest
├── sw.js                               ← Service worker (cache-first)
├── _redirects                          ← Cloudflare Pages SPA routing (/* → index.html)
├── workers/
│   └── oauth-proxy/
│       ├── index.js                    ← Worker: /token and /refresh endpoints
│       └── wrangler.toml               ← Worker config (GOOGLE_CLIENT_ID as var)
├── assets/
│   ├── icon-192.png / icon-512.png     ← PWA icons
│   └── phoenix.svg                     ← Header brand mark
├── scripts/
│   └── blkphx_apps_script.js           ← DEAD CODE — ignore
└── docs/
    ├── BLKPHX_CLAUDECODE_SPEC.md       ← Full spec (authoritative reference)
    └── reference/
        ├── MACROS.xlsx
        └── PH3_PROGRAMMING_POSTINJ.xlsx
```

---

## Known Issue — Sheets Column Inconsistency

**Symptom:** When bulk-syncing multiple sessions, data appears in inconsistent columns across rows.

**Root cause (suspected):** `syncSessionToSheets` computes `cd` (PH3 day), `block`, and `week` from `curDay()` at sync time, not from the session's actual date. Bulk-syncing historical sessions all get today's day number stamped on them. This produces wrong values but shouldn't shift columns — structural cause not yet confirmed.

**Next debug step:**
1. Settings → DATA → **CLEAR SESSIONS**
2. Settings → Google Sheets Sync → **RESET SHEET DATA**
3. Log ONE clean session
4. Check if that single row's columns align with the header in the Sessions tab
5. If aligned → bulk sync logic is the issue; fix `curDay()` call to derive day from `session.date`
6. If misaligned → something structural in `_sheetsAppend` or the API call

**The fix (if step 5):** In `syncSessionToSheets`, replace:
```js
const cd=curDay(), block=..., week=...;
```
with a version that derives day from `session.date` and `S.startDate`, not the current moment.

---

## Session Management (added this session)

- ✕ delete button on each recent session card (Today tab)
- **CLEAR SESSIONS** button in Settings → DATA (localStorage only, doesn't touch sheet)
- **RESET SHEET DATA** button in Settings → Google Sheets Sync (clears Sessions/Lifts/Stats/_data rows, then bulk re-syncs)

---

## Key Technical Notes

| Thing | Detail |
|---|---|
| localStorage key | `blkphx3` — do not rename |
| OAuth token key | `blkphx_gtoken` in localStorage |
| PKCE verifier | Stored in `sessionStorage` as `pkce_v` during auth flow |
| OAuth callback | `window.location.origin + '/oauth-callback'` — handled by `_redirects` catch-all |
| Chart.js | Pinned to `4.4.0` via CDN — do not bump without testing |
| AUTOREG tables | In `index.html` as `const AR={...}` — treat as constants |
| Athlete defaults | 175lb / 11.5% BF / SQ 320 / BN 260 / DL 420 |
| Program start | Set via Settings → Program Start Date — drives `curDay()` |
| Const ordering bug (fixed) | OAuth constants were declared after the init block that called them — caused `ReferenceError`. Fixed by moving init block below constants. |

---

## Spec Reference

Full architecture, data models, AUTOREG tables, nutrition engine, science citations, and deployment steps:

```
docs/BLKPHX_CLAUDECODE_SPEC.md
```

Feed that file + this HANDOFF to Claude Code to resume.
