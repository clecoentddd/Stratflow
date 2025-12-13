import { NextResponse } from 'next/server';
import { waitForEventStore } from '@/lib/db/event-store';
import {
	getKanbanInitiativesProjection,
	rebuildKanbanInitiativesProjection,
	queryInitiativesKanbanBoard,
} from '@/lib/domain/unified-kanban/projection/kanban-initiatives-projection';
import {
	getKanbanInitiativeItemProjection,
	rebuildKanbanInitiativeItemProjection,
	queryInitiativeItemsKanbanBoard,
} from '@/lib/domain/unified-kanban/projection/kanban-initiative-item-projection';
import type { KanbanProjectionEntry } from '@/lib/domain/unified-kanban/types';

type ProjectionType = 'initiatives' | 'items' | 'all';

type SerializedEntry = {
	id: string;
	type: string;
	status: string;
	boardId?: string;
	name?: string;
	metadata: {
		teamId?: string;
		addedAt: string;
		updatedAt: string;
	};
};

function serializeSnapshot(snapshot: Record<string, KanbanProjectionEntry>): SerializedEntry[] {
	return Object.entries(snapshot).map(([id, entry]) => ({
		id,
		type: entry.type,
		status: entry.status,
		boardId: entry.boardId,
		name: entry.name,
		metadata: {
			teamId: entry.teamId,
			addedAt: entry.addedAt,
			updatedAt: entry.updatedAt,
		},
	}));
}

export async function GET(req: Request) {
	await waitForEventStore();
	const { searchParams } = new URL(req.url);
	const typeParam = (searchParams.get('type') as ProjectionType | null) ?? 'items';
	const companyId = searchParams.get('companyId') ?? undefined;

	const type: ProjectionType = typeParam === 'initiatives' || typeParam === 'all' ? typeParam : 'items';

	console.log('[KANBAN PROJECTION API] GET requested for type:', type);
	console.log('DEBUG_KNB monitoring/projection', {
		type,
		companyId,
	});

	if (type === 'initiatives') {
		const snapshot = getKanbanInitiativesProjection();
		if (!companyId) {
			const elements = serializeSnapshot(snapshot);
			console.log('DEBUG_KNB monitoring/projection:initSnapshot', {
				count: elements.length,
			});
			console.log('[KANBAN PROJECTION API] Initiatives snapshot count:', elements.length);
			return NextResponse.json({ type, elements, projection: snapshot });
		}
		const board = queryInitiativesKanbanBoard({ companyId });
		console.log('DEBUG_KNB monitoring/projection:initBoard', {
			companyId,
			elements: board.elements.length,
		});
		console.log('[KANBAN PROJECTION API] Initiatives count:', board.elements.length);
		return NextResponse.json({
			type,
			columns: board.columns,
			swimlanes: board.swimlanes,
			elements: board.elements,
			metadata: board.metadata,
			projection: snapshot,
		});
	}

	if (type === 'all') {
		const initiativesSnapshot = getKanbanInitiativesProjection();
		const itemsSnapshot = getKanbanInitiativeItemProjection();
		if (!companyId) {
			const initiatives = serializeSnapshot(initiativesSnapshot);
			const items = serializeSnapshot(itemsSnapshot);
			console.log('[KANBAN PROJECTION API] Aggregated snapshot totals:', {
				initiatives: initiatives.length,
				items: items.length,
			});
			console.log('DEBUG_KNB monitoring/projection:allSnapshot', {
				initiatives: initiatives.length,
				items: items.length,
			});
			return NextResponse.json({
				type,
				initiatives,
				items,
				elements: [...initiatives, ...items],
				summary: {
					initiatives: initiatives.length,
					items: items.length,
				},
				projection: {
					initiatives: initiativesSnapshot,
					items: itemsSnapshot,
				},
			});
		}
		const initiativesBoard = queryInitiativesKanbanBoard({ companyId });
		const itemsBoard = queryInitiativeItemsKanbanBoard({ companyId });
		console.log('[KANBAN PROJECTION API] Aggregated totals:', {
			initiatives: initiativesBoard.elements.length,
			items: itemsBoard.elements.length,
		});
		console.log('DEBUG_KNB monitoring/projection:allBoard', {
			companyId,
			initiatives: initiativesBoard.elements.length,
			items: itemsBoard.elements.length,
		});
		return NextResponse.json({
			type,
			initiatives: initiativesBoard,
			items: itemsBoard,
			elements: [...initiativesBoard.elements, ...itemsBoard.elements],
			summary: {
				initiatives: initiativesBoard.elements.length,
				items: itemsBoard.elements.length,
			},
			projection: {
				initiatives: initiativesSnapshot,
				items: itemsSnapshot,
			},
		});
	}

	const snapshot = getKanbanInitiativeItemProjection();
	if (!companyId) {
		const elements = serializeSnapshot(snapshot);
		console.log('[KANBAN PROJECTION API] Items snapshot count:', elements.length);
		console.log('DEBUG_KNB monitoring/projection:itemSnapshot', {
			count: elements.length,
		});
		return NextResponse.json({ type: 'items', elements, projection: snapshot });
	}
	const board = queryInitiativeItemsKanbanBoard({ companyId });
	console.log('[KANBAN PROJECTION API] Items count:', board.elements.length);
	console.log('DEBUG_KNB monitoring/projection:itemBoard', {
		companyId,
		elements: board.elements.length,
	});
	return NextResponse.json({
		type: 'items',
		columns: board.columns,
		swimlanes: board.swimlanes,
		elements: board.elements,
		metadata: board.metadata,
		projection: snapshot,
	});
}

export async function POST(req: Request) {
	await waitForEventStore();
	const { searchParams } = new URL(req.url);
	const typeParam = (searchParams.get('type') as ProjectionType | null) ?? 'items';
	const type: ProjectionType = typeParam === 'initiatives' ? 'initiatives' : 'items';

	console.log('[KANBAN PROJECTION API] POST rebuild requested for type:', type);

	if (type === 'initiatives') {
		await rebuildKanbanInitiativesProjection();
		console.log('[KANBAN PROJECTION API] Initiatives projection rebuilt');
		return NextResponse.json({ status: 'ok', type });
	}

	await rebuildKanbanInitiativeItemProjection();
	console.log('[KANBAN PROJECTION API] Initiative items projection rebuilt');
	return NextResponse.json({ status: 'ok', type: 'items' });
}
