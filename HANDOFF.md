# BLK PHX LABS — PH3 Combat Tracker
## Project Handoff — 2026-06-04

---

## What This Is

A PWA training tracker implementing Layne Norton's PH3 13-week powerlifting program, built for a 175lb martial artist running concurrent 2-mile Zone 2 sessions post-lift. Single HTML file, localStorage, science-backed nutrition engine, auto-regulation from AMRAP inputs, Google Sheets sync.

---

## Repo

```
https://github.com/fabzy4L/blkphx-ph3
Local: C:\Users\f4l\Documents\GitHub\blkphx-ph3
```

---

## Current State

| Phase | Status | Notes |
|---|---|---|
| 1 — Static PWA | ✅ Complete | Scaffolded, committed, pushed. Not yet deployed. |
| 2 — Sheets Sync | ✅ Built (needs wiring) | Code is live in `index.html`. User must deploy Apps Script manually. |
| 3 — Google OAuth | ⏳ Pending | Do after Phase 1 is live and tested. |

---

## File Structure

```
blkphx-ph3/
├── index.html                      ← Full app (~105KB, single file)
├── manifest.json                   ← PWA manifest
├── sw.js                           ← Service worker (cache-first)
├── _redirects                      ← Cloudflare Pages SPA routing
├── .gitignore
├── .env.example                    ← Template for Phase 3 env vars
├── README.md
├── assets/
│   ├── BLKPHXLABS.PNG              ← Source logo (1024×1024)
│   ├── icon-192.png                ← PWA icon
│   ├── icon-512.png                ← PWA icon (maskable)
│   └── phoenix.svg                 ← Header brand mark
├── scripts/
│   └── blkphx_apps_script.js       ← Apps Script endpoint (Phase 2)
└── docs/
    ├── BLKPHX_CLAUDECODE_SPEC.md   ← Full spec (authoritative reference)
    └── reference/
        ├── MACROS.xlsx
        └── PH3_PROGRAMMING_POSTINJ.xlsx
```

---

## Immediate Next Steps

### Step 1 — Deploy to Cloudflare Pages (Task 3)

No CLI needed first time. Use the dashboard:

1. Go to **pages.cloudflare.com**
2. Create application → **Connect to Git** → select `blkphx-ph3`
3. Build settings:
   - Framework preset: **None**
   - Build command: **(leave blank)**
   - Build output directory: `/`
4. Deploy
5. Live at: `https://blkphx-ph3.pages.dev`

After this, every push to `main` auto-deploys. No CI config needed.

**Verify after deploy:**
- Open on mobile Chrome → install as PWA
- Disconnect network → reload → app should still work (offline mode)
- Open DevTools → Application → Service Worker → should show as active

---

### Step 2 — Wire Up Google Sheets Sync (Task 4)

The sync code is already in `index.html`. You just need to deploy the Apps Script endpoint once:

1. Open your sheet:  
   `https://docs.google.com/spreadsheets/d/1Ehktj8QPGImsijTPnf5piutbd6G_B-PzaEB2wI1AwQg/edit`
2. **Extensions → Apps Script**
3. Delete the default code
4. Paste the entire contents of `scripts/blkphx_apps_script.js`
5. **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me** (fpalvarez23@gmail.com)
   - Who has access: **Anyone**
6. Click Deploy → grant permissions when prompted
7. Copy the Web App URL
8. In the tracker app: **Settings → Google Sheets Sync → paste URL → Save → Test Connection**

From that point, every saved session auto-syncs a row to the Sessions and Lifts tabs. The "Push Current 1RMs" button writes a stats snapshot to the Stats tab.

---

### Step 3 — Bulk Sync (Task 4 remainder)

Still needed: a button in Settings to push all existing `localStorage` sessions to Sheets in one batch (for backfill after setup). Not yet built.

---

## Key Technical Notes

| Thing | Detail |
|---|---|
| localStorage key | `blkphx3` — do not rename, existing users have data here |
| Apps Script POST | Must use `Content-Type: text/plain` — avoids CORS preflight |
| Chart.js | Pinned to `4.4.0` via CDN — do not bump without testing |
| AUTOREG tables | In `index.html` as `const AR={...}` — extracted verbatim from PH3 spreadsheet, treat as constants |
| Athlete defaults | 175lb / 11.5% BF / SQ 320 / BN 260 / DL 420 |
| Program start | Set via `Settings → Program Start Date` — drives day calculation from real calendar |

---

## Phase 3 — When Ready

Google OAuth PKCE direct to Sheets API (cross-device sync). Full setup in `docs/BLKPHX_CLAUDECODE_SPEC.md` Sections 16–17. Requires:
- Google Cloud project with Sheets API enabled
- OAuth 2.0 Web Application credentials
- Cloudflare Worker for token exchange (client secret never in frontend)
- Authorized origins: `https://blkphx-ph3.pages.dev` + `http://localhost:8080`

Do **not** start Phase 3 until Phase 1 is live and Phase 2 is tested.

---

## Spec Reference

Full architecture, data models, AUTOREG tables, nutrition engine, science citations, and all deployment steps live in:

```
docs/BLKPHX_CLAUDECODE_SPEC.md
```

Feed that file to Claude Code to resume any phase of this project.
