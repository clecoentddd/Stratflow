
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Plus, KanbanSquare } from "lucide-react";
import type { Organization, RadarItem } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { RadarDashboard } from "@/components/radar-dashboard";
import { useToast } from "@/hooks/use-toast";
import { RadarItemDialog } from "@/components/radar-item-dialog";
import type { UpsertRadarItemCommand } from "@/lib/domain/radar/commands";

export default function RadarPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RadarItem | null>(null);
  const { toast } = useToast();

  const fetchOrganizationData = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      // Fetch the specific organization for the radar
      const orgResponse = await fetch(`/api/organizations/${orgId}/radar`);
      if (orgResponse.status === 404) {
        notFound();
        return;
      }
      if (!orgResponse.ok) {
        throw new Error("Failed to fetch organization data");
      }
      const orgData = await orgResponse.json();
      setOrganization(orgData);

      // Fetch all organizations for linking purposes
      const allOrgsResponse = await fetch('/api/organizations');
      if (!allOrgsResponse.ok) throw new Error("Failed to fetch organizations list");
      const allOrgsData = await allOrgsResponse.json();
      setOrganizations(allOrgsData);

    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Error", description: "Could not load radar data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  const handleUpsertRadarItem = async (itemToUpsert: RadarItem) => {
    const isUpdating = !!itemToUpsert.created_at;
    const method = isUpdating ? 'PUT' : 'POST';
    
    const command: UpsertRadarItemCommand = itemToUpsert;

    try {
      const response = await fetch(`/api/organizations/${orgId}/radar`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} radar item`);
      }

      const updatedOrg = await response.json();
      setOrganization(updatedOrg);
      
      toast({
        title: isUpdating ? "Radar Item Updated" : "Radar Item Created",
        description: `"${itemToUpsert.name}" has been saved.`,
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: `Could not save the radar item. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRadarItem = async (itemId: string) => {
    const itemToDelete = organization?.radar.find(item => item.id === itemId);
    if (!itemToDelete) return;

    try {
        const response = await fetch(`/api/organizations/${orgId}/radar`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemId }),
        });

        if (!response.ok) {
            throw new Error('Failed to delete radar item');
        }

        const updatedOrg = await response.json();
        setOrganization(updatedOrg);

        toast({ 
            title: "Radar Item Deleted", 
            description: `"${itemToDelete.name}" has been deleted.`, 
            variant: "destructive" 
        });

    } catch (error) {
        console.error(error);
        toast({
            title: "Error",
            description: "Could not delete the item. Please try again.",
            variant: "destructive",
        });
    }
  }

  const handleOpenDialog = (item: RadarItem | null = null) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <p>Loading Radar...</p>
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
            <Link href={`/organization/${orgId}`}>
              <Button variant="outline">
                <KanbanSquare className="mr-2 h-4 w-4" />
                View Strategy Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold font-headline">{organization.name} - Radar</h1>
        </div>
        <RadarDashboard
          radarItems={organization.radar || []}
          onDeleteItem={handleDeleteRadarItem}
          organizations={organizations}
          currentOrgId={organization.id}
          onEditItem={handleOpenDialog}
          onCreateItem={() => handleOpenDialog()}
        />
      </main>
      <RadarItemDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleUpsertRadarItem}
        item={editingItem}
        organizations={organizations}
        currentOrgId={organization.id}
      />
    </div>
  );
}
