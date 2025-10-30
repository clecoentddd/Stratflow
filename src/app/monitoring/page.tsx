import { getEventLogProjection } from '@/lib/domain/monitoring/projection';
import RebuildButton from './rebuild-button';
import styles from './monitoring.module.css';

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
    <main className={styles.main}>
      <div className={styles.toolbar}>
        <a href="/monitoring?view=events" className={`${styles.tab} ${styles.eventsTab} ${current === 'events' ? styles.tabActive : ''}`}>Event Log</a>
        <a href="/monitoring?view=links" className={`${styles.tab} ${styles.linksTab} ${current === 'links' ? styles.tabActive : ''}`}>Initiative Links</a>
        <a href="/monitoring?view=catalog" className={`${styles.tab} ${styles.catalogTab} ${current === 'catalog' ? styles.tabActive : ''}`}>Initiative Catalog</a>
        <span className={styles.spacer}>
          <RebuildButton />
        </span>
      </div>

      {current === 'events' ? (
        <>
          <h1 className={styles.heading}>Event Log</h1>
          <div className={`${styles.tableWrap} ${styles.eventsAccent}`}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Time</th>
                  <th>Entity</th>
                  <th>Type</th>
                  <th>Aggregate ID</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {events.map((e: any, idx: number) => (
                  <tr key={`${e.timestamp}-${e.aggregateId}-${e.type}-${idx}`}>
                    <td style={{ verticalAlign: 'top' }}>
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>{e.entity}</td>
                    <td style={{ verticalAlign: 'top' }}>{e.type}</td>
                    <td style={{ verticalAlign: 'top' }}>{e.aggregateId}</td>
                    <td style={{ verticalAlign: 'top', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '0.875rem' }}>
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
          <h1 className={styles.heading}>Initiative Links Projection</h1>
          <div className={`${styles.tableWrap} ${styles.linksAccent}`}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>From Initiative</th>
                  <th>To Initiative</th>
                  <th>From Team (Level)</th>
                  <th>To Team (Level)</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {links.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.fromInitiativeId}</td>
                    <td>{r.toInitiativeId}</td>
                    <td>{r.fromTeamId} (L{r.fromTeamLevel ?? '-'})</td>
                    <td>{r.toTeamId} (L{r.toTeamLevel ?? '-'})</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <h1 className={styles.heading}>Initiative Catalog Projection</h1>
          <div className={`${styles.tableWrap} ${styles.catalogAccent}`}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Initiative</th>
                  <th>Team</th>
                  <th>Strategy</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {catalog.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.name} ({r.id})</td>
                    <td>{r.teamId}</td>
                    <td>{r.strategyId}</td>
                    <td>{r.strategyState || '-'}</td>
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
