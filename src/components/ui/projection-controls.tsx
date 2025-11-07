"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ProjectionControlsProps {
  domainName: string;
  projectionEndpoint: string;
  currentView: string;
  viewName: string;
  isQueryTime?: boolean;
  canEmpty?: boolean;
  onAfterAction?: () => void;
}

export function ProjectionControls(props: ProjectionControlsProps) {
  const {
    domainName,
    projectionEndpoint,
    currentView,
    viewName,
    isQueryTime = false,
    canEmpty = true,
    onAfterAction
  } = props;

  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [emptyLoading, setEmptyLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onRebuild = async () => {
    setRebuildLoading(true);
    try {
      const res = await fetch(projectionEndpoint, { method: 'POST' });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Rebuild failed: ${res.status} - ${errorText}`);
        return;
      }
      alert(`✅ ${domainName} rebuild successful!`);
    } catch (error) {
      alert(`❌ Failed to rebuild ${domainName}: ${error instanceof Error ? error.message : String(error)}`);
    }
    setRebuildLoading(false);
    if (onAfterAction) {
      onAfterAction();
    } else {
      startTransition(() => router.refresh());
    }
  };

  const onEmpty = async () => {
    if (!canEmpty) {
      alert(`❌ Cannot empty ${domainName} - it's the source of truth for other projections`);
      return;
    }
    setEmptyLoading(true);
    try {
      const res = await fetch(projectionEndpoint, { method: 'DELETE' });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Empty failed: ${res.status} - ${errorText}`);
        return;
      }
      alert(`✅ ${domainName} emptied successfully!`);
    } catch (error) {
      alert(`❌ Failed to empty ${domainName}: ${error instanceof Error ? error.message : String(error)}`);
    }
    setEmptyLoading(false);
    if (onAfterAction) {
      onAfterAction();
    } else {
      startTransition(() => router.refresh());
    }
  };

  // Only show controls on the relevant view
  const showControls = currentView === viewName;
  if (!showControls) {
    return null;
  }

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
        {domainName}
      </span>
      {isQueryTime && (
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
      {!canEmpty && (
        <span style={{ 
          fontSize: '0.75rem', 
          color: '#6366f1', 
          fontWeight: '500',
          padding: '0.125rem 0.375rem',
          backgroundColor: '#eef2ff',
          borderRadius: '0.25rem',
          marginRight: '0.25rem'
        }}>
          Source of Truth
        </span>
      )}
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onEmpty} 
        disabled={emptyLoading || pending || !canEmpty}
        style={{ 
          minWidth: '60px',
          opacity: !canEmpty ? 0.5 : 1
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
        {rebuildLoading ? '...' : 'Rebuild'}
      </Button>
      </div>
    );
  }