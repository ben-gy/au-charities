// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { DataStore } from '../data';
import { formatMoney, formatNumber } from '../utils/format';
import { gloss } from '../glossaryTooltip';

export function renderOverview(store: DataStore): string {
  const agg = store.aggregate;
  const ins = store.insights.slice(0, 6);
  const stateRows = Object.entries(agg.byState)
    .filter(([k]) => k !== 'OTHER')
    .sort((a, b) => b[1].count - a[1].count);
  const maxStateCount = Math.max(...stateRows.map(([, v]) => v.count));

  const purposeRows = Object.entries(agg.byPurpose).sort((a, b) => b[1].count - a[1].count);
  const maxPurpose = Math.max(...purposeRows.map(([, v]) => v.count));
  const purposeLabels = store.meta.purposeLabels;

  return `
    <div class="section-heading">
      <div>
        <h2>The Australian charity sector at a glance</h2>
        <p>Every figure comes from the ACNC ${gloss('acnc')} Register and the 2023 Annual Information Statement ${gloss('ais')}.</p>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-tile">
        <div class="label">Registered charities</div>
        <div class="value">${formatNumber(agg.totalCharities)}</div>
        <div class="hint">${formatNumber(agg.withAis)} filed a 2023 AIS</div>
      </div>
      <div class="stat-tile">
        <div class="label">Sector revenue (2023)</div>
        <div class="value">${formatMoney(agg.totalRevenue)}</div>
        <div class="hint">All income from all sources</div>
      </div>
      <div class="stat-tile">
        <div class="label">Donations & bequests</div>
        <div class="value">${formatMoney(agg.totalDonations)}</div>
        <div class="hint">${((agg.totalDonations / Math.max(1, agg.totalRevenue)) * 100).toFixed(0)}% of total revenue</div>
      </div>
      <div class="stat-tile">
        <div class="label">Government revenue</div>
        <div class="value">${formatMoney(agg.totalGovRevenue)}</div>
        <div class="hint">${((agg.totalGovRevenue / Math.max(1, agg.totalRevenue)) * 100).toFixed(0)}% of total revenue</div>
      </div>
      <div class="stat-tile">
        <div class="label">Paid staff (FTE)</div>
        <div class="value">${formatNumber(agg.totalFte)}</div>
        <div class="hint">Full-time equivalent</div>
      </div>
      <div class="stat-tile">
        <div class="label">Volunteer relationships</div>
        <div class="value">${formatNumber(agg.totalVolunteers)}</div>
        <div class="hint">Self-reported, may double-count</div>
      </div>
    </div>

    <div class="card-grid">
      <div class="card">
        <h3 class="card-title">Charities by state</h3>
        <p class="card-subtitle">Where the head office is registered. Many charities operate across multiple states.</p>
        <div class="hbar-list">
          ${stateRows
            .map(
              ([code, v]) => `
            <div class="hbar-row" data-jump-state="${code}" data-tip="${code}: ${formatNumber(v.count)} charities (${((v.count / agg.totalCharities) * 100).toFixed(1)}% of all) — click to filter search">
              <div class="lbl">${code}</div>
              <div class="bar"><div class="fill" style="width:${(v.count / maxStateCount) * 100}%"></div></div>
              <div class="val">${formatNumber(v.count)}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Most common purposes</h3>
        <p class="card-subtitle">Charities can list more than one purpose ${gloss('purpose')}, so totals don't sum to 100%.</p>
        <div class="hbar-list">
          ${purposeRows
            .slice(0, 10)
            .map(
              ([key, v]) => `
            <div class="hbar-row" data-tip="${purposeLabels[key] || key}: ${formatNumber(v.count)} charities (${((v.count / agg.totalCharities) * 100).toFixed(1)}% of all)">
              <div class="lbl">${purposeLabels[key] || key}</div>
              <div class="bar"><div class="fill" style="width:${(v.count / maxPurpose) * 100}%"></div></div>
              <div class="val">${formatNumber(v.count)}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>

    <div class="section-heading" style="margin-top:var(--space-2xl)">
      <div>
        <h2>Headline findings</h2>
        <p>Auto-generated from the 2023 dataset. See the Insights tab for the full list.</p>
      </div>
    </div>

    <div class="insight-grid">
      ${ins
        .map(
          (i) => `
        <div class="insight-card severity-${i.severity}">
          ${i.metric ? `<div class="metric">${i.metric}</div>` : ''}
          <h3>${i.title}</h3>
          <p>${i.body}</p>
          ${i.link ? `<a class="link" href="#charity=${i.link.slug}" data-charity="${i.link.slug}">View ${i.link.name} →</a>` : ''}
        </div>
      `,
        )
        .join('')}
    </div>
  `;
}
