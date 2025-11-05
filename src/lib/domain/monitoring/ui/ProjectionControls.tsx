"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ProjectionControlsProps {
  projectionType: 'events' | 'links' | 'catalog' | 'companies' | 'teams';
  projectionName: string;
  currentView: string;
  isQueryTime?: boolean;
}

export default function ProjectionControls({ 
  projectionType, 
  projectionName, 
  currentView, 
  isQueryTime = false 
}: ProjectionControlsProps) {
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [emptyLoading, setEmptyLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onRebuild = async () => {
    console.log(`🔧 Starting rebuild for ${projectionName} (${projectionType})`);
    setRebuildLoading(true);
    try {
      // Events projection uses the legacy rebuild-projections endpoint
      const url = projectionType === 'events' 
        ? '/api/dev/rebuild-projections' 
        : `/api/dev/projections/${projectionType}`;
      console.log(`🔧 Calling POST ${url}`);
      
      const res = await fetch(url, { method: 'POST' });
      console.log(`🔧 Response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`🔧 ERROR: ${res.status} - ${errorText}`);
        alert(`Rebuild failed: ${res.status} - ${errorText}`);
        return;
      }
      
      // Events endpoint doesn't return JSON, just reads the response text
      if (projectionType === 'events') {
        console.log(`🔧 Rebuild ${projectionName} SUCCESS (all projections rebuilt)`);
        alert(`✅ ${projectionName} rebuild successful! (All projections rebuilt)`);
      } else {
        const result = await res.json();
        console.log(`🔧 Rebuild ${projectionName} SUCCESS:`, result);
        alert(`✅ ${projectionName} rebuild successful!`);
      }
    } catch (error) {
      console.error(`🔧 Failed to rebuild ${projectionName}:`, error);
      alert(`❌ Failed to rebuild ${projectionName}: ${error instanceof Error ? error.message : String(error)}`);
    }
    setRebuildLoading(false);
    startTransition(() => router.refresh());
  };

  const onEmpty = async () => {
    // Events cannot be "emptied" - they are the source of truth
    if (projectionType === 'events') {
      alert(`❌ Cannot empty Event Log - events are the source of truth for all projections`);
      return;
    }

    console.log(`🗑️ Starting empty for ${projectionName} (${projectionType})`);
    setEmptyLoading(true);
    try {
      const url = `/api/dev/projections/${projectionType}`;
      console.log(`🗑️ Calling DELETE ${url}`);
      
      const res = await fetch(url, { method: 'DELETE' });
      console.log(`🗑️ Response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`🗑️ ERROR: ${res.status} - ${errorText}`);
        alert(`Empty failed: ${res.status} - ${errorText}`);
        return;
      }
      
      const result = await res.json();
      console.log(`🗑️ Empty ${projectionName} SUCCESS:`, result);
      alert(`✅ ${projectionName} emptied successfully!`);
    } catch (error) {
      console.error(`🗑️ Failed to empty ${projectionName}:`, error);
      alert(`❌ Failed to empty ${projectionName}: ${error instanceof Error ? error.message : String(error)}`);
    }
    setEmptyLoading(false);
    startTransition(() => router.refresh());
  };

  // Only show controls on the relevant view
  const showControls = currentView === projectionType;

  if (!showControls) {
    return null;
  }

  // For query-time projections, show a note but still provide controls
  const showNote = isQueryTime;

  return (
    <div style={{ 
      display: 'flex', 
      gap: '0.5rem', 
      alignItems: 'center',
      padding: '0.5rem',
      backgroundColor: '#f8fafc',
      borderRadius: '0.5rem',
      border: '1px solid #e2e8f0'
    }}>
      <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
        {projectionName}
      </span>
      {showNote && (
        <span style={{ 
          fontSize: '0.75rem', 
          color: '#059669', 
          fontWeight: '500',
          padding: '0.125rem 0.375rem',
          backgroundColor: '#ecfdf5',
          borderRadius: '0.25rem',
          marginRight: '0.25rem'
        }}>
          Live Projection
        </span>
      )}
      {projectionType === 'events' && (
        <span style={{ 
          fontSize: '0.75rem', 
          color: '#6366f1', 
          fontWeight: '500',
          padding: '0.125rem 0.375rem',
          backgroundColor: '#eef2ff',
          borderRadius: '0.25rem',
          marginRight: '0.25rem'
        }}>
          All Events
        </span>
      )}
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onEmpty} 
        disabled={emptyLoading || pending || projectionType === 'events'}
        style={{ 
          minWidth: '60px',
          opacity: projectionType === 'events' ? 0.5 : 1
        }}
      >
        {emptyLoading ? '...' : 'Empty'}
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onRebuild} 
        disabled={rebuildLoading || pending}
        style={{ minWidth: '70px' }}
      >
        {rebuildLoading ? '...' : projectionType === 'events' ? 'Rebuild All' : 'Rebuild'}
      </Button>
    </div>
  );
}