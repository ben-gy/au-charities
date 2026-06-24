import { GLOSSARY } from './glossary';

let tooltip: HTMLDivElement | null = null;

export function initGlossary(root: HTMLElement) {
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const link = t.closest('.glossary-link') as HTMLElement | null;
    if (link) {
      e.stopPropagation();
      const term = link.dataset.term!;
      showTooltip(term, link);
    } else if (tooltip) {
      hideTooltip();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideTooltip();
  });
  window.addEventListener('scroll', hideTooltip, { passive: true });
  window.addEventListener('resize', hideTooltip);
}

function showTooltip(term: string, anchor: HTMLElement) {
  const entry = GLOSSARY[term];
  if (!entry) return;
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'glossary-tooltip';
    document.body.appendChild(tooltip);
  }
  tooltip.innerHTML = `<strong>${entry.title}</strong>${entry.body}`;
  const rect = anchor.getBoundingClientRect();
  const tw = 320;
  const left = Math.min(window.innerWidth - tw - 12, Math.max(12, rect.left));
  let top = rect.bottom + 8;
  if (top + 200 > window.innerHeight) top = rect.top - 8 - tooltip.offsetHeight;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.display = 'block';
}

function hideTooltip() {
  if (tooltip) tooltip.style.display = 'none';
}

export function gloss(term: string): string {
  return `<span class="glossary-link" data-term="${term}" role="button" tabindex="0" aria-label="What is ${GLOSSARY[term]?.title ?? term}?">?</span>`;
}
