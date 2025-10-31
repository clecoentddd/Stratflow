"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { StrategyState } from "@/lib/types";
import styles from "./InitiativeLinkDialog.module.css";

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

  const sortedItems = useMemo(() => {
    return items
      .slice()
      .sort((a, b) => {
        // sort by team level (asc), then team name (asc, case-insensitive), then initiative name
        const levelDiff = (a.teamLevel ?? 0) - (b.teamLevel ?? 0);
        if (levelDiff !== 0) return levelDiff;
        const teamNameA = (a.teamName || '').toLowerCase();
        const teamNameB = (b.teamName || '').toLowerCase();
        if (teamNameA < teamNameB) return -1;
        if (teamNameA > teamNameB) return 1;
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
  }, [items]);

  const grouped = useMemo(() => {
    const byLevel = new Map<number, Map<string, InitiativeSearchItem[]>>();
    for (const it of sortedItems) {
      const lvl = it.teamLevel ?? 0;
      if (!byLevel.has(lvl)) byLevel.set(lvl, new Map());
      const byTeam = byLevel.get(lvl)!;
      const team = it.teamName || it.teamId;
      if (!byTeam.has(team)) byTeam.set(team, []);
      byTeam.get(team)!.push(it);
    }
    return byLevel;
  }, [sortedItems]);

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
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Link initiatives</DialogTitle>
          <DialogDescription>Select one or more initiatives to link. Only Draft or Active strategies are eligible.</DialogDescription>
        </DialogHeader>
        <div className={styles.container}>
          <Input placeholder="Search initiatives, strategies, teams" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className={styles.listContainer}>
            {loading ? (
              <div className={styles.itemMeta}>Loading…</div>
            ) : items.length === 0 ? (
              <div className={styles.itemMeta}>No initiatives found</div>
            ) : (
              <div>
                {Array.from(grouped.keys()).map((level) => (
                  <div key={`lvl-${level}`}>
                    <div className={styles.levelHeader}>Level {level}</div>
                    {Array.from(grouped.get(level)!.keys()).map((team) => (
                      <div key={`lvl-${level}-team-${team}`} className={styles.teamBlock}>
                        <div className={styles.teamHeader}>{team}</div>
                        <ul className={styles.items}>
                          {grouped.get(level)!.get(team)!.map((it) => (
                            <li key={it.initiativeId} className={styles.item}>
                              <div className={styles.itemMain}>
                                <div className={styles.itemTitle}>
                                  {it.name} · {it.state}
                                </div>
                                <div className={styles.itemMeta}>
                                  {it.strategyDescription}
                                </div>
                              </div>
                              <Checkbox checked={!!selected[it.initiativeId]} onCheckedChange={() => toggle(it.initiativeId)} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
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
