import type { CharityRecord } from '../types';

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function matchesQuery(c: CharityRecord, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const hay = `${c.name} ${c.city} ${c.postcode} ${c.abn} ${c.state}`.toLowerCase();
  for (const t of tokens) {
    if (!hay.includes(t)) return false;
  }
  return true;
}

export interface FilterState {
  q: string;
  state: string;
  size: string;
  purpose: number; // index in PURPOSES, -1 = all
  beneficiary: number; // index in BENEFICIARIES, -1 = all
  hasAis: boolean;
  pbi: boolean;
}

export function applyFilters(records: CharityRecord[], f: FilterState): CharityRecord[] {
  const tokens = tokenize(f.q);
  return records.filter((c) => {
    if (!matchesQuery(c, tokens)) return false;
    if (f.state && c.state !== f.state) return false;
    if (f.size && c.size !== f.size) return false;
    if (f.purpose >= 0 && !c.purposes.includes(f.purpose)) return false;
    if (f.beneficiary >= 0 && !c.beneficiaries.includes(f.beneficiary)) return false;
    if (f.hasAis && !c.hasAis) return false;
    if (f.pbi && !c.pbi) return false;
    return true;
  });
}
