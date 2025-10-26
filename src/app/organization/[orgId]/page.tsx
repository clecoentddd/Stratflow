
"use client";

import { initialOrganizations } from '@/lib/data';
import { AppHeader } from '@/components/header';
import { OrganizationView } from '@/components/organization-view';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Organization } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';


export default function OrganizationPage({ params: { orgId } }: { params: { orgId: string } }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedOrgsString = localStorage.getItem("organizations");
    let allOrgs: Organization[] = [];
    if (storedOrgsString) {
      try {
        allOrgs = JSON.parse(storedOrgsString);
      } catch (e) {
        console.error("Failed to parse organizations from localStorage", e);
        allOrgs = initialOrganizations;
      }
    } else {
      allOrgs = initialOrganizations;
    }
    
    let org = allOrgs.find(o => o.id === orgId);

    if (org) {
      // Use a deep copy to avoid direct state mutation issues
      setOrganization(JSON.parse(JSON.stringify(org)));
    } else {
      // Fallback for safety, though should not be hit if navigation is correct
      org = initialOrganizations.find(o => o.id === orgId);
      if (org) {
          setOrganization(JSON.parse(JSON.stringify(org)));
      }
    }
    setIsLoading(false);
  }, [orgId]);

  useEffect(() => {
    // This effect persists the updated organization back to localStorage
    if (organization && !isLoading) {
      const storedOrgsString = localStorage.getItem("organizations");
      const allOrgs: Organization[] = storedOrgsString ? JSON.parse(storedOrgsString) : initialOrganizations;
      
      const orgIndex = allOrgs.findIndex(o => o.id === organization.id);
      
      let updatedOrgs;
      if (orgIndex !== -1) {
          // Found the existing org, replace it
          updatedOrgs = [...allOrgs];
          updatedOrgs[orgIndex] = organization;
      } else {
          // Org not found (should be rare), add it
          updatedOrgs = [...allOrgs, organization];
      }
      localStorage.setItem("organizations", JSON.stringify(updatedOrgs));
    }
  }, [organization, isLoading]);

  // The single source of truth for updating the organization's state
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
        <div className="mb-6">
            <Link href="/organizations">
                <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Organizations
                </Button>
            </Link>
        </div>
        <OrganizationView organization={organization} onUpdateOrganization={handleUpdateOrganization} />
      </main>
    </div>
  );
}
