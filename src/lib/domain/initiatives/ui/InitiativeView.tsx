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
import { LinkRadarItemsDialog } from '../../tag-an-initiative-with-a-risk/ui/LinkRadarItemsDialog';
import { EditInitiativeDialog } from './EditInitiativeDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { InitiativeLinkDialog } from "@/lib/domain/initiatives-linking/ui/InitiativeLinkDialog";
import type { Initiative, InitiativeStepKey, InitiativeItem as InitiativeItemType, RadarItem } from "@/lib/types";
import type { UpdateInitiativeCommand } from '@/lib/domain/initiatives/commands';
import type { AddInitiativeItemCommand, UpdateInitiativeItemCommand } from '@/lib/domain/initiative-items/commands';
import { getTagsForInitiative } from '@/lib/domain/tag-an-initiative-with-a-risk/tagsProjection';
import { getTagsForInitiativeProjection } from '@/lib/domain/tag-an-initiative-with-a-risk/queryTagsProjection';
import stepStyles from "./initiative-step-view.module.css";
import { InitiativeStepView } from "@/lib/domain/initiative-items/ui/InitiativeStepView";
import { addInitiativeItem, updateInitiativeItem, deleteInitiativeItem } from "@/lib/api/initiative-items";
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
  onLocalUpdate?: (initiativeId: string, updated: Partial<Initiative>) => void;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<any>> = { Search, Milestone, ListChecks, Target };

