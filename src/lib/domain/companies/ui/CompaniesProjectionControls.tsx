"use client";

import ProjectionControls from "@/components/ui/projection-controls";

interface CompaniesProjectionControlsProps {
  currentView: string;
}

export default function CompaniesProjectionControls({ currentView }: CompaniesProjectionControlsProps) {
  return (
    <ProjectionControls
      domainName="Companies"
      projectionEndpoint="/api/companies/projection"
      currentView={currentView}
      viewName="companies"
      isQueryTime={true}
      canEmpty={true}
    />
  );
}