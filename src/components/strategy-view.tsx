
"use client";

import { useState, useMemo } from "react";
import { Plus, GripVertical, FilePenLine, Rocket, CheckCircle2, Archive } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Accordion,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { strategyStates } from "@/lib/data";
import { Input } from "@/components/ui/input";

import type { Strategy, RadarItem } from "@/lib/types";
import { InitiativeView } from "./initiative-view";
import { cn } from "@/lib/utils";

const iconMap = {
    FilePenLine,
    Rocket,
    CheckCircle2,
    Archive,
};

interface StrategyViewProps {
  strategy: Strategy;
  radarItems: RadarItem[];
  isFocused: boolean;
  orgId: string;
  onCreateInitiative: (initiativeName: string) => void;
  onUpdateStrategy: (updatedValues: Partial<Strategy>) => void;
}

export function StrategyView({ 
    strategy,
    radarItems,
    isFocused,
    orgId,
    onCreateInitiative, 
    onUpdateStrategy, 
}: StrategyViewProps) {
  const [newInitiativeName, setNewInitiativeName] = useState("");

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

  const handleAddInitiative = () => {
    if (newInitiativeName.trim()) {
      onCreateInitiative(newInitiativeName.trim());
      setNewInitiativeName("");
    }
  };

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
                    "font-semibold",
                    strategy.state === 'Draft' && 'text-blue-600',
                    strategy.state === 'Open' && 'text-green-600',
                )}>
                  <CurrentStateIcon className="mr-2 h-4 w-4" />
                  {strategy.state}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {strategyStates.map(state => {
                  const Icon = iconMap[state.iconName];
                  return (
                  <DropdownMenuItem key={state.value} onClick={() => onUpdateStrategy({ state: state.value })}>
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
                        />
                    ))}
                </Accordion>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">No initiatives for this strategy yet.</p>
            )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 rounded-b-lg">
        <div className="flex w-full items-center gap-2">
          <Input 
            placeholder="Name your new initiative..." 
            value={newInitiativeName}
            onChange={(e) => setNewInitiativeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddInitiative()}
            className="bg-background"
          />
          <Button onClick={handleAddInitiative} disabled={!newInitiativeName.trim()}>
            <Plus className="mr-2 h-4 w-4" /> Add Initiative
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
