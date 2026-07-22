// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
// Approximate state/territory centroids for marker-based map.
export const STATE_CENTROIDS: Record<string, { name: string; lat: number; lng: number }> = {
  ACT: { name: 'Australian Capital Territory', lat: -35.473, lng: 149.012 },
  NSW: { name: 'New South Wales', lat: -32.163, lng: 147.017 },
  NT: { name: 'Northern Territory', lat: -19.491, lng: 132.55 },
  QLD: { name: 'Queensland', lat: -20.917, lng: 142.703 },
  SA: { name: 'South Australia', lat: -30.001, lng: 136.21 },
  TAS: { name: 'Tasmania', lat: -42.022, lng: 146.617 },
  VIC: { name: 'Victoria', lat: -36.857, lng: 144.282 },
  WA: { name: 'Western Australia', lat: -25.043, lng: 117.793 },
};
