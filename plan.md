# Site Plan: Charity Watch (AU)

## Overview
- **Name:** Charity Watch (AU)
- **Repo name:** au-charities
- **Tagline:** Look up any Australian registered charity — sector, finances, where money goes, and red flags — before you donate.

## Target Audience
Australian donors who want to verify a charity before giving money — people seeing fundraising appeals at a checkout, a workplace giving form, a tax-deductible end-of-year donation, or a Facebook ad. Also: small business owners checking a partner charity, journalists, researchers, and people considering a charity to volunteer with.

## Value Proposition
The ACNC register exists but is technical, single-charity lookups only, and buries the financials. This site flips that: search any of the 65,000+ registered Australian charities, and immediately see how big they are, where their money actually comes from, where it goes (programs vs admin), and how they compare to similar charities. Anomaly detection surfaces high-admin or high-gov-dependency charities, and the leaderboards rank the biggest by revenue, donations, and reach. One bookmark for "should I donate to this?"

## Data Sources
| Source | URL | What it provides | Update frequency | Auth required? |
|--------|-----|-------------------|-----------------|----------------|
| ACNC Register of Australian Charities | data.gov.au/data/dataset/acnc-register | Every registered charity — name, ABN, address, size, sector, beneficiaries, purposes | Monthly | No |
| ACNC 2023 Annual Information Statement | data.gov.au/data/dataset/acnc-2023-annual-information-statement-ais-data | Full financials per charity — revenue, expenses, assets, liabilities, surplus | Annual | No |
| ABS State population (ERP June 2024) | Embedded | State-level per-capita normalisation | Annual | No |

## Key Features
1. **Search** — Instant search across all 65k charities by name, ABN, suburb, or postcode
2. **Detail panel** — Per-charity breakdown: financials, where money comes from, where it goes, sectors, beneficiaries
3. **Leaderboards** — Top charities by revenue, by donations, by reach (number of states); also worst by admin-cost ratio and government dependency
4. **Sector flow** — Sankey-style flow showing aggregate revenue → expenses by category (donations / gov / fees → programs / employees / grants / other)
5. **Map** — State-level distribution with per-capita normalisation
6. **Beneficiary matrix** — Heatmap of sectors × beneficiary groups so users can find charities serving specific communities
7. **Anomaly insights** — Auto-detected high-admin ratios, high gov-dependency, sole-purpose charities, deficit-running charities
8. **Glossary + About modal** — Explain "PBI", "HPC", DGR, Charity Size bands, AIS

## Target Audience (detailed)
A 35-year-old urban professional opening this on a phone after a charity worker stops them in the street, OR a retiree comparing three options for a year-end gift on a desktop. Both want quick, trustworthy, calm answers — they should feel like they're looking at the ACNC's own site but with better explanations and faster comparison. They're not data analysts. They might not know what "DGR" or "PBI" means.

## Style Direction
**Tone:** civic, trustworthy, calm — like a public-service portal that respects the user's intelligence without overwhelming them
**Colour palette:** Light theme with deep navy (#0f2a4a), warm teal accent (#0d7a7a), soft warm white background (#fbfaf7), olive-gold highlight (#a37b3b) for key insights. Earth-and-civic — not corporate blue, not hospital clinical. Inspired by ACNC's own visual language but warmer.
**UI density:** Balanced — table views are dense like an admin tool, but the detail panel and leaderboards are spacious like a news site. Cards have generous padding.
**Dark/light theme:** Light. Donors expect trustworthy, calm, daytime.
**Reference sites for tone:** charitynavigator.org (US), acnc.gov.au, theyworkforyou.com — calm civic data.

## Technical Architecture
- **Stack:** Vanilla TypeScript + Vite
- **Data strategy:** pipeline — GitHub Actions downloads CSVs monthly, aggregates, commits JSON to `public/data/`
- **Key libraries:** Leaflet (state map), no chart libs (hand-roll SVG bars, Sankey, network, matrix)

## Layout
Fixed top header (52px) with brand, search input, "?" about button. Main area is a tab strip + content panel. Sticky footer with attribution. Mobile: tabs scroll horizontally, search expands to full width.

## Pages/Views
Single-page app with tabs:
1. **Overview** — landing dashboard with stats, top sectors, top states, anomaly summary
2. **Search** — table of all charities with filters (state, size, sector, beneficiary)
3. **Leaderboards** — ranked tables (largest by revenue, most donations, most reach, highest admin ratio, highest gov dependency)
4. **Money Flow** — Sankey-style flow: aggregate income sources → aggregate expense categories
5. **Sectors** — sector breakdown bar chart + sector × beneficiary heatmap matrix
6. **Map** — Leaflet state map with per-capita charity density and donation density
7. **Insights** — auto-detected anomalies as severity-coloured cards
8. **About** — about modal accessed from header

Detail panel slides in from right when a charity is clicked anywhere.

## Visualization Strategy
1. **Sortable table** (Search tab) — fundamental data view, every charity searchable
2. **Horizontal bar charts** (Leaderboards) — top-N by various metrics
3. **Sankey flow** (Money Flow) — where the sector's aggregate money comes from and where it goes; reveals e.g. how much is direct gov funding vs donations
4. **Matrix heatmap** (Sectors) — sectors × beneficiary groups, shows which causes serve which communities
5. **Leaflet state map** (Map) — per-capita view; reveals e.g. NT and TAS may have higher charities-per-capita
6. **Network graph (sector → beneficiary)** — alternative to matrix for visual exploration
7. **Severity insight cards** (Insights) — actionable surface of statistical outliers
8. **Per-charity drill-down panel** — financial bar, revenue-source pie, expense-bar, sector pills, key warnings
