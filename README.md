<div align="center">

# 🛰️ VYOM

**Catastrophe Risk Intelligence Platform for Tamil Nadu**

Geospatial hazard views, auditable loss calculations, scenario simulation and a grounded AI copilot, built so every rupee of modelled loss can be traced and checked by hand.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

[Features](#-features) · [Quick start](#-quick-start) · [How the model works](#-how-the-model-works) · [Limitations](#️-limitations)

</div>

> **Demo data notice:** assets, hazard scores and the return-period table are demonstration data and simplified models, not calibrated estimates. VYOM supports expert review and is **not** an automatic underwriting decision tool.

---

## 😖 The problem

Catastrophe models are often black boxes built on foreign vulnerability data. Underwriters in India are asked to trust a loss number without seeing the hazard, the damage curve, or the assumptions behind it. After events like Cyclone Michaung (2023) and the 2023 southern Tamil Nadu floods, that opacity is hard to defend.

## ✨ Features

VYOM is a single-page terminal with twelve views:

| View | What it does |
|---|---|
| **Overview** | Portfolio summary for the selected micro-zone |
| **Risk Map** | Interactive SVG map of Tamil Nadu micro-zones with hazard layers |
| **Hazard Analysis** | Flood, cyclone, rainfall and storm-surge scores per zone |
| **Exposure & Assets** | Add, edit and delete insured assets (synced to Supabase when connected) |
| **Loss History** | Historical events (Michaung 2023, southern TN deluge 2023, and more) with economic vs insured loss |
| **Risk Modelling** | Return-period (10 to 250 year) exceedance table with confidence bands |
| **Scenario Simulator** | Change rainfall, surge, wind and plinth height, and see baseline vs scenario loss |
| **Loss Anatomy** ⭐ | A 7-step audit trace from raw hazard to expected annual loss |
| **Explainability** | Plain-language explanation of model choices |
| **Data Trust Center** | Dataset owner, licence, resolution, freshness, validation status and limitations |
| **Risk Passport** | Printable asset risk summary with JSON export |
| **Settings** | Connect Supabase at runtime and copy the SQL schema |

Plus a **Catastrophe Copilot**: a chat assistant grounded in a built-in knowledge base (see [AI copilot](#-ai-copilot)).

### Design principles

| Principle | How it shows up |
|---|---|
| **Traceable** | Loss Anatomy shows the formula, inputs, source, assumptions and limitations at every step. |
| **Deterministic** | The risk engine uses no randomness, so the same inputs always give the same outputs. |
| **Local vulnerability curves** | Four Tamil Nadu curves are used instead of generic US defaults. |
| **Honest labelling** | Curves are tagged `Verified TN Beta` or `Proposed Calibration`; datasets are tagged `Verified Official`, `Modelled Synthetic` or `Research Beta`. |
| **Hand-checkable** | A built-in test confirms the example ₹50,00,000 × 20% = ₹10,00,000. |
| **AI never decides** | The copilot cannot approve, reject or bind a policy, and every reply ends with a review disclaimer. |
| **Works offline** | With no Gemini key or no Supabase, the app still runs on demo data and a deterministic fallback. |

---

## 🧰 Tech stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Motion, Lucide icons
**Server:** Express (serves the app and the copilot API) run with `tsx`
**AI:** Google Gemini via `@google/genai`, with a local TF-IDF retrieval step
**Auth and storage:** Supabase (optional), with a local demo mode as fallback

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────┐
│ React SPA (src/)                          │
│  Views · catRiskEngine.ts · geodata       │
│  supabaseClient.ts ──▶ Supabase (optional)│
└──────────────────┬────────────────────────┘
                   │ POST /api/copilot/chat
                   ▼
┌───────────────────────────────────────────┐
│ Express server (server.ts)                │
│  1. TF-IDF retrieval over knowledge base  │
│  2. Gemini call with grounded prompt      │
│  3. Deterministic fallback if no key/fail │
└───────────────────────────────────────────┘
```

<details>
<summary><b>📁 Project structure</b></summary>

```
Vyom2.0-main/
├── server.ts                    # Express server: /api/health, /api/copilot/chat, Vite/static
├── index.html
├── vite.config.ts
├── package.json
├── .env.example
└── src/
    ├── App.tsx                  # App shell, routing, session and asset loading
    ├── main.tsx
    ├── components/
    │   ├── LoginView.tsx        # Sign in / sign up / reset / demo mode
    │   ├── OpeningAnimation.tsx # Intro animation (once per session)
    │   ├── Sidebar.tsx · Navbar.tsx
    │   ├── AICopilotModal.tsx   # Copilot chat UI
    │   └── views/               # The 12 views listed above
    ├── data/
    │   ├── tamilNaduGeodata.ts  # Zones, vulnerability curves, demo assets, events, data registry
    │   └── vectorKnowledgeBase.ts # Knowledge corpus + TF-IDF retrieval
    ├── services/
    │   └── supabaseClient.ts    # Auth + assets CRUD, runtime credentials
    ├── types/risk.ts            # Shared TypeScript types
    └── utils/
        └── catRiskEngine.ts     # Loss anatomy, scenarios, return periods, self-tests
```

</details>

---

## 🚀 Quick start

**Prerequisites:** Node.js 20+ (Bun also works; a `bun.lock` is included).

```bash
# 1. Clone
git clone https://github.com/VishalRS2466-maker/Vyom2.0.git
cd Vyom2.0

# 2. Install
npm install

# 3. (Optional) configure environment
cp .env.example .env

# 4. Run
npm run dev
```

Open **http://localhost:3000**. Click **Quick Demo Mode** on the login screen to explore with no account or keys.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Express + Vite dev server on port 3000 |
| `npm run build` | Build the frontend into `dist/` |
| `npm start` | Start the server (set `NODE_ENV=production` to serve `dist/`) |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run clean` | Remove `dist/` and `server.js` |

Production run:

```bash
npm run build
NODE_ENV=production npm start
```

### ⚙️ Environment variables

All are optional. Copy `.env.example` to `.env`.

| Variable | Where used | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Server only | Enables Gemini-powered copilot answers |
| `VITE_SUPABASE_URL` | Browser | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Supabase **anon (public)** key |
| `PORT` | Server | Port (default `3000`) |
| `APP_URL` | Deployment | URL where the app is hosted |

> ⚠️ Never put a Supabase `service_role` key in the browser or in `VITE_` variables. Only the public anon key belongs there. `.env` files are git-ignored.

You can also enter the Supabase URL and anon key at runtime in **Settings**; they are stored in the browser's local storage.

---

## 🗄️ Supabase setup (optional)

1. Create a Supabase project.
2. Open **Settings** in VYOM, click **Copy Migration SQL**, and run it in the Supabase SQL Editor. It creates:
   - `assets`: the exposure register, with Row Level Security
   - `audit_traces`: stored loss-anatomy traces, with Row Level Security
3. Add your project URL and anon key (via `.env` or the Settings page).
4. Sign up from the login screen.

Without Supabase, VYOM uses a local demo session and keeps assets in the browser.

---

## 🧮 How the model works

### Loss Anatomy (7 steps)

`generateLossAnatomyTrace()` produces a step-by-step record. For each step it lists the formula, intermediate values, source and version, assumptions and limitations.

1. **Hazard intensity:** raw hazard, minus plinth height for floods (`H_net = max(0, H_flood − H_plinth)`)
2. **Exposure:** total insured value of the asset
3. **Vulnerability curve:** which curve applies to the construction type
4. **Mean damage ratio:** piecewise-linear interpolation, bounded to 0–100%
5. **Gross and net loss:** `net = min(limit, max(0, gross − deductible))`
6. **Expected annual loss (EAL)**
7. **PML and technical rate (bps)**

### Vulnerability curves

| Curve | Used for | Status |
|---|---|---|
| `TN-RCC-2024` | Reinforced concrete buildings | Verified TN Beta |
| `TN-Masonry` | Brick masonry | Verified TN Beta |
| `TN-Industrial-PEB` | Pre-engineered steel sheds | Proposed Calibration |
| `TN-Agri-Paddy` | Paddy / agricultural assets | Proposed Calibration |

### Micro-zones

Chennai, Cuddalore, Nagapattinam, Thoothukudi, Tiruvallur, Kanchipuram, Thanjavur, Coimbatore and Nilgiris, each with flood, cyclone, rainfall and storm-surge scores (0–100).

### Built-in self-tests

`runAutomatedVerificationTests()` checks:

- the illustrative arithmetic example (₹50,00,000 × 20% = ₹10,00,000, labelled as an illustration and not a calibrated estimate)
- damage ratio always stays within 0–100%
- curves never decrease as intensity rises
- the deductible and limit rule holds

---

## 🤖 AI copilot

`POST /api/copilot/chat` accepts `{ message, assetContext, zoneContext }`.

1. The question is matched against a built-in knowledge base (zone profiles, vulnerability curves, loss anatomy, pricing, scenario modelling) using TF-IDF ranking.
2. The top 3 passages are placed into a system prompt along with the selected asset and zone.
3. Gemini answers at low temperature (0.2) under strict rules: stay grounded, explain the calculations, flag uncertainty, never invent sensor data or alerts, never approve or bind a contract.
4. If there is no API key or the call fails, the server returns a **deterministic answer** built from the best-matching passage.

Responses include the retrieved sources so users can see what the answer is based on. The Gemini key stays on the server and is never sent to the browser.

`GET /api/health` returns service status and whether Gemini is configured.

---

## ⚠️ Limitations

Honest notes for reviewers and contributors:

- **Simplified annualisation.** EAL uses a fixed 4% annual exceedance probability (a 1-in-25 benchmark) and PML 1-in-100 uses a 1.45× multiplier on gross damage. These are placeholders, not a full event-set simulation.
- **Return periods are formula-based.** The 10 to 250 year table uses a log-scaled approximation, not fitted station data.
- **Demo data.** Assets, hazard scores and several historical figures are demonstration or synthesised records. Check the Data Trust Center for each dataset's status.
- **Two curves are not yet calibrated** (`TN-Industrial-PEB`, `TN-Agri-Paddy`).
- **Demo login is client-side only** and is not real authentication. Use Supabase Auth for real accounts.
- **Review the RLS policies** in the generated SQL before using real data. The insert and select rules are permissive in places (for example, rows with no `user_id` are readable).
- **No automated test runner.** Self-tests run inside the app; there is no Jest or Vitest suite yet.

## 🗺️ Roadmap

- [ ] Replace the fixed AEP and PML multiplier with a stochastic event set
- [ ] Calibrate the PEB and paddy curves against claims data
- [ ] Persist loss-anatomy traces to `audit_traces` from the UI
- [ ] Tighten RLS policies and add role-based access
- [ ] Real map tiles and district boundary data
- [ ] Add a Vitest suite for the risk engine
- [ ] Portfolio-level import (CSV) for exposure data

## 👥 Team Vyom

| Name | Role |
|---|---|
| Tharun J V | AI/ML Engineer |
| Vishnuvardhan A | Backend Engineer |
| Suhandhan K | Product Integration & QA Lead |
| Vishal R S | AI Engineer |

## 🤝 Contributing

Issues and PRs are welcome. Run `npm run lint` before opening a PR.

## 📄 License

Released under the [MIT License](LICENSE).

---

<p align="center">Made with ☕ by <b>Team Vyom</b> · <b>VYOM</b>: every loss number, traceable.</p>
