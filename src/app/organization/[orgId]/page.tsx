
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Radar, TrendingUp } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import type { Organization, Strategy, Initiative, InitiativeItem } from "@/lib/types";
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
    const originalOrganization = organization;
    
    // Optimistic UI Update
    fetch(`/api/organizations/${orgId}/initiatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to create initiative on server');
        return response.json();
    })
    .then(data => {
        fetchOrganizationData(); // Refresh to get the new initiative
        toast({
          title: "Success",
          description: `Initiative "${initiativeName}" has been added.`,
        });
    })
    .catch((error) => {
        console.error(error);
        toast({
            title: "Error",
            description: "Failed to create initiative. Reverting...",
            variant: "destructive",
        });
        if(originalOrganization) setOrganization(originalOrganization);
    });
  };

  const handleUpdateInitiative = (initiativeId: string, updatedValues: any) => {
    const command: UpdateInitiativeCommand = { initiativeId, ...updatedValues };
    handleApiCall(`/api/organizations/${orgId}/initiatives/${initiativeId}`, 'PUT', command, "Initiative has been updated.");
  };
  
  const handleAddInitiativeItem = async (initiativeId: string, stepKey: string) => {
    const command: AddInitiativeItemCommand = { initiativeId, stepKey };
    
    // Optimistic UI Update
    const tempId = `temp-${uuidv4()}`;
    const newItem: InitiativeItem = { id: tempId, text: "" };

    setOrganization(prevOrg => {
      if (!prevOrg) return null;
      const newOrg = JSON.parse(JSON.stringify(prevOrg));
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

    // Send command to backend and re-sync silently
    try {
      const response = await fetch(`/api/organizations/${orgId}/initiative-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error('Failed to save new item to server.');
      }
      
      // Silently refresh data in the background to get the permanent ID
      await fetchOrganizationData();

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not save item. Your changes may not be persisted.",
        variant: "destructive",
      });
      // Roll back by fetching data again
      await fetchOrganizationData();
    }
  };

  const handleUpdateInitiativeItem = (initiativeId: string, itemId: string, newText: string) => {
    const command: UpdateInitiativeItemCommand = { initiativeId, itemId, text: newText };
    // Fire-and-forget the update to the backend. The component state is managed locally.
    fetch(`/api/organizations/${orgId}/initiative-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      }).catch(err => {
        // Optional: handle background error, maybe with a less intrusive notification
        console.error("Failed to save item in background:", err);
         toast({
          title: "Save Error",
          description: "Could not save item changes to the server.",
          variant: "destructive",
        });
      });
  };
  
  const handleDeleteInitiativeItem = (initiativeId: string, itemId: string) => {
    const command: DeleteInitiativeItemCommand = { initiativeId, itemId };
    
    const originalOrganization = organization;
    
    // Optimistic UI update
    setOrganization(prevOrg => {
        if (!prevOrg) return null;
        const newOrg = JSON.parse(JSON.stringify(prevOrg));
        for (const strategy of newOrg.dashboard.strategies) {
            const initiative = strategy.initiatives.find(i => i.id === initiativeId);
            if (initiative) {
                for (const step of initiative.steps) {
                    const itemIndex = step.items.findIndex((item: InitiativeItem) => item.id === itemId);
                    if (itemIndex > -1) {
                        step.items.splice(itemIndex, 1);
                        break; 
                    }
                }
            }
        }
        return newOrg;
    });

    // Send command to backend
    fetch(`/api/organizations/${orgId}/initiative-items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete on server');
      }
       toast({
        title: "Success",
        description: "Initiative item deleted.",
      });
    })
    .catch((error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete item. Restoring...",
        variant: "destructive",
      });
      // Rollback on failure
      if (originalOrganization) setOrganization(originalOrganization);
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
