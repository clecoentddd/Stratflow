import Link from 'next/link';
import React from 'react';
import EventLogProjectionControls from '@/lib/domain/event-log/ui/EventLogProjectionControls';
import { InitiativeLinksProjectionControls } from '@/lib/domain/initiatives-linking/ui/InitiativeLinksProjectionControls';
import { InitiativeCatalogProjectionControls } from '@/lib/domain/initiatives-catalog/ui/InitiativeCatalogProjectionControls';
import { CompaniesProjectionControls } from '@/lib/domain/companies/ui/CompaniesProjectionControls';
import { TeamsProjectionControls } from '@/lib/domain/teams/ui/TeamsProjectionControls';
import { KanbanProjectionSection } from './KanbanProjectionSection';

type MonitoringPageUIProps = {
  current: string;
  events: any[];
  links: any[];
  catalog: any[];
  companies: any[];
  teams: any[];
  initiatives: any[];
  items: any[];
  tagsProjection: Array<{ initiativeId: string; radarItemIds: string[] }>;
  styles: any;
  companyId?: string;
};

export function MonitoringPageUI(props: MonitoringPageUIProps) {
  const {
    current,
    events,
    links,
    catalog,
    companies,
    teams,
    initiatives,
    items,
    tagsProjection,
    styles,
    companyId,
  } = props;

  type TabDefinition = {
    key: string;
    label: string;
    summary: string;
    badgeClass: string;
    accentClass: string;
    description: string;
    query: string;
    actions: React.ReactNode | null;
    render: () => React.ReactNode;
  };

  const tabs: Array<TabDefinition> = [
    {
      key: 'events',
      label: 'Event Log',
      summary: 'Raw domain events flowing through the platform.',
      badgeClass: styles.eventsTab,
      accentClass: styles.eventsAccent,
      description: 'Inspect the raw event stream driving every projection in the system.',
      query: 'getEventLogProjection()',
      actions: <EventLogProjectionControls currentView={current} />,
      render: () => (
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
              {events.map((entry: any, idx: number) => (
                <tr key={`${entry.timestamp}-${entry.aggregateId}-${entry.type}-${idx}`}>
                  <td style={{ verticalAlign: 'top' }}>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td style={{ verticalAlign: 'top' }}>{entry.entity}</td>
                  <td style={{ verticalAlign: 'top' }}>{entry.type}</td>
                  <td style={{ verticalAlign: 'top' }}>{entry.aggregateId}</td>
                  <td style={{ verticalAlign: 'top', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '0.875rem' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  </td>
                  <td style={{ verticalAlign: 'top', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '0.875rem' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {entry.metadata ? JSON.stringify(entry.metadata, null, 2) : '-'}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      key: 'links',
      label: 'Initiative Links',
      summary: 'All cross-initiative relationships with team context.',
      badgeClass: styles.linksTab,
      accentClass: styles.linksAccent,
      description: 'View cross-team initiative relationships and their provenance.',
      query: 'queryAllActiveLinks()',
      actions: <InitiativeLinksProjectionControls currentView={current} />,
      render: () => (
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
              {links.map((record: any) => (
                <tr key={record.id}>
                  <td>{record.fromInitiativeId}</td>
                  <td>{record.toInitiativeId}</td>
                  <td>{record.fromTeamId} (L{record.fromTeamLevel ?? '-'})</td>
                  <td>{record.toTeamId} (L{record.toTeamLevel ?? '-'})</td>
                  <td>{new Date(record.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      key: 'catalog',
      label: 'Initiative Catalog',
      summary: 'Company-visible initiatives with rollup metadata.',
      badgeClass: styles.catalogTab,
      accentClass: styles.catalogAccent,
      description: `Catalog snapshot for company ${companyId ?? '—'} showing visible initiatives.`,
      query: 'queryEligibleInitiatives({ companyId })',
      actions: <InitiativeCatalogProjectionControls currentView={current} />,
      render: () => (
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
              {catalog.map((record: any) => (
                <tr key={record.id}>
                  <td>{record.name} ({record.id})</td>
                  <td>{record.teamName ?? record.teamId}</td>
                  <td>{typeof record.teamLevel === 'number' ? `L${record.teamLevel}` : '-'}</td>
                  <td>{record.strategyId}</td>
                  <td>{record.strategyState || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      key: 'companies',
      label: 'Companies',
      summary: 'Registered organisations from company projection.',
      badgeClass: styles.catalogTab,
      accentClass: styles.catalogAccent,
      description: 'Company directory derived from company domain events.',
      query: 'getCompaniesProjection()',
      actions: <CompaniesProjectionControls currentView={current} />,
      render: () => (
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
      ),
    },
    {
      key: 'teams',
      label: 'Teams',
      summary: 'Team roster including level, context and ownership.',
      badgeClass: styles.catalogTab,
      accentClass: styles.catalogAccent,
      description: 'Team slice extracted from company and team domain events.',
      query: 'getTeamsProjection()',
      actions: <TeamsProjectionControls currentView={current} />,
      render: () => (
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
      ),
    },
    {
      key: 'kanban-initiatives',
      label: 'Kanban (Initiatives)',
      summary: 'Unified initiative board with live swimlane status.',
      badgeClass: styles.catalogTab,
      accentClass: styles.catalogAccent,
      description: 'Monitor initiative-level flow sourced from the unified kanban projection.',
      query: 'queryInitiativesKanbanBoard({ companyId })',
      actions: null,
      render: () => (
        <KanbanProjectionSection
          key="kanban-initiatives"
          styles={styles}
          typePreset="initiatives"
          title="Initiatives Kanban"
          companyId={companyId}
        />
      ),
    },
    {
      key: 'kanban-items',
      label: 'Kanban (Items)',
      summary: 'Detailed initiative item board grouped by step.',
      badgeClass: styles.catalogTab,
      accentClass: styles.catalogAccent,
      description: 'Inspect initiative item movement with the kanban item projection.',
      query: 'queryInitiativeItemsKanbanBoard({ companyId })',
      actions: null,
      render: () => (
        <KanbanProjectionSection
          key="kanban-items"
          styles={styles}
          typePreset="items"
          title="Initiative Items Kanban"
          companyId={companyId}
        />
      ),
    },
    {
      key: 'initiatives',
      label: 'Initiatives',
      summary: 'Projection rows powering the initiative catalog.',
      badgeClass: styles.catalogTab,
      accentClass: styles.catalogAccent,
      description: 'Raw initiative rows from the catalog projection.',
      query: 'queryEligibleInitiatives({ companyId })',
      actions: <InitiativeCatalogProjectionControls currentView={current} />,
      render: () => (
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
              {initiatives.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No initiatives found in projection.
                  </td>
                </tr>
              ) : (
                initiatives.map((record: any) => (
                  <tr key={record.id}>
                    <td>{record.name} ({record.id})</td>
                    <td>{record.teamName ?? record.teamId}</td>
                    <td>{typeof record.teamLevel === 'number' ? `L${record.teamLevel}` : '-'}</td>
                    <td>{record.strategyId}</td>
                    <td>{record.strategyState || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      summary: 'Flattened initiative items with status and strategy link.',
      badgeClass: styles.catalogTab,
      accentClass: styles.catalogAccent,
      description: 'Flattened initiative items for kanban board insights.',
      query: 'queryInitiativeItems(companyId)',
      actions: null,
      render: () => (
        <div className={`${styles.tableWrap} ${styles.catalogAccent}`}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>Item ID</th>
                <th>Text</th>
                <th>Status</th>
                <th>Step</th>
                <th>Initiative ID</th>
                <th>Strategy ID</th>
                <th>Team ID</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No items found in projection.
                  </td>
                </tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'ui-monospace', fontSize: '0.875rem' }}>{item.id}</td>
                    <td>{item.text}</td>
                    <td>{item.status}</td>
                    <td>{item.stepKey}</td>
                    <td style={{ fontFamily: 'ui-monospace', fontSize: '0.875rem' }}>{item.initiativeId}</td>
                    <td style={{ fontFamily: 'ui-monospace', fontSize: '0.875rem' }}>{item.strategyId}</td>
                    <td style={{ fontFamily: 'ui-monospace', fontSize: '0.875rem' }}>{item.teamId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      summary: 'Initiative to radar tagging pairs for radar sync.',
      badgeClass: styles.catalogTab,
      accentClass: styles.catalogAccent,
      description: 'Initiative to radar item tagging projection.',
      query: 'GET /monitoring/projection/tags',
      actions: null,
      render: () => (
        <div className={`${styles.tableWrap} ${styles.catalogAccent}`}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>Initiative ID</th>
                <th>Radar Item IDs</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {tagsProjection.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No tags found in projection.
                  </td>
                </tr>
              ) : (
                tagsProjection.map(({ initiativeId, radarItemIds }) => (
                  <tr key={initiativeId}>
                    <td style={{ fontFamily: 'ui-monospace', fontSize: '0.875rem' }}>{initiativeId}</td>
                    <td style={{ fontFamily: 'ui-monospace', fontSize: '0.875rem' }}>{radarItemIds.join(', ')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  const activeTab = tabs.find(tab => tab.key === current) ?? tabs[0];

  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Monitoring</h1>
          <p className={styles.pageSubtitle}>
            Inspect and manage read-model projections with a unified dashboard.
          </p>
        </div>
      </header>

      <nav className={styles.tabList} aria-label="Projection selector">
        {tabs.map(tab => {
          const isActive = tab.key === activeTab.key;
          return (
            <Link
              key={tab.key}
              href={`/monitoring?view=${tab.key}`}
              className={`${styles.tab} ${tab.badgeClass} ${isActive ? styles.tabActive : ''}`}
            >
              <span className={styles.tabMeta}>{isActive ? 'Selected' : 'View'}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
              <span className={styles.tabSummary}>{tab.summary}</span>
            </Link>
          );
        })}
      </nav>

      <section className={`${styles.panel} ${activeTab.accentClass}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.sectionTitle}>{activeTab.label}</h2>
            <p className={styles.sectionSubtitle}>{activeTab.description}</p>
          </div>
          {activeTab.actions ? <div className={styles.actionGroup}>{activeTab.actions}</div> : null}
        </div>

        <div className={styles.queryBlock}>
          <span className={styles.queryLabel}>Query</span>
          <code className={styles.queryCode}>{activeTab.query}</code>
        </div>

        <div className={styles.panelBody}>{activeTab.render()}</div>
      </section>
    </main>
  );
}

