# SLtoLot — Forex Lot Size Calculator

> **"What lot size makes X pips equal Y dollars?"**

SLtoLot is a clean, professional, client-side Forex lot size calculator built for traders who think in pips and risk percentages. No backend, no account, no data sent anywhere — just open it and calculate.

---

## Live Demo

```
https://yourusername.github.io/sltolot
```

---

## What It Does

When you define a trade by its **stop loss in pips** and know exactly **how much you want to risk**, SLtoLot tells you the precise lot size to use. It handles the pip value math automatically, including JPY pairs and non-USD accounts.

**Core formula:**

```
Lot Size = Risk Amount ÷ (Stop Loss in Pips × Pip Value per Lot)
```

---

## Features

- **Risk by percentage or fixed amount** — toggle between risking a % of your balance or a fixed dollar/currency amount
- **Auto pip size detection** — detects JPY pairs (pip = 0.01) vs all other pairs (pip = 0.0001) automatically from the symbol, no hardcoded list
- **Full non-USD account support** — correctly handles accounts in EUR, GBP, JPY, or any other currency
- **Dynamic conversion rate field** — only appears when needed, with a clear explanation of exactly what rate to enter
- **Cross pair support** — handles pairs like EURJPY, GBPCHF, AUDCAD for any account currency
- **Lot type classification** — tells you whether your result is a Standard, Mini, or Micro lot
- **Confirmation statement** — displays `20 pips × $2.50/pip = $50 risk` so you can verify at a glance
- **Real-time calculation** — updates instantly as you type
- **Fully responsive** — works on desktop and mobile
- **Zero dependencies** — pure HTML, CSS, and Vanilla JavaScript

---

## How to Use

### Basic Setup

| Field | What to enter |
|---|---|
| **Balance** | Your total account balance |
| **Account Currency** | The currency your account is in (e.g. `USD`, `GBP`, `EUR`) |
| **Risk Type** | Toggle between `% Risk` or `Fixed $` |
| **Risk Value** | Either the percentage (e.g. `1`) or fixed amount (e.g. `50`) |
| **Currency Pair** | The pair you're trading (e.g. `EURUSD`, `GBPJPY`) |
| **Stop Loss (pips)** | Your stop loss distance in pips only — no price levels |
| **Contract Size** | Default is `100,000` (standard). Change for brokers with different contract sizes |

### When Does the Conversion Rate Field Appear?

The conversion rate field only appears when your account currency is not the quote currency of the pair. There are two scenarios:

**Scenario A — Account currency is the base currency**

Example: GBP account trading GBPUSD
The calculator needs to know `1 GBP = ? USD`. Enter the current GBPUSD rate.

**Scenario B — Cross pair**

Example: USD account trading EURJPY
The pip value is in JPY (the quote currency). The calculator needs to convert JPY to USD. Enter the current JPYUSD rate (i.e. `1 JPY = ? USD`).

The hint text in the conversion rate field always tells you exactly what to enter.

---

## Calculation Logic

### Pip Size Detection

```
If last 3 characters of pair = "JPY" → pip size = 0.01
Otherwise → pip size = 0.0001
```

No hardcoded pair list. Works for any valid currency pair symbol.

### Pip Value Per Lot

**Case 1 — Account currency = Quote currency** (e.g. USD account, EURUSD)

```
Pip Value = Pip Size × Contract Size
```

Example: `0.0001 × 100,000 = $10 per lot`

**Case 2 — Account currency = Base currency** (e.g. GBP account, GBPUSD)

```
Pip Value = (Pip Size × Contract Size) ÷ Conversion Rate
```

Where conversion rate = `1 GBP in USD (the quote currency)`

**Case 3 — Cross pair** (e.g. USD account, EURJPY)

```
Pip Value = (Pip Size × Contract Size) × Conversion Rate
```

Where conversion rate = `1 JPY (quote currency) in USD (account currency)`

### Lot Size

```
Risk Amount = Balance × Risk%          (percentage mode)
Risk Amount = Fixed input              (fixed mode)

Lot Size = Risk Amount ÷ (Stop Loss Pips × Pip Value Per Lot)
```

