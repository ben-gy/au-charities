import type { DataStore } from '../data';
import type { LeaderboardRow } from '../types';
import { formatMoney, formatNumber, formatPercent, sizeShort } from '../utils/format';
import { gloss } from '../glossaryTooltip';

interface LBSpec {
  key: keyof DataStore['leaderboards'];
  title: string;
  subtitle: string;
  format: (v: number) => string;
  gloss?: string;
}

const SPECS: LBSpec[] = [
  { key: 'byRevenue', title: 'Largest by total revenue', subtitle: 'All income combined — donations + government + services + investments.', format: formatMoney, gloss: 'total_revenue' },
  { key: 'byDonations', title: 'Largest by donations & bequests', subtitle: 'Voluntary giving only — closest to "biggest charity by public support".', format: formatMoney, gloss: 'donations_bequests' },
  { key: 'byGovRevenue', title: 'Largest by government revenue', subtitle: 'Direct gov funding — grants, contracts, NDIS, school/hospital funding.', format: formatMoney, gloss: 'government_revenue' },
  { key: 'byGrantsMade', title: 'Largest by grants made (AU)', subtitle: 'Money handed to other organisations in Australia — foundations and grant-makers rise here.', format: formatMoney, gloss: 'grants_made' },
  { key: 'byEmployeeExpenses', title: 'Largest by employee expenses', subtitle: 'Total salaries + super + payroll tax. Service-delivery charities dominate.', format: formatMoney, gloss: 'employee_expenses' },
  { key: 'byAssets', title: 'Largest by total assets', subtitle: 'Buildings, investments, cash — the balance sheet, not the income statement.', format: formatMoney },
  { key: 'byVolunteers', title: 'Most volunteers', subtitle: 'Self-reported volunteer count (not hours).', format: (v) => formatNumber(v), gloss: 'volunteers' },
  { key: 'byFte', title: 'Most paid staff (FTE)', subtitle: 'Full-time-equivalent paid staff.', format: (v) => formatNumber(v), gloss: 'fte' },
  { key: 'byReach', title: 'Operates in all 8 states/territories', subtitle: 'Truly national charities — ACT, NSW, NT, QLD, SA, TAS, VIC and WA. Ordered by revenue.', format: (v) => `${v} of 8`, gloss: 'reach' },
  { key: 'highestAdminRatio', title: 'Highest employee-expense ratio', subtitle: 'Among charities with $2M+ income. High is normal for hospitals/schools, suspicious for grant-makers.', format: (v) => formatPercent(v), gloss: 'admin_ratio' },
  { key: 'highestGovDependency', title: 'Most government-dependent', subtitle: 'Among charities with $1M+ income. >100% can occur when other revenue runs negative.', format: (v) => formatPercent(v), gloss: 'gov_dependency' },
  { key: 'highestDonationsShare', title: 'Most donation-funded', subtitle: 'Among charities with $500k+ income — these survive on the public\'s goodwill.', format: (v) => formatPercent(v) },
  { key: 'lowestNetSurplus', title: 'Largest 2023 deficit', subtitle: 'Among charities with $2M+ income — one bad year isn\'t alarming, persistent deficits warrant a look.', format: formatMoney, gloss: 'net_surplus' },
];

export function renderLeaderboards(store: DataStore): string {
  return `
    <div class="section-heading">
      <div>
        <h2>Leaderboards</h2>
        <p>Click any charity for the full breakdown. All financial figures from 2023 AIS lodgements.</p>
      </div>
    </div>

    <div class="lb-groups">
      ${SPECS.map((spec) => renderLb(spec, store.leaderboards[spec.key])).join('')}
    </div>
  `;
}

function renderLb(spec: LBSpec, rows: LeaderboardRow[]): string {
  const top = rows.slice(0, 10);
  if (!top.length) return '';
  return `
    <div class="card lb-section">
      <h3>${spec.title}${spec.gloss ? gloss(spec.gloss) : ''}</h3>
      <div class="sub">${spec.subtitle}</div>
      <table class="data-table" style="font-size:var(--font-size-sm)">
        <tbody>
          ${top
            .map(
              (r, i) => `
            <tr data-charity="${r.slug}" data-abn="${r.abn}">
              <td style="width:24px;color:var(--text-tertiary);font-family:var(--font-mono)">${i + 1}</td>
              <td class="name-cell">${escapeHtml(r.name)}<span class="city">${r.state || '—'} · <span class="pill size-${r.size}">${sizeShort(r.size)}</span></span></td>
              <td class="num">${spec.format(r.value)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function gloss_(_: string) { return ''; } // placeholder
void gloss_;
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
