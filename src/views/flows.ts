import type { DataStore } from '../data';
import { formatMoney } from '../utils/format';
import { gloss } from '../glossaryTooltip';

interface Node {
  key: string;
  label: string;
  value: number;
  side: 'left' | 'right';
  color: string;
}

interface Link {
  from: string;
  to: string;
  value: number;
}

export function renderFlows(store: DataStore): string {
  const f = store.flows;
  const totalIn = f.sources.donations + f.sources.government + f.sources.services + f.sources.investments + f.sources.other;
  const totalOut = f.uses.employees + f.uses.grantsAU + f.uses.grantsOS + f.uses.otherExpenses;

  const sources: Node[] = [
    { key: 'donations', label: 'Donations & bequests', value: f.sources.donations, side: 'left', color: '#0d7a7a' },
    { key: 'government', label: 'Government revenue', value: f.sources.government, side: 'left', color: '#0f2a4a' },
    { key: 'services', label: 'Goods & services', value: f.sources.services, side: 'left', color: '#a37b3b' },
    { key: 'investments', label: 'Investments', value: f.sources.investments, side: 'left', color: '#5b3173' },
    { key: 'other', label: 'Other revenue', value: f.sources.other, side: 'left', color: '#7c8190' },
  ];
  const uses: Node[] = [
    { key: 'employees', label: 'Employee expenses', value: f.uses.employees, side: 'right', color: '#0d7a7a' },
    { key: 'grantsAU', label: 'Grants made (AU)', value: f.uses.grantsAU, side: 'right', color: '#0f2a4a' },
    { key: 'grantsOS', label: 'Grants made (overseas)', value: f.uses.grantsOS, side: 'right', color: '#a37b3b' },
    { key: 'otherExpenses', label: 'Other expenses', value: f.uses.otherExpenses, side: 'right', color: '#7c8190' },
  ];

  const sourceTotal = sources.reduce((s, n) => s + n.value, 0);
  const useTotal = uses.reduce((s, n) => s + n.value, 0);

  const links: Link[] = [];
  for (const s of sources) {
    for (const u of uses) {
      links.push({ from: s.key, to: u.key, value: (s.value / sourceTotal) * (u.value / useTotal) * useTotal });
    }
  }

  const svg = buildSankeySvg(sources, uses, links);

  return `
    <div class="section-heading">
      <div>
        <h2>Where the money comes from, where it goes</h2>
        <p>Aggregate flows across all 2023 AIS filers. Income sources on the left, expense uses on the right. Hover a flow to see the value.</p>
      </div>
    </div>

    <div class="flow-wrap">
      <div class="stat-row" style="margin-bottom:var(--space-lg)">
        <div class="stat-tile"><div class="label">Total revenue ${gloss('total_revenue')}</div><div class="value">${formatMoney(totalIn)}</div></div>
        <div class="stat-tile"><div class="label">Total expenses</div><div class="value">${formatMoney(totalOut)}</div></div>
        <div class="stat-tile"><div class="label">Sector net surplus</div><div class="value">${formatMoney(totalIn - totalOut)}</div></div>
      </div>
      ${svg}
    </div>

    <div class="card-grid" style="margin-top:var(--space-xl)">
      <div class="card">
        <h3 class="card-title">Revenue sources</h3>
        <p class="card-subtitle">Where the sector's money actually came from in 2023.</p>
        <div class="hbar-list">
          ${sources
            .sort((a, b) => b.value - a.value)
            .map(
              (s) => `
            <div class="hbar-row">
              <div class="lbl">${s.label}</div>
              <div class="bar"><div class="fill" style="width:${(s.value / sourceTotal) * 100}%;background:${s.color}"></div></div>
              <div class="val">${formatMoney(s.value)}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Expense uses</h3>
        <p class="card-subtitle">Where the money went. Staff costs dwarf grants made.</p>
        <div class="hbar-list">
          ${uses
            .sort((a, b) => b.value - a.value)
            .map(
              (u) => `
            <div class="hbar-row">
              <div class="lbl">${u.label}</div>
              <div class="bar"><div class="fill" style="width:${(u.value / useTotal) * 100}%;background:${u.color}"></div></div>
              <div class="val">${formatMoney(u.value)}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function buildSankeySvg(sources: Node[], uses: Node[], links: Link[]): string {
  const W = 880;
  const H = 460;
  const NODE_W = 18;
  const PAD = 60;
  const colX_L = 60;
  const colX_R = W - 60 - NODE_W;

  const sTotal = sources.reduce((s, n) => s + n.value, 0);
  const uTotal = uses.reduce((s, n) => s + n.value, 0);

  const usableH = H - PAD * 2;

  const sPositions: Record<string, { y: number; h: number; color: string; label: string }> = {};
  let sy = PAD;
  for (const s of sources) {
    const h = (s.value / sTotal) * usableH;
    sPositions[s.key] = { y: sy, h, color: s.color, label: s.label };
    sy += h + 6;
  }

  const uPositions: Record<string, { y: number; h: number; color: string; label: string }> = {};
  let uy = PAD;
  for (const u of uses) {
    const h = (u.value / uTotal) * usableH;
    uPositions[u.key] = { y: uy, h, color: u.color, label: u.label };
    uy += h + 6;
  }

  // For each source, accumulate offsets as links flow out; same for each use.
  const sFlowOff: Record<string, number> = {};
  const uFlowOff: Record<string, number> = {};
  for (const s of sources) sFlowOff[s.key] = 0;
  for (const u of uses) uFlowOff[u.key] = 0;

  const linkPaths = links
    .filter((l) => l.value > 0)
    .map((l) => {
      const src = sPositions[l.from];
      const dst = uPositions[l.to];
      const linkH_s = (l.value / sTotal) * usableH;
      const linkH_u = (l.value / uTotal) * usableH;
      const y0 = src.y + sFlowOff[l.from];
      const y1 = dst.y + uFlowOff[l.to];
      sFlowOff[l.from] += linkH_s;
      uFlowOff[l.to] += linkH_u;

      const x0 = colX_L + NODE_W;
      const x1 = colX_R;
      const mid = (x0 + x1) / 2;
      const path = `
        M ${x0} ${y0}
        C ${mid} ${y0}, ${mid} ${y1}, ${x1} ${y1}
        L ${x1} ${y1 + linkH_u}
        C ${mid} ${y1 + linkH_u}, ${mid} ${y0 + linkH_s}, ${x0} ${y0 + linkH_s}
        Z`;
      return `<path d="${path}" fill="${src.color}" opacity="0.22" data-link="${l.from}-${l.to}" data-value="${l.value}">
        <title>${formatLink(l, src.label, dst.label)}</title>
      </path>`;
    })
    .join('');

  const sNodes = sources
    .map((s) => {
      const p = sPositions[s.key];
      return `
      <rect x="${colX_L}" y="${p.y}" width="${NODE_W}" height="${p.h}" fill="${p.color}" rx="2"/>
      <text x="${colX_L - 10}" y="${p.y + p.h / 2}" text-anchor="end" dominant-baseline="middle" fill="#1a1f2e" font-size="12" font-family="-apple-system,Inter,sans-serif">
        <tspan font-weight="600">${p.label}</tspan>
        <tspan x="${colX_L - 10}" dy="14" fill="#4a5160" font-family="SF Mono,monospace">${formatMoney(s.value)}</tspan>
      </text>`;
    })
    .join('');

  const uNodes = uses
    .map((u) => {
      const p = uPositions[u.key];
      return `
      <rect x="${colX_R}" y="${p.y}" width="${NODE_W}" height="${p.h}" fill="${p.color}" rx="2"/>
      <text x="${colX_R + NODE_W + 10}" y="${p.y + p.h / 2}" dominant-baseline="middle" fill="#1a1f2e" font-size="12" font-family="-apple-system,Inter,sans-serif">
        <tspan font-weight="600">${p.label}</tspan>
        <tspan x="${colX_R + NODE_W + 10}" dy="14" fill="#4a5160" font-family="SF Mono,monospace">${formatMoney(u.value)}</tspan>
      </text>`;
    })
    .join('');

  return `<svg class="flow-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sankey flow of revenue sources to expense categories">
    ${linkPaths}
    ${sNodes}
    ${uNodes}
  </svg>`;
}

function formatLink(l: Link, srcLabel: string, dstLabel: string): string {
  return `${srcLabel} → ${dstLabel}: ${formatMoney(l.value)}`;
}