### Lot Classification

| Range | Type |
|---|---|
| ≥ 1.00 | Standard Lot |
| ≥ 0.10 | Mini Lot |
| ≥ 0.01 | Micro Lot |
| < 0.01 | Nano Lot |

---

## Examples

### Example 1 — USD account, EURUSD, 1% risk

```
Balance:        $10,000
Account:        USD
Risk:           1% → $100 risk
Pair:           EURUSD
Stop Loss:      20 pips
Contract Size:  100,000

Pip Size:       0.0001
Pip Value/Lot:  0.0001 × 100,000 = $10
Lot Size:       $100 ÷ (20 × $10) = 0.50 lots (Mini)
Units:          50,000

Confirmation:   20 pips × $5.00/pip = $100 risk
```

### Example 2 — GBP account, GBPJPY, fixed risk

```
Balance:        £5,000
Account:        GBP
Risk:           £75 fixed
Pair:           GBPJPY
Stop Loss:      30 pips
Conversion:     1 GBP = 190.00 JPY

Pip Size:       0.01 (JPY pair)
Pip Value/Lot:  (0.01 × 100,000) ÷ 190 = £5.26
Lot Size:       £75 ÷ (30 × £5.26) = 0.47 lots (Mini)
```

### Example 3 — USD account, EURJPY (cross pair)

```
Balance:        $8,000
Account:        USD
Risk:           2% → $160 risk
Pair:           EURJPY
Stop Loss:      40 pips
Conversion:     1 JPY = 0.0067 USD

Pip Size:       0.01 (JPY pair)
Pip Value/Lot:  (0.01 × 100,000) × 0.0067 = $6.70
Lot Size:       $160 ÷ (40 × $6.70) = 0.60 lots (Mini)
```

---

## Project Structure

```
sltolot/
├── index.html      # App markup and layout
├── styles.css      # Dark trading theme, responsive styles
├── script.js       # All calculation logic and UI updates
└── README.md       # This file
```

### JavaScript Functions

| Function | Purpose |
|---|---|
| `getPipSize(pair)` | Returns 0.01 for JPY pairs, 0.0001 for all others |
| `parsePair(pair)` | Splits pair into `{ base, quote }` |
| `calculatePipValue(...)` | Determines pip value in account currency across all 3 cases |
| `calculateLotSize(...)` | Applies the core lot size formula |
| `getRiskAmount(...)` | Converts % or fixed risk input to a currency amount |
| `classifyLot(lotSize)` | Returns lot type label (Standard, Mini, Micro, Nano) |
| `updateConversionUI(...)` | Shows/hides the conversion rate field dynamically |
| `updateUI(data)` | Renders the result section |
| `calculate()` | Main orchestrator — reads inputs, validates, calls all of the above |
| `setRiskType(type)` | Handles the % / Fixed toggle |

---

## Deploying to GitHub Pages

1. Create a new **public** repository on GitHub
2. Upload `index.html`, `styles.css`, and `script.js`
3. Go to **Settings → Pages**
4. Set source to **Deploy from a branch → main → / (root)**
5. Click **Save** — your site will be live at:

```
https://yourusername.github.io/repository-name
```

No build step. No config file. No CI/CD needed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES6+) |
| Hosting | GitHub Pages |
| Dependencies | None |

---

## Limitations & Notes

- **No live price feed** — conversion rates must be entered manually when required. This is by design (no API keys, no backend).
- **Broker variations** — some brokers use different contract sizes (e.g. 10,000 for mini accounts). Use the Contract Size field to adjust.
- **Exotic pairs** — the pip size detection works on any pair where the last 3 characters are the quote currency. Pairs with unusual formatting may need to be cleaned up before entry.
- **This tool is for position sizing only** — it is not financial advice and does not account for spread, commission, or slippage.

---

## License

MIT — free to use, modify, and deploy.

---

*Built with pure HTML, CSS, and Vanilla JavaScript. No tracking. No ads. No data collection.*
