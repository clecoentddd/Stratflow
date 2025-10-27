
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RadarItem } from "@/lib/types";

interface LinkRadarItemsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  availableItems: RadarItem[];
  linkedItemIds: string[];
  onLinkItems: (selectedIds: string[]) => void;
}

export function LinkRadarItemsDialog({
  isOpen,
  onOpenChange,
  availableItems,
  linkedItemIds,
  onLinkItems,
}: LinkRadarItemsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(linkedItemIds);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(linkedItemIds);
    }
  }, [isOpen, linkedItemIds]);

  const handleToggle = (itemId: string) => {
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSave = () => {
    onLinkItems(selectedIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tag Radar Items</DialogTitle>
          <DialogDescription>
            Select radar items to tag this initiative with.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72">
            <div className="space-y-2 p-4">
            {availableItems.length > 0 ? (
                availableItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`radar-link-${item.id}`}
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => handleToggle(item.id)}
                    />
                    <Label
                        htmlFor={`radar-link-${item.id}`}
                        className="font-normal cursor-pointer"
                    >
                        {item.name}
                    </Label>
                </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center">No radar items available in this organization.</p>
            )}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Tags</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
