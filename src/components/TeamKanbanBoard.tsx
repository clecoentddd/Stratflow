import React, { useState } from "react";
import { queryEligibleInitiatives, InitiativeCatalogRow } from "@/lib/domain/initiatives-catalog/projection";
import { KanbanInitiativeCard } from "@/components/KanbanInitiativeCard";

const STATUSES = ["New", "Draft", "Active", "Closed", "Obsolete"];

export function TeamKanbanBoard({ teamId }: { teamId: string }) {
  type InitiativeWithStatus = InitiativeCatalogRow & { status: string };
  const [initiatives, setInitiatives] = useState<InitiativeWithStatus[]>(() => {
    // Get all initiatives and filter by teamId, add local status property
    return queryEligibleInitiatives().filter(i => i.teamId === teamId).map(i => ({ ...i, status: "New" }));
  });

  // Drag-and-drop logic
  const onMoveInitiative = (initiativeId: string, newStatus: string) => {
    setInitiatives((prev: InitiativeWithStatus[]) =>
      prev.map((i: InitiativeWithStatus) =>
        i.id === initiativeId ? { ...i, status: newStatus } : i
      )
    );
  };

  return (
    <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
      {STATUSES.map(status => (
        <div key={status} style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ textAlign: "center", fontWeight: 600, marginBottom: "1rem" }}>{status}</h2>
          <div style={{ background: "#f8fafc", borderRadius: 8, minHeight: 300, padding: 8 }}>
            {initiatives.filter((i: InitiativeWithStatus) => i.status === status).map((initiative: InitiativeWithStatus) => (
              <KanbanInitiativeCard
                key={initiative.id}
                initiative={initiative}
                onMove={onMoveInitiative}
                statuses={STATUSES}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
