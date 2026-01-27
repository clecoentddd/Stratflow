"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, FileEdit, Target, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Dashboard, Strategy, StrategyState, RadarItem } from "@/lib/types";
import type { CreateStrategyCommand } from "@/lib/domain/strategies/commands";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { CreateStrategyDialog } from "./CreateStrategyDialog";
import { StrategyView } from "./StrategyView";
import styles from "./StrategyDashboard.module.css";

const strategyOrder: Record<StrategyState, number> = {
  Draft: 1,
  Active: 2,
  Closed: 3,
  Obsolete: 4,
  Deleted: 5,
};

interface StrategyDashboardProps {
  initialDashboard: Dashboard;
  radarItems: RadarItem[];
  orgId: string;
  onDataChange: () => void;
  isCreateStrategyOpen: boolean;
  setCreateStrategyOpen: (isOpen: boolean) => void;
}

export function StrategyDashboard({
  initialDashboard,
  radarItems,
  orgId,
  onDataChange,
  isCreateStrategyOpen,
  setCreateStrategyOpen,
}: StrategyDashboardProps) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [activeTab, setActiveTab] = useState<'draft' | 'active' | 'archive'>('draft');
  const { toast } = useToast();

  useEffect(() => {
    setDashboard(initialDashboard);
  }, [initialDashboard]);

  const { currentStrategies, archivedStrategies } = useMemo(() => {
    if (!dashboard || !dashboard.strategies) return { currentStrategies: [], archivedStrategies: [] };

    const current = dashboard.strategies.filter(s => s.state === 'Draft' || s.state === 'Active')
      .sort((a, b) => strategyOrder[a.state] - strategyOrder[b.state]);

    const archived = dashboard.strategies.filter(s => s.state === 'Closed' || s.state === 'Obsolete')
      .sort((a, b) => strategyOrder[a.state] - strategyOrder[b.state]);

    return { currentStrategies: current, archivedStrategies: archived };
  }, [dashboard]);

  const counts = useMemo(() => {
    const draft = dashboard.strategies.filter(s => s.state === 'Draft').length;
    const active = dashboard.strategies.filter(s => s.state === 'Active').length;
    const archive = dashboard.strategies.filter(s => s.state === 'Closed' || s.state === 'Obsolete').length;
    return { draft, active, archive };
  }, [dashboard.strategies]);

  const handleCreateStrategy = async (description: string, timeframe: string, _teamId?: string) => {
    setCreateStrategyOpen(false);

    const command: CreateStrategyCommand = { description, timeframe };
    const tempId = `strat-temp-${uuidv4()}`;

    // Optimistic UI Update
    const newStrategy: Strategy = {
      id: tempId,
      description,
      timeframe,
      state: 'Draft',
      initiatives: [],
    };

    setDashboard(prev => ({
      ...prev,
      strategies: [...prev.strategies, newStrategy],
    }));

    try {
      const response = await fetch(`/api/strategies?teamId=${encodeURIComponent(orgId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        // Standard error format handling
        const json = await response.json().catch(() => ({}));
        const msg = json.error?.message || json.error || `Failed to create strategy.`;
        throw new Error(msg);
      }

      toast({
        title: "Success",
        description: "Strategy has been created.",
      });

      // Re-fetch data in the background to sync server-generated ID
      onDataChange();

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      // On failure, rollback the optimistic update by re-fetching
      onDataChange();
    }
  };

  return (
    <div className={styles.container} data-active={activeTab}>
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <div className={styles.tabsPill}>
            <button
              className={styles.tabPill}
              data-active={activeTab === 'draft'}
              onClick={() => setActiveTab('draft')}
            >
              <FileEdit className="w-4 h-4 mr-2" />
              <span>Draft</span>
              {counts.draft > 0 && <span className={styles.tabCount}>{counts.draft}</span>}
            </button>
            <button
              className={styles.tabPill}
              data-active={activeTab === 'active'}
              onClick={() => setActiveTab('active')}
            >
              <Target className="w-4 h-4 mr-2" />
              <span>Active</span>
              {counts.active > 0 && <span className={styles.tabCount}>{counts.active}</span>}
            </button>
            <button
              className={styles.tabPill}
              data-active={activeTab === 'archive'}
              onClick={() => setActiveTab('archive')}
            >
              <Archive className="w-4 h-4 mr-2" />
              <span>Archive</span>
              {counts.archive > 0 && <span className={styles.tabCount}>{counts.archive}</span>}
            </button>
          </div>

          <Button
            onClick={() => setCreateStrategyOpen(true)}
            className="bg-[#388cfa] hover:bg-[#2a7ae8] text-white h-9 px-4 rounded-full font-semibold shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Strategy
          </Button>
        </div>
      </div>

      {activeTab === 'draft' ? (
        <div className={styles.strategySection}>
          {dashboard.strategies.filter(s => s.state === 'Draft').length > 0 ? (
            <div className="space-y-8">
              {dashboard.strategies
                .filter(s => s.state === 'Draft')
                .map(strategy => (
                  <StrategyView
                    key={strategy.id}
                    initialStrategy={strategy}
                    radarItems={radarItems}
                    isFocused={true}
                    orgId={orgId}
                    onStrategyChange={onDataChange}
                  />
                ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyStateTitle}>No draft strategies</h3>
              <p className={styles.emptyStateText}>Get started by creating a new strategy.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'active' ? (
        <div className={styles.strategySection}>
          {dashboard.strategies.filter(s => s.state === 'Active').length > 0 ? (
            <div className="space-y-8">
              {dashboard.strategies
                .filter(s => s.state === 'Active')
                .map(strategy => (
                  <StrategyView
                    key={strategy.id}
                    initialStrategy={strategy}
                    radarItems={radarItems}
                    isFocused={true}
                    orgId={orgId}
                    onStrategyChange={onDataChange}
                  />
                ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyStateTitle}>No active strategies</h3>
              <p className={styles.emptyStateText}>Move a draft strategy to active when ready.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.strategySection}>
          {dashboard.strategies.filter(s => s.state === 'Closed' || s.state === 'Obsolete').length > 0 ? (
            <div className="space-y-8">
              {dashboard.strategies
                .filter(s => s.state === 'Closed' || s.state === 'Obsolete')
                .sort((a, b) => strategyOrder[a.state] - strategyOrder[b.state])
                .map(strategy => (
                  <StrategyView
                    key={strategy.id}
                    initialStrategy={strategy}
                    radarItems={radarItems}
                    isFocused={false}
                    orgId={orgId}
                    onStrategyChange={onDataChange}
                  />
                ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyStateTitle}>No archived strategies</h3>
              <p className={styles.emptyStateText}>Archived strategies will appear here.</p>
            </div>
          )}
        </div>
      )}

      <CreateStrategyDialog
        isOpen={isCreateStrategyOpen}
        onOpenChange={setCreateStrategyOpen}
        onCreate={handleCreateStrategy}
        teamId={orgId}
      />
    </div>
  );
}