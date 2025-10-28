
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

interface EditStrategyDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  strategy: Strategy;
  onStrategyUpdated: (description: string, timeframe: string) => void;
  teamId: string;
}

export function EditStrategyDialog({
  isOpen,
  onOpenChange,
  strategy,
  onStrategyUpdated,
}: EditStrategyDialogProps) {
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState("");
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

    onStrategyUpdated(description, timeframe);
    onOpenChange(false);
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
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!description.trim() || !timeframe.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
