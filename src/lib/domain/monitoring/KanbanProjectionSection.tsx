'use client';

import React, { useEffect, useState } from 'react';
import { KanbanProjectionDisplay } from './KanbanProjectionDisplay';

export function KanbanProjectionSection({ styles }: { styles: any }) {
  const [projection, setProjection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'initiatives' | 'items'>('items');
  const [rebuilding, setRebuilding] = useState<'initiatives' | 'items' | null>(null);

  // Fetch board data function
  const fetchBoardData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[KANBAN PROJECTION SECTION] Fetching projection', type);
      const res = await fetch(`/monitoring/projection?type=${type}`);
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
  };

  useEffect(() => {
    fetchBoardData();
  }, [type]);

  const rebuildProjection = async (target: 'initiatives' | 'items') => {
    setRebuilding(target);
    setError(null);
    try {
      console.log('[KANBAN PROJECTION SECTION] Rebuilding projection', target);
      const res = await fetch(`/monitoring/projection?type=${target}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to rebuild ${target} projection`);
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
      <h1 className={styles.heading}>Kanban Projection (Live)</h1>
      <div style={{ marginBottom: 12, display: 'flex', gap: '10px' }}>
        <button onClick={fetchBoardData}>Refresh</button>
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
        <select 
            value={type} 
            onChange={(e) => setType(e.target.value as 'initiatives' | 'items')}
            style={{ padding: '4px' }}
        >
            <option value="initiatives">Initiatives</option>
            <option value="items">Initiative Items</option>
        </select>
      </div>
      {loading && <div>Loading projection...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {projection && <KanbanProjectionDisplay projection={projection} />}
    </>
  );
}
