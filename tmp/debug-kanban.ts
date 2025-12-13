import { waitForEventStore } from '../src/lib/db/event-store';
import { queryInitiativesKanbanBoard } from '../src/lib/domain/unified-kanban/projection/kanban-initiatives-projection';
import { queryInitiativeItemsKanbanBoard } from '../src/lib/domain/unified-kanban/projection/kanban-initiative-item-projection';

async function main() {
  await waitForEventStore();
  const initiatives = queryInitiativesKanbanBoard({ companyId: 'company-socraft' });
  const initiativeItems = queryInitiativeItemsKanbanBoard({ companyId: 'company-socraft' });
  console.log('Initiatives statuses:', initiatives.elements.map(e => ({ id: e.id, status: e.status })));
  console.log('Items statuses:', initiativeItems.elements.map(e => ({ id: e.id, status: e.status })));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
