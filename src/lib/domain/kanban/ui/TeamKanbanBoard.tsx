"use client";

import React, { useState, useCallback } from "react";
import KanbanCardSimple from "./KanbanCardSimple";
import styles from "./kanban.module.css";

type Initiative = { id: string; name: string; status?: string; strategyName?: string };

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
    strategyName: i.strategyName, // Pass through strategy name
  }));

  const [cards, setCards] = useState<Initiative[]>(initial);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    try {
      e.dataTransfer.setData("text/plain", id);
      // make sure drop effects are allowed
      e.dataTransfer.effectAllowed = "move";
      setIsDragging(true);
    } catch (err) {
      // ignore
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: columnKey } : c)));
    setIsDragging(false);
    setDragOverColumn(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  }, []);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOverColumn(null);
  }, []);

  const ACCENT_GREEN = "#0c8";

  return (
    <div className={`${styles.columnsWrapper} ${isDragging ? styles.dragging : ''}`}>
      <div className={styles.columns} style={{ minHeight: 120 }}>
        {COLUMNS.map((col) => {
          const colCards = cards.filter((c) => c.status === col.key);
          const isCurrentDragOver = dragOverColumn === col.key;
          
          return (
            <div
              key={col.key}
              className={styles.column}
              onDragOver={(e) => onDragOver(e, col.key)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, col.key)}
            >
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className={styles.columnHeader}>{col.label}</h3>
                <span className={styles.columnCount}>{colCards.length}</span>
              </div>
              <div className={`${styles.columnBoard} ${isCurrentDragOver ? styles.dragOver : ''}`}>
                {colCards.map((c) => (
                  <KanbanCardSimple
                    key={c.id}
                    initiative={c}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
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
