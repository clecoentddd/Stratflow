import { getEventLogProjection } from '@/lib/domain/monitoring/projection';
import RebuildButton from './rebuild-button';

type SearchParams = { view?: 'events' | 'links' | 'catalog' };

export default async function MonitoringPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { view } = await searchParams;
  const current = view === 'links' || view === 'catalog' ? view : 'events';

  const [events, links, catalog] = await Promise.all([
    current === 'events' ? getEventLogProjection() : Promise.resolve([] as any[]),
    current === 'links' ? (async () => {
      const mod = await import('@/lib/domain/initiatives/linking/projection');
      return mod.queryAllActiveLinks();
    })() : Promise.resolve([] as any[]),
    current === 'catalog' ? (async () => {
      const mod = await import('@/lib/domain/initiatives/catalog/projection');
      return mod.queryEligibleInitiatives({});
    })() : Promise.resolve([] as any[])
  ]);

  return (
    <main style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <a href="/monitoring?view=events" style={{ padding: '0.375rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, background: current === 'events' ? '#f1f5f9' : 'transparent' }}>Event Log</a>
        <a href="/monitoring?view=links" style={{ padding: '0.375rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, background: current === 'links' ? '#f1f5f9' : 'transparent' }}>Initiative Links</a>
        <a href="/monitoring?view=catalog" style={{ padding: '0.375rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, background: current === 'catalog' ? '#f1f5f9' : 'transparent' }}>Initiative Catalog</a>
        <span style={{ marginLeft: 'auto' }}>
          <RebuildButton />
        </span>
      </div>

      {current === 'events' ? (
        <>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Event Log</h1>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Entity</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Aggregate ID</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Payload</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e: any, idx: number) => (
                  <tr key={`${e.timestamp}-${e.aggregateId}-${e.type}-${idx}`}>
                    <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{e.entity}</td>
                    <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{e.type}</td>
                    <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{e.aggregateId}</td>
                    <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '0.875rem' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(e.payload, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : current === 'links' ? (
        <>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Initiative Links Projection</h1>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>From Initiative</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>To Initiative</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>From Team (Level)</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>To Team (Level)</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {links.map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{r.fromInitiativeId}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{r.toInitiativeId}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{r.fromTeamId} (L{r.fromTeamLevel ?? '-'})</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{r.toTeamId} (L{r.toTeamLevel ?? '-'})</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Initiative Catalog Projection</h1>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Initiative</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Team</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Strategy</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>State</th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{r.name} ({r.id})</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{r.teamId}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{r.strategyId}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{r.strategyState || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
