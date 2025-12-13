'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { KanbanProjectionDisplay } from './KanbanProjectionDisplay';

type KanbanProjectionSectionProps = {
  styles: any;
  title?: string;
  typePreset?: 'initiatives' | 'items';
  companyId?: string;
};

export function KanbanProjectionSection({ styles, title = 'Kanban Projection (Live)', typePreset, companyId }: KanbanProjectionSectionProps) {
  const initialType = typePreset ?? 'items';
  const [projection, setProjection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'initiatives' | 'items'>(initialType);
  const [rebuilding, setRebuilding] = useState<'initiatives' | 'items' | null>(null);

  const effectiveType = typePreset ?? type;

  // Fetch board data function
  const fetchBoardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[KANBAN PROJECTION SECTION] Fetching projection', effectiveType);
      const params = new URLSearchParams({ type: effectiveType });
      if (companyId) {
        params.append('companyId', companyId);
      }
      const res = await fetch(`/monitoring/projection?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch kanban board data');
      const data = await res.json();
      console.log('[KANBAN PROJECTION SECTION] Projection loaded', {
        type: data.type,
        count: Array.isArray(data.elements) ? data.elements.length : 0,
      });
      setProjection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [companyId, effectiveType]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const rebuildProjection = async (target?: 'initiatives' | 'items') => {
    const requested = target ?? effectiveType;
    setRebuilding(requested);
    setError(null);
    try {
      console.log('[KANBAN PROJECTION SECTION] Rebuilding projection', requested);
      const params = new URLSearchParams({ type: requested });
      if (companyId) {
        params.append('companyId', companyId);
      }
      const res = await fetch(`/monitoring/projection?${params.toString()}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to rebuild ${requested} projection`);
      const payload = await res.json();
      console.log('[KANBAN PROJECTION SECTION] Rebuild complete', payload);
      await fetchBoardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRebuilding(null);
    }
  };

  return (
    <>
      <h1 className={styles.heading}>{title}</h1>
      <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={fetchBoardData}>Refresh</button>
        {typePreset ? (
          <button
            onClick={() => rebuildProjection(typePreset)}
            disabled={rebuilding === typePreset}
          >
            {rebuilding === typePreset ? 'Rebuilding…' : `Rebuild ${typePreset === 'initiatives' ? 'Initiatives' : 'Items'}`}
          </button>
        ) : (
          <>
            <button
              onClick={() => rebuildProjection('initiatives')}
              disabled={rebuilding === 'initiatives'}
            >
              {rebuilding === 'initiatives' ? 'Rebuilding Initiatives…' : 'Rebuild Initiatives'}
            </button>
            <button
              onClick={() => rebuildProjection('items')}
              disabled={rebuilding === 'items'}
            >
              {rebuilding === 'items' ? 'Rebuilding Items…' : 'Rebuild Items'}
            </button>
          </>
        )}
        {!typePreset ? (
          <select
            value={type}
            onChange={event => setType(event.target.value as 'initiatives' | 'items')}
            style={{ padding: '4px' }}
          >
            <option value="initiatives">Initiatives</option>
            <option value="items">Initiative Items</option>
          </select>
        ) : null}
      </div>
      {loading && <div>Loading projection...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {projection && <KanbanProjectionDisplay projection={projection} />}
    </>
  );
}
