
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { Plus, Trash2, Search, Milestone, ListChecks, Target, GripVertical, FilePenLine, Rocket, CheckCircle2, Archive } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { Initiative, InitiativeStepKey, InitiativeItem as InitiativeItemType, RadarItem } from "@/lib/types";
import type { AddInitiativeItemCommand, UpdateInitiativeItemCommand, DeleteInitiativeItemCommand } from '@/lib/domain/strategy/commands';

interface InitiativeItemViewProps {
  item: InitiativeItemType;
  onSave: (itemId: string, newText: string) => void;
  onDelete: (itemId: string) => void;
}

function InitiativeItemView({ item, onSave, onDelete }: InitiativeItemViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  useEffect(() => {
    if (item.text === "" && item.id.startsWith('temp-')) {
      setIsEditing(true);
    }
  }, [item]);

  const handleSave = () => {
    onSave(item.id, editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
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
}

const iconMap: Record<string, React.ComponentType<any>> = { Search, Milestone, ListChecks, Target };

export function InitiativeView({ initialInitiative, radarItems, orgId, onInitiativeChange }: InitiativeViewProps) {
  const [initiative, setInitiative] = useState(initialInitiative);
  const [isLinkRadarOpen, setLinkRadarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setInitiative(initialInitiative);
  }, [initialInitiative]);
  
  const fireAndForget = (
    promise: Promise<Response>,
    successMessage: string,
    errorMessage: string
  ) => {
    promise
        .then(async res => {
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Fire-and-forget failed server-side.", errorData);
                throw new Error(errorData.message || errorMessage);
            }
            // If it's a create operation, we might want to sync back the real ID.
            // For now, we rely on the parent's refresh.
        })
        .then(() => onInitiativeChange()) // Refresh parent on success
        .catch(err => {
            console.error(err.message);
            toast({ title: "Save Error", description: err.message, variant: "destructive" });
            onInitiativeChange(); // Rollback on error
        });
  };


  const handleUpdateInitiative = (updatedValues: Partial<Initiative>) => {
    const command = { ...updatedValues };
    setInitiative(prev => ({ ...prev, ...updatedValues })); 
    
    const promise = fetch(`/api/organizations/${orgId}/initiatives/${initiative.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
    });
    fireAndForget(promise, "Initiative updated.", "Could not update initiative.");
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
      // If the text is empty for a new temporary item, just delete it locally.
    if (itemId.startsWith('temp-') && newText.trim() === '') {
        handleDeleteInitiativeItem(itemId, stepKey);
        return;
    }

    if (itemId.startsWith('temp-')) {
        // CREATE (POST) if the item is new
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


        fetch(`/api/organizations/${orgId}/initiative-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        })
        .then(res => {
            if(!res.ok) throw new Error("Server failed to create item.");
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
        // UPDATE (PUT) if the item already exists
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

        const promise = fetch(`/api/organizations/${orgId}/initiative-items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        });
        fireAndForget(promise, "Item saved.", "Could not save item changes.");
    }
  };

  const handleDeleteInitiativeItem = (itemId: string, stepKey: InitiativeStepKey) => {
    setInitiative(prev => {
        const newInitiative = JSON.parse(JSON.stringify(prev));
        const step = newInitiative.steps.find((s: any) => s.key === stepKey);
        if (step) {
          step.items = step.items.filter((i: InitiativeItemType) => i.id !== itemId);
        }
        return newInitiative;
    });
    
    if (itemId.startsWith('temp-')) return;

    const promise = fetch(`/api/organizations/${orgId}/initiative-items/${itemId}`, { method: 'DELETE' });
    fireAndForget(promise, "Item deleted.", "Failed to delete item.");
  };

  const handleLinkRadarItems = (selectedIds: string[]) => {
    handleUpdateInitiative({ linkedRadarItemIds: selectedIds });
  };
  
  const linkedItems = (initiative.linkedRadarItemIds || [])
    .map(id => radarItems.find(item => item.id === id))
    .filter((item): item is RadarItem => !!item);

  return (
    <AccordionItem value={initiative.id}>
      <AccordionTrigger className="hover:bg-accent/50 px-4 rounded-md">
        <div className="flex-1 text-left">
          <p className="font-medium">{initiative.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={initiative.progression} className="h-1 w-32" />
            <span className="text-xs text-muted-foreground">{initiative.progression}%</span>
          </div>
        </div>
      </AccordionTrigger>
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
                            <Link href={`/organization/${item.radarId}/radar#${item.id}`} key={item.id}>
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
  );
}
