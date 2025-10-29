"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from 'next/link';
import { Plus, Edit, MoreVertical, Search, Milestone, ListChecks, Target, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { strategyStates } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import styles from "./strategy-view.module.css";

import type { Strategy, RadarItem, Initiative, InitiativeStep } from "@/lib/types";
import type { UpdateStrategyCommand } from "@/lib/domain/strategies/commands";
import type { CreateInitiativeCommand, DeleteInitiativeCommand } from "@/lib/domain/initiatives/commands";
import { InitiativeView } from "../../initiatives/ui";
import { EditStrategyDialog } from "./EditStrategyDialog";

const iconMap = { FilePenLine: Edit, Rocket: Plus, CheckCircle2: Plus, Archive: Plus };

interface StrategyViewProps {
  initialStrategy: Strategy;
  radarItems: RadarItem[];
  isFocused: boolean;
  orgId: string;
  onStrategyChange: () => void;
}

export function StrategyView({ 
    initialStrategy,
    radarItems,
    isFocused,
    orgId,
    onStrategyChange
}: StrategyViewProps) {
  const [strategy, setStrategy] = useState(initialStrategy);
  const [newInitiativeName, setNewInitiativeName] = useState("");
  const [isCreatingInitiative, setCreatingInitiative] = useState(false);
  const [isEditStrategyOpen, setEditStrategyOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // This effect ensures the component's internal state is updated
    // when the parent passes down a new version of the strategy,
    // specifically after the temporary ID is replaced with the real one.
    if (initialStrategy.id !== strategy.id) {
        setStrategy(initialStrategy);
    }
  }, [initialStrategy, strategy.id]);

  const isSaving = strategy.id.startsWith('strat-temp-');

  const overallProgression = useMemo(() => {
    if (strategy.initiatives.length === 0) return 0;
    const total = strategy.initiatives.reduce(
      (acc, i) => acc + i.progression,
      0
    );
    return Math.round(total / strategy.initiatives.length);
  }, [strategy.initiatives]);

  const currentStateInfo = strategyStates.find(s => s.value === strategy.state) || strategyStates[0];
  const CurrentStateIcon = iconMap[currentStateInfo.iconName as keyof typeof iconMap] || Edit;
  
  const handleUpdateStrategy = useCallback(async (updatedValues: Partial<Strategy>) => {
    const originalStrategy = strategy;
    
    // Use functional update to ensure we're working with the latest state
    setStrategy(prev => ({...prev, ...updatedValues}));
    
    const command: UpdateStrategyCommand = { ...updatedValues, strategyId: originalStrategy.id };
    
    try {
        const response = await fetch(`/api/teams/${orgId}/strategies/${originalStrategy.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update strategy');
        }
        
        onStrategyChange();
    } catch (error: any) {
        console.error(error);
        toast({
            title: "Update Failed",
            description: error.message,
            variant: "destructive"
        });
        setStrategy(originalStrategy);
    }
  }, [strategy, orgId, onStrategyChange, toast]);

  const handleEditStrategy = (description: string, timeframe: string) => {
    const originalStrategy = { ...strategy };
    
    setStrategy(prev => ({ ...prev, description, timeframe })); 
    setEditStrategyOpen(false);

    const command: UpdateStrategyCommand = {
        strategyId: strategy.id,
        description: description,
        timeframe: timeframe,
    };
    
    fetch(`/api/teams/${orgId}/strategies/${strategy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
    })
    .then(async (res) => {
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update strategy.');
        }
        toast({ title: "Strategy Updated", description: "Your changes have been saved."});
        onStrategyChange();
    })
    .catch((error) => {
        console.error("Failed to update strategy:", error);
        toast({
            title: "Update Failed",
            description: error.message,
            variant: "destructive",
        });
        setStrategy(originalStrategy); 
    });
  };

  const handleCreateInitiative = useCallback(async () => {
    if (!newInitiativeName.trim() || isCreatingInitiative || isSaving) {
      return;
    }

    setCreatingInitiative(true);
    const tempId = `init-temp-${uuidv4()}`;
    const command: CreateInitiativeCommand = { 
        strategyId: strategy.id, 
        name: newInitiativeName.trim(),
        tempId: tempId,
    };
    
    setStrategy(prev => {
        const newInitiative: Initiative = {
            id: tempId,
            name: command.name,
            progression: 0,
            steps: [
              { key: 'diagnostic', title: 'Diagnostic', iconName: 'Search', items: [] },
              { key: 'overallApproach', title: 'Overall Approach', iconName: 'Milestone', items: [] },
              { key: 'actions', title: 'Actions', iconName: 'ListChecks', items: [] },
              { key: 'proximateObjectives', title: 'Proximate Objectives', iconName: 'Target', items: [] },
            ] as InitiativeStep[],
            linkedRadarItemIds: [],
        };
        return {
          ...prev,
          initiatives: [...prev.initiatives, newInitiative]
        };
    });
    
    setNewInitiativeName("");
    
    try {
        const response = await fetch(`/api/teams/${orgId}/initiatives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create initiative.');
        }
        toast({ title: "Success", description: `Initiative "${command.name}" created.` });
        onStrategyChange();
    } catch (error: any) {
        console.error(error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        onStrategyChange(); 
    } finally {
        setCreatingInitiative(false);
    }
  }, [newInitiativeName, isCreatingInitiative, isSaving, strategy.id, orgId, toast, onStrategyChange]);

  const handleDeleteInitiative = useCallback((initiativeId: string, strategyId: string) => {
    const originalInitiatives = [...strategy.initiatives];
    
    setStrategy(prev => ({
      ...prev,
      initiatives: prev.initiatives.filter(i => i.id !== initiativeId)
    }));

    const command: DeleteInitiativeCommand = { strategyId, initiativeId };

    fetch(`/api/teams/${orgId}/initiatives/${initiativeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
    })
    .then(async res => {
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete initiative.');
        }
        toast({ title: "Initiative Deleted", variant: "destructive" });
        onStrategyChange();
    })
    .catch(error => {
        console.error(error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setStrategy(prev => ({ ...prev, initiatives: originalInitiatives }));
    });
  }, [strategy.initiatives, orgId, toast, onStrategyChange]);

  const onInitiativeChanged = useCallback(() => {
    onStrategyChange();
  }, [onStrategyChange]);


  return (
    <>
      <Card className={cn(
          "transition-opacity",
          isSaving && "opacity-50",
          !isFocused && !isSaving && "opacity-50 hover:opacity-100",
          strategy.state === 'Draft' && 'border-blue-500/80 border-2',
          strategy.state === 'Open' && 'border-green-500/80 border-2'
      )}>
        <Accordion type="single" collapsible defaultValue={isFocused ? strategy.id : undefined} className="w-full">
         <AccordionItem value={strategy.id} className="border-b-0">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <AccordionTrigger className="flex-1 text-left p-0 hover:no-underline">
                        <div className="flex-1 pr-4">
                            <CardTitle className="font-headline text-xl">{strategy.description}</CardTitle>
                            <CardDescription className="mt-1">Timeframe: {strategy.timeframe}</CardDescription>
                        </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 pl-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditStrategyOpen(true); }}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={styles.statusTag} data-state={strategy.state} onClick={(e) => e.stopPropagation()}>
                                    <CurrentStateIcon />
                                    {strategy.state}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {strategyStates.map(state => {
                                const Icon = iconMap[state.iconName as keyof typeof iconMap] || Edit;
                                return (
                                <DropdownMenuItem key={state.value} onClick={() => handleUpdateStrategy({ state: state.value })}>
                                    <Icon className={cn("mr-2 h-4 w-4", state.colorClass)} />
                                    <span>{state.label}</span>
                                </DropdownMenuItem>
                                )})}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <AccordionContent>
                <CardContent className="pt-0">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                      <span className="text-sm font-semibold">{overallProgression}%</span>
                    </div>
                    <Progress value={overallProgression} className={cn(
                      'h-2',
                      strategy.state === 'Open' && '[&>div]:bg-green-500',
                      strategy.state === 'Draft' && '[&>div]:bg-blue-500'
                    )} />
                  </div>
                  
                  <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-2 font-headline">Initiatives</h4>
                      {strategy.initiatives.length > 0 ? (
                          <div className="space-y-4">
                              {strategy.initiatives.map(initiative => (
                                  <InitiativeView 
                                      key={initiative.id} 
                                      initialInitiative={initiative} 
                                      radarItems={radarItems}
                                      orgId={orgId}
                                      onInitiativeChange={onInitiativeChanged}
                                      onDeleteInitiative={handleDeleteInitiative}
                                      strategyId={strategy.id}
                                  />
                              ))}
                          </div>
                      ) : (
                          <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">No initiatives for this strategy yet.</p>
                      )}
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 p-4 rounded-b-lg">
                  <div className="flex w-full items-center gap-2">
                    <Input 
                      placeholder={isCreatingInitiative ? "Creating initiative..." : isSaving ? "Saving strategy..." : "Name your new initiative..."}
                      value={newInitiativeName}
                      onChange={(e) => setNewInitiativeName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateInitiative()}
                      className="bg-background"
                      disabled={isCreatingInitiative || isSaving}
                    />
                    <Button onClick={handleCreateInitiative} disabled={!newInitiativeName.trim() || isCreatingInitiative || isSaving}>
                      <Plus className="mr-2 h-4 w-4" /> Add Initiative
                    </Button>
                  </div>
                </CardFooter>
            </AccordionContent>
         </AccordionItem>
        </Accordion>
      </Card>
      <EditStrategyDialog
        isOpen={isEditStrategyOpen}
        onOpenChange={setEditStrategyOpen}
        strategy={strategy}
        onStrategyUpdated={handleEditStrategy}
        teamId={orgId}
      />
    </>
  );
}