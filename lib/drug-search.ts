import Fuse from 'fuse.js';
import drugsData from '@/data/indian-drugs.json';
import type { DrugEntry, DrugSearchResult } from '@/types';

const drugs: DrugEntry[] = drugsData as DrugEntry[];

const fuse = new Fuse(drugs, {
  keys: [
    { name: 'generic_name', weight: 0.4 },
    { name: 'brand_names', weight: 0.4 },
    { name: 'category', weight: 0.1 },
    { name: 'common_for', weight: 0.1 },
  ],
  threshold: 0.35,
  distance: 100,
  includeScore: true,
  minMatchCharLength: 2,
});

/**
 * Search the drug database with fuzzy matching.
 * Returns up to `limit` results sorted by relevance.
 */
export function searchDrugs(query: string, limit: number = 8): DrugSearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const results = fuse.search(query.trim(), { limit });
  return results.map((r) => ({
    item: r.item,
    score: r.score ?? 1,
  }));
}

/**
 * Find a specific drug entry by its ID.
 */
export function getDrugById(id: string): DrugEntry | undefined {
  return drugs.find((d) => d.id === id);
}

/**
 * Get all drugs in the database (for browsing / category view).
 */
export function getAllDrugs(): DrugEntry[] {
  return drugs;
}
