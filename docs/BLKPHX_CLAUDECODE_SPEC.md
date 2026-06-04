# BLK PHX LABS — PH3 Combat Tracker
## Claude Code Project Specification v2
### Includes: Full Cloud Deployment Guide

> Feed this entire document to Claude Code.
> All architectural decisions, data models, program logic, science references,
> feature requirements, and end-to-end deployment steps are documented here.
> Claude Code should execute tasks in the order listed in Section 19.

---

## 0. Project Identity

**Name:** BLK PHX LABS — PH3 Combat Tracker
**Owner:** fpalvarez23@gmail.com
**Tagline:** Science-backed strength + conditioning for martial arts
**Brand Colors:**
- Void (background): `#060608`
- Fire (primary accent): `#ff3d1f`
- Gold (secondary): `#f5a623`
- Ice (tertiary): `#00d4ff`
- Ash (text): `#c8cdd8`
- Dim (muted): `#5a6070`
- OK (success): `#00e676`
- Error: `#ff1744`
- Squat: `#ff3d1f` | Bench: `#00d4ff` | Deadlift: `#f5a623`

**Fonts (Google Fonts):**
- Display: `Barlow Condensed` 400–800
- Mono: `Share Tech Mono`
- Body: `Rajdhani` 400–700

**Logo:** White phoenix SVG with atomic symbol in chest.
Text: `BLK PHX LABS` / subtext: `PH3 · COMBAT EDITION`

---

## 1. Project Overview

A PWA (Progressive Web App) that:
1. Implements Dr. Layne Norton's **PH3 13-week powerlifting program** with full auto-regulation
2. Tracks **concurrent training** (lifting + 2-mile Zone 2 runs)
3. Syncs all session data to **Google Sheets** via Apps Script (Phase 2) or OAuth (Phase 3)
4. Provides a **nutrition calculator** for concurrent training at 175lb / ~11.5% BF
5. Surfaces **10 peer-reviewed citations** backing every methodology decision
6. Targets **martial arts / combat sports** relative strength benchmarks

**Athlete Profile:**
- Age: 31 | Male | 6'1" | 175 lb | ~11.5% BF | LBM ~155 lb
- Starting 1RMs: Squat 320 / Bench 260 / Deadlift 420 (conservative)
- Prior PH3 history: 2–3 years. Returning after time off, lighter than peak.
- Goal: Martial arts performance. Relative strength over absolute numbers.
- Additional: 2-mile run every session post-lift (Zone 2, ~65-70% max HR)

---

## 2. Tech Stack by Phase

### Phase 1 — Static PWA (ship immediately)
```
Single HTML file + manifest + service worker
Storage: localStorage key "blkphx3"
Deployment: Cloudflare Pages (free tier)
```

### Phase 2 — Google Sheets Sync (Apps Script)
```
Sheet ID: 1Ehktj8QPGImsijTPnf5piutbd6G_B-PzaEB2wI1AwQg
Apps Script Web App: POST /exec (write) + GET /exec?action=getSessions (read)
Source of truth: still localStorage; Sheets is write-target + human-readable log
```

### Phase 3 — Google OAuth Direct (cross-device sync)
```
Google Cloud project + OAuth 2.0 Web App credentials
Sheets API v4 direct from browser
Sheets becomes source of truth — sessions load from Sheet on any device
```

### Phase 3 Alt — Supabase
```
Free tier PostgreSQL + Auth
Tables: sessions, lifts, stats, amrap_log
Real-time subscription for multi-device sync
```

---

## 3. Core Data Models

### AppState (localStorage "blkphx3")
```typescript
interface AppState {
  onerm:    { sq: number; bn: number; dl: number };   // baselines: 320/260/420
  athlete:  { bw: number; bf: number; sex: 'M'|'F'; age: number };
  programDay:  number;         // 1-90, used if no startDate
  startDate:   string | null;  // ISO "2024-01-15", overrides programDay if set
  sessions:    Session[];
  amrapLog:    Record<string, number>;  // "d12_sq" → 7 reps
  overrides:   { sq?: number; bn?: number; dl?: number };  // auto-reg outputs
  calGoal:     'cut' | 'maintenance' | 'leanBulk' | 'bulk';
}
```

### Session / Lift / Set
```typescript
interface Session {
  id:        number;        // Date.now()
  date:      string;        // "2024-01-15"
  type:      string;        // "Lower Power" | "Upper Power" | "Upper Hypertrophy" | etc.
  bw:        number | null;
  energy:    number | null; // 1-10
  runDist:   number | null; // miles
  runTime:   number | null; // minutes
  notes:     string;
  lifts:     Lift[];
}
interface Lift {
  name:          string;
  type:          'main' | 'acc' | 'bfr';
  sets:          Set[];
  estimated1rm:  number;    // Epley: weight * (1 + reps/30)
}
interface Set {
  weight: number;
  reps:   number;
  rir:    number | null;
}
```

