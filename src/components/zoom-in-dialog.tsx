
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Organization } from "@/lib/types";

interface ZoomInDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organizations: Organization[];
  onSelect: (link: string) => void;
  currentOrgId: string;
}

export function ZoomInDialog({ isOpen, onOpenChange, organizations, onSelect, currentOrgId }: ZoomInDialogProps) {
  const handleSelect = (orgId: string) => {
    onSelect(`/organization/${orgId}/radar`);
    onOpenChange(false);
  };
  
  const availableOrgs = organizations.filter(org => org.id !== currentOrgId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link to another Radar</DialogTitle>
          <DialogDescription>
            Select an organization's radar to link to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2 max-h-96 overflow-y-auto">
          {availableOrgs.map(org => (
            <Button
              key={org.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleSelect(org.id)}
            >
              {org.name}
            </Button>
          ))}
           {availableOrgs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No other organizations available to link to.</p>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
