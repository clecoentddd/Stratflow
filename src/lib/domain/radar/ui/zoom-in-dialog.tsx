"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Team } from "@/lib/types";

interface ZoomInDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  teams: Team[];
  onSelect: (link: string) => void;
  currentTeamId: string;
}

export function ZoomInDialog({ isOpen, onOpenChange, teams, onSelect, currentTeamId }: ZoomInDialogProps) {
  const handleSelect = (teamId: string) => {
    onSelect(`/team/${teamId}/radar`);
    onOpenChange(false);
  };
  
  const availableTeams = teams.filter(team => team.id !== currentTeamId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link to another Radar</DialogTitle>
          <DialogDescription>
            Select a team's radar to link to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2 max-h-96 overflow-y-auto">
          {availableTeams.map(team => (
            <Button
              key={team.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleSelect(team.id)}
            >
              {team.name}
            </Button>
          ))}
           {availableTeams.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No other teams available to link to.</p>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}