
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
import type { CreateOrganizationCommand } from "@/lib/domain/organizations/commands";

interface CreateOrganizationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onOrganizationCreated: () => void;
  companyId: string;
}

export function CreateOrganizationDialog({
  isOpen,
  onOpenChange,
  onOrganizationCreated,
  companyId
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [context, setContext] = useState("");
  const [level, setLevel] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setPurpose("");
    setContext("");
    setLevel("0");
  };

  const handleSubmit = async () => {
    const levelNum = parseInt(level, 10);
    if (!name.trim() || !purpose.trim() || isNaN(levelNum) || !companyId) {
        toast({ title: "Missing Information", description: "Please fill out all fields.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    const command: CreateOrganizationCommand = {
      companyId,
      name: name.trim(),
      purpose: purpose.trim(),
      context: context.trim(),
      level: levelNum,
    };

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error('Failed to create organization');
      }

      toast({
        title: "Organization Created",
        description: `"${command.name}" has been successfully created.`,
      });

      resetForm();
      onOpenChange(false);
      onOrganizationCreated(); // Callback to trigger re-fetch
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not create the organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isFormValid = name.trim() && purpose.trim() && companyId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Define a new organization within your company.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="name">Organization Name</Label>
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
            {isSubmitting ? 'Creating...' : 'Create Organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
