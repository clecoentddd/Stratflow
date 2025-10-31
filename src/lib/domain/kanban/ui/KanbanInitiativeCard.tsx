"use client";

import React, { useRef } from "react";
import { InitiativeCatalogRow } from "@/lib/domain/initiatives-catalog/projection";

type Status = 'New' | 'Draft' | 'Active' | 'Closed' | 'Obsolete';

type KanbanInitiativeCardProps = {
  initiative: InitiativeCatalogRow & { 
    status: Status;
    teamName: string;
  };
  onMove: (id: string, newStatus: Status) => void;
  statuses: readonly Status[];
};

export function KanbanInitiativeCard({ 
  initiative, 
  onMove, 
  statuses 
}: KanbanInitiativeCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Simple drag-and-drop
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("id", initiative.id);
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("id");
    if (id) onMove(id, status);
  };

  // Only show status options that are different from the current status
  const availableStatuses = statuses.filter(s => s !== initiative.status);

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, initiative.status)}
      className="bg-white border border-gray-200 rounded-md p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="font-medium text-gray-900">
        {initiative.name}
      </div>
      
      <div className="mt-1 text-sm text-gray-500">
        Team: {initiative.teamName}
      </div>
      
      {initiative.strategyName && (
        <div className="mt-1 text-xs text-gray-400">
          Strategy: {initiative.strategyName}
        </div>
      )}
      
      {availableStatuses.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Move to:</div>
          <div className="flex flex-wrap gap-1">
            {availableStatuses.map((status) => (
              <button
                key={status}
                onClick={() => onMove(initiative.id, status)}
                className="px-2 py-1 text-xs rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
