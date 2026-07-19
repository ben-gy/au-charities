// feedback:begin (managed by hub/scripts/feedback/backfill.mjs)
import { mountFeedback } from './feedback';
mountFeedback();
// feedback:end

import './style.css';
import { loadCharities, loadCore, loadFinancials, type DataStore } from './data';
import type { CharityRecord, Financials } from './types';
import { initGlossary } from './glossaryTooltip';
import { initTooltip } from './tooltip';
import { renderOverview } from './views/overview';
import { renderSearch, renderSearchRows, defaultSearchState, type SearchState } from './views/search';
import { renderLeaderboards } from './views/leaderboards';
import { renderFlows } from './views/flows';
import { renderSectors } from './views/sectors';
import { renderMap, attachMap } from './views/map';
import { renderInsights } from './views/insights';
import { renderDrilldown } from './views/drilldown';

type Tab = 'overview' | 'search' | 'leaderboards' | 'flows' | 'sectors' | 'map' | 'insights';

interface AppState {
  tab: Tab;
  search: SearchState;
}

const app = document.getElementById('app')!;
const state: AppState = {
  tab: 'overview',
  search: defaultSearchState(),
};

let store: DataStore | null = null;

async function bootstrap() {
  renderShell();
  initGlossary(app);
  initTooltip();

  try {
    store = await loadCore();
  } catch (err) {
    showError(err as Error);
    return;
  }

  // Read URL hash for initial tab/charity
  const initial = parseHash();
  if (initial.tab) state.tab = initial.tab;

  renderActiveTab();

  // Lazy-load charity index in background
  loadCharities()
    .then(({ records, byAbn }) => {
      if (!store) return;
      store.charities = records;
      store.byAbn = byAbn;
      if (state.tab === 'search') renderSearchTableOnly();
    })
    .catch((e) => console.warn('charities load failed', e));

  loadFinancials()
    .then((fin) => {
      if (!store) return;
      store.financials = fin;
    })
    .catch((e) => console.warn('financials load failed', e));

  // Handle initial charity hash
  if (initial.charitySlug) {
    waitForCharities().then((records) => {
      const c = records.find((r) => r.slug === initial.charitySlug);
      if (c) openDrill(c);
    });
  }

  window.addEventListener('hashchange', () => {
    const p = parseHash();
    if (p.charitySlug) {
      waitForCharities().then((records) => {
        const c = records.find((r) => r.slug === p.charitySlug);
        if (c) openDrill(c);
      });
    } else {
      closeDrill();
    }
  });
}

function renderShell() {
  app.innerHTML = `
    <header class="site-header">
      <div class="brand">
        <span class="brand-icon">${BRAND_SVG}</span>
        <span>Charity Watch</span>
        <span class="brand-au">AU</span>
      </div>
      <div class="header-search">
        <input type="search" id="header-search" placeholder="Search 65,000+ Australian charities…" autocomplete="off" />
      </div>
      <div class="header-actions">
        <button class="btn-ghost" id="btn-about" aria-label="About this site">
          <span>About</span>
          <span aria-hidden="true">?</span>
        </button>
      </div>
    </header>
    <nav class="tabs" role="tablist">
      <button class="tab" data-tab="overview" role="tab">Overview</button>
      <button class="tab" data-tab="search" role="tab">Search</button>
      <button class="tab" data-tab="leaderboards" role="tab">Leaderboards</button>
      <button class="tab" data-tab="flows" role="tab">Money flow</button>
      <button class="tab" data-tab="sectors" role="tab">Sectors</button>
      <button class="tab" data-tab="map" role="tab">Map</button>
      <button class="tab" data-tab="insights" role="tab">Insights</button>
    </nav>
    <main class="main-content" id="view-host">
      <div class="loading">Loading sector data…</div>
    </main>
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div>
          Data: ACNC Register + 2023 Annual Information Statement (data.gov.au). Updated monthly.
        </div>
        <div class="credits">
          Built by <a href="https://benrichardson.dev/">benrichardson.dev</a> · <a href="https://hub.benrichardson.dev" target="_blank" rel="noopener">more tools &amp; sites</a>
        </div>
      </div>
    </footer>
  `;

  app.querySelectorAll<HTMLElement>('.tab').forEach((el) => {
    el.addEventListener('click', () => switchTab(el.dataset.tab as Tab));
  });
  app.querySelector<HTMLElement>('#btn-about')!.addEventListener('click', openAbout);
  const search = app.querySelector<HTMLInputElement>('#header-search')!;
  search.addEventListener('input', () => {
    state.search.filter.q = search.value;
    state.search.page = 0;
    if (state.tab !== 'search') switchTab('search');
    else renderSearchTableOnly();
    syncFilterInputs();
  });
}

