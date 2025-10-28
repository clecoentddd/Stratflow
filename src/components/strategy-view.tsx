
"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, GripVertical, FilePenLine, Rocket, CheckCircle2, Archive } from "lucide-react";
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
import { strategyStates } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import type { Strategy, RadarItem, Initiative } from "@/lib/types";
import type { CreateInitiativeCommand, UpdateStrategyCommand } from "@/lib/domain/strategy/commands";
import { InitiativeView } from "./initiative-view";
import { v4 as uuidv4 } from "uuid";
import { newInitiativeTemplate } from "@/lib/data";

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
  const { toast } = useToast();

  const isSaving = strategy.id.startsWith('strat-temp-');

  console.log(`--- StrategyView (${strategy.description}): Render (isSaving: ${isSaving}) ---`);

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
  
  const handleApiCall = useCallback(async (url: string, method: string, body: any, successMessage: string) => {
    console.log(`StrategyView: handleApiCall (${method} ${url})`, body);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to perform action.`);
      }
      
      const data = await response.json();

      toast({
        title: "Success",
        description: successMessage,
      });
      
      onStrategyChange();
      return data;
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
       onStrategyChange();
    }
  }, [toast, onStrategyChange]);


  const handleUpdateStrategy = useCallback((updatedValues: Partial<Strategy>) => {
    const command: UpdateStrategyCommand = { strategyId: strategy.id, ...updatedValues };
    console.log(`StrategyView: handleUpdateStrategy for ${strategy.id}`, command);
    
    setStrategy(prev => ({...prev, ...updatedValues}));
    
    handleApiCall(`/api/organizations/${orgId}/strategies/${strategy.id}`, 'PUT', command, "Strategy has been updated.");
  }, [strategy.id, orgId, handleApiCall]);

  const handleCreateInitiative = useCallback(() => {
    if (!newInitiativeName.trim() || isSaving) {
      if (isSaving) {
        toast({
          title: "Please wait",
          description: "The strategy is still being saved. Please try again in a moment.",
          variant: "destructive",
        });
      }
      return;
    }

    const command: CreateInitiativeCommand = { strategyId: strategy.id, name: newInitiativeName.trim() };
    const tempId = `init-temp-${uuidv4()}`;
    const newInitiative = newInitiativeTemplate(tempId, command.name);

    // Optimistic UI Update
    setStrategy(prev => ({
      ...prev,
      initiatives: [...prev.initiatives, newInitiative]
    }));
    
    setNewInitiativeName(""); // Clear input immediately
    
    handleApiCall(`/api/organizations/${orgId}/initiatives`, 'POST', command, `Initiative "${command.name}" created.`);

  }, [strategy.id, orgId, handleApiCall, toast, isSaving, newInitiativeName]);

  const onInitiativeChanged = useCallback(() => {
    console.log(`StrategyView (${strategy.id}): An initiative inside has changed. Triggering parent refresh.`);
    onStrategyChange();
  }, [strategy.id, onStrategyChange]);


  return (
    <Card className={cn(
        "transition-opacity",
        !isFocused && "opacity-50 hover:opacity-100",
        strategy.state === 'Draft' && 'border-blue-500/80 border-2',
        strategy.state === 'Open' && 'border-green-500/80 border-2'
    )}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{strategy.description}</CardTitle>
          <CardDescription className="mt-1">Timeframe: {strategy.timeframe}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={cn(
                    "font-semibold rounded-full px-3",
                    strategy.state === 'Draft' && 'bg-blue-100 text-blue-800 hover:bg-blue-200',
                    strategy.state === 'Open' && 'bg-green-100 text-green-800 hover:bg-green-200',
                    (strategy.state === 'Closed' || strategy.state === 'Obsolete') && 'bg-gray-100 text-gray-800 hover:bg-gray-200',
                )}>
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
            placeholder={isSaving ? "Saving strategy..." : "Name your new initiative..."}
            value={newInitiativeName}
            onChange={(e) => setNewInitiativeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateInitiative()}
            className="bg-background"
            disabled={isSaving}
          />
          <Button onClick={handleCreateInitiative} disabled={!newInitiativeName.trim() || isSaving}>
            <Plus className="mr-2 h-4 w-4" /> Add Initiative
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
