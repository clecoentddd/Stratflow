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

interface CreateStreamDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (name: string) => void;
}

export function CreateStreamDialog({
  isOpen,
  onOpenChange,
  onCreate,
}: CreateStreamDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Stream</DialogTitle>
          <DialogDescription>
            A stream is a high-level container for your strategies, like a project or a time period.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Q1 2025 Initiatives"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={!name.trim()}>
            Create Stream
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
