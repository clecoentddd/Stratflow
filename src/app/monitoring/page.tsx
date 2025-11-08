import { getEventLogProjection } from '@/lib/domain/event-log';
import '@/lib/domain/event-log/projection'; // Ensure handlers are registered
import EventLogProjectionControls from '@/lib/domain/event-log/ui/EventLogProjectionControls';
import { CompaniesProjectionControls } from '@/lib/domain/companies/ui/CompaniesProjectionControls';
import { TeamsProjectionControls } from '@/lib/domain/teams/ui/TeamsProjectionControls';
import { InitiativeLinksProjectionControls } from '@/lib/domain/initiatives-linking/ui/InitiativeLinksProjectionControls';

import { InitiativeCatalogProjectionControls } from '@/lib/domain/initiatives-catalog/ui/InitiativeCatalogProjectionControls';
import { queryEligibleInitiatives } from '@/lib/domain/initiatives-catalog/projection';
import { queryInitiativeItems } from '@/lib/domain/initiative-items/api';

import styles from '@/lib/domain/monitoring/styles/monitoring.module.css';

type SearchParams = { view?: 'events' | 'links' | 'catalog' | 'companies' | 'teams' | 'kanban' | 'initiatives' | 'items' };

export default async function MonitoringPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { view } = await searchParams;
  const current = view === 'links' || view === 'catalog' || view === 'companies' || view === 'teams' || view === 'kanban' || view === 'initiatives' || view === 'items' ? view : 'events';

  const [events, links, catalog, companies, teams, initiatives, items] = await Promise.all([
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
    })() : Promise.resolve([] as any[]),
    current === 'initiatives' ? queryEligibleInitiatives() : Promise.resolve([] as any[]),
    current === 'items' ? queryInitiativeItems() : Promise.resolve([] as any[])
  ]);

  // Compose controls for toolbar
  const controls = (
    <>
  <a href="/monitoring?view=events" className={`${styles.tab} ${styles.eventsTab} ${current === 'events' ? styles.tabActive : ''}`}>Event Log</a>
  <a href="/monitoring?view=links" className={`${styles.tab} ${styles.linksTab} ${current === 'links' ? styles.tabActive : ''}`}>Initiative Links</a>
  <a href="/monitoring?view=catalog" className={`${styles.tab} ${styles.catalogTab} ${current === 'catalog' ? styles.tabActive : ''}`}>Initiative Catalog</a>
  <a href="/monitoring?view=companies" className={`${styles.tab} ${styles.catalogTab} ${current === 'companies' ? styles.tabActive : ''}`}>Companies</a>
  <a href="/monitoring?view=teams" className={`${styles.tab} ${styles.catalogTab} ${current === 'teams' ? styles.tabActive : ''}`}>Teams</a>
  <a href="/monitoring?view=kanban" className={`${styles.tab} ${styles.catalogTab} ${current === 'kanban' ? styles.tabActive : ''}`}>Kanban</a>
  <a href="/monitoring?view=initiatives" className={`${styles.tab} ${styles.catalogTab} ${current === 'initiatives' ? styles.tabActive : ''}`}>Initiatives</a>
  <a href="/monitoring?view=items" className={`${styles.tab} ${styles.catalogTab} ${current === 'items' ? styles.tabActive : ''}`}>Items</a>
      <span className={styles.spacer}>
        <EventLogProjectionControls currentView={current} />
        <InitiativeLinksProjectionControls currentView={current} />
        <InitiativeCatalogProjectionControls currentView={current} />
        <CompaniesProjectionControls currentView={current} />
        <TeamsProjectionControls currentView={current} />
      </span>
    </>
  );

  const MonitoringPageUI = (await import('@/lib/domain/monitoring/MonitoringPageUI')).MonitoringPageUI;
  return (
    <MonitoringPageUI
      current={current}
      events={events}
      links={links}
      catalog={catalog}
      companies={companies}
      teams={teams}
      initiatives={initiatives}
      items={items}
      styles={styles}
      controls={controls}
    />
  );
}
