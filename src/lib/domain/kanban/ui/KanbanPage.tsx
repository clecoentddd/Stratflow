"use client";

import React, { useMemo, useState } from "react";
import TeamKanbanBoard from "./TeamKanbanBoard";

type KanbanPageProps = {
  initialTeams: Array<{ id: string; name?: string; level?: number }>;
  initialInitiativesByTeam: Record<string, any[]>;
};

export function KanbanPage({ initialTeams, initialInitiativesByTeam }: KanbanPageProps) {
  // sort teams by level (0 first)
  const teamsSorted = useMemo(() => {
    return [...(initialTeams || [])].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  }, [initialTeams]);

  // default: no teams selected on load (user requested)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedTeamIds(teamsSorted.map((t) => t.id));
  const clearAll = () => setSelectedTeamIds([]);

  // simple palette: green, blue, sharp pink
  const ACCENT_GREEN = "#0c8";
  const ACCENT_BLUE = "#388cfa";
  const ACCENT_PINK = "#ff006e";

  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kanban</h1>
        <div className="text-sm text-muted-foreground">Filter teams and view their boards</div>
      </header>

      <div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterOpen((s) => !s)}
            className="px-3 py-1 rounded text-sm"
            style={{ background: filterOpen ? ACCENT_BLUE : 'transparent', color: filterOpen ? '#fff' : 'inherit', border: `1px solid ${ACCENT_BLUE}` }}
          >
            {filterOpen ? 'Hide team selector' : 'Show team selector'}
          </button>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-white text-xs px-2 py-1 rounded" style={{ background: ACCENT_BLUE }}>
              All
            </button>
            <button onClick={clearAll} className="text-white text-xs px-2 py-1 rounded" style={{ background: ACCENT_PINK }}>
              Clear
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="mt-3 bg-zinc-900/40 p-3 rounded">
            <label className="block text-xs mb-2">Select teams (hold Ctrl/Cmd for multiple)</label>
            <select
              multiple
              size={6}
              value={selectedTeamIds}
              onChange={(e) => {
                const options = Array.from(e.target.options);
                const vals = options.filter((o) => o.selected).map((o) => o.value);
                setSelectedTeamIds(vals);
              }}
              className="w-full bg-transparent border rounded p-1 text-sm"
            >
              {teamsSorted.map((t) => (
                <option key={t.id} value={t.id}>{t.name ?? t.id} (Level {t.level ?? 0})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <main>
        {selectedTeamIds.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No teams selected</div>
        ) : (
          <div className="space-y-6">
            {selectedTeamIds.map((teamId) => {
              const team = teamsSorted.find((t) => t.id === teamId)!;
              return (
                <section key={teamId} className="bg-zinc-900/30 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">{team.name ?? team.id}</h2>
                    <div className="text-sm" style={{ color: ACCENT_GREEN }}>Level {team.level ?? 0}</div>
                  </div>
                  <TeamKanbanBoard initialInitiatives={(initialInitiativesByTeam[teamId] ?? []) as any[]} />
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default KanbanPage;
