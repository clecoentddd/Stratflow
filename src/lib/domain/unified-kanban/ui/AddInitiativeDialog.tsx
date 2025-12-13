"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import type { Strategy, RadarItem, Initiative, InitiativeStep } from "@/lib/types";

interface AddInitiativeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  teamId?: string;
  onInitiativeCreated: (initiative: Initiative, strategyId: string, radarItems: RadarItem[], teamId: string) => void;
}

export function AddInitiativeDialog({
  isOpen,
  onOpenChange,
  teamId: propTeamId,
  onInitiativeCreated
}: AddInitiativeDialogProps) {
  const [teams, setTeams] = useState<{id: string, name: string}[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [radarItems, setRadarItems] = useState<RadarItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>(propTeamId || "");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName("");
      setSelectedStrategyId("");
      if (propTeamId) {
        setSelectedTeamId(propTeamId);
        fetchTeamData(propTeamId);
      } else {
        setSelectedTeamId("");
        setStrategies([]);
        fetchTeams();
      }
    }
  }, [isOpen, propTeamId]);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error("Failed to fetch teams");
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load teams", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamData = async (tId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teams/${tId}`);
      if (!res.ok) throw new Error("Failed to fetch team data");
      const data = await res.json();
      if (data && data.dashboard && data.dashboard.strategies) {
        setStrategies(data.dashboard.strategies.filter((s: Strategy) => s.state !== 'Deleted' && s.state !== 'Obsolete'));
      } else {
        setStrategies([]);
      }
      if (data && data.radar) {
        setRadarItems(data.radar);
      } else {
        setRadarItems([]);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load strategies", variant: "destructive" });
      setStrategies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamChange = (tId: string) => {
    setSelectedTeamId(tId);
    setSelectedStrategyId("");
    fetchTeamData(tId);
  };

  const handleCreate = async () => {
    if (!name.trim() || !selectedStrategyId || !selectedTeamId) return;

    setIsSubmitting(true);
    const tempId = `init-temp-${uuidv4()}`;
    const command = {
      strategyId: selectedStrategyId,
      name: name.trim(),
      teamId: selectedTeamId,
      tempId
    };

    try {
      const response = await fetch(`/api/initiatives?teamId=${selectedTeamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create initiative.');
      }

      const data = await response.json();
      const createdInitiative = data.initiative;

      toast({ title: "Success", description: "Initiative created" });
      onInitiativeCreated(createdInitiative, selectedStrategyId, radarItems, selectedTeamId);
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Initiative</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!propTeamId && (
             <div className="grid gap-2">
                <Label htmlFor="team">Team</Label>
                <Select value={selectedTeamId} onValueChange={handleTeamChange}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          )}

          {isLoading ? (
            <div className="flex justify-center text-sm text-muted-foreground">Loading data...</div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="strategy">Strategy</Label>
                <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId} disabled={!selectedTeamId}>
                  <SelectTrigger id="strategy">
                    <SelectValue placeholder={selectedTeamId ? "Select a strategy" : "Select a team first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies.length === 0 ? (
                        <SelectItem value="none" disabled>No active strategies found</SelectItem>
                    ) : (
                        strategies.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                            {s.description} ({s.state})
                        </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Initiative Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter initiative name"
                  disabled={!selectedStrategyId}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isSubmitting || !name.trim() || !selectedStrategyId || !selectedTeamId}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
