// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { DataStore } from '../data';

export function renderInsights(store: DataStore): string {
  return `
    <div class="section-heading">
      <div>
        <h2>Insights</h2>
        <p>Auto-generated from the 2023 dataset. Each card calls out something notable about the sector.</p>
      </div>
    </div>

    <div class="insight-grid">
      ${store.insights
        .map(
          (i) => `
        <div class="insight-card severity-${i.severity}">
          ${i.metric ? `<div class="metric">${i.metric}</div>` : ''}
          <h3>${i.title}</h3>
          <p>${i.body}</p>
          ${i.link ? `<a class="link" href="#charity=${i.link.slug}" data-charity="${i.link.slug}">View ${i.link.name} →</a>` : ''}
        </div>
      `,
        )
        .join('')}
    </div>
  `;
}
