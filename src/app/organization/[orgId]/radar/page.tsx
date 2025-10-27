
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { initialOrganizations } from "@/lib/data";
import type { Organization, RadarItem } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { RadarDashboard } from "@/components/radar-dashboard";
import { useToast } from "@/hooks/use-toast";
import { RadarItemDialog } from "@/components/radar-item-dialog";

export default function RadarPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RadarItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!orgId) return;
    const storedOrgsString = localStorage.getItem("organizations");
    const allOrgs: Organization[] = storedOrgsString
      ? JSON.parse(storedOrgsString)
      : initialOrganizations;
    
    setOrganizations(allOrgs);
    const org = allOrgs.find(o => o.id === orgId);

    if (org) {
      if (!org.radar) {
        org.radar = [];
      }
      setOrganization(org);
    }
    setIsLoading(false);
  }, [orgId]);
  
  useEffect(() => {
    if (organizations.length > 0 && !isLoading) {
      localStorage.setItem("organizations", JSON.stringify(organizations));
    }
    // Update the single organization state if it's in the main list
    const currentOrg = organizations.find(o => o.id === orgId);
    if(currentOrg) {
      setOrganization(currentOrg);
    }

  }, [organizations, orgId, isLoading]);

  const handleUpdateRadar = (updatedRadar: RadarItem[]) => {
    setOrganizations(prevOrgs => 
        prevOrgs.map(org => 
            org.id === orgId ? { ...org, radar: updatedRadar } : org
        )
    );
  };
  
  const handleUpsertRadarItem = (itemToUpsert: RadarItem) => {
    if (!organization) return;
    const radar = organization.radar || [];
    const existingItemIndex = radar.findIndex(item => item.id === itemToUpsert.id);
    let newRadar: RadarItem[];

    const now = new Date().toISOString();
    let toastTitle: string;
    let toastDescription: string;

    if (existingItemIndex > -1) {
      itemToUpsert.updated_at = now;
      newRadar = [...radar];
      newRadar[existingItemIndex] = itemToUpsert;
      toastTitle = "Radar Item Updated";
      toastDescription = `"${itemToUpsert.name}" has been updated.`;
    } else {
      itemToUpsert.created_at = now;
      itemToUpsert.radarId = organization.id;
      newRadar = [...radar, itemToUpsert];
      toastTitle = "Radar Item Created";
      toastDescription = `"${itemToUpsert.name}" has been added.`;
    }
    
    handleUpdateRadar(newRadar);
    toast({ title: toastTitle, description: toastDescription });
  };

  const handleDeleteRadarItem = (itemId: string) => {
    if (!organization) return;
    const radar = organization.radar || [];
    const itemToDelete = radar.find(item => item.id === itemId);
    const newRadar = radar.filter(item => item.id !== itemId);
    handleUpdateRadar(newRadar);
    toast({ title: "Radar Item Deleted", description: `"${itemToDelete?.name}" has been deleted.`, variant: "destructive" });
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
                <h1 className="text-3xl font-bold font-headline">{organization.name} - Radar</h1>
            </div>
        </div>
        <RadarDashboard
            radarItems={organization.radar || []}
            onUpsertItem={handleUpsertRadarItem}
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
