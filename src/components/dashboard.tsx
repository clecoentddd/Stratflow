
"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";

import type { Dashboard, Strategy, StrategyState, RadarItem } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { CreateStrategyDialog } from "@/components/create-strategy-dialog";
import { StrategyView } from "@/components/strategy-view";

const strategyOrder: Record<StrategyState, number> = {
  Draft: 1,
  Open: 2,
  Closed: 3,
  Obsolete: 4,
  Deleted: 5,
};

interface StrategyDashboardProps {
    dashboard: Dashboard;
    radarItems: RadarItem[];
    dashboardName: string;
    orgId: string;
    onCreateStrategy: (description: string, timeframe: string) => void;
    onUpdateStrategy: (strategyId: string, updatedValues: Partial<Strategy>) => void;
    onCreateInitiative: (strategyId: string, initiativeName: string) => void;
}

export function StrategyDashboard({ 
  dashboard, 
  radarItems, 
  dashboardName,
  orgId,
  onCreateStrategy,
  onUpdateStrategy,
  onCreateInitiative
}: StrategyDashboardProps) {
  const [isCreateStrategyOpen, setCreateStrategyOpen] = useState(false);

  const sortedStrategies = useMemo(() => {
    if (!dashboard?.strategies) return [];
    
    return [...dashboard.strategies].sort((a, b) => {
        return strategyOrder[a.state] - strategyOrder[b.state];
    });
  }, [dashboard]);
  
  const handleCreateStrategy = (description: string, timeframe: string) => {
    onCreateStrategy(description, timeframe);
    setCreateStrategyOpen(false);
  };
  
  return (
    <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-headline">
            {dashboardName || "Strategy Board"}
          </h2>
          <Button onClick={() => setCreateStrategyOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Strategy
          </Button>
        </div>

        <div className="space-y-6">
          {sortedStrategies && sortedStrategies.length > 0 ? (
              sortedStrategies.map(strategy => {
                  const isFocused = strategy.state === 'Draft' || strategy.state === 'Open';
                  return (
                      <StrategyView 
                          key={strategy.id} 
                          strategy={strategy} 
                          radarItems={radarItems}
                          isFocused={isFocused}
                          orgId={orgId}
                          onUpdateStrategy={(updatedValues) => onUpdateStrategy(strategy.id, updatedValues)}
                          onCreateInitiative={(initiativeName) => onCreateInitiative(strategy.id, initiativeName)}
                      />
                  )
              })
          ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-lg">
                  <h3 className="text-xl font-medium text-muted-foreground">No strategies yet.</h3>
                  <p className="text-muted-foreground mt-2">Get started by creating a new strategy.</p>
              </div>
          )}
        </div>
      <CreateStrategyDialog
        isOpen={isCreateStrategyOpen}
        onOpenChange={setCreateStrategyOpen}
        onCreate={handleCreateStrategy}
      />
    </div>
  );
}
