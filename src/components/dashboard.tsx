
"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Dashboard, Strategy, StrategyState, RadarItem } from "@/lib/types";
import type { CreateStrategyCommand } from "@/lib/domain/strategy/commands";
import { v4 as uuidv4 } from 'uuid';

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
    initialDashboard: Dashboard;
    radarItems: RadarItem[];
    dashboardName: string;
    orgId: string;
    onDataChange: () => void;
}

export function StrategyDashboard({ 
  initialDashboard, 
  radarItems, 
  dashboardName,
  orgId,
  onDataChange,
}: StrategyDashboardProps) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [isCreateStrategyOpen, setCreateStrategyOpen] = useState(false);
  const { toast } = useToast();

  console.log("--- StrategyDashboard: Render ---");

  const sortedStrategies = useMemo(() => {
    return [...dashboard.strategies].sort((a, b) => {
        return strategyOrder[a.state] - strategyOrder[b.state];
    });
  }, [dashboard.strategies]);

  const handleCreateStrategy = async (description: string, timeframe: string) => {
    console.log("StrategyDashboard: handleCreateStrategy called");
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
      const response = await fetch(`/api/teams/${orgId}/strategies`, {
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
    <div>
        <div className="flex items-center justify-end mb-6">
          <Button onClick={() => setCreateStrategyOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Strategy
          </Button>
        </div>

        <div className="space-y-6">
          {sortedStrategies.length > 0 ? (
              sortedStrategies.map(strategy => {
                  const isFocused = strategy.state === 'Draft' || strategy.state === 'Open';
                  return (
                      <StrategyView 
                          key={strategy.id} 
                          initialStrategy={strategy} 
                          radarItems={radarItems}
                          isFocused={isFocused}
                          orgId={orgId}
                          onStrategyChange={onDataChange}
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
