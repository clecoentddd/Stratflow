"use client";

import { ProjectionControls } from "@/components/ui/projection-controls";

interface InitiativeCatalogProjectionControlsProps {
  currentView: string;
}

export function InitiativeCatalogProjectionControls({ currentView }: InitiativeCatalogProjectionControlsProps) {
  return (
    <ProjectionControls
      domainName="Initiative Catalog"
      projectionEndpoint="/api/initiatives-catalog/projection"
      currentView={currentView}
      viewName="catalog"
      isQueryTime={false}
      canEmpty={true}
    />
  );
}