"use client";

import { ProjectionControls } from "@/components/ui/projection-controls";

interface EventLogProjectionControlsProps {
  currentView: string;
}

export default function EventLogProjectionControls({ currentView }: EventLogProjectionControlsProps) {
  return (
    <ProjectionControls
      domainName="Event Log"
      projectionEndpoint="/api/event-log/projection"
      currentView={currentView}
      viewName="events"
      isQueryTime={false}
      canEmpty={false} // Events are source of truth
    />
  );
}