"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CreateStrategyDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (description: string, timeframe: string, teamId: string) => void;
  teamId?: string;
}

export function CreateStrategyDialog({
  isOpen,
  onOpenChange,
  onCreate,
  teamId: propTeamId,
}: CreateStrategyDialogProps) {
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(propTeamId || "");
  const [teams, setTeams] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (propTeamId) {
        setSelectedTeamId(propTeamId);
      } else {
        setSelectedTeamId("");
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

  const handleSubmit = () => {
    if (description.trim() && timeframe.trim() && selectedTeamId) {
      onCreate(description.trim(), timeframe.trim(), selectedTeamId);
      setDescription("");
      setTimeframe("");
      if (!propTeamId) setSelectedTeamId("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Strategy</DialogTitle>
          <DialogDescription>
            Define a new strategy with a clear description and timeframe.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!propTeamId && (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="team">Team</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={isLoading}>
                <SelectTrigger>
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
          )}
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Enhance user onboarding flow"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Input
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="e.g., Q3 2024"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!description.trim() || !timeframe.trim() || !selectedTeamId}
          >
            Create Strategy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}