### Google Sheets Column Schema

**Sessions tab:**
```
ID | Date | Type | Bodyweight(lb) | BF% | Energy | Run Dist(mi) | Run Time(min) |
Run Pace(min/mi) | PH3 Day | Block | Week | Notes |
Squat 1RM Est. | Bench 1RM Est. | Deadlift 1RM Est. | Total
```

**Lifts tab:**
```
Session ID | Date | Exercise | Type | Set | Weight(lb) | Reps | RIR | Est. 1RM
```

**Stats tab:**
```
Timestamp | Squat 1RM | Bench 1RM | Deadlift 1RM | Total | Bodyweight | Wilks |
DL/BW | SQ/BW | BN/BW
```

---

## 4. PH3 Auto-Regulation Tables

Extracted verbatim from original Layne Norton PH3 spreadsheet. **Do not modify.**

```javascript
const AUTOREG = {
  // Accumulation Block — Week 3 (from Day 12/13 AMRAPs)
  acc_w3_sq: [[4,310],[6,320],[8,325],[10,330],[99,335]],
  acc_w3_bn: [[4,250],[6,260],[8,265],[10,270],[99,270]],
  acc_w3_dl: [[3,405],[5,420],[7,425],[9,435],[99,440]],
  // Accumulation Block — Week 4 (from Day 19/20 AMRAPs)
  acc_w4_sq: [[4,310],[6,320],[8,325],[10,330],[99,335]],
  acc_w4_bn: [[4,230],[6,235],[8,240],[10,240],[99,245]],
  acc_w4_dl: [[3,410],[5,420],[7,425],[9,435],[99,435]],
  // Intermediate Block — Week 7 (from Day 40/41 AMRAPs)
  int_w7_sq: [[3,310],[5,320],[7,325],[9,330],[99,335]],
  int_w7_bn: [[3,250],[5,260],[7,265],[9,270],[99,270]],
  int_w7_dl: [[2,405],[4,420],[6,425],[8,435],[99,435]],
  // Intermediate Block — Week 8 (from Day 47/48 AMRAPs)
  int_w8_sq: [[3,315],[5,325],[7,330],[9,335],[99,340]],
  int_w8_bn: [[3,235],[5,240],[7,245],[9,245],[99,250]],
  int_w8_dl: [[2,410],[4,420],[6,425],[8,435],[99,435]],
  // Intensity Block — Week 11 (from Day 68/69 AMRAPs)
  i2_w11_sq: [[2,330],[4,340],[6,345],[8,350],[99,355]],
  i2_w11_bn: [[2,255],[4,265],[6,270],[8,275],[99,275]],
  i2_w11_dl: [[1,415],[3,430],[5,435],[7,445],[99,445]],
  // Intensity Block — Week 12 (from Day 75/76 AMRAPs)
  i2_w12_sq: [[2,415],[4,430],[6,435],[8,445],[99,450]],
  i2_w12_bn: [[2,305],[4,315],[6,320],[8,325],[99,330]],
  i2_w12_dl: [[1,465],[3,480],[5,485],[7,495],[99,500]],
  // Final Week (from Day 82/83 AMRAPs)
  fin_sq:    [[2,335],[4,340],[6,345],[99,350]],
  fin_bn:    [[2,260],[4,265],[6,270],[99,270]],
  fin_dl:    [[1,420],[3,430],[5,435],[99,440]],
  // Rep Test Day 27 → Intermediate Block weights
  rpt_sq:    [[4,315],[5,320],[7,325],[99,330]],
  rpt_bn:    [[4,255],[5,260],[7,265],[99,265]],
  rpt_dl:    [[4,410],[5,420],[7,425],[99,430]],
  // Rep Test Day 55 → Intensity Block weights
  rpt2_sq:   [[2,315],[4,320],[6,325],[99,330]],
  rpt2_bn:   [[2,255],[4,260],[6,265],[99,265]],
  rpt2_dl:   [[2,410],[4,420],[6,425],[99,430]],
};

// Lookup: find value where reps <= maxReps threshold
const arLookup = (table, reps) => {
  for (const [max, val] of table) if (reps <= max) return val;
  return table[table.length - 1][1];
};
```

### Weight Calculation
```javascript
const r5   = w => Math.round(w / 5) * 5;     // round to nearest 5lb (main lifts)
const r25  = w => Math.round(w / 2.5) * 2.5; // round to nearest 2.5lb (calc display)
const pct  = (p, base) => r5(p * base);       // working weight from percentage
```

### Active 1RM (overrides take precedence)
```javascript
const activeRM = (S) => ({
  sq: S.overrides.sq || S.onerm.sq,
  bn: S.overrides.bn || S.onerm.bn,
  dl: S.overrides.dl || S.onerm.dl,
});
```

