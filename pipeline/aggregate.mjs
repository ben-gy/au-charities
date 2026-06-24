// Join ACNC main register + 2023 AIS financials, write compact JSONs to public/data/.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './csv.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CACHE = join(ROOT, 'cache');
const OUT = join(ROOT, '..', 'public', 'data');
await mkdir(OUT, { recursive: true });

const PURPOSES = [
  ['animals', 'Preventing_or_relieving_suffering_of_animals'],
  ['culture', 'Advancing_Culture'],
  ['education', 'Advancing_Education'],
  ['health', 'Advancing_Health'],
  ['policy', 'Promote_or_oppose_a_change_to_law__government_poll_or_prac'],
  ['environment', 'Advancing_natual_environment'],
  ['human_rights', 'Promoting_or_protecting_human_rights'],
  ['general_public', 'Purposes_beneficial_to_ther_general_public_and_other_analogous'],
  ['reconciliation', 'Promoting_reconciliation__mutual_respect_and_tolerance'],
  ['religion', 'Advancing_Religion'],
  ['social_welfare', 'Advancing_social_or_public_welfare'],
  ['security', 'Advancing_security_or_safety_of_Australia_or_Australian_public'],
];

const BENEFICIARIES = [
  ['aboriginal_tsi', 'Aboriginal_or_TSI'],
  ['adults', 'Adults'],
  ['aged_persons', 'Aged_Persons'],
  ['children', 'Children'],
  ['overseas_communities', 'Communities_Overseas'],
  ['early_childhood', 'Early_Childhood'],
  ['ethnic_groups', 'Ethnic_Groups'],
  ['families', 'Families'],
  ['females', 'Females'],
  ['financially_disadvantaged', 'Financially_Disadvantaged'],
  ['lgbtiqa', 'LGBTIQA+'],
  ['general_community', 'General_Community_in_Australia'],
  ['males', 'Males'],
  ['migrants_refugees', 'Migrants_Refugees_or_Asylum_Seekers'],
  ['other_beneficiaries', 'Other_Beneficiaries'],
  ['other_charities', 'Other_Charities'],
  ['homelessness_risk', 'People_at_risk_of_homelessness'],
  ['chronic_illness', 'People_with_Chronic_Illness'],
  ['disabilities', 'People_with_Disabilities'],
  ['pre_post_offenders', 'Pre_Post_Release_Offenders'],
  ['rural_regional', 'Rural_Regional_Remote_Communities'],
  ['unemployed', 'Unemployed_Person'],
  ['veterans', 'Veterans_or_their_families'],
  ['victims_crime', 'Victims_of_crime'],
  ['victims_disasters', 'Victims_of_Disasters'],
  ['youth', 'Youth'],
  ['animals_b', 'animals'],
  ['environment_b', 'environment'],
];

const OPERATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

