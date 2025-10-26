
"use client";

import { useState, useEffect } from "react";
import { initialOrganizations } from "@/lib/data";
import type { Organization } from "@/lib/types";
import { Dashboard } from "@/components/dashboard";

interface OrganizationClientPageProps {
  initialOrganization: Organization;
}

export function OrganizationClientPage({ initialOrganization }: OrganizationClientPageProps) {
  const [organization, setOrganization] = useState<Organization>(initialOrganization);

  // This effect synchronizes changes back to localStorage
  useEffect(() => {
    const storedOrgsString = localStorage.getItem("organizations");
    const allOrgs: Organization[] = storedOrgsString ? JSON.parse(storedOrgsString) : initialOrganizations;
    
    const orgIndex = allOrgs.findIndex(o => o.id === organization.id);
    
    let updatedOrgs;
    if (orgIndex !== -1) {
        updatedOrgs = [...allOrgs];
        updatedOrgs[orgIndex] = organization;
    } else {
        // This case should ideally not happen if initial data is sourced correctly
        updatedOrgs = [...allOrgs, organization];
    }
    localStorage.setItem("organizations", JSON.stringify(updatedOrgs));
  }, [organization]);

  const handleUpdateStream = (updatedStream: Organization['stream']) => {
    // When the dashboard updates the stream, we update our organization state
    setOrganization(prev => ({...prev, stream: updatedStream }));
  }
  
  return (
    <Dashboard 
      stream={organization.stream} 
      streamName={`${organization.name} - ${organization.stream.name}`}
      onUpdateStream={handleUpdateStream}
    />
  );
}
