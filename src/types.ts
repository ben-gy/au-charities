// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
export type SizeCode = 'S' | 'M' | 'L' | 'U';

export interface CharityIndex {
  headers: string[];
  rows: any[][];
}

export interface CharityRecord {
  abn: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  postcode: string;
  size: SizeCode;
  regYear: number;
  hasAis: 0 | 1;
  revenueK: number;
  purposes: number[];
  beneficiaries: number[];
  operates: string[];
  pbi: 0 | 1;
  hpc: 0 | 1;
}

export interface Financials {
  rev: number;
  inc: number;
  exp: number;
  don: number;
  gov: number;
  svc: number;
  inv: number;
  oth: number;
  emp: number;
  gAU: number;
  gOS: number;
  oex: number;
  surp: number;
  ast: number;
  lia: number;
  fte: number;
  vol: number;
  web: string;
}

export interface AggregateData {
  generatedAt: string;
  totalCharities: number;
  withAis: number;
  totalRevenue: number;
  totalDonations: number;
  totalGovRevenue: number;
  totalExpenses: number;
  totalEmployeeExpenses: number;
  totalGrantsMade: number;
  totalVolunteers: number;
  totalFte: number;
  byState: Record<string, { count: number; revenue: number; donations: number; perCapita: number }>;
  bySize: Record<string, number>;
  byPurpose: Record<string, { count: number; revenue: number; donations: number }>;
  byBeneficiary: Record<string, { count: number; revenue: number; donations: number }>;
  registrationsByYear: Record<string, number>;
}

export interface LeaderboardRow {
  abn: string;
  name: string;
  slug: string;
  state: string;
  value: number;
  revenue: number;
  size: SizeCode;
}

export interface LeaderboardsData {
  byRevenue: LeaderboardRow[];
  byDonations: LeaderboardRow[];
  byGovRevenue: LeaderboardRow[];
  byGrantsMade: LeaderboardRow[];
  byEmployeeExpenses: LeaderboardRow[];
  byAssets: LeaderboardRow[];
  byVolunteers: LeaderboardRow[];
  byFte: LeaderboardRow[];
  byReach: LeaderboardRow[];
  highestAdminRatio: LeaderboardRow[];
  highestGovDependency: LeaderboardRow[];
  highestDonationsShare: LeaderboardRow[];
  lowestNetSurplus: LeaderboardRow[];
}

export interface SectorsData {
  purposes: string[];
  beneficiaries: string[];
  matrix: Record<string, Record<string, number>>;
}

export interface FlowsData {
  sources: Record<string, number>;
  uses: Record<string, number>;
}

export interface Insight {
  severity: 'info' | 'warn' | 'alert';
  title: string;
  body: string;
  metric?: string;
  link?: { slug: string; name: string };
}

export interface MetaData {
  generatedAt: string;
  totalCharities: number;
  withAis: number;
  purposeLabels: Record<string, string>;
  beneficiaryLabels: Record<string, string>;
  statePops: Record<string, number>;
}
