"use client";

import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { InitiativeStep, InitiativeStepKey, InitiativeItem as InitiativeItemType } from "@/lib/types";
import styles from "./initiative-step-view.module.css";
import { useState, useEffect } from "react";

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
      <div className="relative">
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Describe an item..."
          autoFocus
          rows={3}
          className="resize-none"
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
         <div className="flex justify-between mt-2">
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
    <div onClick={() => setIsEditing(true)} className={styles.item}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.text}</p>
    </div>
  );
}

interface InitiativeStepViewProps {
  step: InitiativeStep;
  iconMap: Record<string, React.ComponentType<any>>;
  onAddItem: () => void;
  onSaveItem: (itemId: string, newText: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export function InitiativeStepView({
  step,
  iconMap,
  onAddItem,
  onSaveItem,
  onDeleteItem,
}: InitiativeStepViewProps) {
  const Icon = iconMap[step.iconName as keyof typeof iconMap];

  return (
    <Card key={step.key} className={styles.stepCard} data-step={step.key}>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>
          {Icon && <Icon className={styles.stepIcon} />}
          {step.title}
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onAddItem}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className={styles.stepContent}>
        <div className={styles.itemsList}>
          {step.items.length > 0 ? (
            step.items.map((item) => (
              <InitiativeItemView
                key={item.id}
                item={item}
                onSave={onSaveItem}
                onDelete={onDeleteItem}
              />
            ))
          ) : (
            <p className="text-sm text-center text-muted-foreground w-full py-4">No items yet.</p>
          )}
        </div>
      </div>
    </Card>
  );
}