
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { initialOrganizations } from "@/lib/data";
import type { Organization } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Dashboard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";

export default function OrganizationStrategyPage({ params }: { params: { orgId: string } }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { orgId } = params;

  useEffect(() => {
    const storedOrgsString = localStorage.getItem("organizations");
    let allOrgs: Organization[] = storedOrgsString
      ? JSON.parse(storedOrgsString)
      : initialOrganizations;
    
    const org = allOrgs.find(o => o.id === orgId);

    if (org) {
      setOrganization(JSON.parse(JSON.stringify(org)));
    }
    setIsLoading(false);
  }, [orgId]);

  useEffect(() => {
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

  const handleUpdateStream = (updatedStream: Organization['stream']) => {
    if (organization) {
      setOrganization(prev => prev ? ({...prev, stream: updatedStream }) : null);
    }
  }

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
        <Dashboard 
          stream={organization.stream} 
          streamName={`${organization.name} - ${organization.stream.name}`}
          onUpdateStream={handleUpdateStream}
        />
      </main>
    </div>
  );
}
