export function bitsToArray(bits: number): number[] {
  const out: number[] = [];
  let i = 0;
  let n = bits;
  while (n > 0) {
    if (n & 1) out.push(i);
    n >>>= 1;
    i++;
  }
  return out;
}

export function hasBit(bits: number, i: number): boolean {
  return (bits & (1 << i)) !== 0;
}

const OPERATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

export function bitsToStates(bits: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < OPERATES.length; i++) {
    if (bits & (1 << i)) out.push(OPERATES[i]);
  }
  return out;
}
