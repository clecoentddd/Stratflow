"use client";

import React, { useState, useCallback } from "react";
import KanbanCardSimple from "./KanbanCardSimple";

type Initiative = { id: string; name: string; status?: string };

const COLUMNS: { key: string; label: string }[] = [
  { key: "NEW", label: "NEW" },
  { key: "STRATEGIC_THINKING", label: "STRATEGIC THINKING" },
  { key: "DECISIVENESS", label: "DECISIVENESS" },
  { key: "IMPLEMENTING", label: "IMPLEMENTING" },
  { key: "CLOSED", label: "CLOSED" },
];

function normalizeStatus(status?: string) {
  if (!status) return "NEW";
  const s = status.replace(/\s+/g, "_").toUpperCase();
  if (COLUMNS.some((c) => c.key === s)) return s;
  return "NEW";
}

export default function TeamKanbanBoard({ initialInitiatives = [] }: { initialInitiatives?: Initiative[] }) {
  // Convert projection rows to local state with a status we understand
  const initial = (initialInitiatives || []).map((i: any) => ({
    id: String(i.id),
    name: i.name ?? String(i.id),
    status: normalizeStatus(i.status),
  }));

  const [cards, setCards] = useState<Initiative[]>(initial);

  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    try {
      e.dataTransfer.setData("text/plain", id);
      // make sure drop effects are allowed
      e.dataTransfer.effectAllowed = "move";
    } catch (err) {
      // ignore
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: columnKey } : c)));
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 items-start">
        {COLUMNS.map((col) => {
          const colCards = cards.filter((c) => c.status === col.key);
          return (
            <div
              key={col.key}
              className="flex-1 min-w-[220px] bg-zinc-900/40 rounded-md p-3"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.key)}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">{col.label}</h3>
                <span className="text-xs text-muted-foreground">{colCards.length}</span>
              </div>
              <div className="space-y-2 min-h-[80px]">
                {colCards.map((c) => (
                  <KanbanCardSimple key={c.id} initiative={c} onDragStart={onDragStart} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
