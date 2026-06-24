import { describe, expect, it } from 'vitest';
import { tokenize, matchesQuery, applyFilters } from '../src/utils/search';
import type { CharityRecord } from '../src/types';

const sample: CharityRecord[] = [
  {
    abn: '12345678901', name: 'Salvation Army Australia', slug: 'salvation-army-australia-678901',
    city: 'Sydney', state: 'NSW', postcode: '2000', size: 'L', regYear: 2013, hasAis: 1,
    revenueK: 800000, purposes: [10], beneficiaries: [9, 16], operates: ['NSW', 'VIC'], pbi: 1, hpc: 0,
  },
  {
    abn: '98765432109', name: 'Royal Children\'s Hospital Foundation', slug: 'royal-childrens-432109',
    city: 'Melbourne', state: 'VIC', postcode: '3052', size: 'L', regYear: 2014, hasAis: 1,
    revenueK: 120000, purposes: [3], beneficiaries: [3], operates: ['VIC'], pbi: 0, hpc: 1,
  },
  {
    abn: '11111111111', name: 'Small Local Op Shop', slug: 'small-local-111111',
    city: 'Hobart', state: 'TAS', postcode: '7000', size: 'S', regYear: 2018, hasAis: 0,
    revenueK: 0, purposes: [10], beneficiaries: [11], operates: ['TAS'], pbi: 0, hpc: 0,
  },
];

describe('tokenize', () => {
  it('splits on whitespace and lowercases', () => {
    expect(tokenize('Hello World')).toEqual(['hello', 'world']);
  });
  it('strips punctuation', () => {
    expect(tokenize("Royal Children's Hospital")).toEqual(['royal', 'children', 's', 'hospital']);
  });
  it('returns empty for empty', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('matchesQuery', () => {
  it('matches all tokens', () => {
    expect(matchesQuery(sample[0], ['salvation', 'sydney'])).toBe(true);
  });
  it('requires every token', () => {
    expect(matchesQuery(sample[0], ['salvation', 'melbourne'])).toBe(false);
  });
  it('matches ABN substring', () => {
    expect(matchesQuery(sample[0], ['1234'])).toBe(true);
  });
  it('matches postcode', () => {
    expect(matchesQuery(sample[1], ['3052'])).toBe(true);
  });
  it('matches empty query', () => {
    expect(matchesQuery(sample[0], [])).toBe(true);
  });
});

describe('applyFilters', () => {
  it('filters by state', () => {
    const r = applyFilters(sample, { q: '', state: 'VIC', size: '', purpose: -1, beneficiary: -1, hasAis: false, pbi: false });
    expect(r).toHaveLength(1);
    expect(r[0].state).toBe('VIC');
  });
  it('filters by size', () => {
    const r = applyFilters(sample, { q: '', state: '', size: 'S', purpose: -1, beneficiary: -1, hasAis: false, pbi: false });
    expect(r).toHaveLength(1);
    expect(r[0].size).toBe('S');
  });
  it('filters by hasAis', () => {
    const r = applyFilters(sample, { q: '', state: '', size: '', purpose: -1, beneficiary: -1, hasAis: true, pbi: false });
    expect(r).toHaveLength(2);
  });
  it('filters by PBI', () => {
    const r = applyFilters(sample, { q: '', state: '', size: '', purpose: -1, beneficiary: -1, hasAis: false, pbi: true });
    expect(r).toHaveLength(1);
    expect(r[0].pbi).toBe(1);
  });
  it('filters by purpose index', () => {
    const r = applyFilters(sample, { q: '', state: '', size: '', purpose: 10, beneficiary: -1, hasAis: false, pbi: false });
    expect(r).toHaveLength(2);
  });
  it('combines filters with AND', () => {
    const r = applyFilters(sample, { q: 'army', state: 'NSW', size: '', purpose: -1, beneficiary: -1, hasAis: false, pbi: false });
    expect(r).toHaveLength(1);
  });
  it('returns empty when no match', () => {
    const r = applyFilters(sample, { q: 'nonsense', state: '', size: '', purpose: -1, beneficiary: -1, hasAis: false, pbi: false });
    expect(r).toHaveLength(0);
  });
});
