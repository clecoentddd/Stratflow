"use client";

import React from "react";

type Initiative = { id: string; name: string; status?: string };

export default function KanbanInitiativeCard({
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

/*

"use client";

import React, { useRef } from "react";
import { InitiativeCatalogRow } from "@/lib/domain/initiatives-catalog/projection";
import { setDraggingId, clearDraggingId } from "./dragState";

type Status = 'New' | 'Draft' | 'Decisiveness' | 'Active' | 'Closed' | 'Obsolete';

type KanbanInitiativeCardProps = {
  initiative: InitiativeCatalogRow & { 
    status: Status;
    teamName: string;
  };
  onMove: (id: string, newStatus: Status) => void;
  statuses: readonly Status[];
};

export function KanbanInitiativeCard({ initiative, onMove, statuses }: KanbanInitiativeCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    try {
      e.dataTransfer.setData('text/plain', initiative.id);
      try { e.dataTransfer.setData('text/uri-list', initiative.id); } catch (e) {}
      try { e.dataTransfer.setData('id', initiative.id); } catch (e) {}
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.dropEffect = 'move'; } catch (e) {}
      console.log('dragstart initiative id=', initiative.id, 'dataTransfer types=', e.dataTransfer.types);
      // transparent drag image so underlying columns remain hittable
      try {
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        try { e.dataTransfer.setDragImage(img, 0, 0); } catch (err) { }
      } catch (err) {}
      try {
        const el = e.currentTarget as HTMLElement | null;
        if (el) { el.style.pointerEvents = 'none'; }
      } catch (err) {}
      try { setDraggingId(initiative.id); } catch (e) {}
    } catch (err) {
      try { e.dataTransfer.setData('id', initiative.id); } catch (e) {}
      console.log('dragstart (fallback) initiative id=', initiative.id);
      try { setDraggingId(initiative.id); } catch (e) {}
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    try { console.log('dragend initiative id=', initiative.id, 'dropEffect=', e.dataTransfer.dropEffect); } catch (e) { console.log('dragend', initiative.id); }
    try {
      const el = e.currentTarget as HTMLElement | null;
      if (el) { el.style.pointerEvents = 'auto'; }
    } catch (err) {}
    try { clearDraggingId(); } catch (e) {}
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    console.log('pointerdown on card', initiative.id, 'target=', (e.target as HTMLElement)?.tagName);
    try { setDraggingId(initiative.id); } catch (e) {}
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try { clearDraggingId(); } catch (e) {}
  };

  console.log('Rendered KanbanInitiativeCard for', initiative.id);

  return (
    <div
      ref={ref}
      draggable
      onDragStart={(e) => { console.log('parent onDragStart target=', (e.target as HTMLElement)?.tagName, 'currentTarget=', (e.currentTarget as HTMLElement)?.tagName); handleDragStart(e); }}
      onDragEnd={(e) => { console.log('parent onDragEnd target=', (e.target as HTMLElement)?.tagName, 'currentTarget=', (e.currentTarget as HTMLElement)?.tagName, 'dropEffect=', e.dataTransfer?.dropEffect); handleDragEnd(e); }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onDragOver={(e) => e.preventDefault()}
      className="relative bg-white border border-gray-200 rounded-md p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div
        draggable
        onDragStart={(e) => { console.log('handle onDragStart target=', (e.target as HTMLElement)?.tagName, 'currentTarget=', (e.currentTarget as HTMLElement)?.tagName); handleDragStart(e); }}
        onDragEnd={(e) => { console.log('handle onDragEnd target=', (e.target as HTMLElement)?.tagName, 'currentTarget=', (e.currentTarget as HTMLElement)?.tagName); handleDragEnd(e); }}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-grab bg-red-400"
        aria-label="Drag handle"
        title="Drag to move"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="5" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="19" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/></svg>
      </div>
      <div className="font-medium text-gray-900">{initiative.name}</div>
      <div className="mt-1 text-sm text-gray-500">Team: {initiative.teamName}</div>
      {initiative.strategyName && (<div className="mt-1 text-xs text-gray-400">Strategy: {initiative.strategyName}</div>)}
    </div>
  );
}
"use client";

import React, { useRef } from "react";
import { InitiativeCatalogRow } from "@/lib/domain/initiatives-catalog/projection";
import { setDraggingId, clearDraggingId } from "./dragState";

type Status = 'New' | 'Draft' | 'Decisiveness' | 'Active' | 'Closed' | 'Obsolete';

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

  // Simple drag-and-drop (only set the drag data here). The column
  // drop handler handles the actual move so cards don't intercept drops.
  const handleDragStart = (e: React.DragEvent) => {
    try {
      e.dataTransfer.setData('text/plain', initiative.id);
      try { e.dataTransfer.setData('text/uri-list', initiative.id); } catch (e) {}
      try { e.dataTransfer.setData('id', initiative.id); } catch (e) {}
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.dropEffect = 'move'; } catch (e) {}
      console.log('dragstart initiative id=', initiative.id, 'dataTransfer types=', e.dataTransfer.types);
      try {
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        try { e.dataTransfer.setDragImage(img, 0, 0); } catch (err) { }
      } catch (err) {}
      try {
        const el = e.currentTarget as HTMLElement | null;
        if (el) { el.style.pointerEvents = 'none'; }
      } catch (err) {}
  try { setDraggingId(initiative.id); } catch (e) {}

*/
