

"use client";

import { RadarItemCard } from "@/components/radar-item-card";
import type { RadarItem, Team } from "@/lib/types";
import RadarChart from "@/components/d3-radar/RadarChart";


interface RadarDashboardProps {
  radarItems: RadarItem[];
  onDeleteItem: (itemId: string) => void;
  teams: Team[];
  currentTeamId: string;
  onEditItem: (item: RadarItem) => void;
  onCreateItem: () => void;
}

export function RadarDashboard({ radarItems, onDeleteItem, teams, currentTeamId, onEditItem, onCreateItem }: RadarDashboardProps) {

  const handleEditClick = (item: any) => {
      const fullItem = radarItems.find(i => i.id === item.id);
      if (fullItem) {
          onEditItem(fullItem);
      }
  }


  return (
    <div>
      <div className="bg-background text-foreground p-4 rounded-lg border">
          <RadarChart
              items={radarItems}
              radius={300}
              onEditClick={handleEditClick}
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
                            onEdit={() => onEditItem(item)}
                            onDeleteItem={() => onDeleteItem(item.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
                    <h3 className="text-xl font-medium text-muted-foreground">No radar items yet.</h3>
                    <p className="text-muted-foreground mt-2">Get started by creating a new radar item.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
