
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
import { Textarea } from "./ui/textarea";

interface CreateOrganizationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (name: string, purpose: string, context: string, level: number) => void;
}

export function CreateOrganizationDialog({
  isOpen,
  onOpenChange,
  onCreate,
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [context, setContext] = useState("");
  const [level, setLevel] = useState("0");


  const handleSubmit = () => {
    const levelNum = parseInt(level, 10);
    if (name.trim() && purpose.trim() && !isNaN(levelNum)) {
      onCreate(name.trim(), purpose.trim(), context.trim(), levelNum);
      setName("");
      setPurpose("");
      setContext("");
      setLevel("0");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Define a new organization with its name, purpose, context, and level.
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
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim() || !purpose.trim()}
          >
            Create Organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
