
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
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Team } from "@/lib/types";
import type { UpdateTeamCommand } from "@/lib/domain/teams/commands";

interface EditTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  team: Team;
  onTeamUpdated: () => void;
}

export function EditTeamDialog({
  isOpen,
  onOpenChange,
  team,
  onTeamUpdated,
}: EditTeamDialogProps) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [context, setContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (team) {
      setName(team.name);
      setPurpose(team.purpose);
      setContext(team.context || "");
    }
  }, [team]);

  const handleSubmit = async () => {
    if (!name.trim() || !purpose.trim()) {
      toast({
        title: "Missing Information",
        description: "Name and purpose are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const command: UpdateTeamCommand = {
      id: team.id,
      name: name.trim(),
      purpose: purpose.trim(),
      context: context.trim(),
    };

    try {
      const response = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update team');
      }

      toast({
        title: "Team Updated",
        description: `"${command.name}" has been successfully updated.`,
      });

      onOpenChange(false);
      onTeamUpdated();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Could not update the team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = name.trim() && purpose.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update the details for your team.
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
          <div className="grid w-full gap-1.5">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Leads the company and executes the board's vision."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="context">Context</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., Sits within the executive leadership team."
              rows={2}
              disabled={isSubmitting}
            />
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
