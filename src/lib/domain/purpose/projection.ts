import { getTeamsProjection as _getTeamsProjection } from '@/lib/db/projections';

export type PurposeRow = {
  id: string;
  name: string;
  purpose?: string;
  context?: string;
  level?: number;
};

// Re-export the underlying teams projection for callers that need the full team
// shape. This avoids duplicating projection-building logic across domain slices.
export { _getTeamsProjection as getTeamsProjection };

/**
 * Lightweight query used by the `purpose` slice pages.
 * Returns a minimal row per team suitable for read-only lists and selection.
 */
export const queryPurposeTeams = async (): Promise<PurposeRow[]> => {
  const teams = await _getTeamsProjection();
  return teams
    .map(t => ({ id: t.id, name: t.name, purpose: t.purpose, context: t.context, level: t.level }))
    .sort((a, b) => {
      // sort by level ascending (lower numbers high priority). Keep stable fallback to name.
      const la = typeof a.level === 'number' ? a.level : Number.POSITIVE_INFINITY;
      const lb = typeof b.level === 'number' ? b.level : Number.POSITIVE_INFINITY;
      if (la !== lb) return la - lb;
      return (a.name || a.id).localeCompare(b.name || b.id);
    });
};
