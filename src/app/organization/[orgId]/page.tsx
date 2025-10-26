

import { initialOrganizations } from '@/lib/data';
import { AppHeader } from '@/components/header';
import { OrganizationView } from '@/components/organization-view';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Organization } from '@/lib/types';


export default function OrganizationPage({ params }: { params: { orgId: string } }) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    const org = organizations.find(o => o.id === params.orgId);
    if(org) {
      setOrganization(org);
    } else {
        // Create a new org if not found
        const newOrg = { id: params.orgId, name: "New Organization", structure: [] };
        setOrganization(newOrg);
        setOrganizations(prev => [...prev, newOrg]);
    }
  }, [params.orgId, organizations]);


  const handleUpdateOrganization = (updatedOrg: Organization) => {
    setOrganizations(prevOrgs => prevOrgs.map(o => o.id === updatedOrg.id ? updatedOrg : o));
    setOrganization(updatedOrg);
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
