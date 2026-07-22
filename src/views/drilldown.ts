// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { CharityRecord, Financials } from '../types';
import type { DataStore } from '../data';
import { formatAbn, formatMoney, formatMoneyExact, formatNumber, formatPercent, sizeName } from '../utils/format';
import { gloss } from '../glossaryTooltip';

export function renderDrilldown(c: CharityRecord, store: DataStore, fin: Financials | undefined): string {
  const purposeLabels = store.meta.purposeLabels;
  const beneficiaryLabels = store.meta.beneficiaryLabels;
  const purposes = c.purposes.map((i) => purposeLabels[store.sectors.purposes[i]] || '').filter(Boolean);
  const beneficiaries = c.beneficiaries.map((i) => beneficiaryLabels[store.sectors.beneficiaries[i]] || '').filter(Boolean);

  let financialsHtml = `<p style="color:var(--text-tertiary);font-style:italic">This charity has not lodged a 2023 Annual Information Statement, so financial figures aren't available here. The charity is still on the ACNC register.</p>`;

  if (fin) {
    const income = fin.inc || fin.rev || 1;
    const sources = [
      { key: 'don', label: 'Donations & bequests', value: fin.don, color: '#0d7a7a' },
      { key: 'gov', label: 'Government', value: fin.gov, color: '#0f2a4a' },
      { key: 'svc', label: 'Goods & services', value: fin.svc, color: '#a37b3b' },
      { key: 'inv', label: 'Investments', value: fin.inv, color: '#5b3173' },
      { key: 'oth', label: 'Other revenue', value: fin.oth, color: '#7c8190' },
    ].filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
    const uses = [
      { key: 'emp', label: 'Employee expenses', value: fin.emp, color: '#0d7a7a' },
      { key: 'gAU', label: 'Grants made (AU)', value: fin.gAU, color: '#0f2a4a' },
      { key: 'gOS', label: 'Grants made (overseas)', value: fin.gOS, color: '#a37b3b' },
      { key: 'oex', label: 'Other expenses', value: fin.oex, color: '#7c8190' },
    ].filter((u) => u.value > 0).sort((a, b) => b.value - a.value);

    const sTotal = sources.reduce((s, n) => s + n.value, 0) || 1;
    const uTotal = uses.reduce((s, n) => s + n.value, 0) || 1;

    const adminRatio = fin.emp / income;
    const govDep = fin.gov / income;
    const surplusRatio = fin.surp / income;

    const warnings: string[] = [];
    if (adminRatio > 0.8) warnings.push(`Employee expenses are ${formatPercent(adminRatio)} of income — high, though normal for service-delivery charities.`);
    if (govDep > 0.85) warnings.push(`${formatPercent(govDep)} of income is from government — effectively a government-funded service.`);
    if (fin.surp < 0 && Math.abs(fin.surp) > income * 0.1) warnings.push(`Ran a deficit of ${formatMoney(fin.surp)} (>10% of income) in 2023.`);

    financialsHtml = `
      <div class="stat-row">
        <div class="stat-tile">
          <div class="label">Total revenue ${gloss('total_revenue')}</div>
          <div class="value">${formatMoney(fin.rev)}</div>
        </div>
        <div class="stat-tile">
          <div class="label">Total expenses</div>
          <div class="value">${formatMoney(fin.exp)}</div>
        </div>
        <div class="stat-tile">
          <div class="label">Net surplus ${gloss('net_surplus')}</div>
          <div class="value" style="color:${fin.surp < 0 ? 'var(--status-bad)' : 'var(--status-good)'}">${formatMoney(fin.surp)}</div>
        </div>
        <div class="stat-tile">
          <div class="label">Total assets</div>
          <div class="value">${formatMoney(fin.ast)}</div>
        </div>
        <div class="stat-tile">
          <div class="label">FTE staff ${gloss('fte')}</div>
          <div class="value">${formatNumber(fin.fte)}</div>
        </div>
        <div class="stat-tile">
          <div class="label">Volunteers ${gloss('volunteers')}</div>
          <div class="value">${formatNumber(fin.vol)}</div>
        </div>
      </div>

      ${warnings.length ? `
        <div class="insight-card severity-warn" style="margin-bottom:var(--space-lg)">
          <h3>Things to note</h3>
          ${warnings.map((w) => `<p style="margin-top:6px">• ${w}</p>`).join('')}
        </div>` : ''}

      <div class="drill-section">
        <h3>Where the money came from</h3>
        <div class="hbar-list">
          ${sources.map((s) => `
            <div class="hbar-row" data-tip="${s.label}: ${formatMoneyExact(s.value)} (${formatPercent(s.value / sTotal, 1)} of income)">
              <div class="lbl">${s.label}</div>
              <div class="bar"><div class="fill" style="width:${(s.value / sTotal) * 100}%;background:${s.color}"></div></div>
              <div class="val">${formatMoney(s.value)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="drill-section">
        <h3>Where the money went</h3>
        <div class="hbar-list">
          ${uses.map((u) => `
            <div class="hbar-row" data-tip="${u.label}: ${formatMoneyExact(u.value)} (${formatPercent(u.value / uTotal, 1)} of expenses)">
              <div class="lbl">${u.label}</div>
              <div class="bar"><div class="fill" style="width:${(u.value / uTotal) * 100}%;background:${u.color}"></div></div>
              <div class="val">${formatMoney(u.value)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="drill-section">
        <h3>Key ratios</h3>
        <div class="stat-row">
          <div class="stat-tile">
            <div class="label">Employee-expense ratio ${gloss('admin_ratio')}</div>
            <div class="value">${formatPercent(adminRatio)}</div>
            <div class="hint">Of total gross income</div>
          </div>
          <div class="stat-tile">
            <div class="label">Government dependency ${gloss('gov_dependency')}</div>
            <div class="value">${formatPercent(govDep)}</div>
          </div>
          <div class="stat-tile">
            <div class="label">Surplus/(deficit) ratio</div>
            <div class="value" style="color:${surplusRatio < 0 ? 'var(--status-bad)' : 'var(--status-good)'}">${formatPercent(surplusRatio)}</div>
          </div>
        </div>
      </div>
    `;
  }

  const website = fin?.web || '';

  return `
    <div class="drill-header">
      <button class="drill-close" data-close-drill aria-label="Close charity detail">✕</button>
      <h2>${escapeHtml(c.name)}</h2>
      <div class="meta">ABN ${formatAbn(c.abn)} · ${c.city || 'Australia'}${c.postcode ? ' ' + c.postcode : ''}, ${c.state || '—'}</div>
    </div>
    <div class="drill-body">
      <div class="drill-section">
        <h3>About</h3>
        <div class="drill-pills" style="margin-bottom:var(--space-md)">
          <span class="pill state">${c.state || '—'}</span>
          <span class="pill size-${c.size}">${sizeName(c.size)}</span>
          ${c.pbi ? `<span class="pill pbi">PBI ${gloss('pbi')}</span>` : ''}
          ${c.hpc ? `<span class="pill hpc">HPC ${gloss('hpc')}</span>` : ''}
          ${c.regYear ? `<span class="pill">Registered ${c.regYear}</span>` : ''}
          ${c.operates.length ? `<span class="pill">Operates in ${c.operates.join(', ')}</span>` : ''}
        </div>
        ${website ? `<p><a href="${escapeHtml(addProtocol(website))}" target="_blank" rel="noopener noreferrer">${escapeHtml(website)} ↗</a></p>` : ''}
      </div>

      <div class="drill-section">
        <h3>Purposes</h3>
        <div class="drill-pills">
          ${purposes.length ? purposes.map((p) => `<span class="pill">${p}</span>`).join('') : '<span style="color:var(--text-tertiary);font-style:italic">No purposes recorded.</span>'}
        </div>
      </div>

      <div class="drill-section">
        <h3>Beneficiaries</h3>
        <div class="drill-pills">
          ${beneficiaries.length ? beneficiaries.map((b) => `<span class="pill">${b}</span>`).join('') : '<span style="color:var(--text-tertiary);font-style:italic">No beneficiary groups recorded.</span>'}
        </div>
      </div>

      <div class="drill-section">
        <h3>2023 financials ${gloss('ais')}</h3>
        ${financialsHtml}
      </div>

      <div class="drill-section">
        <h3>Verify on the ACNC register</h3>
        <p style="color:var(--text-secondary)">All figures here come from the ACNC's open data extract. The authoritative current record is on the ACNC website.</p>
        <p style="margin-top:var(--space-sm)"><a href="https://www.acnc.gov.au/charity/charities/${searchSlug(c.name)}" target="_blank" rel="noopener noreferrer">Search ACNC for ${escapeHtml(c.name)} ↗</a></p>
      </div>
    </div>
  `;
}

function addProtocol(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function searchSlug(name: string): string {
  return encodeURIComponent(name);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
