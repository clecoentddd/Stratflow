
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import type { Organization, Dashboard } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { StrategyDashboard } from "@/components/dashboard";
import { useToast } from "@/hooks/use-toast";

export default function OrganizationStrategyPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrganizationData = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      // The radar API route now returns the full organization object
      const response = await fetch(`/api/organizations/${orgId}/radar`);
       if (!response.ok) {
        throw new Error('Failed to fetch organization data');
      }
      const data = await response.json();
      setOrganization(data);
    } catch (error) {
      console.error("Failed to fetch organization from API", error);
      toast({ title: "Error", description: "Could not load organization data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);
  
  const handleUpdateDashboard = (updatedDashboard: Dashboard) => {
    // This is now an optimistic update.
    // A full implementation would save this to the backend via an API.
    setOrganization(prev => prev ? ({...prev, dashboard: updatedDashboard }) : null);
    toast({ title: "Dashboard Updated", description: "Changes have been saved locally." });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
            <p>Loading Strategy Dashboard...</p>
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
             <h1 className="text-3xl font-bold font-headline">{organization.name} - Strategy</h1>
        </div>
        <StrategyDashboard 
            dashboard={organization.dashboard}
            radarItems={organization.radar || []}
            dashboardName={`${organization.name} - Strategy Dashboard`}
            onUpdateDashboard={handleUpdateDashboard}
        />
      </main>
    </div>
  );
}
