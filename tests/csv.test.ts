import { describe, expect, it } from 'vitest';
import { parseCsv } from '../pipeline/csv.mjs';

describe('parseCsv', () => {
  it('parses a simple CSV', () => {
    const out = parseCsv('a,b,c\n1,2,3\n4,5,6\n');
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ a: '1', b: '2', c: '3' });
  });

  it('handles quoted fields with commas', () => {
    const out = parseCsv('a,b\n"Smith, John","Sydney"\n');
    expect(out[0]).toEqual({ a: 'Smith, John', b: 'Sydney' });
  });

  it('handles escaped double-quotes inside quoted fields', () => {
    const out = parseCsv('a\n"She said ""hi"""\n');
    expect(out[0].a).toBe('She said "hi"');
  });

  it('handles CRLF line endings', () => {
    const out = parseCsv('a,b\r\n1,2\r\n3,4\r\n');
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ a: '1', b: '2' });
  });

  it('strips BOM', () => {
    const out = parseCsv('﻿a,b\n1,2\n');
    expect(out[0].a).toBe('1');
    expect(Object.keys(out[0])).toEqual(['a', 'b']);
  });

  it('skips empty trailing rows', () => {
    const out = parseCsv('a,b\n1,2\n\n');
    expect(out).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});
