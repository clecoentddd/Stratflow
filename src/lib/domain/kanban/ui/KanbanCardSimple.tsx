"use client";

import React from "react";

type Initiative = { id: string; name: string; status?: string };

export default function KanbanCardSimple({
  initiative,
  onDragStart,
}: {
  initiative: Initiative;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, initiative.id)}
      className="cursor-grab select-none rounded-md bg-white/5 p-3 text-sm shadow-sm"
      title={initiative.name}
    >
      {initiative.name}
    </div>
  );
}
