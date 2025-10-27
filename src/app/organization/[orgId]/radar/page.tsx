
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { initialOrganizations } from "@/lib/data";
import type { Organization, RadarItem } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { RadarDashboard } from "@/components/radar-dashboard";
import { useToast } from "@/hooks/use-toast";

export default function RadarPage({ params }: { params: { orgId: string } }) {
  const { orgId } = use(params);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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
    if (organizations.length > 0) {
      localStorage.setItem("organizations", JSON.stringify(organizations));
    }
    // Update the single organization state if it's in the main list
    const currentOrg = organizations.find(o => o.id === orgId);
    if(currentOrg) {
      setOrganization(currentOrg);
    }

  }, [organizations, orgId]);

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
    if (existingItemIndex > -1) {
      newRadar = [...radar];
      newRadar[existingItemIndex] = itemToUpsert;
      toast({ title: "Radar Item Updated", description: `"${itemToUpsert.title}" has been updated.` });
    } else {
      newRadar = [...radar, itemToUpsert];
      toast({ title: "Radar Item Created", description: `"${itemToUpsert.title}" has been added.` });
    }
    handleUpdateRadar(newRadar);
  };

  const handleDeleteRadarItem = (itemId: string) => {
    if (!organization) return;
    const radar = organization.radar || [];
    const itemToDelete = radar.find(item => item.id === itemId);
    const newRadar = radar.filter(item => item.id !== itemId);
    handleUpdateRadar(newRadar);
    toast({ title: "Radar Item Deleted", description: `"${itemToDelete?.title}" has been deleted.`, variant: "destructive" });
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
        <div className="mb-6">
          <Link href="/organizations">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
        </div>
        <RadarDashboard
            organizationName={organization.name}
            radarItems={organization.radar || []}
            onUpsertItem={handleUpsertRadarItem}
            onDeleteItem={handleDeleteRadarItem}
            organizations={organizations}
            currentOrgId={organization.id}
        />
      </main>
    </div>
  );
}