export function InitiativeView({ initialInitiative, radarItems, orgId, onInitiativeChange, onDeleteInitiative, strategyId, onLocalUpdate }: InitiativeViewProps) {
  const defaultExpanded = initialInitiative.isExpanded ?? !!(initialInitiative.steps && initialInitiative.steps.some((s: any) => Array.isArray(s.items) && s.items.length > 0));
  const [initiative, setInitiative] = useState({ ...initialInitiative, isExpanded: defaultExpanded });
  const [isLinkRadarOpen, setLinkRadarOpen] = useState(false);
  const [isLinkInitiativesOpen, setLinkInitiativesOpen] = useState(false);
  const [linkedInits, setLinkedInits] = useState<Array<{ toInitiativeId: string; toInitiativeName?: string }>>([]);
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
    if (onLocalUpdate) {
      onLocalUpdate(initiative.id, updatedValues);
    }
    if (initiative.id.startsWith('init-temp-')) {
      setInitiative(prev => ({ ...prev, ...updatedValues }));
      return;
    }
    const command: UpdateInitiativeCommand = { ...updatedValues, initiativeId: initiative.id };
    setInitiative(prev => ({ ...prev, ...updatedValues }));
    // Removed: updateInitiative call (now handled by tag-an-initiative-with-a-risk slice)
  };

  const handleEditName = (newName: string) => {
    if (initiative.id.startsWith('init-temp-')) {
      setInitiative(prev => ({ ...prev, name: newName }));
      return;
    }
    const command: UpdateInitiativeCommand = { name: newName, initiativeId: initiative.id };
    setInitiative(prev => ({ ...prev, name: newName }));
    // Removed: updateInitiative call (now handled by tag-an-initiative-with-a-risk slice)
  };

  const handleDeleteConfirmed = () => {
    onDeleteInitiative(initiative.id, strategyId);
  };

  const handleAddInitiativeItem = (stepKey: InitiativeStepKey) => {
  const tempId = `temp-${uuidv4()}`;
  const newItem: InitiativeItemType = { id: tempId, text: "" };
  console.log('[UI] Adding new initiative item (optimistic):', { tempId, stepKey });
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
    console.log('[UI] Sending addInitiativeItem command:', { orgId, command });
    const optimisticInitiative = { ...initiative };
    const step = optimisticInitiative.steps.find(s => s.key === stepKey);
    if(step) {
      const item = step.items.find(i => i.id === itemId);
      if(item) item.text = newText;
    }
    setInitiative(optimisticInitiative);

    addInitiativeItem(orgId, command)
    .then(async res => {
      if(!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Server failed to create item.");
      }
      return res.json();
    })
    .then((savedItem: InitiativeItemType) => {
      console.log('[UI] Initiative item created on server:', savedItem);
      toast({ 
        title: "Success", 
        description: "Initiative Item Saved",
        variant: "default"
      });
      onInitiativeChange(); 
    })
    .catch(err => {
      console.error('[UI] Error creating initiative item:', err);
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

        const promise = updateInitiativeItem(orgId, itemId, command);
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

    deleteInitiativeItem(orgId, itemId, initiative.id)
    .then(async res => {
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete item.');
        }
        toast({ 
            title: "Success", 
            description: "Initiative Item Deleted",
            variant: "default"
        });
    })
    .catch(err => {
        console.error(err);
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setInitiative(originalInitiative);
    });
  };

  // Tag/untag radar items using the tag-an-initiative-with-a-risk API slice
  // Pessimistic UI: update state on successful API responses
  const [tagIds, setTagIds] = useState<string[]>([]);

  // Load initial tags from projection (server or API)
  useEffect(() => {
    // Try to use the projection query directly (works on server), fallback to API fetch on client
    let didCancel = false;
    async function loadTags() {
      let tags: string[] = [];
      try {
        // Try direct import (works in SSR/server context)
        tags = getTagsForInitiativeProjection
          ? getTagsForInitiativeProjection(initiative.id)
          : [];
        // If SSR returns empty, or we're on client, fetch from API
        if (!tags.length && typeof window !== 'undefined') {
          const res = await fetch(`/monitoring/projection/tags?initiativeId=${initiative.id}`);
          if (res.ok) {
            const data = await res.json();
            tags = data.tags || [];
          }
        }
      } catch (err) {
        // Always fallback to API fetch on error
        if (typeof window !== 'undefined') {
          const res = await fetch(`/monitoring/projection/tags?initiativeId=${initiative.id}`);
          if (res.ok) {
            const data = await res.json();
            tags = data.tags || [];
          }
        }
      }
      if (!didCancel) setTagIds(tags);
    }
    loadTags();
    return () => { didCancel = true; };
  }, [initiative.id]);

  const handleLinkRadarItems = async (selectedIds: string[]) => {
    const prevIds = tagIds;
    const toAdd = selectedIds.filter(id => !prevIds.includes(id));
    const toRemove = prevIds.filter(id => !selectedIds.includes(id));
    console.log('[InitiativeView] Tagging radar items. To add:', toAdd, 'To remove:', toRemove);
    let allOk = true;
    for (const radarItemId of toAdd) {
      try {
        const res = await fetch('/api/tag-an-initiative-with-a-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initiativeId: initiative.id, radarItemId, action: 'add' })
        });
        const data = await res.json();
        console.log('[InitiativeView] Tag add response:', data);
        if (!data.ok) allOk = false;
      } catch (err) {
        allOk = false;
        console.error('[InitiativeView] Error tagging radar item:', radarItemId, err);
      }
    }
    for (const radarItemId of toRemove) {
      try {
        const res = await fetch('/api/tag-an-initiative-with-a-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initiativeId: initiative.id, radarItemId, action: 'remove' })
        });
        const data = await res.json();
        console.log('[InitiativeView] Tag remove response:', data);
        if (!data.ok) allOk = false;
      } catch (err) {
        allOk = false;
        console.error('[InitiativeView] Error untagging radar item:', radarItemId, err);
      }
    }
    if (allOk) {
      // Update state after successful tagging (pessimistic UI)
      setTagIds(prevIds => {
        const newIds = [...prevIds];
        toAdd.forEach(id => { if (!newIds.includes(id)) newIds.push(id); });
        toRemove.forEach(id => { const idx = newIds.indexOf(id); if (idx !== -1) newIds.splice(idx, 1); });
        return newIds;
      });
      toast({
        title: "Success",
        description: `Tagged ${toAdd.length} radar item${toAdd.length !== 1 ? 's' : ''}${toRemove.length > 0 ? ` and untagged ${toRemove.length}` : ''}.`,
        variant: "default"
      });
    }
  };
  
  // Always use projection for linked tags
  // Show all tagIds, even if radarItems does not include them yet
  type FallbackRadarItem = { id: string; name: string; type?: undefined; radarId: string; fallback: true };
  const linkedItems: (RadarItem | FallbackRadarItem)[] = tagIds.map(id => radarItems.find(item => item.id === id) || { id, name: id, type: undefined, radarId: '', fallback: true });

  function isFallbackRadarItem(item: RadarItem | FallbackRadarItem): item is FallbackRadarItem {
    return (item as FallbackRadarItem).fallback === true;
  }
  const isTempInitiative = typeof initiative.id === 'string' && initiative.id.startsWith('init-temp-');

  useEffect(() => {
    const loadLinks = async () => {
      try {
        const res = await fetch(`/api/initiatives/${initiative.id}/links`);
        const data = await res.json();
        if (Array.isArray(data)) setLinkedInits(data);
      } catch {}
    };
    loadLinks();
  }, [initiative.id]);

  const handleLinked = (count: number) => {
    // refresh links list after linking
    fetch(`/api/initiatives/${initiative.id}/links`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setLinkedInits(data);
    });
  };

  const handleUnlink = async (toInitiativeId: string) => {
    try {
      const res = await fetch(`/api/initiatives/${initiative.id}/links`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toInitiativeId })
      });
      if (res.ok) {
        setLinkedInits(prev => prev.filter(x => x.toInitiativeId !== toInitiativeId));
      }
    } catch {}
  };

  return (
    <>
    <div className="mb-3">
      <div
        className={styles.initiativeHeader}
        data-state={initiative.isExpanded ? 'expanded' : 'collapsed'}
      >
        <div className="flex-1" onClick={() => setInitiative(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}>
          <div className={styles.initiativeNameContainer}>
            <p className={styles.initiativeName}>{initiative.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
      <div
        className={styles.initiativeContent}
        data-state={initiative.isExpanded ? 'expanded' : 'collapsed'}
      >
           <div className="mb-6">
             <Label style={{ marginBottom: '12px', display: 'block' }}>
               Overall Progression: {initiative.progression}%
             </Label>
           <Slider
             value={[initiative.progression]}
             onValueChange={(value) => {
               // Update UI immediately for responsiveness
               setInitiative(prev => ({ ...prev, progression: value[0] }));
             }}
             onValueCommit={(value) => {
               // Only send API call when user stops dragging
               handleUpdateInitiative({ progression: value[0] });
             }}
             max={100}
             step={1}
           />
         </div>

        {/* Tag radar items group */}
        <div className={styles.tagButtonGroup}>
          <Button className={styles.tagButton} variant="outline" size="sm" onClick={() => setLinkRadarOpen(true)}>
            Tag radar item
          </Button>
          {linkedItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {linkedItems.map(item => (
                <span key={item.id} className="flex items-center">
                  {isFallbackRadarItem(item) ? (
                    <Badge variant="outline">{item.id}</Badge>
                  ) : (
                    <Link href={`/team/${item.radarId}/radar#${item.id}`}>
                      <Badge style={{ background: '#bbf7d0', color: '#166534' }}>{item.name}</Badge>
                    </Link>
                  )}
                  <button
                    aria-label="Remove tag"
                    className={styles.deleteButton}
                    onClick={() => {
                      const newIds = tagIds.filter(id => id !== item.id);
                      handleLinkRadarItems(newIds);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No radar items tagged yet.</p>
          )}
        </div>

        {/* Link initiatives group */}
        <div className={styles.initiativeButtonGroup}>
          <Button className={styles.initiativeButton} variant="outline" size="sm" onClick={() => setLinkInitiativesOpen(true)} disabled={isTempInitiative}>
            Link initiatives
          </Button>
          {isTempInitiative && (
            <span className="text-xs text-muted-foreground">Save this initiative before linking</span>
          )}
          {linkedInits.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {linkedInits.map(li => (
                <Badge key={li.toInitiativeId} variant="secondary">
                  {li.toInitiativeName || li.toInitiativeId}
                  <button
                    aria-label="Unlink initiative"
                    className={styles.deleteButton}
                    onClick={() => handleUnlink(li.toInitiativeId)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No initiative links yet.</p>
          )}
        </div>

        <div className={stepStyles.stepsGrid}>
          {initiative.steps && initiative.steps.length > 0 ? (
            initiative.steps.map((step) => (
              <InitiativeStepView
                  key={step.key}
                  step={step}
                  iconMap={iconMap}
                  onAddItem={() => handleAddInitiativeItem(step.key)}
                  onSaveItem={(itemId, newText) => handleSaveInitiativeItem(itemId, newText, step.key)}
                  onDeleteItem={(itemId) => handleDeleteInitiativeItem(itemId, step.key)}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No steps available for this initiative.</p>
          )}
        </div>

    <LinkRadarItemsDialog
      isOpen={isLinkRadarOpen}
      onOpenChange={setLinkRadarOpen}
      availableItems={radarItems}
      linkedItemIds={tagIds}
      onLinkItems={handleLinkRadarItems}
    />
      </div>
    </div>
    <InitiativeLinkDialog
      open={isLinkInitiativesOpen}
      onOpenChange={setLinkInitiativesOpen}
      companyId={orgId}
      sourceInitiativeId={initiative.id}
      onLinked={handleLinked}
    />
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