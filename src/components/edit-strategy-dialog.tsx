
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
import { useToast } from "@/hooks/use-toast";
import type { Strategy } from "@/lib/types";
import type { UpdateStrategyCommand } from "@/lib/domain/strategy/commands";

interface EditStrategyDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  strategy: Strategy;
  onStrategyUpdated: () => void;
  teamId: string;
}

export function EditStrategyDialog({
  isOpen,
  onOpenChange,
  strategy,
  onStrategyUpdated,
  teamId,
}: EditStrategyDialogProps) {
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (strategy) {
      setDescription(strategy.description);
      setTimeframe(strategy.timeframe);
    }
  }, [strategy]);

  const handleSubmit = async () => {
    if (!description.trim() || !timeframe.trim()) {
      toast({
        title: "Missing Information",
        description: "Description and timeframe are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const command: UpdateStrategyCommand = {
      strategyId: strategy.id,
      description: description.trim(),
      timeframe: timeframe.trim(),
    };

    try {
      const response = await fetch(`/api/teams/${teamId}/strategies/${strategy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update strategy');
      }

      toast({
        title: "Strategy Updated",
        description: `The strategy has been successfully updated.`,
      });

      onOpenChange(false);
      onStrategyUpdated();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Could not update the strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Strategy</DialogTitle>
          <DialogDescription>
            Update the description and timeframe for your strategy.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Enhance user onboarding flow"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Input
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="e.g., Q3 2024"
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
            disabled={!description.trim() || !timeframe.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
