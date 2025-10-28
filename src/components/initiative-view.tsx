
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { Plus, Trash2, Search, Milestone, ListChecks, Target, Link2 } from "lucide-react";
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
import type { Initiative, InitiativeStepKey, InitiativeItem, RadarItem } from "@/lib/types";
import type { AddInitiativeItemCommand, UpdateInitiativeItemCommand, DeleteInitiativeItemCommand } from '@/lib/domain/strategy/commands';

interface InitiativeItemViewProps {
  item: InitiativeItem;
  initiativeId: string;
  orgId: string;
  stepKey: InitiativeStepKey;
  onUpdate: (itemId: string, newText: string, stepKey: InitiativeStepKey) => void;
  onDelete: (itemId: string, stepKey: InitiativeStepKey) => void;
}

function InitiativeItemView({ item, orgId, initiativeId, stepKey, onUpdate, onDelete }: InitiativeItemViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  useEffect(() => {
    // If the item is new (text is empty), automatically enter editing mode.
    // This effect will run whenever the item prop changes.
    if (item.text === "") {
      setIsEditing(true);
    }
  }, [item]);


  const handleSave = () => {
    console.log(`InitiativeItemView (${item.id}): handleSave called.`);
    if (editText.trim() || item.id.startsWith('temp-')) {
      onUpdate(item.id, editText, stepKey);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    console.log(`InitiativeItemView (${item.id}): handleCancel called.`);
    // If the item was new and is being cancelled, trigger deletion.
    if (item.text === "" && item.id.startsWith('temp-')) {
        onDelete(item.id, stepKey);
    } else {
        setEditText(item.text);
        setIsEditing(false);
    }
  };

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
          onBlur={handleSave} // Save when the user clicks away
        />
        <div className="flex justify-between items-center">
            <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(item.id, stepKey)}>
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

export function InitiativeView({ initialInitiative, radarItems, orgId, onInitiativeChange }: InitiativeViewProps) {
  const [initiative, setInitiative] = useState(initialInitiative);
  const [isLinkRadarOpen, setLinkRadarOpen] = useState(false);
  const { toast } = useToast();

  console.log(`--- InitiativeView (${initiative.name}): Render ---`);

  const fireAndForget = (url: string, method: string, body: any, errorMessage: string) => {
    console.log(`InitiativeView: fireAndForget (${method} ${url})`, body);
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(res => {
        if (!res.ok) {
            console.error("Fire-and-forget failed server-side.", res);
            throw new Error(errorMessage);
        }
        // If it's a create operation, we might want to sync back the real ID.
        // For now, we rely on the parent's broader refresh mechanism.
        if (method === 'POST') {
          onInitiativeChange(); // Trigger a sync to get the real ID
        }
    }).catch(err => {
      console.error(errorMessage, err);
      toast({ title: "Save Error", description: errorMessage, variant: "destructive" });
      onInitiativeChange(); // On failure, trigger a hard refresh from parent
    });
  };

  const handleUpdateInitiative = (updatedValues: Partial<Initiative>) => {
    const command = { ...updatedValues };
    console.log(`InitiativeView: handleUpdateInitiative for ${initiative.id}`, command);
    // Optimistic update
    setInitiative(prev => ({ ...prev, ...updatedValues })); 
    // Fire and forget, parent will refresh on error
    fireAndForget(`/api/organizations/${orgId}/initiatives/${initiative.id}`, 'PUT', command, "Could not update initiative progression.");
  };

  const handleAddInitiativeItem = (stepKey: InitiativeStepKey) => {
    const tempId = `temp-${uuidv4()}`;
    const newItem: InitiativeItem = { id: tempId, text: "" };
    
    console.log(`InitiativeView: handleAddInitiativeItem to step ${stepKey}`, newItem);
    // Optimistic UI Update - NO API CALL
    setInitiative(prev => {
        const newInitiative = JSON.parse(JSON.stringify(prev));
        const step = newInitiative.steps.find((s: any) => s.key === stepKey);
        if (step) {
            step.items.push(newItem);
        }
        return newInitiative;
    });
  };

  const handleUpdateInitiativeItem = (itemId: string, newText: string, stepKey: InitiativeStepKey) => {
     console.log(`InitiativeView: handleUpdateInitiativeItem for ${itemId}`, { text: newText });

     // If the ID is temporary, it's a CREATE operation.
     if (itemId.startsWith('temp-')) {
        const command: AddInitiativeItemCommand = {
            initiativeId: initiative.id,
            stepKey: stepKey,
            // The item in the command should have empty text, as the real text will be in the update.
            // Let's create a new item but with the final text. This simplifies the backend.
            item: { id: '', text: newText }, // Backend will generate ID.
        };

        // Optimistically update the text of the temporary item
        setInitiative(prev => {
            const newInitiative = JSON.parse(JSON.stringify(prev));
            for (const step of newInitiative.steps) {
                const item = step.items.find((i: InitiativeItem) => i.id === itemId);
                if (item) {
                    item.text = newText;
                    break;
                }
            }
            return newInitiative;
        });

        // Fire a CREATE request, and on success, replace the temp item with the real one.
        fetch(`/api/organizations/${orgId}/initiative-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        })
        .then(res => {
            if(!res.ok) throw new Error("Server failed to create item.");
            return res.json();
        })
        .then((savedItem: InitiativeItem) => {
            console.log("Item created, replacing temp item", { tempId: itemId, savedItem });
            // Silently replace the temporary item with the final one from the server.
            setInitiative(prev => {
                const newInitiative = JSON.parse(JSON.stringify(prev));
                for (const step of newInitiative.steps) {
                    const itemIndex = step.items.findIndex((i: InitiativeItem) => i.id === itemId);
                    if (itemIndex !== -1) {
                        step.items[itemIndex] = savedItem;
                        break;
                    }
                }
                return newInitiative;
            })
        })
        .catch(err => {
            console.error(err);
            toast({ title: "Error", description: "Could not create item.", variant: "destructive" });
            onInitiativeChange(); // Hard refresh on failure
        });

     } else {
        // This is a standard UPDATE operation for an existing item.
        setInitiative(prev => {
            const newInitiative = JSON.parse(JSON.stringify(prev));
            for (const step of newInitiative.steps) {
                const item = step.items.find((i: InitiativeItem) => i.id === itemId);
                if (item) {
                    item.text = newText;
                    break;
                }
            }
            return newInitiative;
        });

        const command: UpdateInitiativeItemCommand = { initiativeId: initiative.id, itemId, text: newText };
        fireAndForget(`/api/organizations/${orgId}/initiative-items/${itemId}`, 'PUT', command, "Could not save item changes.");
     }
  };

  const handleDeleteInitiativeItem = (itemId: string, stepKey: InitiativeStepKey) => {
    console.log(`InitiativeView: handleDeleteInitiativeItem for ${itemId}`);
    
    // Optimistic update
     setInitiative(prev => {
        const newInitiative = JSON.parse(JSON.stringify(prev));
        const step = newInitiative.steps.find((s: any) => s.key === stepKey);
        if (step) {
          step.items = step.items.filter((i: InitiativeItem) => i.id !== itemId);
        }
        return newInitiative;
    });
    
    // If the item was temporary, no need to call the API.
    if (itemId.startsWith('temp-')) {
        return;
    }

    const command: DeleteInitiativeItemCommand = { initiativeId: initiative.id, itemId };
     fireAndForget(`/api/organizations/${orgId}/initiative-items/${itemId}`, 'DELETE', command, "Failed to delete item.");
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
                      orgId={orgId}
                      initiativeId={initiative.id}
                      stepKey={step.key}
                      onUpdate={handleUpdateInitiativeItem}
                      onDelete={handleDeleteInitiativeItem}
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
