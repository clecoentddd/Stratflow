
"use client";

import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InitiativeStep, InitiativeStepKey, InitiativeItem as InitiativeItemType } from "@/lib/types";
import styles from './initiative-step-view.module.css';

// Re-defining InitiativeItemView here as it's tightly coupled.
// In a larger app, this would be in its own file.
import { useState, useEffect } from "react";
import itemStyles from './initiative-view.module.css';
import { Textarea } from "./ui/textarea";
import { Trash2 } from "lucide-react";

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
      <div className={itemStyles.editContainer}>
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Describe an item..."
          autoFocus
          rows={3}
          className={itemStyles.editTextarea}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
         <div className={itemStyles.editActions}>
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
    <div onClick={() => setIsEditing(true)} className={itemStyles.itemView}>
      <p className={itemStyles.itemText}>{item.text}</p>
    </div>
  );
}


// Main component for this file
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
    <Card key={step.key} className={styles.stepCard}>
      <CardHeader className={styles.stepHeader}>
        <CardTitle className={styles.stepTitle}>
          {Icon && <Icon className={styles.stepIcon} />}
          {step.title}
        </CardTitle>
        <Button size="icon" variant="ghost" className={styles.addItemButton} onClick={onAddItem}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className={styles.stepContent}>
        <div className={styles.stepItemsContainer}>
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
            <p className={styles.noItemsText}>No items yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
