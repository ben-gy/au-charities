import { describe, expect, it } from 'vitest';
import { bitsToArray, hasBit, bitsToStates } from '../src/utils/bits';

describe('bitsToArray', () => {
  it('returns empty for 0', () => {
    expect(bitsToArray(0)).toEqual([]);
  });
  it('decodes bit 0', () => {
    expect(bitsToArray(1)).toEqual([0]);
  });
  it('decodes bits 0 and 2', () => {
    expect(bitsToArray(0b101)).toEqual([0, 2]);
  });
  it('decodes a wide range', () => {
    expect(bitsToArray(0b11111111)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('hasBit', () => {
  it('detects set bits', () => {
    expect(hasBit(0b101, 0)).toBe(true);
    expect(hasBit(0b101, 2)).toBe(true);
  });
  it('detects unset bits', () => {
    expect(hasBit(0b101, 1)).toBe(false);
    expect(hasBit(0, 7)).toBe(false);
  });
});

describe('bitsToStates', () => {
  it('returns nothing for 0', () => {
    expect(bitsToStates(0)).toEqual([]);
  });
  it('returns ACT for bit 0', () => {
    expect(bitsToStates(1)).toEqual(['ACT']);
  });
  it('returns all 8 for full mask', () => {
    expect(bitsToStates(0xff)).toEqual(['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']);
  });
});
