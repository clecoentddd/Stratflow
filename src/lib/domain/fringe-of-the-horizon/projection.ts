import { _getAllEvents } from '@/lib/db/event-store';
import type { TeamEvent } from '@/lib/domain/teams/events';

export type FringeItem = {
  id: string;
  teamId: string;
  teamName: string;
  teamLevel: number;
  created_at: string;
  name: string;
  detect: string;
  assess: string;
  respond: string;
  type: string;
  category: string;
  distance: string;
  impact: string;
  tolerance: string;
  zoom_in: string | null;
};

export async function getFringeOfTheHorizonProjection(limit = 20): Promise<FringeItem[]> {
  const allEvents = await _getAllEvents();
  const teamEvents = allEvents.filter(e => e.entity === 'team') as TeamEvent[];

  const teamInfo = new Map<string, { name: string; level: number }>();
  const items = new Map<string, FringeItem & { deleted?: boolean }>();

  teamEvents
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach(event => {
      switch (event.type) {
        case 'TeamCreated': {
          teamInfo.set(event.aggregateId, { name: event.payload.name, level: event.payload.level });
          break;
        }
        case 'TeamUpdated': {
          const existing = teamInfo.get(event.aggregateId);
          teamInfo.set(event.aggregateId, { name: event.payload.name, level: existing?.level ?? 0 });
          break;
        }
        case 'RadarItemCreated': {
          const p: any = event.payload as any;
          const t = teamInfo.get(event.aggregateId);
          items.set(p.id, {
            id: p.id,
            teamId: event.aggregateId,
            teamName: t?.name ?? '',
            teamLevel: t?.level ?? 0,
            created_at: p.created_at,
            name: p.name,
            detect: p.detect,
            assess: p.assess,
            respond: p.respond,
            type: p.type,
            category: p.category,
            distance: p.distance,
            impact: p.impact,
            tolerance: p.tolerance,
            zoom_in: p.zoom_in ?? null,
          });
          break;
        }
        case 'RadarItemUpdated': {
          const p: any = event.payload as any;
          const existing = items.get(p.id);
          if (existing) {
            items.set(p.id, {
              ...existing,
              name: p.name ?? existing.name,
              detect: p.detect ?? existing.detect,
              assess: p.assess ?? existing.assess,
              respond: p.respond ?? existing.respond,
              type: p.type ?? existing.type,
              category: p.category ?? existing.category,
              distance: p.distance ?? existing.distance,
              impact: p.impact ?? existing.impact,
              tolerance: p.tolerance ?? existing.tolerance,
              zoom_in: p.zoom_in ?? existing.zoom_in,
            });
          }
          break;
        }
        case 'RadarItemDeleted': {
          const p: any = event.payload as any;
          const existing = items.get(p.id);
          if (existing) {
            items.set(p.id, { ...existing, deleted: true });
          }
          break;
        }
        default:
          break;
      }
    });

  const result = Array.from(items.values())
    .filter(i => !i.deleted)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
    .map(({ deleted, ...i }) => i);

  return result;
}
