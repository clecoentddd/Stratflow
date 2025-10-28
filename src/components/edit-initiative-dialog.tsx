
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

interface EditInitiativeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initiativeName: string;
  onSave: (newName: string) => void;
}

export function EditInitiativeDialog({
  isOpen,
  onOpenChange,
  initiativeName,
  onSave,
}: EditInitiativeDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(initiativeName);
    }
  }, [isOpen, initiativeName]);

  const handleSubmit = () => {
    if (name.trim()) {
      onSave(name.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Initiative Name</DialogTitle>
          <DialogDescription>
            Update the name for your initiative.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Initiative Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Conduct Market Research"
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
            disabled={!name.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
