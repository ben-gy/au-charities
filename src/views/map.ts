import L from 'leaflet';
import type { DataStore } from '../data';
import { STATE_CENTROIDS } from '../data/states';
import { formatMoney, formatNumber } from '../utils/format';

let map: L.Map | null = null;
let layerGroup: L.LayerGroup | null = null;

export function renderMap(_store: DataStore): string {
  return `
    <div class="section-heading">
      <div>
        <h2>Where Australia's charities are based</h2>
        <p>Bubble size = charities per 100,000 residents (per-capita view). The Northern Territory and ACT punch well above their weight.</p>
      </div>
    </div>

    <div class="map-wrap">
      <div id="state-map" aria-label="Map of Australian states showing charity density"></div>
      <div class="map-side">
        <div class="card">
          <h3 class="card-title">Per-capita density</h3>
          <p class="card-subtitle">Charities per 100,000 residents (ABS June 2024 ERP).</p>
          <div id="map-density"></div>
        </div>
        <div class="card">
          <h3 class="card-title">Sector revenue by state</h3>
          <p class="card-subtitle">2023 total revenue of charities headquartered there.</p>
          <div id="map-revenue"></div>
        </div>
      </div>
    </div>
  `;
}

export function attachMap(store: DataStore, onClick: (state: string) => void) {
  const el = document.getElementById('state-map');
  if (!el) return;

  if (map) {
    map.remove();
    map = null;
  }
  map = L.map(el, {
    center: [-27.5, 134],
    zoom: 4,
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 18,
    subdomains: 'abcd',
  }).addTo(map);

  layerGroup = L.layerGroup().addTo(map);

  const stateCounts = store.aggregate.byState;
  const maxPerCap = Math.max(
    ...Object.entries(stateCounts).filter(([k]) => k !== 'OTHER').map(([, v]) => v.perCapita),
  );

  for (const [code, centroid] of Object.entries(STATE_CENTROIDS)) {
    const v = stateCounts[code];
    if (!v) continue;
    const radius = 10 + (v.perCapita / maxPerCap) * 32;
    const marker = L.circleMarker([centroid.lat, centroid.lng], {
      radius,
      color: '#0d7a7a',
      weight: 2,
      fillColor: '#0d7a7a',
      fillOpacity: 0.45,
    });
    marker.bindPopup(
      `<div style="font-family:-apple-system,Inter,sans-serif">
        <strong style="color:#0f2a4a">${centroid.name}</strong><br>
        ${formatNumber(v.count)} charities (${v.perCapita.toFixed(1)} per 100k)<br>
        ${formatMoney(v.revenue)} 2023 revenue<br>
        <a href="#" data-jump-state="${code}" style="color:#0d7a7a">Filter search to ${code} →</a>
      </div>`,
    );
    marker.on('click', () => {
      marker.openPopup();
    });
    marker.on('popupopen', () => {
      const link = document.querySelector('.leaflet-popup-content a[data-jump-state]') as HTMLAnchorElement | null;
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          onClick(link.dataset.jumpState!);
        });
      }
    });
    layerGroup.addLayer(marker);
  }

  // Side panels
  const densityEl = document.getElementById('map-density');
  if (densityEl) {
    const rows = Object.entries(stateCounts)
      .filter(([k]) => k !== 'OTHER')
      .sort((a, b) => b[1].perCapita - a[1].perCapita);
    const max = Math.max(...rows.map(([, v]) => v.perCapita));
    densityEl.innerHTML = `<div class="hbar-list">${rows
      .map(
        ([code, v]) => `
        <div class="hbar-row" data-jump-state="${code}" style="cursor:pointer">
          <div class="lbl">${code}</div>
          <div class="bar"><div class="fill" style="width:${(v.perCapita / max) * 100}%"></div></div>
          <div class="val">${v.perCapita.toFixed(0)}</div>
        </div>`,
      )
      .join('')}</div>`;
    densityEl.querySelectorAll<HTMLElement>('[data-jump-state]').forEach((el) => {
      el.addEventListener('click', () => onClick(el.dataset.jumpState!));
    });
  }

  const revEl = document.getElementById('map-revenue');
  if (revEl) {
    const rows = Object.entries(stateCounts)
      .filter(([k]) => k !== 'OTHER')
      .sort((a, b) => b[1].revenue - a[1].revenue);
    const max = Math.max(...rows.map(([, v]) => v.revenue));
    revEl.innerHTML = `<div class="hbar-list">${rows
      .map(
        ([code, v]) => `
        <div class="hbar-row">
          <div class="lbl">${code}</div>
          <div class="bar"><div class="fill" style="width:${(v.revenue / max) * 100}%;background:var(--accent-secondary)"></div></div>
          <div class="val">${formatMoney(v.revenue)}</div>
        </div>`,
      )
      .join('')}</div>`;
  }
}
