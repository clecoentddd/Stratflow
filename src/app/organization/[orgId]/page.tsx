
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Radar } from "lucide-react";
import type { Organization, Strategy } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { StrategyDashboard } from "@/components/dashboard";
import { useToast } from "@/hooks/use-toast";
import type {
  CreateStrategyCommand,
  UpdateStrategyCommand,
  CreateInitiativeCommand,
} from "@/lib/domain/strategy/commands";

export default function OrganizationStrategyPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrganizationData = useCallback(async () => {
    if (!orgId) return;
    // Don't set loading to true on background refreshes
    if (!organization) {
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
      setIsLoading(false);
    }
  }, [orgId, toast, organization]);

  useEffect(() => {
    fetchOrganizationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]); // Only run on initial orgId load

  const handleApiCall = async (url: string, method: string, body: any, successMessage: string) => {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to perform action.`);
      }
      
      // We re-fetch data for actions that create/delete top-level entities
      // Child components will handle their own optimistic updates
      await fetchOrganizationData();

      toast({
        title: "Success",
        description: successMessage,
      });

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleCreateStrategy = (description: string, timeframe: string) => {
    const command: CreateStrategyCommand = { description, timeframe };
    handleApiCall(`/api/organizations/${orgId}/strategies`, 'POST', command, "Strategy has been created.");
  };

  const handleUpdateStrategy = (strategyId: string, updatedValues: Partial<Strategy>) => {
    const command: UpdateStrategyCommand = { strategyId, ...updatedValues };
    handleApiCall(`/api/organizations/${orgId}/strategies/${strategyId}`, 'PUT', command, "Strategy has been updated.");
  };

  const handleCreateInitiative = (strategyId: string, initiativeName: string) => {
    const command: CreateInitiativeCommand = { strategyId, name: initiativeName };
    handleApiCall(`/api/organizations/${orgId}/initiatives`, 'POST', command, `Initiative "${initiativeName}" has been added.`);
  };

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
            dashboard={organization.dashboard}
            radarItems={organization.radar || []}
            dashboardName={`${organization.name} - Strategy Dashboard`}
            orgId={orgId}
            onCreateStrategy={handleCreateStrategy}
            onUpdateStrategy={handleUpdateStrategy}
            onCreateInitiative={handleCreateInitiative}
        />
      </main>
    </div>
  );
}
