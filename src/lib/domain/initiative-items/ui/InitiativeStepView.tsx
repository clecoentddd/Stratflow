"use client";

import { Plus, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { InitiativeStep, InitiativeItem as InitiativeItemType } from "@/lib/types";
import styles from "@/lib/domain/initiatives/ui/initiative-step-view.module.css";
import itemStyles from "@/lib/domain/initiatives/ui/initiative-item-view.module.css";

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
      <div className={itemStyles.container}>
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Describe an item..."
          autoFocus
          rows={3}
          className={itemStyles.textarea}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
         <div className={itemStyles.actions}>
            <Button size="icon" variant="ghost" className={itemStyles.deleteBtn} onClick={() => onDelete(item.id)}>
                <Trash2 className={itemStyles.iconSmall} />
            </Button>
            <div className={itemStyles.actionsRight}>
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
      <p className={itemStyles.itemText}>{item.text}</p>
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
        <Button size="icon" variant="ghost" className={styles.addButton} onClick={onAddItem}>
          <Plus className={styles.addIcon} />
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
            <p className={styles.emptyText}>No items yet.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
