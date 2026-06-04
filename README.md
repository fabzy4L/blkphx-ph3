# BLK PHX LABS — PH3 Combat Tracker

Science-backed strength + conditioning for martial arts.

**Stack:** Static PWA · localStorage · Google Sheets (Phase 2) · Google OAuth (Phase 3)  
**Deploy:** Cloudflare Pages (free tier)  
**Program:** Dr. Layne Norton PH3 — 13 weeks, 90 days

---

## Athlete Profile

| | |
|---|---|
| Age | 31 |
| BW | 175 lb |
| BF | ~11.5% |
| LBM | ~155 lb |
| Starting 1RMs | SQ 320 / BN 260 / DL 420 |
| Goal | Martial arts relative strength |
| Run | 2-mile Zone 2 post-lift, every session |

---

## Phase 1 — Static PWA (current)

Single HTML file, localStorage, Cloudflare Pages.

**Live:** https://blkphx-ph3.pages.dev

---

## Phase 2 — Google Sheets Sync

See [SHEETS_SETUP.md](docs/SHEETS_SETUP.md) for step-by-step Apps Script setup.

Sheet ID: `1Ehktj8QPGImsijTPnf5piutbd6G_B-PzaEB2wI1AwQg`

---

## Phase 3 — Google OAuth Direct

PKCE flow → Sheets API v4 → cross-device sync.  
See [BLKPHX_CLAUDECODE_SPEC.md](docs/BLKPHX_CLAUDECODE_SPEC.md) Section 17.

---

## Local Dev

```
# Serve locally (any static server)
npx serve .
# or
python -m http.server 8080
```

## Deploy

```
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=blkphx-ph3
```

Cloudflare auto-deploys on every push to `main`.