function renderActiveTab() {
  app.querySelectorAll<HTMLElement>('.tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === state.tab);
  });
  const host = document.getElementById('view-host')!;
  if (!store) {
    host.innerHTML = '<div class="loading">Loading sector data…</div>';
    return;
  }
  switch (state.tab) {
    case 'overview':
      host.innerHTML = renderOverview(store);
      wireHbarStateJumps(host);
      wireCharityLinks(host);
      break;
    case 'search':
      host.innerHTML = renderSearch(store, state.search);
      wireSearchFilters();
      renderSearchTableOnly();
      break;
    case 'leaderboards':
      host.innerHTML = renderLeaderboards(store);
      wireCharityLinks(host);
      break;
    case 'flows':
      host.innerHTML = renderFlows(store);
      break;
    case 'sectors':
      host.innerHTML = renderSectors(store);
      break;
    case 'map':
      host.innerHTML = renderMap(store);
      attachMap(store, (st) => {
        state.search.filter.state = st;
        switchTab('search');
      });
      break;
    case 'insights':
      host.innerHTML = renderInsights(store);
      wireCharityLinks(host);
      break;
  }
}

function switchTab(t: Tab) {
  state.tab = t;
  renderActiveTab();
  history.replaceState(null, '', `#tab=${t}`);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function syncFilterInputs() {
  const headerSearch = document.querySelector<HTMLInputElement>('#header-search');
  if (headerSearch && headerSearch.value !== state.search.filter.q) headerSearch.value = state.search.filter.q;
  const fq = document.querySelector<HTMLInputElement>('#f-q');
  if (fq && fq.value !== state.search.filter.q) fq.value = state.search.filter.q;
  const fst = document.querySelector<HTMLSelectElement>('#f-state');
  if (fst) fst.value = state.search.filter.state;
}

let searchDebounce: number | null = null;

function wireSearchFilters() {
  const fq = document.querySelector<HTMLInputElement>('#f-q')!;
  const fst = document.querySelector<HTMLSelectElement>('#f-state')!;
  const fsize = document.querySelector<HTMLSelectElement>('#f-size')!;
  const fp = document.querySelector<HTMLSelectElement>('#f-purpose')!;
  const fb = document.querySelector<HTMLSelectElement>('#f-beneficiary')!;
  const fais = document.querySelector<HTMLInputElement>('#f-ais')!;
  const fpbi = document.querySelector<HTMLInputElement>('#f-pbi')!;
  const fclear = document.querySelector<HTMLElement>('#f-clear')!;

  fq.addEventListener('input', () => {
    if (searchDebounce) window.clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(() => {
      state.search.filter.q = fq.value;
      state.search.page = 0;
      renderSearchTableOnly();
      const headerSearch = document.querySelector<HTMLInputElement>('#header-search');
      if (headerSearch) headerSearch.value = fq.value;
    }, 200);
  });
  fst.addEventListener('change', () => {
    state.search.filter.state = fst.value;
    state.search.page = 0;
    renderSearchTableOnly();
  });
  fsize.addEventListener('change', () => {
    state.search.filter.size = fsize.value;
    state.search.page = 0;
    renderSearchTableOnly();
  });
  fp.addEventListener('change', () => {
    state.search.filter.purpose = parseInt(fp.value, 10);
    state.search.page = 0;
    renderSearchTableOnly();
  });
  fb.addEventListener('change', () => {
    state.search.filter.beneficiary = parseInt(fb.value, 10);
    state.search.page = 0;
    renderSearchTableOnly();
  });
  fais.addEventListener('change', () => {
    state.search.filter.hasAis = fais.checked;
    state.search.page = 0;
    renderSearchTableOnly();
  });
  fpbi.addEventListener('change', () => {
    state.search.filter.pbi = fpbi.checked;
    state.search.page = 0;
    renderSearchTableOnly();
  });
  fclear.addEventListener('click', () => {
    state.search = defaultSearchState();
    document.getElementById('view-host')!.innerHTML = renderSearch(store!, state.search);
    wireSearchFilters();
    renderSearchTableOnly();
  });

  document.querySelectorAll<HTMLElement>('.data-table th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort as SearchState['sortKey'];
      if (state.search.sortKey === k) {
        state.search.sortDir = state.search.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.search.sortKey = k;
        state.search.sortDir = k === 'name' ? 'asc' : 'desc';
      }
      updateSortHeaders();
      renderSearchTableOnly();
    });
  });
  updateSortHeaders();
}

