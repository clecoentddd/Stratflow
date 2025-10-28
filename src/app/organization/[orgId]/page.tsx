
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { initialOrganizations } from "@/lib/data";
import type { Organization, Dashboard } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { StrategyDashboard } from "@/components/dashboard";

export default function OrganizationStrategyPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    if (!orgId) return;
    const storedOrgsString = localStorage.getItem("organizations");
    let allOrgs: Organization[] = storedOrgsString
      ? JSON.parse(storedOrgsString)
      : initialOrganizations;
    
    let org = allOrgs.find(o => o.id === orgId);

    if (org) {
      if (!org.radar) org.radar = [];
      setOrganization(org);
    }
    setIsLoading(false);
  }, [orgId]);
  
  useEffect(() => {
    // This effect also runs only on the client.
    if (organization && !isLoading) {
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
  }, [organization, isLoading]);
  
  const handleUpdateDashboard = (updatedDashboard: Dashboard) => {
    setOrganization(prev => prev ? ({...prev, dashboard: updatedDashboard }) : null);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
            <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!organization) {
    return notFound();
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                 <Link href="/organizations">
                    <Button variant="outline">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Organizations
                    </Button>
                </Link>
                 <Link href={`/organization/${orgId}/radar`}>
                    <Button variant="outline">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        View Radar
                    </Button>
                </Link>
            </div>
        </div>
        <StrategyDashboard 
            dashboard={organization.dashboard}
            radarItems={organization.radar}
            dashboardName={`${organization.name} - Strategy Dashboard`}
            onUpdateDashboard={handleUpdateDashboard}
        />
      </main>
    </div>
  );
}
