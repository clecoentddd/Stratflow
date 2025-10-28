
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Radar } from "lucide-react";
import type { Organization } from "@/lib/types";
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

  const fetchOrganizationData = useCallback(async (showLoading = true) => {
    if (!orgId) return;
    
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const response = await fetch(`/api/organizations/${orgId}/radar`);
      if (response.status === 404) {
        notFound();
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch organization data');
      }
      const data = await response.json();
      if (!data) {
        notFound();
        return;
      }
      setOrganization(data);
    } catch (error) {
      console.error("Failed to fetch organization from API", error);
      toast({ title: "Error", description: "Could not load organization data.", variant: "destructive" });
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [orgId, toast]);

  useEffect(() => {
    fetchOrganizationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

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
    return (
       <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Organization Not Found</h1>
                <p className="text-muted-foreground">The organization you are looking for does not exist.</p>
                <Link href="/organizations" className="mt-4 inline-block">
                    <Button>Back to Organizations</Button>
                </Link>
            </div>
        </main>
      </div>
    )
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
                        <Radar className="mr-2 h-4 w-4" />
                        View Radar
                    </Button>
                </Link>
            </div>
             <h1 className="text-3xl font-bold font-headline">{organization.name} - Strategy</h1>
        </div>
        <StrategyDashboard 
            initialDashboard={organization.dashboard}
            radarItems={organization.radar || []}
            dashboardName={`${organization.name} - Strategy Dashboard`}
            orgId={orgId}
            onDataChange={() => fetchOrganizationData(false)}
        />
      </main>
    </div>
  );
}
