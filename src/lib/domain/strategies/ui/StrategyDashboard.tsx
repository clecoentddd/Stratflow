"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
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

  const handleCreateStrategy = async (description: string, timeframe: string) => {
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
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create strategy.`);
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
      <div className={styles.tabs}>
        <button 
          className={styles.tab} 
          data-active={activeTab === 'draft' ? 'draft' : undefined} 
          onClick={() => setActiveTab('draft')}
        >
          Draft Strategy
        </button>
        <button 
          className={styles.tab} 
          data-active={activeTab === 'active' ? 'active' : undefined} 
          onClick={() => setActiveTab('active')}
        >
          Active Strategy
        </button>
        <button 
          className={styles.tab} 
          data-active={activeTab === 'archive' ? 'archive' : undefined} 
          onClick={() => setActiveTab('archive')}
        >
          Archived Strategies
        </button>
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
      />
    </div>
  );
}