### Program Block Structure
```
ACCUMULATION  Days  1-28  Weeks 1-4   ~72-82.5% 1RM   Volume builds
INTERMEDIATE  Days 29-56  Weeks 5-8   ~75-85%          Sets increase 2→5
INTENSITY     Days 57-84  Weeks 9-12  ~77-88%          Lower reps, higher %
TAPER         Days 85-90  Week 13     ~71-83%           Volume drops → Meet Day

AMRAP days:   12, 13, 19, 20, 40, 41, 47, 48, 68, 69, 75, 76, 82, 83
Rep Tests:    Day 27 (87.5% × all 3), Day 55 (82.5-87.5% × all 3)
Meet Day:     Day 90 — 3 attempts at 92%, 98%, 102% each lift

Session types per day:
  LP  = Lower Power   (Sq + Bn heavy + leg accessories)
  UP  = Upper Power   (DL + Bn heavy + upper accessories)
  UH  = Upper Hypertrophy (DB work, rows, curls, BFR)
  FBH = Full Body Hypertrophy (light, weeks 4/8/taper)
  REST = Rest / Active Recovery
  TEST = Rep Test AMRAP
  MEET = Meet / Max Testing Day

Heavy leg days (flag to delay post-lift run):
  [3,6,10,13,17,20,24,31,34,38,41,45,48,52,59,62,66,69,73,76,80,83,87]
```

---

## 5. Nutrition Engine

```javascript
// Katch-McArdle BMR (LBM-based — more accurate for lean athletes)
const calcBMR  = lbm_lb => 370 + 21.6 * (lbm_lb * 0.4536);
const calcTDEE = lbm_lb => calcBMR(lbm_lb) * 1.725; // Very Active = PH3 + runs

// Macro targets (Bagheri et al. 2023 — concurrent training optimized)
function calcMacros(bw_lb, lbm_lb, calGoal = 'maintenance') {
  const tdee    = calcTDEE(lbm_lb);
  const mults   = { cut: 0.90, maintenance: 1.0, leanBulk: 1.05, bulk: 1.10 };
  const target  = tdee * mults[calGoal];
  const prot_g  = Math.round(lbm_lb * 1.2);     // 1.2g/lb LBM
  const fat_g   = Math.round(bw_lb * 0.45);      // 0.45g/lb BW
  const carb_g  = Math.round((target - prot_g*4 - fat_g*9) / 4);
  return { prot_g, fat_g, carb_g, target: Math.round(target), tdee: Math.round(tdee) };
}

// Wilks score (IPF formula)
function calcWilks(total_lb, bw_lb, sex) {
  const bwKg    = bw_lb * 0.4536;
  const totKg   = total_lb * 0.4536;
  const coefM   = [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-6, -1.291e-8];
  const coefF   = [594.31748, -27.23843, 0.82112, -0.009307, 4.732e-5, -9.054e-8];
  const c       = sex === 'M' ? coefM : coefF;
  const denom   = c[0]+c[1]*bwKg+c[2]*bwKg**2+c[3]*bwKg**3+c[4]*bwKg**4+c[5]*bwKg**5;
  return Math.round(totKg * (500 / denom) * 10) / 10;
}
```

### Athlete Baselines at 175lb / 11.5% BF
```
LBM: 154.9 lb | BMR: 1,887 cal | TDEE: 3,256 cal
Macros (maintenance): Protein 186g | Carbs 451g | Fats 79g | Total 3,258 cal
Cut -10%: 2,930 cal | Lean Bulk +5%: 3,419 cal | Bulk +10%: 3,582 cal
```

---

## 6. Combat Benchmarks

```javascript
// Sources: Lum et al. 2022, Sweet Science of Fighting, Williams et al. 2024
const COMBAT_BENCHMARKS = {
  sq: { target: 2.0, label: 'SQUAT' },     // At 175lb → 350 lb
  bn: { target: 1.5, label: 'BENCH' },     // At 175lb → 262 lb
  dl: { target: 2.5, label: 'DEADLIFT' },  // At 175lb → 438 lb
};
// These = ~50th-65th percentile of drug-tested unequipped powerlifters (Williams 2024)
// Starting 1RMs at 175lb → SQ 1.83×, BN 1.49×, DL 2.40×
// One solid PH3 run gets all three over the line
```

---

## 7. Science Citations

These citations appear verbatim in the Science view. **Do not alter findings or DOIs.**

