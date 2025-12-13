import { getEventLogProjection } from '@/lib/domain/event-log';
import '@/lib/domain/event-log/projection'; // Ensure handlers are registered
import { queryEligibleInitiatives } from '@/lib/domain/initiatives-catalog/projection';
import { queryInitiativeItems } from '@/lib/domain/initiative-items/api';

import { headers, cookies } from 'next/headers';
import { getUsersProjection } from '@/lib/domain/userManagement/user-projection';
import styles from '@/lib/domain/monitoring/styles/monitoring.module.css';

type SearchParams = {
  view?:
    | 'events'
    | 'links'
    | 'catalog'
    | 'companies'
    | 'teams'
    | 'kanban-initiatives'
    | 'kanban-items'
    | 'initiatives'
    | 'items'
    | 'tags';
};

export default async function MonitoringPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { view } = await searchParams;
  const current = view === 'links'
    || view === 'catalog'
    || view === 'companies'
    || view === 'teams'
    || view === 'kanban-initiatives'
    || view === 'kanban-items'
    || view === 'initiatives'
    || view === 'items'
    || view === 'tags'
    ? view
    : 'events';

  // Get current user company
  const users = await getUsersProjection();
  const cookieStore = await cookies();
  const userIdFromCookie = cookieStore.get('userId')?.value;
  const user = userIdFromCookie ? users.find(u => u.userId === userIdFromCookie) : undefined;
  const companyId = user?.companyId;

  const [events, links, catalog, companies, teams, initiatives, items, tagsProjection] = await Promise.all([
  current === 'events' ? getEventLogProjection() : Promise.resolve([] as any[]),
    current === 'links' ? (async () => {
      const mod = await import('@/lib/domain/initiatives-linking/projection');
      return mod.queryAllActiveLinks();
    })() : Promise.resolve([] as any[]),
    current === 'catalog' ? (async () => {
      const mod = await import('@/lib/domain/initiatives-catalog/projection');
      return mod.queryEligibleInitiatives({ companyId });
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
    current === 'initiatives' ? queryEligibleInitiatives({ companyId }) : Promise.resolve([] as any[]),
    current === 'items' ? queryInitiativeItems(companyId) : Promise.resolve([] as any[]),
    current === 'tags' ? (async () => {
      let url = '';
      if (typeof window === 'undefined') {
        // Server: build absolute URL
        const h = await headers();
        const host = h.get('host');
        url = `http://${host}/monitoring/projection/tags`;
      } else {
        // Client: relative is fine
        url = `/monitoring/projection/tags`;
      }
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.tagsProjection || [];
    })() : Promise.resolve([])
  ]);

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
      tagsProjection={tagsProjection}
      companyId={companyId}
    />
  );
}
