# Charity Watch (AU) — Build Review

This file exists only to create a reviewable PR. All code is already deployed on `main`.

**Merge this PR to acknowledge the build.** Closing without merging is also fine.

## Links

- **GitHub Pages:** https://ben-gy.github.io/au-charities/ *(redirects to custom domain once DNS is set)*
- **Custom domain:** https://au-charities.benrichardson.dev *(live after DNS + cert)*

## What it is

A faster, friendlier interface to the ACNC register — look up any of Australia's 65,000+ registered charities before donating. Search by name, ABN, suburb, or postcode; see where each charity's money comes from and goes; compare across 13 leaderboards; browse the sector × beneficiary matrix; and read auto-generated insights.

- **Data:** ACNC Register + 2023 Annual Information Statement (data.gov.au), joined on ABN — 65,231 charities, 50,539 with full 2023 financials. Per-capita figures from ABS ERP June 2024.
- **Stack:** Vanilla TypeScript + Vite 6 + Vitest + Leaflet. 49 tests, ~60 KB gzipped JS.
- **Pipeline:** monthly GitHub Actions cron refreshes the data.

## DNS setup

Already configured in Cloudflare (`benrichardson.dev` zone):

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `au-charities` | `ben-gy.github.io` | DNS only (grey cloud) |
