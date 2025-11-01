"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import styles from "./kanban.module.css";

type Team = { id: string; name?: string; level?: number };

type Props = {
  teams: Team[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function TeamSelectorDialog({ teams, open, onOpenChange, selectedIds, onChange }: Props) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedIds || []);

  // keep local selection in sync when props change
  React.useEffect(() => setLocalSelection(selectedIds || []), [selectedIds]);

  const grouped = useMemo(() => {
    const m = new Map<number, Team[]>();
    for (const t of teams) {
      const lvl = typeof t.level === "number" ? t.level : 999;
      if (!m.has(lvl)) m.set(lvl, []);
      m.get(lvl)!.push(t);
    }
    // sort keys ascending
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  }, [teams]);

  const toggle = (id: string) => {
    setLocalSelection((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const selectAll = () => setLocalSelection(teams.map((t) => t.id));
  const clearAll = () => setLocalSelection([]);

  const apply = () => {
    onChange(localSelection);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-[520px]" >
        <DialogHeader>
          <DialogTitle>Select teams</DialogTitle>
          <DialogDescription className="mb-2">Pick one or more teams to show on the Kanban board.</DialogDescription>
        </DialogHeader>

  <div className={"space-y-4 pr-2 " + styles.teamSelectorList + " " + styles.thinScrollbar}>
          <div className="flex items-center gap-2 mb-2">
            <Button size="sm" onClick={selectAll}>Select all</Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
            <div className="text-xs text-muted-foreground ml-auto">{localSelection.length} selected</div>
          </div>

          {grouped.map(([level, items]) => (
            <div key={String(level)} className="pb-3">
              {items.length > 1 ? (
                <div className={styles.levelHeaderSmall}>
                  <div className="text-sm font-medium">Level {level}</div>
                  <div className={styles.countSmall}>{items.length} teams</div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-2 mt-2">
                {items.map((t) => (
                  <label key={t.id} className={styles.teamRow}>
                    <Checkbox
                      checked={localSelection.includes(t.id)}
                      onCheckedChange={() => toggle(t.id)}
                    />
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground">{t.id}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={apply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
