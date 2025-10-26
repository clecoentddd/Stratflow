
"use client";

import { initialOrganizations } from '@/lib/data';
import { AppHeader } from '@/components/header';
import { OrganizationView } from '@/components/organization-view';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Organization } from '@/lib/types';


export default function OrganizationPage({ params }: { params: { orgId: string } }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedOrgsString = localStorage.getItem("organizations");
    const allOrgs: Organization[] = storedOrgsString ? JSON.parse(storedOrgsString) : initialOrganizations;
    
    let org = allOrgs.find(o => o.id === params.orgId);

    if (org) {
      setOrganization(JSON.parse(JSON.stringify(org)));
    } else {
        // If not found in localStorage, check initial data as a fallback
        org = initialOrganizations.find(o => o.id === params.orgId);
        if (org) {
            setOrganization(JSON.parse(JSON.stringify(org)));
        }
    }
    setIsLoading(false);
  }, [params.orgId]);

  useEffect(() => {
    if (organization) {
      const storedOrgsString = localStorage.getItem("organizations");
      const allOrgs: Organization[] = storedOrgsString ? JSON.parse(storedOrgsString) : initialOrganizations;
      const orgIndex = allOrgs.findIndex(o => o.id === organization.id);
      
      let updatedOrgs;
      if (orgIndex !== -1) {
          updatedOrgs = [...allOrgs];
          updatedOrgs[orgIndex] = organization;
      } else {
          updatedOrgs = [...allOrgs, organization];
      }
      localStorage.setItem("organizations", JSON.stringify(updatedOrgs));
    }
  }, [organization]);


  const handleUpdateOrganization = (updatedOrg: Organization) => {
    setOrganization(updatedOrg);
  };
  
  if (isLoading) {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="p-4 md:p-6 flex-1">
                <p>Loading organization...</p>
            </main>
        </div>
    );
  }

  if (!organization) {
      notFound();
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
