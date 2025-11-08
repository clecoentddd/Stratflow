'use client';

import React, { useEffect, useState } from 'react';
import { KanbanProjectionDisplay } from './KanbanProjectionDisplay';

export function KanbanProjectionSection({ styles }: { styles: any }) {
  const [projection, setProjection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch board data function
  const fetchBoardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/kanban/data?type=initiatives');
      if (!res.ok) throw new Error('Failed to fetch kanban board data');
      const data = await res.json();
      setProjection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, []);

  return (
    <>
      <h1 className={styles.heading}>Kanban Projection (Live)</h1>
      <button onClick={fetchBoardData} style={{ marginBottom: 12 }}>Refresh</button>
      {loading && <div>Loading projection...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {projection && <KanbanProjectionDisplay projection={projection} />}
    </>
  );
}
