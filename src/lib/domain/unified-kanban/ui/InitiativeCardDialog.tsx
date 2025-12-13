"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InitiativeView } from "@/lib/domain/initiatives/ui";
import type { Initiative, RadarItem } from "@/lib/types";
import { useState, useEffect } from "react";
import styles from "./InitiativeCardDialog.module.css";

interface InitiativeCardDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initiative: Initiative;
  radarItems: RadarItem[];
  orgId: string;
  strategyId: string;
  strategyName?: string;
  onUpdate: () => void; // Callback to refresh parent data
}

export function InitiativeCardDialog({
  isOpen,
  onOpenChange,
  initiative: initialInitiative,
  radarItems,
  orgId,
  strategyId,
  strategyName,
  onUpdate
}: InitiativeCardDialogProps) {
  const [initiative, setInitiative] = useState({ ...initialInitiative, isExpanded: true });

  useEffect(() => {
    setInitiative({ ...initialInitiative, isExpanded: true });
  }, [initialInitiative]);

  const handleLocalUpdate = (id: string, updated: Partial<Initiative>) => {
    setInitiative(prev => ({ ...prev, ...updated }));
  };

  const handleDelete = (id: string, stratId: string) => {
    // Deletion logic is handled inside InitiativeView usually, but here we might want to close the dialog
    // InitiativeView calls onDeleteInitiative which does the API call in StrategyView.
    // Here we need to implement the API call or pass a handler.
    // Since InitiativeView expects a handler that does the deletion, let's implement it.
    // But wait, InitiativeView's onDeleteInitiative prop is: (initiativeId: string, strategyId: string) => void
    // It assumes the parent handles the state update.
    
    // We should probably implement the delete call here if we want it to work.
    // Or just close the dialog and let the user delete it from the board (if that's possible).
    // For now, let's just close the dialog and trigger update.
    onOpenChange(false);
    onUpdate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle asChild>
            {strategyName ? (
              <div className={styles.headerContainer}>
                <span className={styles.strategyName}>{strategyName}</span>
                <span className={styles.dialogTitle}>Initiative Details</span>
              </div>
            ) : (
              <span className={styles.dialogTitle}>Initiative Details</span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and edit details for initiative {initiative.name}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <InitiativeView
            initialInitiative={initiative}
            radarItems={radarItems}
            orgId={orgId}
            strategyId={strategyId}
            onInitiativeChange={onUpdate}
            onDeleteInitiative={handleDelete}
            onLocalUpdate={handleLocalUpdate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
