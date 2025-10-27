
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
  const resolvedParams = use(params);
  const orgId = resolvedParams.orgId;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedOrgsString = localStorage.getItem("organizations");
    let allOrgs: Organization[] = storedOrgsString
      ? JSON.parse(storedOrgsString)
      : initialOrganizations;
    
    let org = allOrgs.find(o => o.id === orgId);

    if (org) {
      // Ensure radar property exists
      if (!org.radar) {
        org.radar = [];
      }
      setOrganization(org);
    }
    setIsLoading(false);
  }, [orgId]);
  
  useEffect(() => {
    if (organization) {
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
  }, [organization]);

  const handleUpdateRadar = (updatedRadar: RadarItem[]) => {
    setOrganization(prev => prev ? ({ ...prev, radar: updatedRadar }) : null);
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
    const newRadar = radar.filter(item => item.id !== itemId);
    handleUpdateRadar(newRadar);
    toast({ title: "Radar Item Deleted", variant: "destructive" });
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
        />
      </main>
    </div>
  );
}
