"use client";

import { useState } from "react";
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
// no textarea needed for create flow (purpose/context optional)
import { useToast } from "@/hooks/use-toast";
import type { CreateTeamCommand } from "@/lib/domain/teams/commands";

interface CreateTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTeamCreated: () => void;
  companyId: string;
}

export function CreateTeamDialog({
  isOpen,
  onOpenChange,
  onTeamCreated,
  companyId
}: CreateTeamDialogProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setLevel("0");
  };

  const handleSubmit = async () => {
    const levelNum = parseInt(level, 10);
  // Only name and level are required. Purpose/context are optional.
  if (!name.trim() || isNaN(levelNum) || !companyId) {
    toast({ title: "Missing Information", description: "Please provide a team name and numeric level.", variant: "destructive" });
    return;
  }

    setIsSubmitting(true);

    const command: CreateTeamCommand = {
      companyId,
      name: name.trim(),
      level: levelNum,
    };

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error('Failed to create team');
      }

      toast({
        title: "Team Created",
        description: `"${command.name}" has been successfully created.`,
      });

      resetForm();
      onOpenChange(false);
      onTeamCreated(); // Callback to trigger re-fetch
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not create the team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isFormValid = !!(name.trim() && companyId && !isNaN(parseInt(level, 10)));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Define a new team within your company.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., CEO"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="level">Level</Label>
            <Input
              id="level"
              type="number"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="e.g., 0 for top-level"
              disabled={isSubmitting}
            />
            <div style={{ color: '#666', fontSize: 13, marginTop: 6 }}>Purpose and context can be added later on the team's Purpose page.</div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
