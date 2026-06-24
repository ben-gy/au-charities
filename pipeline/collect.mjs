// Download ACNC main register + 2023 AIS financials to pipeline/cache/.
// Re-uses cached files if newer than 7 days, so reruns are cheap.

import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CACHE = join(ROOT, 'cache');
await mkdir(CACHE, { recursive: true });

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const sources = [
  {
    name: 'main.csv',
    url: 'https://data.gov.au/data/dataset/b050b242-4487-4306-abf5-07ca073e5594/resource/8fb32972-24e9-4c95-885e-7140be51be8a/download/datadotgov_main.csv',
  },
  {
    name: 'ais23.csv',
    url: 'https://data.gov.au/data/dataset/ff6905d6-9d5d-4ef1-8478-72b833864fb7/resource/2b0fb746-57c5-4523-bb4c-74b7b78279d9/download/datadotgov_ais23.csv',
  },
];

async function fresh(file) {
  try {
    const s = await stat(file);
    return Date.now() - s.mtimeMs < SEVEN_DAYS;
  } catch {
    return false;
  }
}

async function download(src) {
  const dest = join(CACHE, src.name);
  if (await fresh(dest)) {
    console.log(`[skip] ${src.name} cached`);
    return;
  }
  console.log(`[fetch] ${src.name}`);
  const res = await fetch(src.url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Fetch failed ${src.name}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`[ok] ${src.name} ${(buf.length / 1024 / 1024).toFixed(1)}MB`);
}

for (const s of sources) await download(s);
console.log('collect: done');
