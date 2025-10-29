"use client";

import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import { Plus, Trash2, Search, Milestone, ListChecks, Target, Edit, MoreVertical } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { LinkRadarItemsDialog } from './LinkRadarItemsDialog';
import { EditInitiativeDialog } from './EditInitiativeDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Initiative, InitiativeStepKey, InitiativeItem as InitiativeItemType, RadarItem } from "@/lib/types";
import type { UpdateInitiativeCommand } from '@/lib/domain/initiatives/commands';
import type { AddInitiativeItemCommand, UpdateInitiativeItemCommand } from '@/lib/domain/initiative-items/commands';
import stepStyles from "./initiative-step-view.module.css";
import { InitiativeStepView } from "./InitiativeStepView";
import styles from "./InitiativeView.module.css"

interface InitiativeItemViewProps {
  item: InitiativeItemType;
  onSave: (itemId: string, newText: string) => void;
  onDelete: (itemId: string) => void;
}

function InitiativeItemView({ item, onSave, onDelete }: InitiativeItemViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  useEffect(() => {
    // Automatically enter edit mode for new, empty items.
    if (item.text === "" && item.id.startsWith('temp-')) {
      setIsEditing(true);
    }
  }, [item]);

  const handleSave = () => {
    onSave(item.id, editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // If it was a new temporary item, just delete it on cancel.
    if (item.text === "" && item.id.startsWith('temp-')) {
        onDelete(item.id);
    } else {
        setEditText(item.text);
        setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
    }
  }

  if (isEditing) {
    return (
      <div className={stepStyles.editContainer}>
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Describe an item..."
          autoFocus
          rows={3}
          className={`${stepStyles.editTextarea} ${styles.plainEditTextarea}`}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
        <div className={stepStyles.editActions}>
          <button className="destructiveButton" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-4 w-4" />
          </button>

          <div className="buttonGroup">
            <button className="editButton" onClick={handleCancel}>
              Cancel
            </button>
            <button className="editButton" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
        onClick={() => setIsEditing(true)} 
        className={stepStyles.itemView}
    >
      <p className={stepStyles.itemText}>{item.text}</p>
    </div>
  );
}

interface InitiativeViewProps {
  initialInitiative: Initiative & { isExpanded?: boolean };
  radarItems: RadarItem[];
  orgId: string;
  onInitiativeChange: () => void;
  onDeleteInitiative: (initiativeId: string, strategyId: string) => void;
  strategyId: string;
}

const iconMap: Record<string, React.ComponentType<any>> = { Search, Milestone, ListChecks, Target };

export function InitiativeView({ initialInitiative, radarItems, orgId, onInitiativeChange, onDeleteInitiative, strategyId }: InitiativeViewProps) {
  const [initiative, setInitiative] = useState({ ...initialInitiative, isExpanded: false });
  const [isLinkRadarOpen, setLinkRadarOpen] = useState(false);
  const [isEditInitiativeOpen, setEditInitiativeOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setInitiative(prev => ({ ...initialInitiative, isExpanded: prev.isExpanded }));
  }, [initialInitiative]);
  
  const fireAndForget = (
    promise: Promise<Response>,
    errorMessage: string
  ) => {
    promise
        .then(async res => {
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Fire-and-forget failed server-side.", errorData);
                throw new Error(errorData.message || errorMessage);
            }
        })
        .then(() => onInitiativeChange()) 
        .catch(err => {
            console.error(err.message);
            toast({ title: "Save Error", description: err.message, variant: "destructive" });
            onInitiativeChange(); // Rollback on error
        });
  };


  const handleUpdateInitiative = (updatedValues: Partial<Initiative>) => {
    const command: UpdateInitiativeCommand = { ...updatedValues, initiativeId: initiative.id };
    setInitiative(prev => ({ ...prev, ...updatedValues })); 
    
    const promise = fetch(`/api/teams/${orgId}/initiatives/${initiative.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
    });
    fireAndForget(promise, "Could not update initiative.");
  };

  const handleEditName = (newName: string) => {
    const command: UpdateInitiativeCommand = { name: newName, initiativeId: initiative.id };
    setInitiative(prev => ({ ...prev, name: newName }));
    const promise = fetch(`/api/teams/${orgId}/initiatives/${initiative.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
    });
    fireAndForget(promise, "Could not update initiative name.");
  };

  const handleDeleteConfirmed = () => {
    onDeleteInitiative(initiative.id, strategyId);
  };

  const handleAddInitiativeItem = (stepKey: InitiativeStepKey) => {
    const tempId = `temp-${uuidv4()}`;
    const newItem: InitiativeItemType = { id: tempId, text: "" };
    
    setInitiative(prev => {
        const newInitiative = JSON.parse(JSON.stringify(prev));
        const step = newInitiative.steps.find((s: any) => s.key === stepKey);
        if (step) {
            step.items.push(newItem);
        }
        return newInitiative;
    });
  };
  
  const handleSaveInitiativeItem = (itemId: string, newText: string, stepKey: InitiativeStepKey) => {
    if (itemId.startsWith('temp-') && newText.trim() === '') {
        handleDeleteInitiativeItem(itemId, stepKey);
        return;
    }

    if (itemId.startsWith('temp-')) {
        // CREATE (POST)
        const command: AddInitiativeItemCommand = {
            initiativeId: initiative.id,
            stepKey,
            item: { text: newText }, 
        };
        
        const optimisticInitiative = { ...initiative };
        const step = optimisticInitiative.steps.find(s => s.key === stepKey);
        if(step) {
            const item = step.items.find(i => i.id === itemId);
            if(item) item.text = newText;
        }
        setInitiative(optimisticInitiative);

        fetch(`/api/teams/${orgId}/initiative-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        })
        .then(async res => {
            if(!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.message || "Server failed to create item.");
            }
            return res.json();
        })
        .then((savedItem: InitiativeItemType) => {
            onInitiativeChange(); 
        })
        .catch(err => {
            console.error(err);
            toast({ title: "Error", description: err.message, variant: "destructive" });
            onInitiativeChange(); // Hard refresh on failure
        });
    } else {
        // UPDATE (PUT)
        const command: UpdateInitiativeItemCommand = { initiativeId: initiative.id, itemId, text: newText };
        
        setInitiative(prev => {
            const newInitiative = JSON.parse(JSON.stringify(prev));
            for (const step of newInitiative.steps) {
                const item = step.items.find((i: InitiativeItemType) => i.id === itemId);
                if (item) {
                    item.text = newText;
                    break;
                }
            }
            return newInitiative;
        });

        const promise = fetch(`/api/teams/${orgId}/initiative-items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        });
        fireAndForget(promise, "Could not save item changes.");
    }
  };

  const handleDeleteInitiativeItem = (itemId: string, stepKey: InitiativeStepKey) => {
    const originalInitiative = JSON.parse(JSON.stringify(initiative));
    setInitiative(prev => {
        const newInitiative = JSON.parse(JSON.stringify(prev));
        const step = newInitiative.steps.find((s: any) => s.key === stepKey);
        if (step) {
          step.items = step.items.filter((i: InitiativeItemType) => i.id !== itemId);
        }
        return newInitiative;
    });
    
    if (itemId.startsWith('temp-')) return;

    fetch(`/api/teams/${orgId}/initiative-items/${itemId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiativeId: initiative.id }) // Pass initiativeId in body
    })
    .then(async res => {
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete item.');
        }
    })
    .catch(err => {
        console.error(err);
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setInitiative(originalInitiative);
    });
  };

  const handleLinkRadarItems = (selectedIds: string[]) => {
    handleUpdateInitiative({ linkedRadarItemIds: selectedIds });
  };
  
  const linkedItems = (initiative.linkedRadarItemIds || [])
    .map(id => radarItems.find(item => item.id === id))
    .filter((item): item is RadarItem => !!item);

  return (
    <>
    <div className="border rounded-md mb-2">
      <div className="flex items-center justify-between hover:bg-accent/50 rounded-md">
        <div className="flex-1 px-4 py-2" onClick={() => setInitiative(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}>
            <div className={styles.initiativeNameContainer}>
              <p className={styles.initiativeName}>test {initiative.name}</p>
            </div>
        </div>
        <div className="flex items-center gap-1 pr-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditInitiativeOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Name</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Initiative</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      {initiative.isExpanded && (
        <div className="p-4 bg-muted/20">
          <div className="mb-6">
            <Label>Overall Progression: {initiative.progression}%</Label>
          <Slider
            value={[initiative.progression]}
            onValueChange={(value) => handleUpdateInitiative({ progression: value[0] })}
            max={100}
            step={1}
          />
        </div>
        
        <div className="mb-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="sm" onClick={() => setLinkRadarOpen(true)}>
                    Tag radar item
                </Button>
                {linkedItems.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {linkedItems.map(item => (
                            <Link href={`/team/${item.radarId}/radar#${item.id}`} key={item.id}>
                                <Badge variant={item.type === 'Threat' ? 'destructive' : 'default'}>
                                    {item.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No radar items tagged yet.</p>
                )}
            </div>
        </div>

        <div className={stepStyles.stepsGrid}>
          {initiative.steps.map((step) => (
            <InitiativeStepView
                key={step.key}
                step={step}
                iconMap={iconMap}
                onAddItem={() => handleAddInitiativeItem(step.key)}
                onSaveItem={(itemId, newText) => handleSaveInitiativeItem(itemId, newText, step.key)}
                onDeleteItem={(itemId) => handleDeleteInitiativeItem(itemId, step.key)}
            />
          ))}
        </div>

        <LinkRadarItemsDialog
            isOpen={isLinkRadarOpen}
            onOpenChange={setLinkRadarOpen}
            availableItems={radarItems}
            linkedItemIds={initiative.linkedRadarItemIds || []}
            onLinkItems={handleLinkRadarItems}
        />
      </div>)}
    </div>
    <EditInitiativeDialog
        isOpen={isEditInitiativeOpen}
        onOpenChange={setEditInitiativeOpen}
        initiativeName={initiative.name}
        onSave={handleEditName}
    />
     <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the initiative
                and all of its associated items.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>
    </>
  );
}