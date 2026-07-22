// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
export const GLOSSARY: Record<string, { title: string; body: string }> = {
  acnc: {
    title: 'ACNC',
    body: 'Australian Charities and Not-for-profits Commission — the national regulator that decides who can call themselves a "registered charity" in Australia. Charities must lodge an Annual Information Statement (AIS) to keep their registration.',
  },
  ais: {
    title: 'AIS',
    body: 'Annual Information Statement — the yearly report charities lodge with the ACNC. Medium and Large charities also provide audited or reviewed financial statements. The financial figures on this site come from the 2023 AIS lodgements.',
  },
  abn: {
    title: 'ABN',
    body: 'Australian Business Number — the 11-digit identifier used by the ATO and ACNC. Every registered charity has one. Search the ABN to confirm you have the right organisation.',
  },
  pbi: {
    title: 'PBI',
    body: 'Public Benevolent Institution — a charity subtype that relieves poverty, sickness, suffering, distress, misfortune, disability or helplessness. PBIs can usually access Deductible Gift Recipient status, meaning donations are tax-deductible.',
  },
  hpc: {
    title: 'HPC',
    body: 'Health Promotion Charity — a charity whose principal activity is to promote the prevention or control of diseases in human beings. HPCs can usually access DGR endorsement.',
  },
  dgr: {
    title: 'DGR',
    body: 'Deductible Gift Recipient — ATO endorsement that lets donors claim a tax deduction for their gift. Not all registered charities are DGR-endorsed. This site does not show DGR status directly; check abr.business.gov.au.',
  },
  size_small: {
    title: 'Small charity',
    body: 'Annual revenue under $500,000. Small charities have lighter reporting obligations and are not required to submit financial statements with their AIS.',
  },
  size_medium: {
    title: 'Medium charity',
    body: 'Annual revenue between $500,000 and $3 million. Medium charities must lodge reviewed financial statements with their AIS.',
  },
  size_large: {
    title: 'Large charity',
    body: 'Annual revenue $3 million or more. Large charities must lodge audited financial statements with their AIS.',
  },
  total_revenue: {
    title: 'Total revenue',
    body: 'All money the charity earned during the financial year — including donations, government grants and contracts, fees for service, and investment income. Does not include capital gains, asset sales, or unrealised revaluations.',
  },
  total_gross_income: {
    title: 'Total gross income',
    body: 'Total revenue plus other income (e.g. asset sales, capital gains). Used by the ACNC to determine charity Size band.',
  },
  donations_bequests: {
    title: 'Donations & bequests',
    body: 'Voluntary gifts from the public, including individual donations, corporate giving, and money left in wills. This is the only income line that comes from "the public" in the way most donors imagine.',
  },
  government_revenue: {
    title: 'Government revenue',
    body: 'Money received from federal, state, or local government — through grants, service contracts, NDIS payments, school funding, hospital funding etc. A high share is common for service-delivery charities.',
  },
  service_revenue: {
    title: 'Goods & services revenue',
    body: 'Fees the charity charged for goods or services — school fees, hospital fees, course fees, op-shop sales, ticket sales etc.',
  },
  employee_expenses: {
    title: 'Employee expenses',
    body: 'Total cost of paid staff — salaries, superannuation, payroll tax, leave. For service-delivery charities this is usually the biggest line; for grant-making foundations it should be much smaller.',
  },
  grants_made: {
    title: 'Grants made',
    body: 'Money the charity gave to other organisations or individuals as grants or donations. The "grants made for use outside Australia" line is the closest proxy for international aid spend.',
  },
  net_surplus: {
    title: 'Net surplus / deficit',
    body: 'Total revenue minus total expenses. A surplus builds reserves; a deficit draws on them. A single deficit year isn\'t alarming, but persistent deficits warrant a closer look.',
  },
  fte: {
    title: 'FTE staff',
    body: 'Full-time equivalent paid staff. Two half-time staff count as one FTE.',
  },
  volunteers: {
    title: 'Volunteers',
    body: 'Self-reported number of volunteer relationships — not hours. One person volunteering for two charities counts twice.',
  },
  admin_ratio: {
    title: 'Employee-expense ratio',
    body: 'Employee expenses ÷ total gross income. High ratios (over 70%) are normal for service-delivery charities such as hospitals, schools, or aged-care providers, because their "product" is staff time. They should be low for grant-makers or foundations.',
  },
  gov_dependency: {
    title: 'Government dependency',
    body: 'Government revenue ÷ total gross income. A charity that gets nearly all its income from government contracts is in effect a service-delivery arm of the state, not a privately-funded charity in the everyday sense.',
  },
  reach: {
    title: 'Reach',
    body: 'Number of Australian states and territories in which the charity reports it operates. Includes ACT, NSW, NT, QLD, SA, TAS, VIC, WA — so the maximum is 8.',
  },
  purpose: {
    title: 'Charitable purpose',
    body: 'The ACNC recognises 12 categories of charitable purpose. A charity can have more than one — for example, a religious school may register both "advancing religion" and "advancing education".',
  },
  beneficiary: {
    title: 'Beneficiaries',
    body: 'The groups a charity reports it primarily helps. A charity can list multiple beneficiary groups.',
  },
};
