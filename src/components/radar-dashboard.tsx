

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { RadarItemDialog } from "@/components/radar-item-dialog";
import { RadarItemCard } from "@/components/radar-item-card";
import { Button } from "@/components/ui/button";
import type { RadarItem, Organization } from "@/lib/types";
import RadarChart from "@/components/d3-radar/RadarChart";


interface RadarDashboardProps {
  organizationName: string;
  radarItems: RadarItem[];
  onUpsertItem: (item: RadarItem) => void;
  onDeleteItem: (itemId: string) => void;
  organizations: Organization[];
  currentOrgId: string;
}

export function RadarDashboard({ organizationName, radarItems, onUpsertItem, onDeleteItem, organizations, currentOrgId }: RadarDashboardProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RadarItem | null>(null);

  const handleOpenDialog = (item: RadarItem | null = null) => {
    setEditingItem(item);
    setDialogOpen(true);
  };
  
  const handleEditClick = (item: any) => {
      const fullItem = radarItems.find(i => i.id === item.id);
      if (fullItem) {
          handleOpenDialog(fullItem);
      }
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-headline">{organizationName} - Radar</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Radar Item
        </Button>
      </div>
      
      <div className="bg-black text-white p-4 rounded-lg">
          <RadarChart
              items={radarItems}
              radius={300}
              onEditClick={handleEditClick}
              onCreateClick={() => handleOpenDialog()}
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-12 space-y-4">
            <h2 className="text-2xl font-semibold font-headline">Radar Items</h2>
            {radarItems.length > 0 ? (
                <div className="space-y-4">
                    {radarItems.map(item => (
                        <RadarItemCard 
                            key={item.id} 
                            item={item} 
                            onEdit={() => handleOpenDialog(item)}
                            onDeleteItem={() => onDeleteItem(item.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-medium text-muted-foreground">No radar items yet.</h3>
                    <p className="text-muted-foreground mt-2">Get started by creating a new radar item.</p>
                </div>
            )}
        </div>
      </div>

      <RadarItemDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={onUpsertItem}
        item={editingItem}
        organizations={organizations}
        currentOrgId={currentOrgId}
      />
    </div>
  );
}
