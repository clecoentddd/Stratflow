"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { StrategyState } from "@/lib/types";

export type InitiativeSearchItem = {
  initiativeId: string;
  name: string;
  strategyId: string;
  strategyDescription: string;
  teamId: string;
  teamName: string;
  teamLevel: number;
  state: StrategyState;
};

export function InitiativeLinkDialog({
  open,
  onOpenChange,
  companyId,
  sourceInitiativeId,
  onLinked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  sourceInitiativeId: string;
  onLinked?: (count: number) => void;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InitiativeSearchItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (companyId) params.set("companyId", companyId);
        if (q) params.set("q", q);
        params.append("states", "Draft");
        params.append("states", "Active");
        const res = await fetch(`/api/initiatives/search?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        setItems(Array.isArray(data) ? data.filter((x) => x.initiativeId !== sourceInitiativeId) : []);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
    return () => controller.abort();
  }, [open, q, companyId, sourceInitiativeId]);

  const anySelected = useMemo(() => Object.values(selected).some(Boolean), [selected]);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const handleLink = async () => {
    const targets = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!targets.length) return;
    const res = await fetch(`/api/initiatives/${sourceInitiativeId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targets }),
    });
    const data = await res.json();
    if (res.ok) {
      onLinked?.(data?.count || targets.length);
      onOpenChange(false);
      setSelected({});
      setQ("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link initiatives</DialogTitle>
          <DialogDescription>Select one or more initiatives to link. Only Draft or Active strategies are eligible.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Search initiatives, strategies, teams" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="max-h-72 overflow-auto border rounded-md p-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-muted-foreground">No initiatives found</div>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => (
                  <li key={it.initiativeId} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {it.strategyDescription} · {it.teamName} (L{it.teamLevel}) · {it.state}
                      </div>
                    </div>
                    <Checkbox checked={!!selected[it.initiativeId]} onCheckedChange={() => toggle(it.initiativeId)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={!anySelected}>
            Link selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
