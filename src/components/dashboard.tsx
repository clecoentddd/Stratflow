
"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Workflow } from "lucide-react";

import type { Stream, Strategy, Initiative, StrategyState, InitiativeStepKey, InitiativeItem } from "@/lib/types";
import { initialStreams, newInitiativeTemplate } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/header";
import { StratFlowLogo } from "@/components/icons";
import { CreateStreamDialog } from "@/components/create-stream-dialog";
import { CreateStrategyDialog } from "@/components/create-strategy-dialog";
import { StrategyView } from "@/components/strategy-view";

export function Dashboard() {
  const { toast } = useToast();
  const [streams, setStreams] = useState<Stream[]>(initialStreams);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(initialStreams[0]?.id || null);
  const [isCreateStreamOpen, setCreateStreamOpen] = useState(false);
  const [isCreateStrategyOpen, setCreateStrategyOpen] = useState(false);

  const activeStream = useMemo(() => streams.find((s) => s.id === activeStreamId), [streams, activeStreamId]);

  const handleCreateStream = useCallback((name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    const newStream: Stream = { id, name, strategies: [] };
    setStreams((prev) => [...prev, newStream]);
    setActiveStreamId(id);
    toast({
        title: "Stream Created",
        description: `Successfully created "${name}".`,
    });
  }, [toast]);

  const handleCreateStrategy = useCallback((description: string, timeframe: string) => {
    if (!activeStreamId) return;
    const newStrategy: Strategy = {
      id: `strat-${Date.now()}`,
      description,
      timeframe,
      state: "Draft",
      initiatives: [],
    };
    setStreams((prev) =>
      prev.map((stream) =>
        stream.id === activeStreamId
          ? { ...stream, strategies: [...stream.strategies, newStrategy] }
          : stream
      )
    );
    toast({
        title: "Strategy Created",
        description: `A new strategy has been added to the stream.`,
    });
  }, [activeStreamId, toast]);

  const handleCreateInitiative = useCallback((strategyId: string, initiativeName: string) => {
    if (!activeStreamId) return;

    const newInitiative = newInitiativeTemplate(`init-${Date.now()}`, initiativeName);
    
    setStreams(prev => prev.map(stream => {
      if (stream.id !== activeStreamId) return stream;
      return {
        ...stream,
        strategies: stream.strategies.map(strategy => {
          if (strategy.id !== strategyId) return strategy;
          return {
            ...strategy,
            initiatives: [...strategy.initiatives, newInitiative]
          };
        })
      };
    }));
    toast({ title: "Initiative Added", description: `"${initiativeName}" has been added.` });
  }, [activeStreamId, toast]);

  const handleUpdateStrategy = useCallback((strategyId: string, updatedValues: Partial<Strategy>) => {
    if (!activeStreamId) return;
    setStreams(prev => prev.map(stream => stream.id === activeStreamId ? {
      ...stream,
      strategies: stream.strategies.map(s => s.id === strategyId ? { ...s, ...updatedValues } : s)
    } : stream));
  }, [activeStreamId]);
  
  const handleUpdateInitiative = useCallback((strategyId: string, initiativeId: string, updatedValues: Partial<Initiative>) => {
    if (!activeStreamId) return;
    setStreams(prev => prev.map(stream => stream.id === activeStreamId ? {
      ...stream,
      strategies: stream.strategies.map(s => s.id === strategyId ? {
        ...s,
        initiatives: s.initiatives.map(i => i.id === initiativeId ? { ...i, ...updatedValues } : i)
      } : s)
    } : stream));
  }, [activeStreamId]);

  const handleUpdateInitiativeItem = useCallback((strategyId: string, initiativeId: string, stepKey: InitiativeStepKey, itemId: string, newText: string) => {
    if (!activeStreamId) return;
    setStreams(prev => prev.map(stream => stream.id === activeStreamId ? {
        ...stream,
        strategies: stream.strategies.map(s => s.id === strategyId ? {
            ...s,
            initiatives: s.initiatives.map(i => i.id === initiativeId ? {
                ...i,
                steps: i.steps.map(step => step.key === stepKey ? {
                    ...step,
                    items: step.items.map(item => item.id === itemId ? {...item, text: newText} : item)
                } : step)
            } : i)
        } : s)
    } : stream));
  }, [activeStreamId]);

  const handleAddInitiativeItem = useCallback((strategyId: string, initiativeId: string, stepKey: InitiativeStepKey) => {
    if (!activeStreamId) return;
    const newItem: InitiativeItem = { id: `item-${Date.now()}`, text: "" };
    setStreams(prev => prev.map(stream => stream.id === activeStreamId ? {
        ...stream,
        strategies: stream.strategies.map(s => s.id === strategyId ? {
            ...s,
            initiatives: s.initiatives.map(i => i.id === initiativeId ? {
                ...i,
                steps: i.steps.map(step => step.key === stepKey ? {
                    ...step,
                    items: [...step.items, newItem]
                } : step)
            } : i)
        } : s)
    } : stream));
    toast({ title: "Item Added", description: `A new item has been added to the initiative.` });
  }, [activeStreamId, toast]);

  const handleDeleteInitiativeItem = useCallback((strategyId: string, initiativeId: string, stepKey: InitiativeStepKey, itemId: string) => {
    if (!activeStreamId) return;
    setStreams(prev => prev.map(stream => stream.id === activeStreamId ? {
        ...stream,
        strategies: stream.strategies.map(s => s.id === strategyId ? {
            ...s,
            initiatives: s.initiatives.map(i => i.id === initiativeId ? {
                ...i,
                steps: i.steps.map(step => step.key === stepKey ? {
                    ...step,
                    items: step.items.filter(item => item.id !== itemId)
                } : step)
            } : i)
        } : s)
    } : stream));
    toast({ title: "Item Removed", variant: "destructive" });
  }, [activeStreamId, toast]);


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <StratFlowLogo className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-headline font-semibold">StratFlow</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <h2 className="px-2 py-1 text-sm font-medium text-muted-foreground font-headline">Streams</h2>
            </SidebarMenuItem>
            {streams.map((stream) => (
              <SidebarMenuItem key={stream.id}>
                <SidebarMenuButton
                  onClick={() => setActiveStreamId(stream.id)}
                  isActive={activeStreamId === stream.id}
                  className="font-body"
                >
                  <Workflow />
                  <span>{stream.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="outline" onClick={() => setCreateStreamOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Stream
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <AppHeader />
        <main className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold font-headline">
              {activeStream?.name || "No Stream Selected"}
            </h1>
            <Button onClick={() => setCreateStrategyOpen(true)} disabled={!activeStream}>
              <Plus className="mr-2 h-4 w-4" />
              New Strategy
            </Button>
          </div>

          <div className="space-y-6">
            {activeStream?.strategies && activeStream.strategies.length > 0 ? (
                activeStream.strategies.map(strategy => (
                    <StrategyView 
                        key={strategy.id} 
                        strategy={strategy} 
                        onCreateInitiative={(initiativeName) => handleCreateInitiative(strategy.id, initiativeName)}
                        onUpdateStrategy={(updatedValues) => handleUpdateStrategy(strategy.id, updatedValues)}
                        onUpdateInitiative={(initiativeId, updatedValues) => handleUpdateInitiative(strategy.id, initiativeId, updatedValues)}
                        onUpdateInitiativeItem={(...args) => handleUpdateInitiativeItem(strategy.id, ...args)}
                        onAddInitiativeItem={(...args) => handleAddInitiativeItem(strategy.id, ...args)}
                        onDeleteInitiativeItem={(...args) => handleDeleteInitiativeItem(strategy.id, ...args)}
                    />
                ))
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-medium text-muted-foreground">No strategies yet.</h3>
                    <p className="text-muted-foreground mt-2">Get started by creating a new strategy.</p>
                </div>
            )}
          </div>
        </main>
      </SidebarInset>

      <CreateStreamDialog
        isOpen={isCreateStreamOpen}
        onOpenChange={setCreateStreamOpen}
        onCreate={handleCreateStream}
      />
      <CreateStrategyDialog
        isOpen={isCreateStrategyOpen}
        onOpenChange={setCreateStrategyOpen}
        onCreate={handleCreateStrategy}
      />
    </SidebarProvider>
  );
}
