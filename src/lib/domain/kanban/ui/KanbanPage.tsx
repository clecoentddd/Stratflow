"use client";

import React, { useMemo, useState } from "react";
import TeamKanbanBoard from "./TeamKanbanBoard";
import TeamSelectorDialog from "./TeamSelectorDialog";
import { Button } from "@/components/ui/button";

type KanbanPageProps = {
  initialTeams: Array<{ id: string; name?: string; level?: number }>; 
  initialInitiativesByTeam: Record<string, any[]>;
};

export function KanbanPage({ initialTeams, initialInitiativesByTeam }: KanbanPageProps) {
  // client: no debug logs here
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(initialTeams.map(t => t.id));

  // filtered teams based on selection
  const visibleTeams = useMemo(() => initialTeams.filter(t => selectedTeamIds.includes(t.id)), [initialTeams, selectedTeamIds]);

  // group visible teams by level (ascending)
  const groupedByLevel = useMemo(() => {
    const m = new Map<number, typeof visibleTeams>();
    for (const t of visibleTeams) {
      const lvl = typeof t.level === 'number' ? t.level : 999;
      if (!m.has(lvl)) m.set(lvl, [] as any);
      m.get(lvl)!.push(t);
    }
    return Array.from(m.entries()).sort((a,b) => a[0] - b[0]);
  }, [visibleTeams]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Strategic Initiatives Kanban</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="bg-[#0c8] text-white hover:brightness-90"
          >
            Select teams
          </Button>
        </div>
      </div>

      <TeamSelectorDialog
        teams={initialTeams}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedIds={selectedTeamIds}
        onChange={(ids) => setSelectedTeamIds(ids.length ? ids : initialTeams.map(t => t.id))}
      />

  <div className="space-y-4 bg-[#071018] p-4 rounded-md">
        {initialTeams.length === 0 ? (
          <div className="text-muted-foreground">No teams available</div>
        ) : (
          groupedByLevel.map(([level, teams]) => (
            <div key={`level-${level}`}>
              {teams.length > 1 ? (
                <div className="mb-3 py-1 px-2 rounded-md bg-muted/10 border border-muted/10 text-sm text-muted-foreground">Level {level}</div>
              ) : null}
              <div className="space-y-4">
                {teams.map((team) => (
                  <section key={team.id} className="bg-gradient-to-br from-[#061016] to-[#08121a] p-4 rounded-md shadow-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium text-slate-100">{team.name ?? `Team ${team.id}`} <span className="text-sm text-muted-foreground">(level: {typeof team.level === 'number' ? team.level : '—'})</span></h2>
                     </div>
                    <TeamKanbanBoard
                      initialInitiatives={(initialInitiativesByTeam[team.id] ?? []) as any[]}
                    />
                  </section>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default KanbanPage;
