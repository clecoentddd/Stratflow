import Link from 'next/link';
import { Suspense } from 'react';
import '@/lib/domain/initiatives/catalog/projection';
import { queryEligibleInitiatives } from '@/lib/domain/initiatives/catalog/projection';
import '@/lib/domain/initiatives/linking/projection';
import { queryAllActiveLinks } from '@/lib/domain/initiatives/linking/projection';

type SearchParams = { id?: string };

function buildAdjacencyBoth() {
  const edges = queryAllActiveLinks();
  const fwd = new Map<string, string[]>();
  const rev = new Map<string, string[]>();
  for (const e of edges) {
    if (e.deletedAt) continue;
    if (!fwd.has(e.fromInitiativeId)) fwd.set(e.fromInitiativeId, []);
    if (!rev.has(e.toInitiativeId)) rev.set(e.toInitiativeId, []);
    fwd.get(e.fromInitiativeId)!.push(e.toInitiativeId);
    rev.get(e.toInitiativeId)!.push(e.fromInitiativeId);
  }
  return { fwd, rev };
}

function buildTree(rootId: string, adj: Map<string, string[]>) {
  const visited = new Set<string>();
  function dfs(id: string): any {
    if (visited.has(id)) {
      return { id, cycle: true, children: [] as any[] };
    }
    visited.add(id);
    const next = adj.get(id) || [];
    return { id, cycle: false, children: next.map(dfs) };
  }
  return dfs(rootId);
}

function Tree({ node, names }: { node: any; names: Record<string, string> }) {
  return (
    <ul style={{ marginLeft: 16 }}>
      <li>
        <span>{names[node.id] || node.id}{node.cycle ? ' (cycle)' : ''}</span>
        {node.children && node.children.length > 0 ? (
          <div>
            {node.children.map((c: any) => (
              <Tree key={c.id + Math.random()} node={c} names={names} />
            ))}
          </div>
        ) : null}
      </li>
    </ul>
  );
}

export default async function StrategicViewPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { id } = await searchParams;
  const rows = queryEligibleInitiatives({ states: ['Draft','Active'] });
  const names: Record<string, string> = Object.fromEntries(rows.map(r => [r.id, r.name]));
  const selectedId = id && rows.find(r => r.id === id) ? id : (rows[0]?.id || undefined);

  return (
    <main style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Strategic View</h1>

      <form method="get" style={{ marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'center' }}>
        <label htmlFor="id" style={{ fontSize: 14 }}>Initiative</label>
        <select id="id" name="id" defaultValue={selectedId} style={{ border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: 6 }}>
          {rows.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button type="submit" style={{ border: '1px solid #e5e7eb', padding: '4px 10px', borderRadius: 6 }}>View</button>
        <Link href="/monitoring?view=links" style={{ marginLeft: 'auto', fontSize: 14, color: '#2563eb' }}>View Links Projection</Link>
      </form>

      {selectedId ? (
        <Suspense>
          {(() => {
            const { fwd, rev } = buildAdjacencyBoth();
            const down = buildTree(selectedId, fwd);
            const up = buildTree(selectedId, rev);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Downstream (influences)</h2>
                  <Tree node={down} names={names} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Upstream (influenced by)</h2>
                  <Tree node={up} names={names} />
                </div>
              </div>
            );
          })()}
        </Suspense>
      ) : (
        <p style={{ color: '#6b7280' }}>No initiatives found. Create a Draft/Active initiative to start.</p>
      )}
    </main>
  );
}
