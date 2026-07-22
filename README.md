# Charity Watch (AU)

**Look up any Australian registered charity — sector, finances, where money goes, and red flags — before you donate.**

🔗 **Live:** [https://au-charities.benrichardson.dev](https://au-charities.benrichardson.dev)

## What is this?

There are over 65,000 charities on the ACNC register. If you want to verify a charity before donating — confirm it's real, see how much of your dollar reaches programs vs admin, check whether it depends on government — the official register is a single-charity lookup with the financials buried three clicks deep.

This site flips that. Search by name, ABN, suburb, or postcode. Click any charity for a full breakdown: where its 2023 income came from, where it went, who benefits, and any noteworthy ratios. Compare across leaderboards. Browse the sector × beneficiary matrix to find charities serving specific communities. Auto-generated insights surface high-admin or government-dependent charities.

All data is from the ACNC's own public datasets. No edits, no editorial choices about what to show — just a better interface to the same numbers.

## Who is this for?

- **Donors** weighing up a year-end gift, a workplace giving form, a Facebook fundraiser, or a street collector — anyone who wants to confirm "is this legit and where does my money actually go?"
- **Volunteers** comparing organisations before signing up.
- **Researchers, journalists, and accountants** wanting a faster lens over the sector than navigating the ACNC site charity-by-charity.
- **Boards and grant-makers** benchmarking a charity against peers in the same sector.

## Data Sources

| Source | What it provides | Update frequency |
|--------|-------------------|-----------------|
| [ACNC Register of Australian Charities](https://data.gov.au/data/dataset/acnc-register) | Every registered charity — name, ABN, address, size, purposes, beneficiaries, states of operation | Monthly |
| [ACNC 2023 Annual Information Statement (AIS) Data](https://data.gov.au/data/dataset/acnc-2023-annual-information-statement-ais-data) | Full financials — revenue, expenses, donations, government revenue, assets, staffing, volunteers | Annual |
| ABS Estimated Resident Population (June 2024) | State-level population for per-capita comparisons | Annual (embedded) |

## Features

- **Search 65,000+ charities** — instant filter by name, ABN, suburb, postcode, state, size, purpose, beneficiary, AIS status, or PBI status.
- **Per-charity detail panel** — full financial breakdown with revenue sources, expense uses, key ratios, and auto-generated warnings for high admin or government dependency.
- **13 leaderboards** — largest by revenue, donations, government revenue, grants made, employee expenses, assets, volunteers, FTE staff, reach across states; also highest admin ratio, government dependency, donations share, and largest deficits.
- **Money flow Sankey** — aggregate income sources (donations, government, services, investments, other) to expense uses (employees, grants AU, grants OS, other).
- **Sector × beneficiary matrix** — heatmap showing which sectors serve which communities, so you can find e.g. "charities advancing education whose beneficiaries include refugees."
- **State map** — Leaflet-based, sized by per-capita charity density. NT and ACT have the highest density.
- **10 auto-generated insights** — anomalies like the largest single deficit, sector with most charities, the share of revenue that's actually from donations vs government.
- **Glossary tooltips** — click any **?** icon for plain-language explanations of ABN, ACNC, AIS, PBI, HPC, DGR, charity size bands, and key financial terms.

## Tech Stack

- **Runtime:** Vanilla TypeScript
- **Build:** Vite 6
- **Testing:** Vitest (49 tests covering format helpers, bit-field decoding, search/filter logic, CSV parser)
- **Map:** Leaflet 1.9 (CartoDB Positron tiles)
- **Hosting:** GitHub Pages (static, no backend)
- **Data:** GitHub Actions pipeline downloads ACNC CSVs monthly, aggregates and joins on ABN, commits compact tabular JSON to `public/data/`

No cookies, no fingerprinting, no third-party fonts. Anonymous, cookie-less page-view counts via Cloudflare Web Analytics — no personal data, no cross-site tracking. Total client bundle: ~60 KB gzipped JS + 4 KB gzipped CSS.

## Local Development

```bash
npm install

# Run the data pipeline (downloads ACNC CSVs, ~50MB cache, ~22MB JSON output)
npm run pipeline

# Dev server
npm run dev

# Run tests
npm test

# Production build
npm run build

# Preview the production build
npm run preview
```

## How it works

`pipeline/collect.mjs` downloads the two ACNC CSVs from data.gov.au and caches them in `pipeline/cache/` for a week. `pipeline/aggregate.mjs` parses them with a hand-rolled RFC-4180 CSV parser, joins on ABN, and emits seven JSON files into `public/data/`:

- `meta.json` — labels and metadata (~2 KB)
- `aggregate.json` — overall stats, by state/size/purpose/beneficiary (~4 KB)
- `leaderboards.json` — top 100 per metric (~200 KB)
- `sectors.json` — purpose × beneficiary matrix (~8 KB)
- `flows.json` — Sankey nodes and links (~250 B)
- `insights.json` — auto-generated cards (~3 KB)
- `charities.json` — tabular search index (~10 MB)
- `financials.json` — per-ABN financial detail (~11 MB)

The frontend loads the small pre-aggregated files immediately for the overview, leaderboards, flows, sectors, map, and insights tabs. The bulky charity index and financials load lazily in the background — only the Search tab and the drill-down panel need them.

The pipeline runs monthly via `.github/workflows/data-pipeline.yml`. The data files in `public/data/` are committed to the repository, so changes show up as diffs and the site can be served as a fully static asset.

## license

[GNU Affero General Public License v3.0 or later](./LICENSE), with an attribution
requirement added under section 7(b) — see
[ADDITIONAL-TERMS.md](./ADDITIONAL-TERMS.md).

In short: you may run, modify, redistribute and even sell this, but if you
distribute it — or run a modified version where other people can reach it — you
have to publish your source under the same licence and keep the attribution. A
separate commercial licence without those obligations is available on request:
<hi@ben.gy>.

Third-party components keep their own licences — see
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
