import type {
  AggregateData,
  CharityIndex,
  CharityRecord,
  Financials,
  FlowsData,
  Insight,
  LeaderboardsData,
  MetaData,
  SectorsData,
  SizeCode,
} from './types';
import { bitsToArray, bitsToStates } from './utils/bits';

const BASE = './data';

export interface DataStore {
  meta: MetaData;
  aggregate: AggregateData;
  leaderboards: LeaderboardsData;
  sectors: SectorsData;
  flows: FlowsData;
  insights: Insight[];
  charities?: CharityRecord[];
  financials?: Record<string, Financials>;
  byAbn?: Map<string, CharityRecord>;
}

export async function loadCore(): Promise<DataStore> {
  const [meta, aggregate, leaderboards, sectors, flows, insights] = await Promise.all([
    fetchJson<MetaData>(`${BASE}/meta.json`),
    fetchJson<AggregateData>(`${BASE}/aggregate.json`),
    fetchJson<LeaderboardsData>(`${BASE}/leaderboards.json`),
    fetchJson<SectorsData>(`${BASE}/sectors.json`),
    fetchJson<FlowsData>(`${BASE}/flows.json`),
    fetchJson<Insight[]>(`${BASE}/insights.json`),
  ]);
  return { meta, aggregate, leaderboards, sectors, flows, insights };
}

export async function loadCharities(): Promise<{ records: CharityRecord[]; byAbn: Map<string, CharityRecord> }> {
  const idx = await fetchJson<CharityIndex>(`${BASE}/charities.json`);
  const headers = idx.headers;
  const colIdx: Record<string, number> = {};
  headers.forEach((h, i) => (colIdx[h] = i));
  const records: CharityRecord[] = idx.rows.map((row) => ({
    abn: row[colIdx.a] as string,
    name: row[colIdx.n] as string,
    slug: row[colIdx.s] as string,
    city: row[colIdx.c] as string,
    state: row[colIdx.st] as string,
    postcode: row[colIdx.pc] as string,
    size: row[colIdx.sz] as SizeCode,
    regYear: row[colIdx.ry] as number,
    hasAis: row[colIdx.ais] as 0 | 1,
    revenueK: row[colIdx.rk] as number,
    purposes: bitsToArray(row[colIdx.p] as number),
    beneficiaries: bitsToArray(row[colIdx.b] as number),
    operates: bitsToStates(row[colIdx.op] as number),
    pbi: row[colIdx.pbi] as 0 | 1,
    hpc: row[colIdx.hpc] as 0 | 1,
  }));
  const byAbn = new Map<string, CharityRecord>();
  for (const r of records) byAbn.set(r.abn, r);
  return { records, byAbn };
}

export async function loadFinancials(): Promise<Record<string, Financials>> {
  return fetchJson<Record<string, Financials>>(`${BASE}/financials.json`);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return (await res.json()) as T;
}
