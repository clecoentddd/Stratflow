
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import { Plus, Trash2, Search, Milestone, ListChecks, Target, Edit, MoreVertical } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LinkRadarItemsDialog } from './link-radar-items-dialog';
import { EditInitiativeDialog } from './edit-initiative-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Initiative, InitiativeStepKey, InitiativeItem as InitiativeItemType, RadarItem } from "@/lib/types";
import type { UpdateInitiativeCommand, DeleteInitiativeCommand } from '@/lib/domain/initiatives/commands';
import type { AddInitiativeItemCommand, UpdateInitiativeItemCommand } from '@/lib/domain/initiative-items/commands';

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
      <div className="space-y-2 p-2 border rounded-md bg-background shadow-md">
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Describe an item..."
          autoFocus
          rows={3}
          className="text-sm"
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-between items-center">
            <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                    Save
                </Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div 
        onClick={() => setIsEditing(true)} 
        className="block p-2 border rounded-md hover:bg-accent/50 cursor-pointer min-h-[5.5rem]"
    >
      <p className="text-sm line-clamp-3 whitespace-pre-wrap">{item.text}</p>
    </div>
  );
}

interface InitiativeViewProps {
  initialInitiative: Initiative;
  radarItems: RadarItem[];
  orgId: string;
  onInitiativeChange: () => void;
  onDeleteInitiative: (initiativeId: string, strategyId: string) => void;
  strategyId: string;
}

const iconMap: Record<string, React.ComponentType<any>> = { Search, Milestone, ListChecks, Target };

export function InitiativeView({ initialInitiative, radarItems, orgId, onInitiativeChange, onDeleteInitiative, strategyId }: InitiativeViewProps) {
  const [initiative, setInitiative] = useState(initialInitiative);
  const [isLinkRadarOpen, setLinkRadarOpen] = useState(false);
  const [isEditInitiativeOpen, setEditInitiativeOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setInitiative(initialInitiative);
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
            item: { id: '', text: newText }, 
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
            throw new Error(errorData.message || "Failed to delete item.");
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
    <AccordionItem value={initiative.id}>
      <div className="flex items-center justify-between hover:bg-accent/50 rounded-md">
        <AccordionTrigger className="flex-1 text-left px-4 py-2">
            <div className="flex-1 text-left">
            <p className="font-medium">{initiative.name}</p>
            <div className="flex items-center gap-2 mt-1">
                <Progress value={initiative.progression} className="h-1 w-32" />
                <span className="text-xs text-muted-foreground">{initiative.progression}%</span>
            </div>
            </div>
        </AccordionTrigger>
        <div className="flex items-center gap-1 pr-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
      <AccordionContent className="p-4 bg-muted/20">
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

        <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
          {initiative.steps.map((step) => {
            const Icon = iconMap[step.iconName as keyof typeof iconMap];
            return (
            <Card key={step.key} className="bg-background h-full">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                {step.title}
                </CardTitle>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleAddInitiativeItem(step.key)}>
                <Plus className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="space-y-2">
                {step.items.length > 0 ? step.items.map((item) => (
                    <InitiativeItemView 
                      key={item.id}
                      item={item}
                      onSave={(itemId, newText) => handleSaveInitiativeItem(itemId, newText, step.key)}
                      onDelete={(itemId) => handleDeleteInitiativeItem(itemId, step.key)}
                    />
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-2">No items yet.</p>
                )}
                </div>
            </CardContent>
            </Card>
          )})}
        </div>

        <LinkRadarItemsDialog
            isOpen={isLinkRadarOpen}
            onOpenChange={setLinkRadarOpen}
            availableItems={radarItems}
            linkedItemIds={initiative.linkedRadarItemIds || []}
            onLinkItems={handleLinkRadarItems}
        />
      </AccordionContent>
    </AccordionItem>
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
