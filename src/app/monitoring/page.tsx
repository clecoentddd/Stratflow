import { getEventLogProjection } from '@/lib/domain/event-log';
import '@/lib/domain/event-log/projection'; // Ensure handlers are registered
import EventLogProjectionControls from '@/lib/domain/event-log/ui/EventLogProjectionControls';
import { CompaniesProjectionControls } from '@/lib/domain/companies/ui/CompaniesProjectionControls';
import { TeamsProjectionControls } from '@/lib/domain/teams/ui/TeamsProjectionControls';
import { InitiativeLinksProjectionControls } from '@/lib/domain/initiatives-linking/ui/InitiativeLinksProjectionControls';

import { InitiativeKanbanProjectionControls } from '@/lib/domain/initiative-kanban/ui/InitiativeKanbanProjectionControls';

import { InitiativeCatalogProjectionControls } from '@/lib/domain/initiatives-catalog/ui/InitiativeCatalogProjectionControls';

import styles from '@/lib/domain/monitoring/styles/monitoring.module.css';

type SearchParams = { view?: 'events' | 'links' | 'catalog' | 'companies' | 'teams' | 'kanban' };

export default async function MonitoringPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { view } = await searchParams;
  const current = view === 'links' || view === 'catalog' || view === 'companies' || view === 'teams' || view === 'kanban' ? view : 'events';

  const [events, links, catalog, companies, teams] = await Promise.all([
  current === 'events' ? getEventLogProjection() : Promise.resolve([] as any[]),
    current === 'links' ? (async () => {
      const mod = await import('@/lib/domain/initiatives-linking/projection');
      return mod.queryAllActiveLinks();
    })() : Promise.resolve([] as any[]),
    current === 'catalog' ? (async () => {
      const mod = await import('@/lib/domain/initiatives-catalog/projection');
      return mod.queryEligibleInitiatives({});
    })() : Promise.resolve([] as any[]),
    current === 'companies' ? (async () => {
      const { getCompaniesProjection } = await import('@/lib/domain/companies/projection');
      try {
        const companiesData = await getCompaniesProjection();
        console.log('🔍 [MONITORING] Companies found:', companiesData.length);
        return companiesData;
      } catch (error) {
        console.error('❌ [MONITORING] Error getting companies:', error);
        return [];
      }
    })() : Promise.resolve([] as any[]),
    current === 'teams' ? (async () => {
      const { getTeamsProjection } = await import('@/lib/domain/teams/projection');
      try {
        const teamsData = await getTeamsProjection();
        console.log('🔍 [MONITORING] Teams found:', teamsData.length);
        return teamsData;
      } catch (error) {
        console.error('❌ [MONITORING] Error getting teams:', error);
        return [];
      }
    })() : Promise.resolve([] as any[])
  ]);

  return (
    <main className={styles.main}>
      <div className={styles.toolbar}>
        <a href="/monitoring?view=events" className={`${styles.tab} ${styles.eventsTab} ${current === 'events' ? styles.tabActive : ''}`}>Event Log</a>
        <a href="/monitoring?view=links" className={`${styles.tab} ${styles.linksTab} ${current === 'links' ? styles.tabActive : ''}`}>Initiative Links</a>
        <a href="/monitoring?view=catalog" className={`${styles.tab} ${styles.catalogTab} ${current === 'catalog' ? styles.tabActive : ''}`}>Initiative Catalog</a>
        <a href="/monitoring?view=companies" className={`${styles.tab} ${styles.catalogTab} ${current === 'companies' ? styles.tabActive : ''}`}>Companies</a>
        <a href="/monitoring?view=teams" className={`${styles.tab} ${styles.catalogTab} ${current === 'teams' ? styles.tabActive : ''}`}>Teams</a>
        <a href="/monitoring?view=kanban" className={`${styles.tab} ${styles.catalogTab} ${current === 'kanban' ? styles.tabActive : ''}`}>Kanban</a>
        <span className={styles.spacer}>
          <EventLogProjectionControls currentView={current} />
          <InitiativeLinksProjectionControls currentView={current} />
          <InitiativeCatalogProjectionControls currentView={current} />

          <CompaniesProjectionControls currentView={current} />
          <TeamsProjectionControls currentView={current} />
          <InitiativeKanbanProjectionControls currentView={current} />

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
                  <th>Metadata</th>
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
                    <td style={{ verticalAlign: 'top', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '0.875rem' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {e.metadata ? JSON.stringify(e.metadata, null, 2) : '-'}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : current === 'kanban' ? (
        <>
          <h1 className={styles.heading}>Initiative Kanban Projection</h1>
          <InitiativeKanbanProjectionControls currentView={current} renderTableBelowHeading />
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
      ) : current === 'catalog' ? (
        <>
          <h1 className={styles.heading}>Initiative Catalog Projection</h1>
          <div className={`${styles.tableWrap} ${styles.catalogAccent}`}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Initiative</th>
                  <th>Team</th>
                  <th>Level</th>
                  <th>Strategy</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {catalog.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.name} ({r.id})</td>
                    <td>{r.teamName ?? r.teamId}</td>
                    <td>{typeof r.teamLevel === 'number' ? `L${r.teamLevel}` : '-'}</td>
                    <td>{r.strategyId}</td>
                    <td>{r.strategyState || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : current === 'companies' ? (
        <>
          <h1 className={styles.heading}>Companies Projection (Slice View)</h1>
          <div className={`${styles.tableWrap} ${styles.catalogAccent}`}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Company ID</th>
                  <th>Name</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No companies found in projections. Try rebuilding companies projection.
                    </td>
                  </tr>
                ) : (
                  companies.map((company: any) => (
                    <tr key={company.id}>
                      <td style={{ fontFamily: 'ui-monospace', fontSize: '0.875rem' }}>{company.id}</td>
                      <td style={{ fontWeight: 'bold' }}>{company.name}</td>
                      <td>{company.createdAt ? new Date(company.createdAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <h1 className={styles.heading}>Teams Projection (Slice View)</h1>
          <div className={`${styles.tableWrap} ${styles.catalogAccent}`}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Team ID</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Level</th>
                  <th>Purpose</th>
                  <th>Context</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No teams found in projections. Try rebuilding teams projection.
                    </td>
                  </tr>
                ) : (
                  teams.map((team: any) => (
                    <tr key={team.id}>
                      <td style={{ fontFamily: 'ui-monospace', fontSize: '0.875rem' }}>{team.id}</td>
                      <td style={{ fontWeight: 'bold' }}>{team.name}</td>
                      <td style={{ fontSize: '0.875rem' }}>{team.companyId}</td>
                      <td style={{ textAlign: 'center' }}>{typeof team.level === 'number' ? `L${team.level}` : '-'}</td>
                      <td style={{ fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {team.purpose || '-'}
                      </td>
                      <td style={{ fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {team.context || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
