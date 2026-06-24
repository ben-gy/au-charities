import { describe, expect, it } from 'vitest';
import { formatNumber, formatMoney, formatPercent, formatAbn, sizeName, sizeShort } from '../src/utils/format';

describe('formatNumber', () => {
  it('formats thousands with commas (en-AU)', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
  it('handles negatives', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
  });
  it('rounds to integer by default', () => {
    expect(formatNumber(1234.7)).toBe('1,235');
  });
  it('respects decimals option', () => {
    expect(formatNumber(1234.567, 2)).toBe('1,234.57');
  });
  it('returns em dash for NaN', () => {
    expect(formatNumber(NaN)).toBe('—');
  });
});

describe('formatMoney', () => {
  it('formats billions', () => {
    expect(formatMoney(1_500_000_000)).toBe('$1.5B');
  });
  it('formats millions', () => {
    expect(formatMoney(2_400_000)).toBe('$2.4M');
  });
  it('formats thousands as K', () => {
    expect(formatMoney(12_000)).toBe('$12K');
  });
  it('returns em dash for zero', () => {
    expect(formatMoney(0)).toBe('—');
  });
  it('formats negative as -$X', () => {
    expect(formatMoney(-1_500_000)).toBe('-$1.5M');
  });
});

describe('formatPercent', () => {
  it('multiplies by 100 and adds %', () => {
    expect(formatPercent(0.42)).toBe('42%');
  });
  it('handles decimals', () => {
    expect(formatPercent(0.1234, 1)).toBe('12.3%');
  });
  it('returns em dash for NaN', () => {
    expect(formatPercent(NaN)).toBe('—');
  });
});

describe('formatAbn', () => {
  it('formats 11-digit ABN with spaces', () => {
    expect(formatAbn('12345678901')).toBe('12 345 678 901');
  });
  it('passes through invalid ABNs', () => {
    expect(formatAbn('123')).toBe('123');
  });
});

describe('size labels', () => {
  it('maps codes to long names', () => {
    expect(sizeName('S')).toContain('Small');
    expect(sizeName('M')).toContain('Medium');
    expect(sizeName('L')).toContain('Large');
    expect(sizeName('U')).toBe('Unknown');
  });
  it('maps codes to short names', () => {
    expect(sizeShort('S')).toBe('Small');
    expect(sizeShort('L')).toBe('Large');
    expect(sizeShort('U')).toBe('Unknown');
  });
});
