import type { CharityRecord } from '../types';
import type { DataStore } from '../data';
import { formatMoney, formatMoneyExact, formatNumber, sizeShort } from '../utils/format';
import { applyFilters, type FilterState } from '../utils/search';

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const SIZES = [
  { code: 'S', name: 'Small (< $500k)' },
  { code: 'M', name: 'Medium ($500k–$3M)' },
  { code: 'L', name: 'Large ($3M+)' },
];

export interface SearchState {
  filter: FilterState;
  sortKey: 'name' | 'state' | 'size' | 'revenue';
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function defaultSearchState(): SearchState {
  return {
    filter: { q: '', state: '', size: '', purpose: -1, beneficiary: -1, hasAis: false, pbi: false },
    sortKey: 'revenue',
    sortDir: 'desc',
    page: 0,
    pageSize: 80,
  };
}

export function renderSearch(store: DataStore, state: SearchState): string {
  const purposeOpts = store.sectors.purposes
    .map((k, i) => `<option value="${i}">${store.meta.purposeLabels[k] || k}</option>`)
    .join('');
  const beneOpts = store.sectors.beneficiaries
    .map((k, i) => `<option value="${i}">${store.meta.beneficiaryLabels[k] || k}</option>`)
    .join('');

  return `
    <div class="section-heading">
      <div>
        <h2>Search all ${formatNumber(store.aggregate.totalCharities)} registered charities</h2>
        <p>Search by name, ABN, suburb, or postcode. Click any row for the full breakdown.</p>
      </div>
    </div>

    <div class="filter-bar" id="search-filters">
      <input type="text" id="f-q" placeholder="Charity name, ABN, suburb, postcode…" value="${escapeHtml(state.filter.q)}" />
      <select id="f-state">
        <option value="">All states</option>
        ${STATES.map((s) => `<option value="${s}" ${s === state.filter.state ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <select id="f-size">
        <option value="">Any size</option>
        ${SIZES.map((s) => `<option value="${s.code}" ${s.code === state.filter.size ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
      <select id="f-purpose">
        <option value="-1">Any purpose</option>
        ${purposeOpts}
      </select>
      <select id="f-beneficiary">
        <option value="-1">Any beneficiary</option>
        ${beneOpts}
      </select>
      <label><input type="checkbox" id="f-ais" ${state.filter.hasAis ? 'checked' : ''} /> Filed 2023 AIS</label>
      <label><input type="checkbox" id="f-pbi" ${state.filter.pbi ? 'checked' : ''} /> PBI only</label>
      <button id="f-clear" class="btn-ghost" style="height:34px">Clear</button>
      <span class="count" id="search-count">…</span>
    </div>

    <div class="scroll-area">
      <table class="data-table">
        <thead>
          <tr>
            <th class="sortable" data-sort="name">Charity</th>
            <th class="sortable" data-sort="state">State</th>
            <th class="sortable" data-sort="size">Size</th>
            <th class="sortable num" data-sort="revenue">Revenue (2023)</th>
            <th>Purposes</th>
          </tr>
        </thead>
        <tbody id="search-tbody">
          <tr><td colspan="5" class="loading">Loading 65,000+ charities…</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

export function renderSearchRows(records: CharityRecord[], store: DataStore, state: SearchState): string {
  const filtered = applyFilters(records, state.filter);
  const sorted = sortRecords(filtered, state.sortKey, state.sortDir);
  const start = state.page * state.pageSize;
  const slice = sorted.slice(start, start + state.pageSize);

  const countEl = document.getElementById('search-count');
  if (countEl) countEl.textContent = `${formatNumber(filtered.length)} match${filtered.length === 1 ? '' : 'es'}`;

  if (slice.length === 0) {
    return `<tr><td colspan="5" class="empty">No charities match these filters. Try clearing some.</td></tr>`;
  }

  const labels = store.meta.purposeLabels;
  return slice
    .map((c) => {
      const purposes = c.purposes
        .slice(0, 3)
        .map((pi) => `<span class="pill">${labels[store.sectors.purposes[pi]] || ''}</span>`)
        .join(' ');
      const more = c.purposes.length > 3 ? `<span class="pill">+${c.purposes.length - 3}</span>` : '';
      return `
        <tr data-charity="${c.slug}" data-abn="${c.abn}">
          <td class="name-cell">${escapeHtml(c.name)}<span class="city">${escapeHtml(c.city || '')}${c.postcode ? ' · ' + c.postcode : ''}</span></td>
          <td><span class="pill state">${c.state || '—'}</span></td>
          <td><span class="pill size-${c.size}">${sizeShort(c.size)}</span></td>
          <td class="num" ${c.hasAis ? `data-tip="2023 total revenue: ${formatMoneyExact(c.revenueK * 1000)} (rounded to nearest $1k)"` : 'data-tip="No 2023 Annual Information Statement lodged — no financials available"'}>${c.hasAis ? formatMoney(c.revenueK * 1000) : '<span style="color:var(--text-muted)">no AIS</span>'}</td>
          <td>${purposes} ${more}</td>
        </tr>
      `;
    })
    .join('');
}

function sortRecords(records: CharityRecord[], key: SearchState['sortKey'], dir: 'asc' | 'desc'): CharityRecord[] {
  const m = dir === 'asc' ? 1 : -1;
  return [...records].sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name) * m;
    if (key === 'state') return a.state.localeCompare(b.state) * m;
    if (key === 'size') {
      const order = { L: 3, M: 2, S: 1, U: 0 };
      return ((order[a.size] || 0) - (order[b.size] || 0)) * m;
    }
    if (key === 'revenue') return (a.revenueK - b.revenueK) * m;
    return 0;
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