function updateSortHeaders() {
  document.querySelectorAll<HTMLElement>('.data-table th.sortable').forEach((th) => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === state.search.sortKey) {
      th.classList.add(state.search.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

function renderSearchTableOnly() {
  const tbody = document.getElementById('search-tbody');
  if (!tbody) return;
  if (!store?.charities) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading 65,000+ charities…</td></tr>';
    return;
  }
  tbody.innerHTML = renderSearchRows(store.charities, store, state.search);
  tbody.querySelectorAll<HTMLElement>('tr[data-charity]').forEach((tr) => {
    tr.addEventListener('click', () => {
      const slug = tr.dataset.charity!;
      const c = store!.charities!.find((r) => r.slug === slug);
      if (c) openDrill(c);
    });
  });
}

function wireHbarStateJumps(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-jump-state]').forEach((el) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      state.search.filter.state = el.dataset.jumpState!;
      switchTab('search');
    });
  });
}

function wireCharityLinks(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-charity]').forEach((el) => {
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      const slug = el.dataset.charity!;
      const records = await waitForCharities();
      const c = records.find((r) => r.slug === slug);
      if (c) openDrill(c);
    });
  });
}

function openDrill(c: CharityRecord) {
  let panel = document.getElementById('drill-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'drill-panel';
    panel.className = 'drill-panel';
    document.body.appendChild(panel);
  }
  const fin: Financials | undefined = store?.financials?.[c.abn];
  panel.innerHTML = renderDrilldown(c, store!, fin);
  // If financials aren't loaded yet, fetch lazily for this open.
  if (!fin && c.hasAis) {
    loadFinancials().then((all) => {
      if (store) store.financials = all;
      const refreshed = all[c.abn];
      if (refreshed && document.getElementById('drill-panel')) {
        panel!.innerHTML = renderDrilldown(c, store!, refreshed);
        wireDrillClose(panel!);
      }
    });
  }
  requestAnimationFrame(() => panel!.classList.add('open'));
  wireDrillClose(panel);
  history.replaceState(null, '', `#charity=${c.slug}`);
  document.addEventListener('keydown', escClose);
}

function wireDrillClose(panel: HTMLElement) {
  panel.querySelector('[data-close-drill]')?.addEventListener('click', closeDrill);
}

function escClose(e: KeyboardEvent) {
  if (e.key === 'Escape') closeDrill();
}

function closeDrill() {
  const panel = document.getElementById('drill-panel');
  if (!panel) return;
  panel.classList.remove('open');
  setTimeout(() => panel.remove(), 240);
  document.removeEventListener('keydown', escClose);
  if (location.hash.startsWith('#charity=')) {
    history.replaceState(null, '', `#tab=${state.tab}`);
  }
}

