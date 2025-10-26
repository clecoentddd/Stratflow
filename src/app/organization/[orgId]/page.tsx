"use client";

import { initialOrganizations } from '@/lib/data';
import { AppHeader } from '@/components/header';
import { OrganizationView } from '@/components/organization-view';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Organization } from '@/lib/types';


export default function OrganizationPage({ params }: { params: { orgId: string } }) {
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    const org = initialOrganizations.find(o => o.id === params.orgId);
    if(org) {
      // Deep copy to prevent mutation issues
      setOrganization(JSON.parse(JSON.stringify(org)));
    } else {
        const newOrg: Organization = { id: params.orgId, name: "New Organization", structure: [] };
        // In a real app, you might want to persist this new org, 
        // but for now, we just set it in state.
        // We add it to the initialOrganizations array for demonstration if you navigate away and back,
        // but this is temporary and will be lost on a full page reload.
        initialOrganizations.push(newOrg);
        setOrganization(newOrg);
    }
  }, [params.orgId]);


  const handleUpdateOrganization = (updatedOrg: Organization) => {
    // Deep copy the updated organization to ensure React re-renders
    setOrganization(JSON.parse(JSON.stringify(updatedOrg)));

    // Also update the in-memory array
    const orgIndex = initialOrganizations.findIndex(o => o.id === updatedOrg.id);
    if (orgIndex !== -1) {
        initialOrganizations[orgIndex] = updatedOrg;
    }
  };
  
  if (!organization) {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="p-4 md:p-6 flex-1">
                <p>Loading organization...</p>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <OrganizationView organization={organization} onUpdateOrganization={handleUpdateOrganization} />
      </main>
    </div>
  );
}
