
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

const iconMap = { Search, Milestone, ListChecks, Target };

interface InitiativeItemViewProps {
  item: InitiativeItem;
  initiativeId: string;
  orgId: string;
  onUpdate: (itemId: string, newText: string) => void;
  onDelete: (itemId: string) => void;
}

function InitiativeItemView({ item, orgId, initiativeId, onUpdate, onDelete }: InitiativeItemViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  useEffect(() => {
    // If the item is new (text is empty), automatically enter editing mode.
    // This effect will run whenever the item prop changes.
    if (item.text === "") {
      setIsEditing(true);
    }
  }, [item.text]);


  const handleSave = () => {
    console.log(`InitiativeItemView (${item.id}): handleSave called.`);
    if (editText.trim() !== item.text) {
      onUpdate(item.id, editText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    console.log(`InitiativeItemView (${item.id}): handleCancel called.`);
    // If the item was new and is being cancelled, trigger deletion.
    if (item.text === "") {
        onDelete(item.id);
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
            <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!editText.trim()}>
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
}

export function InitiativeView({ initialInitiative, radarItems, orgId }: InitiativeViewProps) {
  const [initiative, setInitiative] = useState(initialInitiative);
  const [isLinkRadarOpen, setLinkRadarOpen] = useState(false);
  const { toast } = useToast();

  console.log(`--- InitiativeView (${initiative.name}): Render ---`);

  const fireAndForget = (url: string, method: string, body: any, errorMessage: string) => {
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(err => {
      console.error(errorMessage, err);
      toast({ title: "Save Error", description: errorMessage, variant: "destructive" });
    });
  };

  const handleUpdateInitiative = (updatedValues: Partial<Initiative>) => {
    const command = { ...updatedValues };
    console.log(`InitiativeView: handleUpdateInitiative for ${initiative.id}`, command);
    setInitiative(prev => ({ ...prev, ...updatedValues })); // Optimistic update
    fireAndForget(`/api/organizations/${orgId}/initiatives/${initiative.id}`, 'PUT', command, "Could not update initiative progression.");
  };

  const handleAddInitiativeItem = (stepKey: InitiativeStepKey) => {
    const tempId = `temp-${uuidv4()}`;
    const newItem: InitiativeItem = { id: tempId, text: "" };
    
    console.log(`InitiativeView: handleAddInitiativeItem to step ${stepKey}`, newItem);
    // Optimistic UI Update
    setInitiative(prev => {
        const newInitiative = JSON.parse(JSON.stringify(prev));
        const step = newInitiative.steps.find((s: any) => s.key === stepKey);
        if (step) {
            step.items.push(newItem);
        }
        return newInitiative;
    });

    const command: AddInitiativeItemCommand = { initiativeId: initiative.id, stepKey };
    
    // Fire and forget, but get the real ID back to patch the state
    fetch(`/api/organizations/${orgId}/initiative-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
    })
    .then(res => res.json())
    .then((savedItem: InitiativeItem) => {
      console.log("Initiative Item created successfully, server data:", savedItem);
      // Silently replace temporary item with the one from the server
      setInitiative(prev => {
          const newInitiative = JSON.parse(JSON.stringify(prev));
           for (const step of newInitiative.steps) {
                const itemIndex = step.items.findIndex((i: InitiativeItem) => i.id === tempId);
                if (itemIndex > -1) {
                    step.items[itemIndex] = savedItem;
                    break;
                }
            }
          return newInitiative;
      })
    })
    .catch(err => {
        console.error("Failed to add item:", err);
        toast({ title: "Error", description: "Failed to add item. It may not be saved.", variant: "destructive" });
        // Rollback optimistic update
        setInitiative(prev => {
            const newInitiative = JSON.parse(JSON.stringify(prev));
            for (const step of newInitiative.steps) {
                step.items = step.items.filter((i: InitiativeItem) => i.id !== tempId);
            }
            return newInitiative;
        })
    });
  };

  const handleUpdateInitiativeItem = (itemId: string, newText: string) => {
     console.log(`InitiativeView: handleUpdateInitiativeItem for ${itemId}`, { text: newText });
     // Optimistic update
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
  };

  const handleDeleteInitiativeItem = (itemId: string) => {
    console.log(`InitiativeView: handleDeleteInitiativeItem for ${itemId}`);
    // Optimistic update
     setInitiative(prev => {
        const newInitiative = JSON.parse(JSON.stringify(prev));
        for (const step of newInitiative.steps) {
            step.items = step.items.filter((i: InitiativeItem) => i.id !== itemId);
        }
        return newInitiative;
    });
    
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
