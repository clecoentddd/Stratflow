"use client";

import React from "react";
import TeamKanbanBoard from "./TeamKanbanBoard";

type KanbanPageProps = {
  initialTeams: Array<{ id: string; name?: string }>;
  initialInitiativesByTeam: Record<string, any[]>;
};

export function KanbanPage({ initialTeams, initialInitiativesByTeam }: KanbanPageProps) {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Kanban</h1>
      <div className="space-y-6">
        {initialTeams.length === 0 ? (
          <div className="text-muted-foreground">No teams available</div>
        ) : (
          initialTeams.map((team) => (
            <section key={team.id} className="bg-white/5 p-4 rounded-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">{team.name ?? `Team ${team.id}`}</h2>
                <div className="text-sm text-muted-foreground">Team ID: {team.id}</div>
              </div>
              <TeamKanbanBoard
                initialInitiatives={(initialInitiativesByTeam[team.id] ?? []) as any[]}
              />
            </section>
          ))
        )}
      </div>
    </div>
  );
}

export default KanbanPage;