function openAbout() {
  let backdrop = document.getElementById('about-modal');
  if (backdrop) return;
  backdrop = document.createElement('div');
  backdrop.id = 'about-modal';
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-labelledby="about-title">
      <button class="modal-close" data-close-about>✕</button>
      <h2 id="about-title">About Charity Watch (AU)</h2>
      <p>This site is a faster, friendlier way to look up the <strong>${store?.aggregate.totalCharities.toLocaleString('en-AU') || '65,000+'} registered Australian charities</strong> on the ACNC public register. It exists because the official register is technical, single-charity-lookup only, and buries the financials.</p>

      <h3>Where the data comes from</h3>
      <p>Two open government datasets:</p>
      <ul style="padding-left:1.5em;color:var(--text-secondary);margin-bottom:var(--space-md)">
        <li><a href="https://data.gov.au/data/dataset/acnc-register" target="_blank" rel="noopener noreferrer">ACNC Register of Australian Charities</a> — every registered charity, with location, size, purposes, beneficiaries. Updated monthly.</li>
        <li><a href="https://data.gov.au/data/dataset/acnc-2023-annual-information-statement-ais-data" target="_blank" rel="noopener noreferrer">ACNC 2023 Annual Information Statement (AIS)</a> — financial figures, staffing, volunteers. Lodged annually.</li>
      </ul>
      <p>Per-capita figures use ABS Estimated Resident Population (June 2024). Joining the register and AIS by ABN gives ${store?.aggregate.withAis.toLocaleString('en-AU') || '50,000+'} charities with full 2023 financials. The rest are on the register but haven't lodged a 2023 statement yet, so financial figures aren't shown for them here.</p>

      <h3>What the figures mean</h3>
      <p>Click the small <strong>?</strong> next to any term anywhere on the site for a short explanation. The Glossary covers ABN, ACNC, AIS, PBI, HPC, charity size bands, donations vs revenue, employee expenses, government dependency, and more.</p>

      <h3>Limits</h3>
      <p>This site reproduces what the ACNC publishes; we don't fact-check individual charities. Some financial ratios can show oddities — e.g. a charity reporting government grant income greater than its total income when other revenue runs negative. We've left those in rather than hide them; treat anything unusual as a prompt to read the charity's actual annual report.</p>
      <p>The 2023 figures are the most recent year for which the ACNC has published a complete dataset. We do not include the 2024 AIS until the ACNC publishes it.</p>

      <h3>No tracking</h3>
      <p>No cookies, no fingerprinting, no third-party fonts. The only analytics is Cloudflare Web Analytics — anonymous, cookie-less page-view counts; no personal data, no cross-site tracking. Built as a static site on GitHub Pages.</p>

      <h3>For corrections</h3>
      <p>If you spot a data quality issue with a specific charity, the authoritative source is the ACNC register. We import their CSV monthly and don't edit individual records.</p>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop || (e.target as HTMLElement).hasAttribute('data-close-about')) {
      backdrop!.remove();
    }
  });
}

function showError(err: Error) {
  const host = document.getElementById('view-host');
  if (host) {
    host.innerHTML = `
      <div class="card" style="border-left:4px solid var(--status-bad)">
        <h3 class="card-title" style="color:var(--status-bad)">Couldn't load charity data</h3>
        <p style="color:var(--text-secondary)">${err.message}. Try refreshing the page. If this keeps happening, the data files at <code>/data/</code> may not have been generated by the pipeline yet.</p>
      </div>
    `;
  }
}

function parseHash(): { tab?: Tab; charitySlug?: string } {
  const h = location.hash.replace(/^#/, '');
  if (!h) return {};
  const out: { tab?: Tab; charitySlug?: string } = {};
  for (const part of h.split('&')) {
    const [k, v] = part.split('=');
    if (k === 'tab' && v) out.tab = v as Tab;
    if (k === 'charity' && v) out.charitySlug = decodeURIComponent(v);
  }
  return out;
}

function waitForCharities(): Promise<CharityRecord[]> {
  if (store?.charities) return Promise.resolve(store.charities);
  return new Promise((resolve) => {
    const tick = () => {
      if (store?.charities) resolve(store.charities);
      else setTimeout(tick, 80);
    };
    tick();
  });
}

const BRAND_SVG = `<svg viewBox="0 0 64 64" width="28" height="28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="64" height="64" rx="10" fill="#0f2a4a"/><path d="M32 14 L48 24 L48 38 C48 46 40 52 32 54 C24 52 16 46 16 38 L16 24 Z" fill="#0d7a7a" stroke="#fbfaf7" stroke-width="2"/><path d="M24 32 L30 38 L42 26" stroke="#fbfaf7" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Start the app only after all module-level consts above (e.g. BRAND_SVG) are
// initialized. renderShell() runs synchronously inside bootstrap() and reads
// BRAND_SVG, so calling bootstrap() earlier hits its temporal dead zone and
// throws "Cannot access 'BRAND_SVG' before initialization", blanking the page.
bootstrap();
