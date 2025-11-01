"use client";

import React, { useCallback, useMemo, useState } from "react";
import KanbanCardSimple from "./KanbanCardSimple";

type Initiative = { id: string; name: string; status?: string };

const COLUMNS = ["NEW", "STRATEGIC THINKING", "DECISIVENSS", "IMPLEMENTING", "CLOSED"];

export default function KanbanMatrix({
  teams,
  initiativesByTeam,
}: {
  teams: Array<{ id: string; name?: string; level?: number }>;
  initiativesByTeam: Record<string, any[]>;
}) {
  // local mutable copy of initiatives per team for UI-only moves
  const initial = useMemo(() => {
    const m: Record<string, Initiative[]> = {};
    for (const t of teams) {
      const rows = (initiativesByTeam[t.id] ?? []).map((r: any) => ({ id: String(r.id), name: r.name ?? String(r.id), status: (r.status || 'NEW').toUpperCase() }));
      m[t.id] = rows;
    }
    return m;
  }, [teams, initiativesByTeam]);

  const [state, setState] = useState<Record<string, Initiative[]>>(initial);

  const onDragStart = useCallback((e: React.DragEvent, id: string, teamId: string) => {
    try {
      e.dataTransfer.setData('application/json', JSON.stringify({ id, teamId }));
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
    } catch (err) {}
  }, []);

  const onDrop = useCallback((e: React.DragEvent, toTeamId: string, toStatus: string) => {
    e.preventDefault();
    let payload = null;
    try {
      const txt = e.dataTransfer.getData('application/json');
      if (txt) payload = JSON.parse(txt);
    } catch (err) {}
    if (!payload) {
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      payload = { id, teamId: toTeamId };
    }

    const { id, teamId: fromTeamId } = payload as { id: string; teamId: string };
    setState((prev) => {
      const copy: Record<string, Initiative[]> = {};
      for (const k of Object.keys(prev)) copy[k] = [...prev[k]];

      // find and remove from source
      const src = copy[fromTeamId] || [];
      const idx = src.findIndex((c) => c.id === id);
      let card: Initiative | undefined = undefined;
      if (idx >= 0) {
        [card] = src.splice(idx, 1);
      } else {
        // card not found in source (maybe transport only id) create minimal
        card = { id, name: id, status: toStatus };
      }

      // update status and add to target
      if (card) {
        card = { ...card, status: toStatus };
        const dest = copy[toTeamId] ||= [];
        dest.push(card);
      }

      return copy;
    });
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch (err) {}
  }, []);

  return (
    <div className="overflow-auto">
      {/* Column headers */}
      <div className="flex bg-zinc-900/20 rounded-t-md p-3">
        <div className="w-48 pr-4" />{/* spacer for team column */}
        {COLUMNS.map((col) => (
          <div key={col} className="flex-1 text-sm font-medium text-center" style={{ color: '#388cfa' }}>{col}</div>
        ))}
      </div>

      {/* Swimlanes */}
      <div className="space-y-2">
        {teams.map((t) => (
          <div key={t.id} className="flex items-start border-t border-zinc-700/40 p-3">
            <div className="w-48 pr-4">
              <div className="font-medium">{t.name ?? t.id}</div>
              <div className="text-xs text-muted-foreground">Level {t.level ?? 0}</div>
            </div>

            {COLUMNS.map((col) => {
              const list = state[t.id] ? state[t.id].filter((c) => (c.status || 'NEW') === col || ((c.status || '').toUpperCase() === col)) : [];
              return (
                <div key={col} className="flex-1 min-h-[72px] p-2">
                  <div
                    className="min-h-[48px] p-1 rounded-md"
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, t.id, col)}
                    style={{ background: 'transparent' }}
                  >
                    <div className="space-y-2">
                      {list.map((c) => (
                        <div key={c.id} draggable onDragStart={(e) => onDragStart(e, c.id, t.id)}>
                          <KanbanCardSimple initiative={c} onDragStart={(e) => onDragStart(e, c.id, t.id)} style={{ borderLeft: '4px solid #0c8', paddingLeft: 12 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
