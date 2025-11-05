"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { RadarDashboard } from "@/lib/domain/radar/ui";
import { RadarItemDialog } from "@/lib/domain/radar/ui";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { RadarItem, Team } from "@/lib/types";

export default function RadarPage() {
  const [radarItems, setRadarItems] = useState<RadarItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateItemOpen, setCreateItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RadarItem | null>(null);
  const { toast } = useToast();

  // Fetch teams for the dropdown
  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data);
      
      // Auto-select first team if available
      if (data.length > 0 && !selectedTeamId) {
        setSelectedTeamId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch teams", error);
      toast({ title: "Error", description: "Could not load teams.", variant: "destructive" });
    }
  }, [selectedTeamId, toast]);

  // Fetch radar items for selected team
  const fetchRadarData = useCallback(async (showLoading = true) => {
    if (!selectedTeamId) return;
    
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const response = await fetch(`/api/teams/${selectedTeamId}/radar`);
      if (!response.ok) throw new Error('Failed to fetch radar data');
      const data = await response.json();
      setRadarItems(data);
    } catch (error) {
      console.error("Failed to fetch radar items", error);
      toast({ title: "Error", description: "Could not load radar items.", variant: "destructive" });
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [selectedTeamId, toast]);

  // Load teams on mount
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Load radar data when team selection changes
  useEffect(() => {
    if (selectedTeamId) {
      fetchRadarData();
    }
  }, [selectedTeamId, fetchRadarData]);

  const handleCreateItem = () => {
    setEditingItem(null);
    setCreateItemOpen(true);
  };

  const handleEditItem = (item: RadarItem) => {
    setEditingItem(item);
    setCreateItemOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedTeamId) return;
    
    try {
      const response = await fetch(`/api/teams/${selectedTeamId}/radar`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId }),
      });
      
      if (!response.ok) throw new Error('Failed to delete radar item');
      
      toast({ title: "Success", description: "Radar item deleted successfully." });
      fetchRadarData(false);
    } catch (error) {
      console.error("Failed to delete radar item", error);
      toast({ title: "Error", description: "Could not delete radar item.", variant: "destructive" });
    }
  };

  const handleSaveItem = async (item: RadarItem) => {
    if (!selectedTeamId) return;
    
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const response = await fetch(`/api/teams/${selectedTeamId}/radar`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, teamId: selectedTeamId }),
      });
      
      if (!response.ok) throw new Error(`Failed to ${editingItem ? 'update' : 'create'} radar item`);
      
      toast({ 
        title: "Success", 
        description: `Radar item ${editingItem ? 'updated' : 'created'} successfully.` 
      });
      
      setCreateItemOpen(false);
      setEditingItem(null);
      fetchRadarData(false);
    } catch (error) {
      console.error(`Failed to ${editingItem ? 'update' : 'create'} radar item`, error);
      toast({ 
        title: "Error", 
        description: `Could not ${editingItem ? 'update' : 'create'} radar item.`, 
        variant: "destructive" 
      });
    }
  };

  if (isLoading && !selectedTeamId) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
          <p>Loading teams...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold font-headline">Radar</h1>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleCreateItem}
            disabled={!selectedTeamId}
            className="bg-[#388cfa] hover:bg-[#2a7ae8] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Radar Item
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p>Loading radar items...</p>
          </div>
        ) : !selectedTeamId ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-muted-foreground">Select a team to view radar</h3>
            <p className="text-muted-foreground mt-2">Choose a team from the dropdown above to see their radar items.</p>
          </div>
        ) : (
          <RadarDashboard
            radarItems={radarItems}
            onDeleteItem={handleDeleteItem}
            teams={teams}
            currentTeamId={selectedTeamId}
            onEditItem={handleEditItem}
            onCreateItem={handleCreateItem}
          />
        )}

        <RadarItemDialog
          isOpen={isCreateItemOpen}
          onOpenChange={(isOpen) => {
            setCreateItemOpen(isOpen);
            if (!isOpen) setEditingItem(null);
          }}
          onSave={handleSaveItem}
          item={editingItem}
          teams={teams}
          currentTeamId={selectedTeamId}
        />
      </main>
    </div>
  );
}