const STATE_POP = {
  NSW: 8479200,
  VIC: 7012400,
  QLD: 5648900,
  WA: 3041700,
  SA: 1888100,
  TAS: 575700,
  ACT: 481400,
  NT: 257300,
};

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function num(v) {
  if (!v) return 0;
  const n = Number(String(v).replace(/[,\s$]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function isY(v) {
  if (!v) return false;
  const s = String(v).trim().toUpperCase();
  return s === 'Y' || s === 'YES' || s === 'TRUE' || s === '1';
}

function sizeToCode(s) {
  if (!s) return 'U';
  const t = s.trim().toUpperCase();
  if (t.startsWith('S')) return 'S';
  if (t.startsWith('M')) return 'M';
  if (t.startsWith('L')) return 'L';
  return 'U';
}

function parseYear(d) {
  if (!d) return null;
  const m = String(d).match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}

console.log('aggregate: reading main.csv');
const mainText = await readFile(join(CACHE, 'main.csv'), 'utf8');
const mainRows = parseCsv(mainText);
console.log(`  ${mainRows.length} main rows`);

console.log('aggregate: reading ais23.csv');
const aisText = await readFile(join(CACHE, 'ais23.csv'), 'utf8');
const aisRows = parseCsv(aisText);
console.log(`  ${aisRows.length} ais rows`);

// Index AIS by ABN
const aisByAbn = new Map();
for (const r of aisRows) {
  const abn = (r['abn'] || '').toString().trim();
  if (!abn) continue;
  aisByAbn.set(abn, r);
}

console.log('aggregate: joining and projecting');
const charities = [];

for (const r of mainRows) {
  const abn = (r['ABN'] || '').trim();
  if (!abn) continue;
  const name = (r['Charity_Legal_Name'] || '').trim();
  if (!name) continue;

  const purposes = [];
  for (let i = 0; i < PURPOSES.length; i++) {
    if (isY(r[PURPOSES[i][1]])) purposes.push(i);
  }
  const beneficiaries = [];
  for (let i = 0; i < BENEFICIARIES.length; i++) {
    if (isY(r[BENEFICIARIES[i][1]])) beneficiaries.push(i);
  }
  const operates = [];
  for (const code of OPERATES) {
    if (isY(r[`Operates_in_${code}`])) operates.push(code);
  }

  const ais = aisByAbn.get(abn);
  const totalRevenue = ais ? num(ais['total revenue']) : 0;
  const totalGrossIncome = ais ? num(ais['total gross income']) : 0;
  const totalExpenses = ais ? num(ais['total expenses']) : 0;
  const donations = ais ? num(ais['donations and bequests']) : 0;
  const govRevenue = ais ? num(ais['revenue from government']) : 0;
  const serviceRevenue = ais ? num(ais['revenue from goods and services']) : 0;
  const investmentRevenue = ais ? num(ais['revenue from investments']) : 0;
  const otherRevenue = ais ? num(ais['all other revenue']) : 0;
  const employeeExpenses = ais ? num(ais['employee expenses']) : 0;
  const grantsAU = ais ? num(ais['grants and donations made for use in Australia']) : 0;
  const grantsOS = ais ? num(ais['grants and donations made for use outside Australia']) : 0;
  const otherExpenses = ais ? num(ais['all other expenses']) : 0;
  const netSurplus = ais ? num(ais['net surplus/deficit']) : 0;
  const totalAssets = ais ? num(ais['total assets']) : 0;
  const totalLiabilities = ais ? num(ais['total liabilities']) : 0;
  const fte = ais ? num(ais['total full time equivalent staff']) : 0;
  const volunteers = ais ? num(ais['staff - volunteers']) : 0;

  const grantsMade = grantsAU + grantsOS;
  const incomeForRatio = totalGrossIncome || totalRevenue;
  const adminRatio = incomeForRatio > 0 ? employeeExpenses / incomeForRatio : null;
  const govDependency = incomeForRatio > 0 ? govRevenue / incomeForRatio : null;
  const donationsShare = incomeForRatio > 0 ? donations / incomeForRatio : null;
  const grantsShare = totalExpenses > 0 ? grantsMade / totalExpenses : null;

  charities.push({
    abn,
    name,
    slug: slugify(name) + '-' + abn.slice(-6),
    city: (r['Town_City'] || '').trim(),
    state: (r['State'] || '').trim(),
    postcode: (r['Postcode'] || '').trim(),
    country: (r['Country'] || '').trim(),
    website: (r['Charity_Website'] || '').trim(),
    size: sizeToCode(r['Charity_Size']),
    pbi: isY(r['PBI']) ? 1 : 0,
    hpc: isY(r['HPC']) ? 1 : 0,
    regYear: parseYear(r['Registration_Date']),
    estYear: parseYear(r['Date_Organisation_Established']),
    purposes,
    beneficiaries,
    operates,
    countries: (r['Operating_Countries'] || '').trim().split(/[,;]/).filter(Boolean).slice(0, 6),
    hasAis: ais ? 1 : 0,
    totalRevenue,
    totalGrossIncome,
    totalExpenses,
    donations,
    govRevenue,
    serviceRevenue,
    investmentRevenue,
    otherRevenue,
    employeeExpenses,
    grantsAU,
    grantsOS,
    otherExpenses,
    netSurplus,
    totalAssets,
    totalLiabilities,
    fte,
    volunteers,
    adminRatio,
    govDependency,
    donationsShare,
    grantsShare,
  });
}

console.log(`  ${charities.length} merged records`);

// ── aggregate.json ─────────────────────────────────────────────────────────
const agg = {
  generatedAt: new Date().toISOString(),
  totalCharities: charities.length,
  withAis: charities.filter((c) => c.hasAis).length,
  totalRevenue: 0,
  totalDonations: 0,
  totalGovRevenue: 0,
  totalExpenses: 0,
  totalEmployeeExpenses: 0,
  totalGrantsMade: 0,
  totalVolunteers: 0,
  totalFte: 0,
  byState: {},
  bySize: { S: 0, M: 0, L: 0, U: 0 },
  byPurpose: {},
  byBeneficiary: {},
  registrationsByYear: {},
};

for (const code of OPERATES) {
  agg.byState[code] = { count: 0, revenue: 0, donations: 0, perCapita: 0 };
}
agg.byState['OTHER'] = { count: 0, revenue: 0, donations: 0, perCapita: 0 };

for (const [key] of PURPOSES) agg.byPurpose[key] = { count: 0, revenue: 0, donations: 0 };
for (const [key] of BENEFICIARIES) agg.byBeneficiary[key] = { count: 0, revenue: 0, donations: 0 };

for (const c of charities) {
  agg.totalRevenue += c.totalRevenue;
  agg.totalDonations += c.donations;
  agg.totalGovRevenue += c.govRevenue;
  agg.totalExpenses += c.totalExpenses;
  agg.totalEmployeeExpenses += c.employeeExpenses;
  agg.totalGrantsMade += c.grantsAU + c.grantsOS;
  agg.totalVolunteers += c.volunteers;
  agg.totalFte += c.fte;
  agg.bySize[c.size] = (agg.bySize[c.size] || 0) + 1;

  const st = OPERATES.includes(c.state) ? c.state : 'OTHER';
  agg.byState[st].count += 1;
  agg.byState[st].revenue += c.totalRevenue;
  agg.byState[st].donations += c.donations;

  for (const pi of c.purposes) {
    const key = PURPOSES[pi][0];
    agg.byPurpose[key].count += 1;
    agg.byPurpose[key].revenue += c.totalRevenue;
    agg.byPurpose[key].donations += c.donations;
  }
  for (const bi of c.beneficiaries) {
    const key = BENEFICIARIES[bi][0];
    agg.byBeneficiary[key].count += 1;
    agg.byBeneficiary[key].revenue += c.totalRevenue;
    agg.byBeneficiary[key].donations += c.donations;
  }
  if (c.regYear) {
    agg.registrationsByYear[c.regYear] = (agg.registrationsByYear[c.regYear] || 0) + 1;
  }
}

for (const code of OPERATES) {
  const pop = STATE_POP[code];
  if (pop) agg.byState[code].perCapita = (agg.byState[code].count / pop) * 100000;
}

// ── leaderboards.json ──────────────────────────────────────────────────────
function topBy(field, n, filter) {
  const pool = filter ? charities.filter(filter) : charities;
  return pool
    .filter((c) => c[field] !== null && c[field] !== undefined && c[field] > 0)
    .sort((a, b) => b[field] - a[field])
    .slice(0, n)
    .map((c) => ({
      abn: c.abn,
      name: c.name,
      slug: c.slug,
      state: c.state,
      value: c[field],
      revenue: c.totalRevenue,
      size: c.size,
    }));
}

function topRatio(field, n, minIncome = 1000000) {
  return charities
    .filter((c) => c.hasAis && c.totalGrossIncome >= minIncome && c[field] !== null)
    .sort((a, b) => b[field] - a[field])
    .slice(0, n)
    .map((c) => ({
      abn: c.abn,
      name: c.name,
      slug: c.slug,
      state: c.state,
      value: c[field],
      revenue: c.totalRevenue,
      size: c.size,
    }));
}

const leaderboards = {
  byRevenue: topBy('totalRevenue', 100),
  byDonations: topBy('donations', 100),
  byGovRevenue: topBy('govRevenue', 100),
  byGrantsMade: topBy('grantsAU', 100),
  byEmployeeExpenses: topBy('employeeExpenses', 100),
  byAssets: topBy('totalAssets', 100),
  byVolunteers: topBy('volunteers', 100),
  byFte: topBy('fte', 100),
  byReach: charities
    .map((c) => ({ ...c, reach: c.operates.length }))
    .filter((c) => c.reach >= 8)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 100)
    .map((c) => ({
      abn: c.abn,
      name: c.name,
      slug: c.slug,
      state: c.state,
      value: c.reach,
      revenue: c.totalRevenue,
      size: c.size,
    })),
  highestAdminRatio: topRatio('adminRatio', 60, 2000000),
  highestGovDependency: topRatio('govDependency', 60, 1000000),
  highestDonationsShare: topRatio('donationsShare', 60, 500000),
  lowestNetSurplus: charities
    .filter((c) => c.hasAis && c.totalGrossIncome >= 2000000 && c.netSurplus < 0)
    .sort((a, b) => a.netSurplus - b.netSurplus)
    .slice(0, 60)
    .map((c) => ({
      abn: c.abn,
      name: c.name,
      slug: c.slug,
      state: c.state,
      value: c.netSurplus,
      revenue: c.totalRevenue,
      size: c.size,
    })),
};

// ── sectors.json (purpose × beneficiary matrix) ────────────────────────────
const matrix = {};
for (const [pkey] of PURPOSES) matrix[pkey] = {};
for (const c of charities) {
  for (const pi of c.purposes) {
    const pkey = PURPOSES[pi][0];
    for (const bi of c.beneficiaries) {
      const bkey = BENEFICIARIES[bi][0];
      matrix[pkey][bkey] = (matrix[pkey][bkey] || 0) + 1;
    }
  }
}

const sectors = {
  purposes: PURPOSES.map(([k]) => k),
  beneficiaries: BENEFICIARIES.map(([k]) => k),
  matrix,
};

// ── flows.json (Sankey: income source → expense use) ───────────────────────
const flows = {
  sources: {
    donations: agg.totalDonations,
    government: agg.totalGovRevenue,
    services: charities.reduce((s, c) => s + c.serviceRevenue, 0),
    investments: charities.reduce((s, c) => s + c.investmentRevenue, 0),
    other: charities.reduce((s, c) => s + c.otherRevenue, 0),
  },
  uses: {
    employees: agg.totalEmployeeExpenses,
    grantsAU: charities.reduce((s, c) => s + c.grantsAU, 0),
    grantsOS: charities.reduce((s, c) => s + c.grantsOS, 0),
    otherExpenses: charities.reduce((s, c) => s + c.otherExpenses, 0),
  },
};

// ── insights.json (anomaly cards) ──────────────────────────────────────────
const insights = [];

// 1. State with highest charities per capita
{
  let topState = null;
  let topRate = 0;
  for (const code of OPERATES) {
    if (agg.byState[code].perCapita > topRate) {
      topRate = agg.byState[code].perCapita;
      topState = code;
    }
  }
  if (topState) {
    insights.push({
      severity: 'info',
      title: `${topState} has the most charities per capita`,
      body: `${topRate.toFixed(1)} registered charities per 100,000 residents — well above the national average. Often driven by smaller community and religious groups.`,
      metric: topRate.toFixed(1),
    });
  }
}

// 2. Largest charity by revenue
{
  const top = leaderboards.byRevenue[0];
  if (top) {
    insights.push({
      severity: 'info',
      title: `${top.name} is the largest charity by revenue`,
      body: `Reported $${(top.value / 1_000_000).toFixed(0)} million in total revenue (2023 AIS). Headquartered in ${top.state || 'AU'}.`,
      metric: `$${(top.value / 1_000_000).toFixed(0)}M`,
      link: { slug: top.slug, name: top.name },
    });
  }
}

// 3. How much comes from government
{
  const govPct = agg.totalRevenue > 0 ? (agg.totalGovRevenue / agg.totalRevenue) * 100 : 0;
  insights.push({
    severity: 'info',
    title: `Government provides ${govPct.toFixed(0)}% of all charity revenue`,
    body: `In 2023, registered charities reported $${(agg.totalGovRevenue / 1_000_000_000).toFixed(1)} billion in government revenue out of $${(agg.totalRevenue / 1_000_000_000).toFixed(1)} billion total — a single dominant funding source for the sector.`,
    metric: `${govPct.toFixed(0)}%`,
  });
}

// 4. How much comes from donations
{
  const donPct = agg.totalRevenue > 0 ? (agg.totalDonations / agg.totalRevenue) * 100 : 0;
  insights.push({
    severity: 'info',
    title: `Donations and bequests are only ${donPct.toFixed(0)}% of revenue`,
    body: `Charities reported $${(agg.totalDonations / 1_000_000_000).toFixed(1)} billion in donations and bequests against $${(agg.totalRevenue / 1_000_000_000).toFixed(1)} billion total revenue. Services and government dwarf public giving.`,
    metric: `${donPct.toFixed(0)}%`,
  });
}

// 5. Charities running at a loss
{
  const losing = charities.filter((c) => c.hasAis && c.netSurplus < 0).length;
  const haveAis = agg.withAis;
  const pct = haveAis > 0 ? (losing / haveAis) * 100 : 0;
  insights.push({
    severity: pct > 30 ? 'warn' : 'info',
    title: `${pct.toFixed(0)}% of charities ran a deficit in 2023`,
    body: `${losing.toLocaleString('en-AU')} registered charities that filed a 2023 Annual Information Statement reported expenses exceeding revenue. A single year's deficit isn't unusual, but persistent deficits can signal financial stress.`,
    metric: `${pct.toFixed(0)}%`,
  });
}

// 6. High admin ratio outliers
{
  const sorted = leaderboards.highestAdminRatio;
  if (sorted.length) {
    const top = sorted[0];
    insights.push({
      severity: 'warn',
      title: `Highest reported employee-expense ratio: ${(top.value * 100).toFixed(0)}%`,
      body: `${top.name} reported employee expenses equal to ${(top.value * 100).toFixed(0)}% of gross income. High ratios can be normal for service-delivery charities (hospitals, universities) but worth investigating for advocacy or grant-makers.`,
      metric: `${(top.value * 100).toFixed(0)}%`,
      link: { slug: top.slug, name: top.name },
    });
  }
}

// 7. Government-dependent
{
  const high = leaderboards.highestGovDependency.filter((c) => c.value > 0.9).length;
  insights.push({
    severity: 'warn',
    title: `${high} large charities depend on government for 90%+ of revenue`,
    body: `Among charities reporting over $1M in income, ${high} get more than 90% of their funding from government contracts and grants. Effectively service-delivery arms of the state.`,
    metric: `${high}`,
  });
}

// 8. Sector concentration
{
  let topPurp = null;
  let topCount = 0;
  for (const [key, v] of Object.entries(agg.byPurpose)) {
    if (v.count > topCount) {
      topCount = v.count;
      topPurp = key;
    }
  }
  if (topPurp) {
    const pct = (topCount / charities.length) * 100;
    insights.push({
      severity: 'info',
      title: `The largest sector by count is "${topPurp.replace(/_/g, ' ')}"`,
      body: `${topCount.toLocaleString('en-AU')} charities (${pct.toFixed(0)}% of all registered) advance this purpose. Charities can have multiple purposes — totals across sectors do not sum to 100%.`,
      metric: `${topCount.toLocaleString('en-AU')}`,
    });
  }
}

// 9. Volunteer army
{
  insights.push({
    severity: 'info',
    title: `${(agg.totalVolunteers / 1_000_000).toFixed(1)} million Australians volunteer for registered charities`,
    body: `Across the 2023 AIS reports, charities account for ${agg.totalVolunteers.toLocaleString('en-AU')} volunteer relationships and ${Math.round(agg.totalFte).toLocaleString('en-AU')} full-time-equivalent paid staff. Volunteers outnumber paid FTE roughly ${agg.totalFte > 0 ? (agg.totalVolunteers / agg.totalFte).toFixed(0) : '∞'}-to-1.`,
    metric: `${(agg.totalVolunteers / 1_000_000).toFixed(1)}M`,
  });
}

// 10. Religion vs welfare
{
  const rel = agg.byPurpose.religion;
  const welf = agg.byPurpose.social_welfare;
  if (rel && welf) {
    insights.push({
      severity: 'info',
      title: `Social welfare charities outnumber religious by ${(welf.count / Math.max(1, rel.count)).toFixed(1)}x`,
      body: `${welf.count.toLocaleString('en-AU')} charities list "advancing social or public welfare" as a purpose, vs ${rel.count.toLocaleString('en-AU')} for "advancing religion" — though many religious organisations also list welfare as a secondary purpose.`,
      metric: `${(welf.count / Math.max(1, rel.count)).toFixed(1)}x`,
    });
  }
}

// ── charities.json (tabular search index, no financials) ───────────────────
// Tabular form so we don't repeat field names 65,000 times.
// Order: abn, name, slug, city, state, postcode, size, regYear, hasAis,
//        revenue (k), purposes-bits, beneficiaries-bits, operates-bits, pbi, hpc
const purposeBits = (arr) => arr.reduce((m, i) => m | (1 << i), 0);
const beneBits = (arr) => arr.reduce((m, i) => m | (1 << i), 0);
const opBits = (arr) => arr.reduce((m, code) => m | (1 << OPERATES.indexOf(code)), 0);

const charityIndex = {
  headers: ['a', 'n', 's', 'c', 'st', 'pc', 'sz', 'ry', 'ais', 'rk', 'p', 'b', 'op', 'pbi', 'hpc'],
  rows: charities.map((c) => [
    c.abn,
    c.name,
    c.slug,
    c.city,
    c.state,
    c.postcode,
    c.size,
    c.regYear || 0,
    c.hasAis,
    Math.round(c.totalRevenue / 1000), // revenue in thousands
    purposeBits(c.purposes),
    beneBits(c.beneficiaries),
    opBits(c.operates),
    c.pbi,
    c.hpc,
  ]),
};

// ── financials.json (ABN-keyed full financials for drill-down) ─────────────
// Only charities that filed a 2023 AIS get an entry.
const financials = {};
for (const c of charities) {
  if (!c.hasAis) continue;
  financials[c.abn] = {
    rev: Math.round(c.totalRevenue),
    inc: Math.round(c.totalGrossIncome),
    exp: Math.round(c.totalExpenses),
    don: Math.round(c.donations),
    gov: Math.round(c.govRevenue),
    svc: Math.round(c.serviceRevenue),
    inv: Math.round(c.investmentRevenue),
    oth: Math.round(c.otherRevenue),
    emp: Math.round(c.employeeExpenses),
    gAU: Math.round(c.grantsAU),
    gOS: Math.round(c.grantsOS),
    oex: Math.round(c.otherExpenses),
    surp: Math.round(c.netSurplus),
    ast: Math.round(c.totalAssets),
    lia: Math.round(c.totalLiabilities),
    fte: Math.round(c.fte),
    vol: Math.round(c.volunteers),
    web: c.website,
  };
}

// Write outputs
async function writeJson(name, obj) {
  const path = join(OUT, name);
  await writeFile(path, JSON.stringify(obj));
  const size = JSON.stringify(obj).length;
  console.log(`  wrote ${name} ${(size / 1024).toFixed(0)}KB`);
}

console.log('aggregate: writing outputs');
await writeJson('aggregate.json', agg);
await writeJson('leaderboards.json', leaderboards);
await writeJson('sectors.json', sectors);
await writeJson('flows.json', flows);
await writeJson('insights.json', insights);
await writeJson('charities.json', charityIndex);
await writeJson('financials.json', financials);
await writeJson('meta.json', {
  generatedAt: new Date().toISOString(),
  totalCharities: charities.length,
  withAis: agg.withAis,
  purposeLabels: PURPOSES.reduce(
    (a, [k, full]) => ({ ...a, [k]: humanize(full) }),
    {},
  ),
  beneficiaryLabels: BENEFICIARIES.reduce(
    (a, [k, full]) => ({ ...a, [k]: humanize(full) }),
    {},
  ),
  statePops: STATE_POP,
});

function humanize(s) {
  return s
    .replace(/_/g, ' ')
    .replace(/\bof\b/gi, 'of')
    .replace(/\bor\b/gi, 'or')
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\bAdvancing natual environment\b/, 'Advancing natural environment')
    .replace(/\bPurposes beneficial to ther general public and other analogous\b/, 'General public benefit')
    .replace(/\bPromote or oppose a change to law government poll or prac\b/, 'Public policy advocacy')
    .replace(/\bAdvancing security or safety of Australia or Australian public\b/, 'Advancing national security/safety')
    .replace(/\bPromoting reconciliation mutual respect and tolerance\b/, 'Reconciliation, tolerance')
    .replace(/\bPreventing or relieving suffering of animals\b/, 'Animal welfare')
    .replace(/\bAboriginal or TSI\b/, 'Aboriginal & Torres Strait Islander')
    .replace(/\bMigrants Refugees or Asylum Seekers\b/, 'Migrants, refugees & asylum seekers')
    .replace(/\bRural Regional Remote Communities\b/, 'Rural, regional & remote')
    .replace(/\bPeople at risk of homelessness\b/, 'At risk of homelessness')
    .replace(/\bPeople with Chronic Illness\b/, 'People with chronic illness')
    .replace(/\bPeople with Disabilities\b/, 'People with disabilities')
    .replace(/\bPre Post Release Offenders\b/, 'Pre/post-release offenders')
    .replace(/\bGeneral Community in Australia\b/, 'General community')
    .replace(/\bVeterans or their families\b/, 'Veterans & families')
    .replace(/\bVictims of crime\b/, 'Victims of crime')
    .replace(/\bVictims of Disasters\b/, 'Disaster victims')
    .replace(/\bFinancially Disadvantaged\b/, 'Financially disadvantaged')
    .replace(/\bOther Beneficiaries\b/, 'Other beneficiaries')
    .replace(/\bOther Charities\b/, 'Other charities')
    .replace(/\bEthnic Groups\b/, 'Ethnic groups')
    .replace(/\bEarly Childhood\b/, 'Early childhood')
    .replace(/\bCommunities Overseas\b/, 'Overseas communities')
    .replace(/\bAged Persons\b/, 'Aged persons')
    .replace(/\bUnemployed Person\b/, 'Unemployed')
    .replace(/\banimals$/, 'Animals (beneficiary)')
    .replace(/\benvironment$/, 'Environment (beneficiary)');
}

console.log('aggregate: done');
