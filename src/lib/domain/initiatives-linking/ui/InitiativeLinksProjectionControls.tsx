"use client";

import ProjectionControls from "@/components/ui/projection-controls";

interface InitiativeLinksProjectionControlsProps {
  currentView: string;
}

export default function InitiativeLinksProjectionControls({ currentView }: InitiativeLinksProjectionControlsProps) {
  return (
    <ProjectionControls
      domainName="Initiative Links"
      projectionEndpoint="/api/initiatives-linking/projection"
      currentView={currentView}
      viewName="links"
      isQueryTime={false}
      canEmpty={true}
    />
  );
}