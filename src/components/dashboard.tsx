
"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";

import type { Stream, Strategy, Initiative, StrategyState, InitiativeStepKey, InitiativeItem } from "@/lib/types";
import { initialStreams, newInitiativeTemplate } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/header";
import { CreateStrategyDialog } from "@/components/create-strategy-dialog";
import { StrategyView } from "@/components/strategy-view";

const strategyOrder: Record<StrategyState, number> = {
  Draft: 1,
  Open: 2,
  Closed: 3,
  Obsolete: 4,
  Deleted: 5,
};

export function Dashboard() {
  const { toast } = useToast();
  const [stream, setStream] = useState<Stream>(initialStreams[0]);
  const [isCreateStrategyOpen, setCreateStrategyOpen] = useState(false);

  const sortedStrategies = useMemo(() => {
    if (!stream?.strategies) return [];
    
    return [...stream.strategies].sort((a, b) => {
        return strategyOrder[a.state] - strategyOrder[b.state];
    });
  }, [stream]);

  const handleCreateStrategy = useCallback((description: string, timeframe: string) => {
    const newStrategy: Strategy = {
      id: `strat-${Date.now()}`,
      description,
      timeframe,
      state: "Draft",
      initiatives: [],
    };
    setStream((prev) => ({ ...prev, strategies: [...prev.strategies, newStrategy] }));
    toast({
        title: "Strategy Created",
        description: `A new strategy has been added.`,
    });
  }, [toast]);

  const handleCreateInitiative = useCallback((strategyId: string, initiativeName: string) => {
    const newInitiative = newInitiativeTemplate(`init-${Date.now()}`, initiativeName);
    
    setStream(prev => ({
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
  }, [toast]);

  const handleUpdateStrategy = useCallback((strategyId: string, updatedValues: Partial<Strategy>) => {
    setStream(prev => ({
      ...prev,
      strategies: prev.strategies.map(s => s.id === strategyId ? { ...s, ...updatedValues } : s)
    }));
  }, []);
  
  const handleUpdateInitiative = useCallback((strategyId: string, initiativeId: string, updatedValues: Partial<Initiative>) => {
    setStream(prev => ({
      ...prev,
      strategies: prev.strategies.map(s => s.id === strategyId ? {
        ...s,
        initiatives: s.initiatives.map(i => i.id === initiativeId ? { ...i, ...updatedValues } : i)
      } : s)
    }));
  }, []);

  const handleUpdateInitiativeItem = useCallback((strategyId: string, initiativeId: string, stepKey: InitiativeStepKey, itemId: string, newText: string) => {
    setStream(prev => ({
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
  }, []);

  const handleAddInitiativeItem = useCallback((strategyId: string, initiativeId: string, stepKey: InitiativeStepKey) => {
    const newItem: InitiativeItem = { id: `item-${Date.now()}`, text: "" };
    setStream(prev => ({
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
  }, [toast]);

  const handleDeleteInitiativeItem = useCallback((strategyId: string, initiativeId: string, stepKey: InitiativeStepKey, itemId: string) => {
    setStream(prev => ({
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
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-headline">
            {stream?.name || "Strategy Board"}
          </h1>
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
      </main>

      <CreateStrategyDialog
        isOpen={isCreateStrategyOpen}
        onOpenChange={setCreateStrategyOpen}
        onCreate={handleCreateStrategy}
      />
    </div>
  );
}
