
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
  onCreate: (name: string, title: string, description: string, level: number) => void;
}

export function CreateOrganizationDialog({
  isOpen,
  onOpenChange,
  onCreate,
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("0");


  const handleSubmit = () => {
    const levelNum = parseInt(level, 10);
    if (name.trim() && title.trim() && !isNaN(levelNum)) {
      onCreate(name.trim(), title.trim(), description.trim(), levelNum);
      setName("");
      setTitle("");
      setDescription("");
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
            Give your new organization a name and define its first node.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Innovate Inc."
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="title">Node Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Board of Directors"
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Node Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Oversees the company's direction."
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="level">Node Level</Label>
            <Input
              id="level"
              type="number"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="e.g., 0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim() || !title.trim()}
          >
            Create Organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