```
STRENGTH / COMBAT SPORTS
[1] Lum D, et al. "Maximum Isometric and Dynamic Strength of MMA Athletes."
    Front. Physiol. 2022. PMC9323058.
    DOI: 10.3389/fphys.2022.897255
    Finding: Higher-level MMA athletes: squat 1.8× vs 1.6× BW. Bench 1RM (r=0.67)
    correlates with isometric lumbar strength — upper body pressing power critical for ground work.

[2] Esposito G, et al. "Maximum strength development in martial arts and perception."
    Front. Sports Active Living. 2025. PMC12682768.
    DOI: 10.3389/fspor.2025.1676250
    Finding: 8-week bench/squat/deadlift → +17.3% bench, +14.7% squat, +15.7% deadlift (p<0.05)
    in Wushu Sanda athletes. Strength gains linked to improved confidence in open-skills contexts.

[3] Williams TD, et al. "Normative data for squat, bench press and deadlift in powerlifting."
    J Sci Med Sport. 2024. n=809,986 competition entries.
    Finding: Males 18-35 90th percentile: SQ 2.83× BW, BP 1.95×, DL 3.25×.
    Combat targets (2.0/1.5/2.5) = 50th-65th percentile — meaningful, achievable markers.

AEROBIC / VO₂ MAX
[4] Sanders GJ, et al. "Physiological variables in combat sports fighters by weight."
    Sports Innovation Journal. 2024.
    Finding: Lighter fighters (<185lb) VO₂max 53.4 vs 48.1 ml/kg/min (p=0.033).
    At 175lb the athlete inherently advantages relative aerobic capacity.

[5] Ouergui I, et al. "Effects of HIIT on aerobic/anaerobic capacity in Olympic combat sports."
    Front. Physiol. 2025. PMC12098572.
    DOI: 10.3389/fphys.2025.xxxxx
    Finding: HIIT improves VO₂max ES=1.007 (95% CI 0.701–1.312, p<0.001).
    Meta-analysis 20 studies, n=445 combat athletes.

CONCURRENT TRAINING
[6] Wilson JM, et al. "Concurrent Training: A meta-analysis examining interference."
    J Strength Cond Res. 26(8):2293-2307. 2012.
    Finding: Running > cycling for interference. Effect scales with frequency/duration.
    2-mile Zone 2 runs (~20 min) are in the minimal-interference zone.

[7] Frontiers in Sports — Concurrent training review synthesis 2024-2025.
    Finding: Strength BEFORE endurance minimizes AMPK/mTOR signaling conflict.
    6+ hour separation optimal. MICT causes less interference than HIIT same-session.

NUTRITION
[8] Bagheri R, et al. "Effects of 16 weeks of two different high-protein diets with CT or RT."
    JISSN. 2023. DOI: 10.1080/15502783.2023.2236053
    Finding: 1.6 g/kg sufficient to max lean mass, strength, aerobic capacity in concurrent training.
    3.2 g/kg = no additional benefit. n=48, 16-week RCT.

[9] Venckunas T, et al. "Effect of Low vs High CHO after Glycogen-Depleting Session on Run."
    Nutrients. 16(16):2763. 2024. PMC11357641.
    Finding: Low CHO (<1.5g/kg) after glycogen-depleting session significantly impairs
    subsequent performance. High CHO (>5g/kg) essential when lifting + running daily.

[10] Moore DR, et al. "Protein requirements in endurance athletes after exercise."
     PMC4913918. 2016.
     Finding: Recommended protein for endurance-trained adults = 1.83 g/kg/day post-exercise,
     exceeding the 1.2-1.4 g/kg current guidelines.

PERIODIZATION
[11] Suarez DG, et al. "Phase-Specific Changes in RFD in Block Periodized Weightlifters."
     Sports. 2019. PMC6628423.
     Finding: Volume phase builds CSA. Intensity phase rebounds RFD above baseline.
     PH3 Accumulation → Intensity arc mirrors evidence-based block periodization model.

[12] Kirk C, et al. "Quantification of training load distribution in MMA athletes."
     PLoS ONE. 2021. PMC8109772.
     Finding: Most MMA athletes lack structured periodization. PH3 provides the
     systematic strength + load management that combat athletes are routinely missing.
```

---

## 8. App Views

```
1. TODAY       Current day workout card, week strip, AMRAP entry boxes, run card, Log CTA
2. DASHBOARD   1RM stat cards, PL total + Wilks, combat benchmarks with progress bars,
               block progress bar, 90-day consistency heatmap, recent sessions, badges
3. NUTRITION   Katch-McArdle stats, macro grid, calorie goal selector (4 options), timing protocol
4. LOG         Session logger: date, type, BW, energy, run dist/time, exercises (sets/reps/RIR), notes
5. PROGRESS    1RM trend chart, run pace trend, weekly volume bar, PR table with relative strength
6. SCIENCE     12 peer-reviewed citations with tags, findings, and DOI links
7. CALC        % of 1RM table, Epley estimator, combat relative strength ratio, RIR guide
8. SETTINGS    1RM baselines, program day/start date, athlete info, 1RM overrides,
               Google Sheets sync (URL input + test + push stats), data export/clear
```

---

## 9. Key Algorithms

```javascript
// Epley 1RM
const epley = (w, r) => r === 1 ? w : Math.round(w * (1 + r / 30));

// Run pace min/mile
const pace = (dist, time) => dist && time ? +(time / dist).toFixed(2) : null;

// Current program day
function currentDay(S) {
  if (S.startDate) {
    const d = Math.floor((Date.now() - new Date(S.startDate)) / 86400000);
    return Math.min(90, Math.max(1, d + 1));
  }
  return S.programDay || 1;
}
```

