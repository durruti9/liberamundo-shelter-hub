/** Normalize a free-text label: lowercase, no accents, collapsed spaces. */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const hasDiacritics = (v: string) => /[\u0300-\u036f]/.test(v.normalize('NFD'));
const isTitleCase = (v: string) => /^[A-ZÁÉÍÓÚÜÑ][^A-Z]*$/.test(v.trim());

/** Pick the nicest looking variant among equivalent spellings. */
function bestVariant(variants: string[]): string {
  const scored = variants.map(v => {
    let score = 0;
    if (hasDiacritics(v)) score += 4;
    if (isTitleCase(v)) score += 2;
    if (v !== v.toUpperCase()) score += 1;
    return { v, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].v.trim();
  return best.charAt(0).toUpperCase() + best.slice(1);
}

/**
 * Group free-text values ignoring accents and case.
 * Returns entries sorted by count desc, labelled with the best-looking variant.
 */
export function groupNormalized(
  values: string[],
  fallback = 'Sin especificar'
): { name: string; value: number }[] {
  const groups = new Map<string, { variants: string[]; count: number }>();
  for (const raw of values) {
    const clean = (raw || '').trim() || fallback;
    const key = normalizeKey(clean);
    const g = groups.get(key) || { variants: [], count: 0 };
    g.variants.push(clean);
    g.count += 1;
    groups.set(key, g);
  }
  return [...groups.values()]
    .map(g => ({ name: bestVariant(g.variants), value: g.count }))
    .sort((a, b) => b.value - a.value);
}
