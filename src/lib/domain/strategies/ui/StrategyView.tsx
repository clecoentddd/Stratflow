"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit, MoreVertical, Search, Milestone, ListChecks, Target, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { strategyStates } from "../constants";
import type { Strategy, RadarItem, Initiative, InitiativeStep } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UpdateStrategyCommand } from "@/lib/domain/strategies/commands";
import type { CreateInitiativeCommand, DeleteInitiativeCommand } from "@/lib/domain/initiatives/commands";
import { InitiativeView } from "../../initiatives/ui";
import { EditStrategyDialog } from "./EditStrategyDialog";
import styles from "./StrategyView.module.css";

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
    if (!strategy.initiatives || strategy.initiatives.length === 0) return 0;
    const total = strategy.initiatives.reduce(
      (acc, i) => acc + (i.progression || 0),
      0
    );
    return Math.round(total / strategy.initiatives.length);
  }, [strategy.initiatives]);

  const currentStateInfo = strategyStates.find(s => s.value === strategy.state) || strategyStates[0];
  const CurrentStateIcon = iconMap[currentStateInfo.iconName as keyof typeof iconMap] || Edit;
  
  const handleUpdateStrategy = useCallback(async (updatedValues: Partial<Strategy>) => {
    const originalStrategy = strategy;
    
    const command: UpdateStrategyCommand = { ...updatedValues, strategyId: originalStrategy.id };
    
    try {
    const response = await fetch(`/api/strategies/${encodeURIComponent(originalStrategy.id)}?teamId=${encodeURIComponent(orgId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update strategy');
        }
        
        // Only update local state after successful server response
        setStrategy(prev => ({...prev, ...updatedValues}));
        onStrategyChange();
        
        toast({
            title: "Strategy Updated",
            description: "Changes saved successfully"
        });
    } catch (error: any) {
        console.error(error);
        toast({
            title: "Update Failed",
            description: error.message,
            variant: "destructive"
        });
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
    
  fetch(`/api/strategies/${encodeURIComponent(strategy.id)}?teamId=${encodeURIComponent(orgId)}`, {
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
        const response = await fetch(`/api/initiatives?teamId=${orgId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...command, teamId: orgId }),
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

    fetch(`/api/initiatives?teamId=${orgId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...command, teamId: orgId }),
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

  const onInitiativeLocalUpdate = useCallback((initiativeId: string, updated: Partial<Initiative>) => {
    setStrategy(prev => ({
      ...prev,
      initiatives: prev.initiatives.map(i => i.id === initiativeId ? { ...i, ...updated } : i)
    }));
  }, []);


  const StatusDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(styles.statusTag)} data-state={strategy.state}>
          <CurrentStateIcon className={styles.statusIcon} />
          {strategy.state}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {strategyStates.map(state => {
          const Icon = iconMap[state.iconName as keyof typeof iconMap] || Edit;
          return (
            <DropdownMenuItem
              key={state.value}
              onClick={() => handleUpdateStrategy({ state: state.value })}
              disabled={state.value === strategy.state}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{state.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className={cn(
      styles.strategyContainer,
      isSaving && styles.saving,
      !isFocused && !isSaving && styles.unfocused,
      strategy.state === 'Draft' && styles.cardDraft,
      strategy.state === 'Active' && styles.cardOpen,
      strategy.state === 'Closed' && styles.cardClosed,
      strategy.state === 'Obsolete' && styles.cardObsolete
    )}>
      <div className={styles.strategyHeader} onClick={() => {}}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h3 className={styles.strategyTitle}>{strategy.description}</h3>
            <span className={styles.timeframeTag}>Timeframe: {strategy.timeframe}</span>
          </div>
          <div className={styles.actions}>
            <button 
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                setEditStrategyOpen(true);
              }}
            >
              <Edit className={styles.actionIcon} />
            </button>
            <StatusDropdown />
          </div>
        </div>
      </div>

      <div className={styles.strategyContent}>
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Overall Progress</span>
            <span className={styles.progressValue}>{overallProgression}%</span>
          </div>
          <div className={styles.progressBarContainer}>
            <div 
              className={styles.progressBar}
              style={{ width: `${overallProgression}%` }}
            />
          </div>
        </div>
        
        <div className={styles.initiativesSection}>
          <h4 className={styles.sectionTitle}>Initiatives</h4>
          {strategy.initiatives && strategy.initiatives.length > 0 ? (
              <div className={styles.initiativesList}>
              {strategy.initiatives.map(initiative => (
                <InitiativeView
                  key={initiative.id}
                  initialInitiative={initiative}
                  radarItems={radarItems}
                  orgId={orgId}
                  onInitiativeChange={onInitiativeChanged}
                  onDeleteInitiative={handleDeleteInitiative}
                  strategyId={strategy.id}
                  onLocalUpdate={onInitiativeLocalUpdate}
                  className={styles.initiativeItem}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noInitiatives}>
              <p>No initiatives yet. Add one to get started.</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerRow}>
            <input
              type="text"
              placeholder="New initiative name"
              value={newInitiativeName}
              onChange={(e) => setNewInitiativeName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && newInitiativeName.trim() && !isCreatingInitiative) {
                  await handleCreateInitiative();
                }
              }}
              className={styles.initiativeInput}
              disabled={isCreatingInitiative || isSaving}
            />
            <button
              onClick={handleCreateInitiative}
              disabled={!newInitiativeName.trim() || isCreatingInitiative || isSaving}
              className={styles.addButton}
            >
              <Plus className={styles.buttonIcon} />
              <span>Add Initiative</span>
            </button>
          </div>
        </div>
      </div>
      <EditStrategyDialog
        isOpen={isEditStrategyOpen}
        onOpenChange={setEditStrategyOpen}
        strategy={strategy}
        onStrategyUpdated={handleEditStrategy}
        teamId={orgId}
      />
    </div>
  );
}