
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, GripVertical, FilePenLine, Rocket, CheckCircle2, Archive, Edit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { strategyStates, newInitiativeTemplate } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import type { Strategy, RadarItem, Initiative } from "@/lib/types";
import type { CreateInitiativeCommand, UpdateStrategyCommand, DeleteInitiativeCommand } from "@/lib/domain/strategy/commands";
import { InitiativeView } from "./initiative-view";
import { v4 as uuidv4 } from "uuid";
import { EditStrategyDialog } from "./edit-strategy-dialog";

const iconMap = { FilePenLine, Rocket, CheckCircle2, Archive };

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

  const isSaving = strategy.id.startsWith('strat-temp-');

  // Sync state only when the initial prop ID changes, not on every re-render.
  useEffect(() => {
    setStrategy(initialStrategy);
  }, [initialStrategy]);

  const overallProgression = useMemo(() => {
    if (strategy.initiatives.length === 0) return 0;
    const total = strategy.initiatives.reduce(
      (acc, i) => acc + i.progression,
      0
    );
    return Math.round(total / strategy.initiatives.length);
  }, [strategy.initiatives]);

  const currentStateInfo = strategyStates.find(s => s.value === strategy.state) || strategyStates[0];
  const CurrentStateIcon = iconMap[currentStateInfo.iconName];
  
  const handleUpdateStrategy = useCallback(async (updatedValues: Partial<Strategy>) => {
    const originalStrategy = strategy;
    const newStrategy = { ...originalStrategy, ...updatedValues };
    setStrategy(newStrategy);

    const command: UpdateStrategyCommand = { ...updatedValues, strategyId: strategy.id };
    
    try {
        const response = await fetch(`/api/teams/${orgId}/strategies/${strategy.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        });

        if (!response.ok) {
            const errorData = await response.json();
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
    const originalStrategy = strategy;
    const updatedStrategy = { ...strategy, description, timeframe };
    setStrategy(updatedStrategy); // Optimistic update
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
        setStrategy(originalStrategy); // Rollback on error
    });
  };

  const handleCreateInitiative = useCallback(async () => {
    if (!newInitiativeName.trim() || isCreatingInitiative) {
      return;
    }

    setCreatingInitiative(true);
    const tempId = `init-temp-${uuidv4()}`;
    const command: CreateInitiativeCommand = { 
        strategyId: strategy.id, 
        name: newInitiativeName.trim(),
        tempId: tempId,
    };
    const newInitiative = newInitiativeTemplate(tempId, command.name);

    // Optimistic UI Update
    setStrategy(prev => ({
      ...prev,
      initiatives: [...prev.initiatives, newInitiative]
    }));
    
    setNewInitiativeName("");
    
    try {
        const response = await fetch(`/api/teams/${orgId}/initiatives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
        });
        if (!response.ok) {
            const errorData = await res.json().catch(() => ({}));
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
  }, [strategy.id, orgId, toast, newInitiativeName, onStrategyChange, isCreatingInitiative]);

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
          !isFocused && "opacity-50 hover:opacity-100",
          strategy.state === 'Draft' && 'border-blue-500/80 border-2',
          strategy.state === 'Open' && 'border-green-500/80 border-2'
      )}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <CardTitle className="font-headline text-xl">{strategy.description}</CardTitle>
              <CardDescription className="mt-1">Timeframe: {strategy.timeframe}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditStrategyOpen(true)}>
                    <Edit className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={cn(
                        "font-semibold rounded-full px-3",
                        strategy.state === 'Draft' && 'bg-blue-100 text-blue-800 hover:bg-blue-200',
                        strategy.state === 'Open' && 'bg-green-100 text-green-800 hover:bg-green-200',
                        (strategy.state === 'Closed' || strategy.state === 'Obsolete') && 'bg-gray-100 text-gray-800 hover:bg-gray-200',
                    )}
                    >
                      <CurrentStateIcon className="mr-2 h-4 w-4" />
                      {strategy.state}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {strategyStates.map(state => {
                      const Icon = iconMap[state.iconName];
                      return (
                      <DropdownMenuItem key={state.value} onClick={() => handleUpdateStrategy({ state: state.value })}>
                        <Icon className={cn("mr-2 h-4 w-4", state.colorClass)} />
                        <span>{state.label}</span>
                      </DropdownMenuItem>
                    )})}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  <Accordion type="multiple" className="w-full">
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
                  </Accordion>
              ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">No initiatives for this strategy yet.</p>
              )}
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 p-4 rounded-b-lg">
          <div className="flex w-full items-center gap-2">
            <Input 
              placeholder={isCreatingInitiative ? "Creating initiative..." : "Name your new initiative..."}
              value={newInitiativeName}
              onChange={(e) => setNewInitiativeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateInitiative()}
              className="bg-background"
              disabled={isCreatingInitiative}
            />
            <Button onClick={handleCreateInitiative} disabled={!newInitiativeName.trim() || isCreatingInitiative}>
              <Plus className="mr-2 h-4 w-4" /> Add Initiative
            </Button>
          </div>
        </CardFooter>
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
