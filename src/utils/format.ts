// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
const AUD = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });

export function formatNumber(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-AU', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(n);
}

export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return `${n < 0 ? '-' : ''}$${AUD.format(abs)}`;
}

export function formatMoneyExact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `$${AUD.format(n)}`;
}

export function formatPercent(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(decimals)}%`;
}

export function formatAbn(abn: string): string {
  if (!abn || abn.length !== 11) return abn;
  return `${abn.slice(0, 2)} ${abn.slice(2, 5)} ${abn.slice(5, 8)} ${abn.slice(8, 11)}`;
}

export function sizeName(code: string): string {
  switch (code) {
    case 'S': return 'Small (< $500k)';
    case 'M': return 'Medium ($500k–$3M)';
    case 'L': return 'Large ($3M+)';
    default: return 'Unknown';
  }
}

export function sizeShort(code: string): string {
  switch (code) {
    case 'S': return 'Small';
    case 'M': return 'Medium';
    case 'L': return 'Large';
    default: return 'Unknown';
  }
}