---

## 10. Charts (Chart.js v4.4.0)

```javascript
const CHART_THEME = {
  grid:   { color: '#1e2229' },
  ticks:  { color: '#5a6070', font: { family: 'Share Tech Mono', size: 9 } },
  legend: { labels: { color: '#5a6070', font: { family: 'Share Tech Mono', size: 9 } } },
};
// 1RM Progress   — line, 3 series (SQ=#ff3d1f, BN=#00d4ff, DL=#f5a623), spanGaps:true
// Run Pace       — line, single series, Y-axis REVERSED (lower=faster), color=#00d4ff
// Weekly Volume  — bar, sessions/week last 12 wks, color=rgba(255,61,31,.5)
```

---

## 11. Google Sheets Integration

### Phase 2 — Apps Script Web App

**Existing sheet:**
```
ID:  1Ehktj8QPGImsijTPnf5piutbd6G_B-PzaEB2wI1AwQg
URL: https://docs.google.com/spreadsheets/d/1Ehktj8QPGImsijTPnf5piutbd6G_B-PzaEB2wI1AwQg/edit
```

**Apps Script file:** `scripts/blkphx_apps_script.js`

**Setup (one-time, manual):**
```
1. Open sheet → Extensions → Apps Script
2. Delete default code → paste blkphx_apps_script.js contents
3. Save (Ctrl+S)
4. Deploy → New deployment
5. Type: Web app
   Execute as: Me (fpalvarez23@gmail.com)
   Who has access: Anyone
6. Click Deploy → grant permissions when prompted
7. Copy the Web App URL
8. Paste into tracker: Settings → Google Sheets Sync → Save URL → Test Connection
```

**Payload format (POST body as text/plain to avoid CORS preflight):**
```json
{ "type": "session", "session": { ...Session, programDay, block, week, bf, squat1rm, bench1rm, deadlift1rm, total, wilks } }
{ "type": "stats",   "stats":   { sq, bn, dl, total, bw, wilks } }
```

**Sync triggers in app:**
- Every `saveWorkout()` call — auto-syncs session + lifts
- Settings → "Push Current 1RMs" button — syncs stats snapshot
- Bulk export button — syncs all localStorage sessions in batch

### Phase 3 — Google OAuth Direct

```
Setup steps (Claude Code executes these):
1. Go to console.cloud.google.com
2. Create project: "blkphx-ph3"
3. Enable API: Google Sheets API v4
4. Credentials → Create Credentials → OAuth 2.0 Client ID
   Type: Web application
   Name: BLK PHX LABS Tracker
   Authorized origins: https://blkphx.pages.dev (or custom domain)
   Authorized redirect URIs: https://blkphx.pages.dev/oauth-callback
5. Copy Client ID → add to .env as GOOGLE_CLIENT_ID

OAuth flow (PKCE, no server needed):
  - User clicks "Connect Google" in Settings
  - App generates code_verifier + code_challenge (PKCE S256)
  - Redirect to accounts.google.com/o/oauth2/auth with:
      scope=https://www.googleapis.com/auth/spreadsheets
      response_type=code
      code_challenge_method=S256
  - Handle redirect back → exchange code for token
  - Store token in localStorage (key: "blkphx_gtoken")
  - All Sheets reads/writes use Bearer token in Authorization header

API calls:
  // Append session row
  POST https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/Sessions:append
       ?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS

  // Read all sessions (cross-device sync)
  GET  https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/Sessions
```

---

## 12. PWA Configuration

```json
// manifest.json
{
  "name": "BLK PHX LABS — PH3",
  "short_name": "BLK PHX",
  "description": "Science-backed PH3 combat training tracker",
  "theme_color": "#060608",
  "background_color": "#060608",
  "display": "standalone",
  "orientation": "portrait-primary",
  "start_url": "/",
  "scope": "/",
  "icons": [
    { "src": "/assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

```javascript
// sw.js — Cache-first for app shell, passthrough for API/CDN
const CACHE_NAME = 'blkphx-v1';
const APP_SHELL  = ['/', '/index.html', '/manifest.json', '/assets/phoenix.svg'];

self.addEventListener('install',  e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys =>
  Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))));
