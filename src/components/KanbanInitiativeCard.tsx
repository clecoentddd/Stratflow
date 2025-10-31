import React, { useRef } from "react";
import { InitiativeCatalogRow } from "@/lib/domain/initiatives-catalog/projection";

type KanbanInitiativeCardProps = {
  initiative: InitiativeCatalogRow & { status: string };
  onMove: (id: string, newStatus: string) => void;
  statuses: readonly string[];
};

export function KanbanInitiativeCard({ initiative, onMove, statuses }: KanbanInitiativeCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Simple drag-and-drop
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("id", initiative.id);
  };
  const handleDrop = (e: React.DragEvent, status: string) => {
    const id = e.dataTransfer.getData("id");
    if (id) onMove(id, status);
  };

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        marginBottom: 8,
        padding: "0.75rem 1rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        cursor: "grab"
      }}
    >
      <div style={{ fontWeight: 600 }}>{initiative.name}</div>
      {initiative.teamName && (
        <div style={{ fontSize: 12, color: "#64748b" }}>Team: {initiative.teamName}</div>
      )}
      <div style={{ marginTop: 8 }}>
        Move to:
        {statuses.filter(s => s !== initiative.status).map(s => (
          <button
            key={s}
            style={{ marginLeft: 6, padding: "2px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #e5e7eb", background: "#f1f5f9", cursor: "pointer" }}
            onClick={() => onMove(initiative.id, s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
