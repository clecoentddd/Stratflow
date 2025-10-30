import Link from 'next/link';
import { Suspense } from 'react';
import BubbleGraph, { CatalogNode, LinkEdge } from '@/components/d3-nodes/BubbleGraph';
import '@/lib/domain/initiatives/catalog/projection';
import { queryEligibleInitiatives } from '@/lib/domain/initiatives/catalog/projection';
import '@/lib/domain/initiatives/linking/projection';
import { queryAllActiveLinks } from '@/lib/domain/initiatives/linking/projection';

function buildSubgraph(selectedId: string | undefined) {
  const rows = queryEligibleInitiatives({ states: ['Draft','Active'] });
  const edges = queryAllActiveLinks();
  const nodes: CatalogNode[] = rows.map(r => ({
    id: r.id,
    name: r.name,
    teamId: r.teamId,
    teamName: r.teamName,
    teamLevel: r.teamLevel,
  }));
  const allEdges: LinkEdge[] = edges.filter(e => !e.deletedAt).map(e => ({ fromInitiativeId: e.fromInitiativeId, toInitiativeId: e.toInitiativeId }));

  if (!selectedId) return { nodes, edges: allEdges };

  // Filter to connected component of selected node (both upstream and downstream)
  const adjF = new Map<string, string[]>();
  const adjR = new Map<string, string[]>();
  for (const e of allEdges) {
    if (!adjF.has(e.fromInitiativeId)) adjF.set(e.fromInitiativeId, []);
    if (!adjR.has(e.toInitiativeId)) adjR.set(e.toInitiativeId, []);
    adjF.get(e.fromInitiativeId)!.push(e.toInitiativeId);
    adjR.get(e.toInitiativeId)!.push(e.fromInitiativeId);
  }
  const seen = new Set<string>();
  const stack = [selectedId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    (adjF.get(id) || []).forEach(n => stack.push(n));
    (adjR.get(id) || []).forEach(n => stack.push(n));
  }
  const subNodes = nodes.filter(n => seen.has(n.id));
  const subEdges = allEdges.filter(e => seen.has(e.fromInitiativeId) && seen.has(e.toInitiativeId));
  return { nodes: subNodes, edges: subEdges };
}

export default async function StrategicViewPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const all = queryEligibleInitiatives({ states: ['Draft','Active'] });
  const selectedId = id && all.find(r => r.id === id) ? id : undefined;
  const { nodes, edges } = buildSubgraph(selectedId);

  return (
    <main style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Strategic View</h1>

      <form method="get" style={{ marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'center' }}>
        <label htmlFor="id" style={{ fontSize: 14 }}>Focus initiative</label>
        <select id="id" name="id" defaultValue={selectedId} style={{ border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: 6, minWidth: 300 }}>
          <option value="">All connected</option>
          {all.map(r => (
            <option key={r.id} value={r.id}>{r.name} · {r.teamName || r.teamId}</option>
          ))}
        </select>
        <button type="submit" style={{ border: '1px solid #e5e7eb', padding: '4px 10px', borderRadius: 6 }}>View</button>
        <Link href="/monitoring?view=links" style={{ marginLeft: 'auto', fontSize: 14, color: '#2563eb' }}>View Links Projection</Link>
      </form>

      <Suspense>
        <BubbleGraph nodes={nodes} edges={edges} />
      </Suspense>
    </main>
  );
}
