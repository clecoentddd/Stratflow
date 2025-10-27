

"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";

import type { Dashboard, Strategy, StrategyState, InitiativeStepKey, InitiativeItem, Initiative, RadarItem } from "@/lib/types";
import { newInitiativeTemplate } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

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
    onUpdateDashboard: (dashboard: Dashboard) => void;
}

export function StrategyDashboard({ dashboard, radarItems, dashboardName, onUpdateDashboard }: StrategyDashboardProps) {
  const { toast } = useToast();
  const [isCreateStrategyOpen, setCreateStrategyOpen] = useState(false);

  const sortedStrategies = useMemo(() => {
    if (!dashboard?.strategies) return [];
    
    return [...dashboard.strategies].sort((a, b) => {
        return strategyOrder[a.state] - strategyOrder[b.state];
    });
  }, [dashboard]);
  
  const updateDashboard = (updater: (currentDashboard: Dashboard) => Dashboard) => {
    onUpdateDashboard(updater(dashboard));
  };

  const handleCreateStrategy = useCallback((description: string, timeframe: string) => {
    const newStrategy: Strategy = {
      id: `strat-${Date.now()}`,
      description,
      timeframe,
      state: "Draft",
      initiatives: [],
    };
    updateDashboard(prev => ({ ...prev, strategies: [...prev.strategies, newStrategy] }));
    toast({
        title: "Strategy Created",
        description: `A new strategy has been added.`,
    });
  }, [toast, updateDashboard]);

  const handleCreateInitiative = useCallback((strategyId: string, initiativeName: string) => {
    const newInitiative = newInitiativeTemplate(`init-${Date.now()}`, initiativeName);
    
    updateDashboard(prev => ({
      ...prev,
      strategies: prev.strategies.map(strategy => {
        if (strategy.id !== strategyId) return strategy;
        return {
          ...strategy,
          initiatives: [...strategy.initiatives, newInitiative]
        };
      })
    }));
    toast({ title: "Initiative Added", description: `"${initiativeName}" has been added.` });
  }, [toast, updateDashboard]);

  const handleUpdateStrategy = useCallback((strategyId: string, updatedValues: Partial<Strategy>) => {
    updateDashboard(prev => ({
      ...prev,
      strategies: prev.strategies.map(s => s.id === strategyId ? { ...s, ...updatedValues } : s)
    }));
  }, [updateDashboard]);
  
  const handleUpdateInitiative = useCallback((strategyId: string, initiativeId: string, updatedValues: Partial<Initiative>) => {
    updateDashboard(prev => ({
      ...prev,
      strategies: prev.strategies.map(s => s.id === strategyId ? {
        ...s,
        initiatives: s.initiatives.map(i => i.id === initiativeId ? { ...i, ...updatedValues } : i)
      } : s)
    }));
  }, [updateDashboard]);

  const handleUpdateInitiativeItem = useCallback((strategyId: string, initiativeId: string, stepKey: InitiativeStepKey, itemId: string, newText: string) => {
    updateDashboard(prev => ({
        ...prev,
        strategies: prev.strategies.map(s => s.id === strategyId ? {
            ...s,
            initiatives: s.initiatives.map(i => i.id === initiativeId ? {
                ...i,
                steps: i.steps.map(step => step.key === stepKey ? {
                    ...step,
                    items: step.items.map(item => item.id === itemId ? {...item, text: newText} : item)
                } : step)
            } : i)
        } : s)
    }));
  }, [updateDashboard]);

  const handleAddInitiativeItem = useCallback((strategyId: string, initiativeId: string, stepKey: InitiativeStepKey) => {
    const newItem: InitiativeItem = { id: `item-${Date.now()}`, text: "" };
    updateDashboard(prev => ({
        ...prev,
        strategies: prev.strategies.map(s => s.id === strategyId ? {
            ...s,
            initiatives: s.initiatives.map(i => i.id === initiativeId ? {
                ...i,
                steps: i.steps.map(step => step.key === stepKey ? {
                    ...step,
                    items: [...step.items, newItem]
                } : step)
            } : i)
        } : s)
    }));
    toast({ title: "Item Added", description: `A new item has been added to the initiative.` });
  }, [toast, updateDashboard]);

  const handleDeleteInitiativeItem = useCallback((strategyId: string, initiativeId: string, stepKey: InitiativeStepKey, itemId: string) => {
    updateDashboard(prev => ({
        ...prev,
        strategies: prev.strategies.map(s => s.id === strategyId ? {
            ...s,
            initiatives: s.initiatives.map(i => i.id === initiativeId ? {
                ...i,
                steps: i.steps.map(step => step.key === stepKey ? {
                    ...step,
                    items: step.items.filter(item => item.id !== itemId)
                } : step)
            } : i)
        } : s)
    }));
    toast({ title: "Item Removed", variant: "destructive" });
  }, [toast, updateDashboard]);

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
                          onCreateInitiative={(initiativeName) => handleCreateInitiative(strategy.id, initiativeName)}
                          onUpdateStrategy={(updatedValues) => handleUpdateStrategy(strategy.id, updatedValues)}
                          onUpdateInitiative={(initiativeId, updatedValues) => handleUpdateInitiative(strategy.id, initiativeId, updatedValues)}
                          onUpdateInitiativeItem={(...args) => handleUpdateInitiativeItem(strategy.id, ...args)}
                          onAddInitiativeItem={(...args) => handleAddInitiativeItem(strategy.id, ...args)}
                          onDeleteInitiativeItem={(...args) => handleDeleteInitiativeItem(strategy.id, ...args)}
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