self.addEventListener('fetch',    e => {
  // Network-first for Apps Script and Sheets API calls
  if (e.request.url.includes('script.google.com') ||
      e.request.url.includes('sheets.googleapis.com')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

---

## 13. File Structure

```
blkphx-ph3/
├── index.html                   # Main app (~105KB, single file)
├── manifest.json                # PWA manifest
├── sw.js                        # Service worker
├── _redirects                   # Cloudflare Pages SPA redirect
├── .env.example                 # Template for environment variables
├── .gitignore
├── README.md
├── assets/
│   ├── phoenix.svg              # BLK PHX logo mark (extracted from inline HTML)
│   ├── icon-192.png             # PWA icon
│   └── icon-512.png             # PWA icon (maskable)
├── scripts/
│   └── blkphx_apps_script.js    # Google Apps Script Web App endpoint
└── docs/
    └── BLKPHX_CLAUDECODE_SPEC.md  # This file
```

**`_redirects` (Cloudflare Pages SPA routing):**
```
/*    /index.html    200
```

---

## 14. Existing Artifacts

| File | Description | Location |
|------|-------------|----------|
| `blkphx_ph3.html` | Complete working app (~105KB) | Claude outputs / project |
| `blkphx_apps_script.js` | Apps Script endpoint code | Claude outputs / project |
| `PH3_PROGRAMMING__POSTINJ.xlsx` | Original Layne Norton spreadsheet | Google Drive |
| `PH3_Schedule.pdf` | PH3 schedule PDF | Project files |
| Google Sheet | Training log (exists, empty) | ID: 1Ehktj8QPGImsijTPnf5piutbd6G_B-PzaEB2wI1AwQg |

---

## 15. Git Repository Setup

```bash
# Initialize repo
git init blkphx-ph3
cd blkphx-ph3

# .gitignore
cat > .gitignore << 'EOF'
.env
.env.local
node_modules/
.DS_Store
dist/
.cloudflare/
EOF

# .env.example
cat > .env.example << 'EOF'
# Google OAuth (Phase 3 only — not needed for Phase 1 or 2)
GOOGLE_CLIENT_ID=your_oauth_client_id_here

# Google Sheets (always needed)
GOOGLE_SHEETS_ID=1Ehktj8QPGImsijTPnf5piutbd6G_B-PzaEB2wI1AwQg

# Supabase (Phase 3 alt — only if choosing Supabase over Google OAuth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
EOF

# Initial commit
git add .
git commit -m "feat: initial BLK PHX LABS PH3 tracker scaffold"

# Push to GitHub
gh repo create blkphx-ph3 --private --source=. --push
# or manually:
git remote add origin https://github.com/YOUR_USERNAME/blkphx-ph3.git
git push -u origin main
```

---

## 16. Cloudflare Pages Deployment (Phase 1 + 2)

Cloudflare Pages is the primary deployment target — free tier, global CDN, zero config for static sites.

### Initial Setup
```bash
# Option A: Deploy via Cloudflare Dashboard (recommended first time)
# 1. Go to pages.cloudflare.com
# 2. Create application → Connect to Git → select blkphx-ph3 repo
# 3. Build settings:
#      Framework preset: None
#      Build command: (leave empty)
#      Build output directory: /  (root)
#      Root directory: /
# 4. Environment variables: (none needed for Phase 1-2)
# 5. Deploy

# Option B: Deploy via Wrangler CLI
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=blkphx-ph3
```

### Wrangler Config (for CLI deploys)
```toml
# wrangler.toml
name = "blkphx-ph3"
compatibility_date = "2024-01-01"

[site]
bucket = "."
```

### Custom Domain (optional)
```
1. Cloudflare Dashboard → Pages → blkphx-ph3 → Custom domains
2. Add domain: app.blkphxlabs.com (or blkphx.YOUR_DOMAIN.com)
3. If domain is on Cloudflare: auto-configures DNS
4. If external domain: add CNAME blkphx-ph3.pages.dev
5. SSL: automatic via Cloudflare
```

### Auto-Deploy on Push
```
Cloudflare Pages auto-deploys on every push to main branch.
Preview deployments on every PR (feature branches get a unique URL).
No GitHub Actions needed — Cloudflare handles CI/CD natively.

Production URL:  https://blkphx-ph3.pages.dev
Preview format:  https://COMMIT_HASH.blkphx-ph3.pages.dev
```

### Environment Variables in Cloudflare Pages
```
Dashboard → Pages → blkphx-ph3 → Settings → Environment variables

For Phase 3 (Google OAuth), add:
  Variable: GOOGLE_CLIENT_ID
  Value: (from Google Cloud console)
  Environment: Production + Preview

Note: These are build-time env vars for static sites.
For runtime client-side use, embed them during build or use
a Cloudflare Worker as a proxy (see Phase 3 below).
```

### Cloudflare Worker for OAuth Token Exchange (Phase 3)
```javascript
// workers/oauth-proxy/index.js
// Deploy separately: wrangler deploy workers/oauth-proxy/

export default {
  async fetch(request, env) {
    if (request.method === 'POST' && new URL(request.url).pathname === '/token') {
      const body = await request.json();
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code:          body.code,
          client_id:     env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,  // NEVER in frontend
          redirect_uri:  body.redirect_uri,
          grant_type:    'authorization_code',
          code_verifier: body.code_verifier,
        }),
      });
      const data = await response.json();
      return Response.json(data);
    }
    return new Response('Not found', { status: 404 });
  }
};
```

```toml
# workers/oauth-proxy/wrangler.toml
name = "blkphx-oauth"
compatibility_date = "2024-01-01"
main = "index.js"

[vars]
GOOGLE_CLIENT_ID = "your_client_id"
# GOOGLE_CLIENT_SECRET stored as a Secret:
# wrangler secret put GOOGLE_CLIENT_SECRET
```

---

## 17. Google Cloud Project Setup (Phase 3)

Follow these steps exactly. Claude Code can automate steps 4–7 using the gcloud CLI.

```bash
# Prerequisites
npm install -g @google-cloud/cli   # or: brew install google-cloud-sdk
gcloud auth login

# Step 1: Create project
gcloud projects create blkphx-ph3-tracker --name="BLK PHX LABS PH3"
gcloud config set project blkphx-ph3-tracker

# Step 2: Enable billing (required for API activation — free tier applies)
# Manual: console.cloud.google.com → Billing → Link account

# Step 3: Enable Google Sheets API
gcloud services enable sheets.googleapis.com

# Step 4: Configure OAuth consent screen
# Manual via console (cannot fully automate):
# APIs & Services → OAuth consent screen
# App type: External
# App name: BLK PHX LABS Tracker
# User support email: fpalvarez23@gmail.com
# Authorized domains: pages.dev, YOUR_CUSTOM_DOMAIN (if any)
# Scopes: .../auth/spreadsheets

# Step 5: Create OAuth 2.0 credentials
# Manual: APIs & Services → Credentials → Create Credentials → OAuth Client ID
# Application type: Web application
# Name: BLK PHX LABS Web Client
# Authorized JavaScript origins:
#   https://blkphx-ph3.pages.dev
#   http://localhost:8080  (for local dev)
# Authorized redirect URIs:
#   https://blkphx-ph3.pages.dev/oauth-callback
#   http://localhost:8080/oauth-callback

# Step 6: Download credentials JSON, extract client_id
# Add to Cloudflare Pages env vars and .env.local

# Step 7: Add test users while in "Testing" mode
# OAuth consent → Test users → Add fpalvarez23@gmail.com
# (Required until app is published / verified)
```

---

## 18. Supabase Setup (Phase 3 Alternative)

If choosing Supabase over Google OAuth:

```bash
# Step 1: Create project at supabase.com
# Project name: blkphx-ph3
# Region: us-east-1 (or closest)
# Copy Project URL and anon key

# Step 2: Run schema migration
# Supabase Dashboard → SQL Editor → paste and run:
```

```sql
-- sessions table
CREATE TABLE sessions (
  id          BIGINT PRIMARY KEY,
  date        DATE NOT NULL,
  type        TEXT,
  bw          DECIMAL(5,1),
  bf          DECIMAL(4,1),
  energy      SMALLINT,
  run_dist    DECIMAL(4,2),
  run_time    DECIMAL(5,1),
  run_pace    DECIMAL(5,2),
  program_day SMALLINT,
  block       TEXT,
  week        SMALLINT,
  notes       TEXT,
  squat_1rm   SMALLINT,
  bench_1rm   SMALLINT,
  dl_1rm      SMALLINT,
  total       SMALLINT,
  wilks       DECIMAL(6,1),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- lifts table
CREATE TABLE lifts (
  id           BIGSERIAL PRIMARY KEY,
  session_id   BIGINT REFERENCES sessions(id),
  date         DATE,
  exercise     TEXT,
  type         TEXT,
  set_num      SMALLINT,
  weight       DECIMAL(6,1),
  reps         SMALLINT,
  rir          SMALLINT,
  estimated1rm SMALLINT
);

-- stats snapshots
CREATE TABLE stats (
  id         BIGSERIAL PRIMARY KEY,
  squat_1rm  SMALLINT,
  bench_1rm  SMALLINT,
  dl_1rm     SMALLINT,
  total      SMALLINT,
  bw         DECIMAL(5,1),
  wilks      DECIMAL(6,1),
  dl_bw      DECIMAL(4,2),
  sq_bw      DECIMAL(4,2),
  bn_bw      DECIMAL(4,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats    ENABLE ROW LEVEL SECURITY;

-- Public read/write policy (single-user app — adjust if multi-user)
CREATE POLICY "Allow all" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all" ON lifts    FOR ALL USING (true);
CREATE POLICY "Allow all" ON stats    FOR ALL USING (true);
```

```javascript
// Supabase client usage in app
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_ANON_KEY'
);

// Insert session
await supabase.from('sessions').insert({ ...sessionData });

// Read all sessions
const { data } = await supabase
  .from('sessions')
  .select('*')
  .order('date', { ascending: false });
```

---

## 19. Claude Code — Execution Tasks (in order)

```
PHASE 1: LOCAL APP → CLOUDFLARE (do first, ship quickly)

Task 1 — Scaffold repo
  [ ] git init blkphx-ph3
  [ ] Copy blkphx_ph3.html → index.html
  [ ] Copy blkphx_apps_script.js → scripts/
  [ ] Create manifest.json (Section 12)
  [ ] Create sw.js (Section 12)
  [ ] Create _redirects with: /*  /index.html  200
  [ ] Create .gitignore and .env.example (Section 15)
  [ ] Create assets/phoenix.svg (extract from inline HTML in index.html)
  [ ] Create README.md (project overview, setup steps, deploy steps)
  [ ] git add . && git commit -m "feat: initial scaffold"
  [ ] gh repo create blkphx-ph3 --private --source=. --push

Task 2 — Register service worker in index.html
  [ ] Add to <head>: <link rel="manifest" href="/manifest.json">
  [ ] Add iOS meta tags: apple-mobile-web-app-capable, apple-touch-icon
  [ ] Add SW registration script before </body>:
        if ('serviceWorker' in navigator)
          navigator.serviceWorker.register('/sw.js');
  [ ] Test: Lighthouse PWA audit must pass installability

Task 3 — Deploy to Cloudflare Pages
  [ ] wrangler login (or use Dashboard)
  [ ] Create Pages project: blkphx-ph3
  [ ] Connect GitHub repo OR run: wrangler pages deploy . --project-name=blkphx-ph3
  [ ] Verify live at https://blkphx-ph3.pages.dev
  [ ] Test PWA install on mobile (Chrome + Safari)
  [ ] Verify offline mode works (disconnect network, reload app)

PHASE 2: GOOGLE SHEETS SYNC (do after Phase 1 is live)

Task 4 — Apps Script setup (manual — document steps for user)
  [ ] Confirm scripts/blkphx_apps_script.js is complete and correct
  [ ] Write SHEETS_SETUP.md with exact copy-paste steps for user
  [ ] Add bulk sync button to app: loops S.sessions → POSTs each to Sheets
  [ ] Add sync status indicator: spinner during POST, ✓/✗ result toast
  [ ] Test end-to-end: log session → verify row appears in sheet

PHASE 3: GOOGLE OAUTH DIRECT (do after Sheets sync is stable)

Task 5 — Google Cloud project
  [ ] Follow Section 17 steps
  [ ] Create OAuth credentials for pages.dev + localhost
  [ ] Store Client ID in Cloudflare Pages env vars

Task 6 — OAuth PKCE flow in app
  [ ] Implement PKCE code_verifier + code_challenge generation (SubtleCrypto API)
  [ ] Add "Connect Google Account" button to Settings
  [ ] Handle OAuth redirect back to app → exchange code → store token
  [ ] Add token refresh logic (expires in 1 hour — auto-refresh on expiry)
  [ ] Replace Apps Script POST with direct Sheets API v4 append
  [ ] Add session pull on app load → populate S.sessions from Sheet
  [ ] Sheet becomes source of truth; localStorage is cache

Task 7 — Deploy Cloudflare Worker for token exchange
  [ ] Create workers/oauth-proxy/ (Section 16)
  [ ] Add GOOGLE_CLIENT_SECRET as Wrangler secret
  [ ] Deploy: cd workers/oauth-proxy && wrangler deploy
  [ ] Update app to POST to worker URL for token exchange
  [ ] Test full OAuth flow in production

ONGOING
Task 8 — CI/CD via Cloudflare auto-deploy
  [ ] Every push to main → automatic production deploy
  [ ] Every PR → preview deploy at unique URL
  [ ] Monitor: Cloudflare Dashboard → Pages → Deployments
```

---

## 20. Notes for Claude Code

- **Do not modify the AUTOREG tables** (Section 4) — extracted from original spreadsheet, verified correct. Treat as constants.
- **Brand is non-negotiable** — void black background, fire red primary, BLK PHX phoenix logo. Never default to generic fitness app UI.
- **Science citations** — reproduce exactly as written in Section 7. Do not summarize, paraphrase, or alter DOIs.
- **Mobile-first always** — app is used in the gym on a phone. All tap targets ≥44px. Navigation sticky at top. Primary CTAs full-width at view bottom.
- **Offline-first** — app must function fully without network. Sheets sync is additive, not required.
- **Phase sequencing** — do not jump to OAuth before Phase 1 is live and tested. Ship something real first.
- **Athlete context** — 175lb male, 31, 11.5% BF, returning lifter. Conservative 1RM starts. Relative strength matters more than absolute numbers. Martial arts is the goal, not powerlifting competition.
- **Session order** — Lift → Run. Never run first. Heavy leg days flag the run with a delay warning.
- **Apps Script Content-Type** — POST body must be `text/plain` (not `application/json`) to avoid CORS preflight issues with Apps Script Web Apps.
- **localStorage key** — `blkphx3`. Do not rename — existing users have data under this key.
- **Chart.js CDN** — `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`. Pin to this version.
