import { NextResponse } from 'next/server';
import { waitForEventStore } from '@/lib/db/event-store';
import {
	getKanbanInitiativesProjection,
	rebuildKanbanInitiativesProjection,
} from '@/lib/domain/unified-kanban/projection/kanban-initiatives-projection';
import {
	getKanbanInitiativeItemProjection,
	rebuildKanbanInitiativeItemProjection,
} from '@/lib/domain/unified-kanban/projection/kanban-initiative-item-projection';

type ProjectionType = 'initiatives' | 'items' | 'all';

type SerializedEntry = {
	id: string;
	type: string;
	status: string;
	boardId?: string;
	metadata: {
		teamId?: string;
		addedAt: string;
		updatedAt: string;
	};
};

function serialize(snapshot: Record<string, { type: string; status: string; boardId?: string; teamId?: string; addedAt: string; updatedAt: string }>): SerializedEntry[] {
	return Object.entries(snapshot).map(([id, entry]) => ({
		id,
		type: entry.type,
		status: entry.status,
		boardId: entry.boardId,
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

	const type: ProjectionType = typeParam === 'initiatives' || typeParam === 'all' ? typeParam : 'items';

	console.log('[KANBAN PROJECTION API] GET requested for type:', type);

	if (type === 'initiatives') {
		const snapshot = getKanbanInitiativesProjection();
		const elements = serialize(snapshot);
		console.log('[KANBAN PROJECTION API] Initiatives count:', elements.length);
		return NextResponse.json({ type, elements });
	}

	if (type === 'all') {
		const initiatives = serialize(getKanbanInitiativesProjection());
		const items = serialize(getKanbanInitiativeItemProjection());
		console.log('[KANBAN PROJECTION API] Aggregated totals:', {
			initiatives: initiatives.length,
			items: items.length,
		});
		return NextResponse.json({
			type,
			elements: [...initiatives, ...items],
			summary: {
				initiatives: initiatives.length,
				items: items.length,
			},
		});
	}

	const itemsSnapshot = getKanbanInitiativeItemProjection();
	const elements = serialize(itemsSnapshot);
	console.log('[KANBAN PROJECTION API] Items count:', elements.length);
	return NextResponse.json({ type: 'items', elements });
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
