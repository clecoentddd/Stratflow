
"use client";

import { Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { Initiative, InitiativeStepKey } from "@/lib/types";

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {initiative.steps.map((step) => (
            <Card key={step.key} className="bg-background">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <step.icon className="h-4 w-4 text-muted-foreground" />
                  {step.title}
                </CardTitle>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAddInitiativeItem(initiative.id, step.key)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {step.items.length > 0 ? step.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.text}
                        onChange={(e) => onUpdateInitiativeItem(initiative.id, step.key, item.id, e.target.value)}
                        placeholder="Describe an item..."
                      />
                      <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => onDeleteInitiativeItem(initiative.id, step.key, item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive/80" />
                      </Button>
                    </div>
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
