import type { DataStore } from '../data';
import { formatMoney, formatMoneyExact, formatNumber } from '../utils/format';
import { gloss } from '../glossaryTooltip';

export function renderSectors(store: DataStore): string {
  const purposes = store.sectors.purposes;
  const beneficiaries = store.sectors.beneficiaries;
  const matrix = store.sectors.matrix;
  const pLabels = store.meta.purposeLabels;
  const bLabels = store.meta.beneficiaryLabels;

  // Compute max for colour scale
  let maxCell = 1;
  for (const p of purposes) {
    for (const b of beneficiaries) {
      const v = matrix[p]?.[b] || 0;
      if (v > maxCell) maxCell = v;
    }
  }

  const matrixHtml = `
    <table class="matrix" role="grid" aria-label="Charities by purpose and beneficiary">
      <thead>
        <tr>
          <th class="row"></th>
          ${beneficiaries.map((b) => `<th class="col">${bLabels[b] || b}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${purposes
          .map(
            (p) => `
          <tr>
            <th class="row">${pLabels[p] || p}</th>
            ${beneficiaries
              .map((b) => {
                const v = matrix[p]?.[b] || 0;
                const intensity = Math.sqrt(v / maxCell);
                const bg = intensity > 0 ? `rgba(13, 122, 122, ${0.05 + intensity * 0.85})` : 'var(--bg-surface)';
                const color = intensity > 0.5 ? 'white' : 'var(--text-primary)';
                const tip = `${pLabels[p] || p} × ${bLabels[b] || b}: ${formatNumber(v)} charities`;
                return `<td class="cell" style="background:${bg};color:${color}" data-tip="${tip}" aria-label="${tip}">${v > 0 ? formatNumber(v) : ''}</td>`;
              })
              .join('')}
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  `;

  // Donations/revenue by purpose
  const byPurp = Object.entries(store.aggregate.byPurpose).sort((a, b) => b[1].revenue - a[1].revenue);
  const maxRev = Math.max(...byPurp.map(([, v]) => v.revenue));
  const maxDon = Math.max(...byPurp.map(([, v]) => v.donations));

  const byBene = Object.entries(store.aggregate.byBeneficiary).sort((a, b) => b[1].count - a[1].count);
  const maxBeneCount = Math.max(...byBene.map(([, v]) => v.count));

  return `
    <div class="section-heading">
      <div>
        <h2>Sectors and who they serve</h2>
        <p>Every charity declares one or more purposes ${gloss('purpose')} and one or more beneficiary groups ${gloss('beneficiary')}. The matrix below shows the overlap — find a sector + beneficiary combination to see how many charities work there.</p>
      </div>
    </div>

    <div class="matrix-wrap">
      <p style="margin-bottom:var(--space-md);color:var(--text-tertiary);font-size:var(--font-size-sm)">Each cell = number of registered charities listing both that purpose and that beneficiary group. Darker = more charities. Hover a cell for the exact number.</p>
      ${matrixHtml}
    </div>

    <div class="card-grid" style="margin-top:var(--space-xl)">
      <div class="card">
        <h3 class="card-title">Sector revenue (2023)</h3>
        <p class="card-subtitle">Where the money actually sits. Some sectors (education, health) are dominated by a few giant charities.</p>
        <div class="hbar-list">
          ${byPurp
            .map(
              ([key, v]) => `
            <div class="hbar-row" data-tip="${pLabels[key] || key}: ${formatMoneyExact(v.revenue)} total 2023 revenue across ${formatNumber(v.count)} charities">
              <div class="lbl">${pLabels[key] || key}</div>
              <div class="bar"><div class="fill" style="width:${(v.revenue / maxRev) * 100}%"></div></div>
              <div class="val">${formatMoney(v.revenue)}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Sector donations (2023)</h3>
        <p class="card-subtitle">Where the voluntary donor dollar actually goes — a very different shape from revenue.</p>
        <div class="hbar-list">
          ${byPurp
            .filter(([, v]) => v.donations > 0)
            .sort((a, b) => b[1].donations - a[1].donations)
            .map(
              ([key, v]) => `
            <div class="hbar-row" data-tip="${pLabels[key] || key}: ${formatMoneyExact(v.donations)} donations &amp; bequests in 2023">
              <div class="lbl">${pLabels[key] || key}</div>
              <div class="bar"><div class="fill" style="width:${(v.donations / maxDon) * 100}%;background:var(--accent-gold)"></div></div>
              <div class="val">${formatMoney(v.donations)}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Beneficiary groups by charity count</h3>
        <p class="card-subtitle">Which Australians are most served by registered charities. "General community" tops the list because it's the catch-all.</p>
        <div class="hbar-list">
          ${byBene
            .slice(0, 16)
            .map(
              ([key, v]) => `
            <div class="hbar-row" data-tip="${bLabels[key] || key}: ${formatNumber(v.count)} charities list this beneficiary group">
              <div class="lbl">${bLabels[key] || key}</div>
              <div class="bar"><div class="fill" style="width:${(v.count / maxBeneCount) * 100}%;background:var(--accent-secondary)"></div></div>
              <div class="val">${formatNumber(v.count)}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}
