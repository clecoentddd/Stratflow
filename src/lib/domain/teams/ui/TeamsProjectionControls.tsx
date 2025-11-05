"use client";

import ProjectionControls from "@/components/ui/projection-controls";

interface TeamsProjectionControlsProps {
  currentView: string;
}

export default function TeamsProjectionControls({ currentView }: TeamsProjectionControlsProps) {
  return (
    <ProjectionControls
      domainName="Teams"
      projectionEndpoint="/api/teams/projection"
      currentView={currentView}
      viewName="teams"
      isQueryTime={true}
      canEmpty={true}
    />
  );
}