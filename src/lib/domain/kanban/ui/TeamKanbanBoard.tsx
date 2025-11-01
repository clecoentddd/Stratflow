"use client";

import React, { useState, useCallback } from "react";
import KanbanCardSimple from "./KanbanCardSimple";
import styles from "./kanban.module.css";

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

  const ACCENT_GREEN = "#0c8";

  return (
    <div className={styles.columnsWrapper}>
      <div className={styles.columns} style={{ minHeight: 120 }}>
        {COLUMNS.map((col) => {
          const colCards = cards.filter((c) => c.status === col.key);
          return (
            <div
              key={col.key}
              className={styles.column}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.key)}
            >
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.columnHeader}>{col.label}</h3>
                <span className={styles.columnCount}>{colCards.length}</span>
              </div>
              <div className={styles.columnBoard}>
                {colCards.map((c) => (
                  <KanbanCardSimple
                    key={c.id}
                    initiative={c}
                    onDragStart={onDragStart}
                    style={{ borderLeft: `4px solid ${ACCENT_GREEN}`, paddingLeft: 12 }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
