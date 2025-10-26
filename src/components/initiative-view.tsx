
"use client";

import { useState } from "react";
import { Plus, Save, XCircle, Trash2 } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Initiative, InitiativeStepKey, InitiativeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InitiativeItemViewProps {
  item: InitiativeItem;
  stepKey: InitiativeStepKey;
  initiativeId: string;
  onUpdateInitiativeItem: (initiativeId: string, stepKey: InitiativeStepKey, itemId: string, newText: string) => void;
  onDeleteInitiativeItem: (initiativeId: string, stepKey: InitiativeStepKey, itemId: string) => void;
}

function InitiativeItemView({ item, stepKey, initiativeId, onUpdateInitiativeItem, onDeleteInitiativeItem }: InitiativeItemViewProps) {
  const [isEditing, setIsEditing] = useState(item.text === "");
  const [editText, setEditText] = useState(item.text);

  const handleSave = () => {
    if (editText.trim() !== item.text) {
      onUpdateInitiativeItem(initiativeId, stepKey, item.id, editText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(item.text);
    setIsEditing(false);
    if(item.text === "") {
        onDeleteInitiativeItem(initiativeId, stepKey, item.id);
    }
  };
  
  const handleDelete = () => {
    onDeleteInitiativeItem(initiativeId, stepKey, item.id);
  }

  if (isEditing) {
    return (
      <div className="space-y-2 p-2 border rounded-md">
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Describe an item..."
          autoFocus
          rows={3}
          className="text-sm"
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!editText.trim()}>
            Save
          </Button>
        </div>
        {item.text && (
            <div className="pt-2 border-t">
             <Button size="sm" variant="destructive-outline" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
             </Button>
            </div>
        )}
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
  initiative: Initiative;
  onUpdateInitiative: (initiativeId: string, updatedValues: Partial<Initiative>) => void;
  onUpdateInitiativeItem: (initiativeId: string, stepKey: InitiativeStepKey, itemId: string, newText: string) => void;
  onAddInitiativeItem: (initiativeId: string, stepKey: InitiativeStepKey) => void;
  onDeleteInitiativeItem: (initiativeId: string, stepKey: InitiativeStepKey, itemId: string) => void;
}

export function InitiativeView({ 
    initiative,
    onUpdateInitiative,
    onUpdateInitiativeItem,
    onAddInitiativeItem,
    onDeleteInitiativeItem
}: InitiativeViewProps) {
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
            onValueChange={(value) => onUpdateInitiative(initiative.id, { progression: value[0] })}
            max={100}
            step={1}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
          {initiative.steps.map((step) => (
            <Card key={step.key} className="bg-background h-full">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                <step.icon className="h-4 w-4 text-muted-foreground" />
                {step.title}
                </CardTitle>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAddInitiativeItem(initiative.id, step.key)}>
                <Plus className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="space-y-2">
                {step.items.length > 0 ? step.items.map((item) => (
                    <InitiativeItemView 
                      key={item.id}
                      item={item}
                      stepKey={step.key}
                      initiativeId={initiative.id}
                      onUpdateInitiativeItem={onUpdateInitiativeItem}
                      onDeleteInitiativeItem={onDeleteInitiativeItem}
                    />
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-2">No items yet.</p>
                )}
                </div>
            </CardContent>
            </Card>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
