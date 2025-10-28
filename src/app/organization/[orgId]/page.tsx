
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Radar, TrendingUp } from "lucide-react";
import type { Organization, Strategy, InitiativeItem } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { StrategyDashboard } from "@/components/dashboard";
import { useToast } from "@/hooks/use-toast";
import type {
  CreateStrategyCommand,
  UpdateStrategyCommand,
  CreateInitiativeCommand,
  UpdateInitiativeCommand,
  AddInitiativeItemCommand,
  UpdateInitiativeItemCommand,
  DeleteInitiativeItemCommand
} from "@/lib/domain/strategy/commands";

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
      const response = await fetch(`/api/organizations/${orgId}/radar`);
      if (response.status === 404) {
        notFound();
        return;
      }
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
      
      // Re-fetch data to reflect changes
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

  const handleUpdateInitiative = (initiativeId: string, updatedValues: any) => {
    const command: UpdateInitiativeCommand = { initiativeId, ...updatedValues };
    handleApiCall(`/api/organizations/${orgId}/initiatives/${initiativeId}`, 'PUT', command, "Initiative has been updated.");
  };
  
  const handleAddInitiativeItem = async (initiativeId: string, stepKey: string) => {
    const command: AddInitiativeItemCommand = { initiativeId, stepKey };
    try {
      const response = await fetch(`/api/organizations/${orgId}/initiative-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add item.');
      }
      
      const newItem = await response.json();

      // Update state locally instead of full refresh
      setOrganization(prevOrg => {
        if (!prevOrg) return null;
        
        const newOrg = JSON.parse(JSON.stringify(prevOrg)); // Deep copy
        
        for (const strategy of newOrg.dashboard.strategies) {
            const initiative = strategy.initiatives.find((i: any) => i.id === initiativeId);
            if (initiative) {
                const step = initiative.steps.find((s: any) => s.key === stepKey);
                if (step) {
                    step.items.push(newItem);
                }
                break;
            }
        }
        return newOrg;
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

  const handleUpdateInitiativeItem = (initiativeId: string, itemId: string, newText: string) => {
    const command: UpdateInitiativeItemCommand = { initiativeId, itemId, text: newText };
    // This is a fire-and-forget save. We can add optimistic UI here as well,
    // but for now, we just don't do a full refresh.
    fetch(`/api/organizations/${orgId}/initiative-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      }).then(response => {
        if (response.ok) {
          toast({ title: "Success", description: "Initiative item saved." });
        } else {
           toast({ title: "Error", description: "Failed to save item.", variant: "destructive" });
        }
      }).catch(err => {
        toast({ title: "Error", description: "Failed to save item.", variant: "destructive" });
      });
  };
  
  const handleDeleteInitiativeItem = (initiativeId: string, itemId: string) => {
    const command: DeleteInitiativeItemCommand = { initiativeId, itemId };
    
    // --- Optimistic UI Update ---
    const originalOrganization = organization;
    
    // 1. Immediately update the local state
    setOrganization(prevOrg => {
        if (!prevOrg) return null;

        const newOrg = JSON.parse(JSON.stringify(prevOrg)); // Deep copy
        let itemFoundAndRemoved = false;

        for (const strategy of newOrg.dashboard.strategies) {
            for (const initiative of strategy.initiatives) {
                if (initiative.id === initiativeId) {
                    for (const step of initiative.steps) {
                        const initialItemCount = step.items.length;
                        step.items = step.items.filter((item: InitiativeItem) => item.id !== itemId);
                        if (step.items.length < initialItemCount) {
                            itemFoundAndRemoved = true;
                            break;
                        }
                    }
                }
                if (itemFoundAndRemoved) break;
            }
            if (itemFoundAndRemoved) break;
        }
        return newOrg;
    });

    toast({
        title: "Success",
        description: "Initiative item deleted.",
    });


    // 2. Send the API request in the background
    fetch(`/api/organizations/${orgId}/initiative-items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    .then(response => {
      if (!response.ok) {
        // 3. If it fails, revert the state and show an error
        throw new Error('Failed to delete on server');
      }
      // On success, do nothing. The UI is already correct.
    })
    .catch((error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete item. Restoring...",
        variant: "destructive",
      });
      // Rollback
      setOrganization(originalOrganization);
    });
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
            onCreateStrategy={handleCreateStrategy}
            onUpdateStrategy={handleUpdateStrategy}
            onCreateInitiative={handleCreateInitiative}
            onUpdateInitiative={handleUpdateInitiative}
            onAddInitiativeItem={handleAddInitiativeItem}
            onUpdateInitiativeItem={handleUpdateInitiativeItem}
            onDeleteInitiativeItem={handleDeleteInitiativeItem}
        />
      </main>
    </div>
  );
}
