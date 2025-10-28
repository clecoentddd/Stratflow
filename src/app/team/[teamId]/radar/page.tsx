
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Plus, TrendingUp } from "lucide-react";
import type { Team, RadarItem } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { RadarDashboard } from "@/components/radar-dashboard";
import { useToast } from "@/hooks/use-toast";
import { RadarItemDialog } from "@/components/radar-item-dialog";
import type { UpsertRadarItemCommand } from "@/lib/domain/radar/commands";

export default function RadarPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RadarItem | null>(null);
  const { toast } = useToast();

  const fetchTeamData = useCallback(async () => {
    if (!teamId) return;
    setIsLoading(true);
    try {
      // Fetch the specific team for the radar
      const orgResponse = await fetch(`/api/teams/${teamId}`);
       if (orgResponse.status === 404) {
        notFound();
        return;
      }
      if (!orgResponse.ok) {
        throw new Error("Failed to fetch team data");
      }
      const orgData = await orgResponse.json();
      
      if (!orgData) {
        notFound();
        return;
      }
      setTeam(orgData);

      const allOrgsResponse = await fetch('/api/teams');
      if (!allOrgsResponse.ok) throw new Error("Failed to fetch teams list");
      const allOrgsData = await allOrgsResponse.json();
      setTeams(allOrgsData);

    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Error", description: "Could not load radar data.", variant: "destructive" });
      setTeam(null);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, toast]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleUpsertRadarItem = async (itemToUpsert: RadarItem) => {
    const isUpdating = !!itemToUpsert.created_at;
    const method = isUpdating ? 'PUT' : 'POST';
    
    const command: UpsertRadarItemCommand = itemToUpsert;

    try {
      const response = await fetch(`/api/teams/${teamId}/radar`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} radar item`);
      }

      const updatedOrg = await response.json();
      setTeam(updatedOrg);
      
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
    const itemToDelete = team?.radar.find(item => item.id === itemId);
    if (!itemToDelete) return;

    try {
        const response = await fetch(`/api/teams/${teamId}/radar`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemId }),
        });

        if (!response.ok) {
            throw new Error('Failed to delete radar item');
        }

        const updatedOrg = await response.json();
        setTeam(updatedOrg);

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

  if (!team) {
     return (
       <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Team Not Found</h1>
                <p className="text-muted-foreground">The team you are looking for does not exist.</p>
                <Link href="/" className="mt-4 inline-block">
                    <Button>Back to Companies</Button>
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
            <Link href={`/company/${team.companyId}/teams`}>
              <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Teams
              </Button>
            </Link>
            <Link href={`/team/${teamId}`}>
              <Button variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Strategy Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold font-headline">{team.name} - Radar</h1>
          <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />New Radar Item</Button>
        </div>
        <RadarDashboard
          radarItems={team.radar || []}
          onDeleteItem={handleDeleteRadarItem}
          teams={teams}
          currentTeamId={team.id}
          onEditItem={handleOpenDialog}
          onCreateItem={() => handleOpenDialog()}
        />
      </main>
      <RadarItemDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleUpsertRadarItem}
        item={editingItem}
        teams={teams}
        currentTeamId={team.id}
      />
    </div>
  );
}
