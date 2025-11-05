"use client";

import React from "react";
import styles from "./kanban.module.css";

type Initiative = { id: string; name?: string; status?: string; strategyName?: string };

export default function KanbanCardSimple({
  initiative,
  onDragStart,
  onDragEnd,
  style,
}: {
  initiative: Initiative;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, initiative.id)}
      onDragEnd={onDragEnd}
      className={styles.card}
      title={initiative.name}
      style={{ ...style }}
    >
      <div className="title">{initiative.name}</div>
      {initiative.strategyName && (
        <div className={styles.strategyName}>{initiative.strategyName}</div>
      )}
    </div>
  );
}
