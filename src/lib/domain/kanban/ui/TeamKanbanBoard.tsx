"use client";

import React, { useState, useEffect, useCallback } from "react";
import { queryEligibleInitiatives, getAllTeams, type InitiativeCatalogRow, getTable } from "@/lib/domain/initiatives-catalog/projection";
import { KanbanInitiativeCard } from "./KanbanInitiativeCard";

const STATUSES = ["New", "Draft", "Active", "Closed", "Obsolete"] as const;

type Status = typeof STATUSES[number];

type InitiativeWithStatus = InitiativeCatalogRow & { 
  status: Status;
  teamName: string;
};

// Helper function to get a random status
const getRandomStatus = (): Status => {
  const randomIndex = Math.floor(Math.random() * STATUSES.length);
  return STATUSES[randomIndex];
};

export function TeamKanbanBoard({ teamId }: { teamId: string }) {
  const [initiatives, setInitiatives] = useState<InitiativeWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug function to log the current state of the initiatives table
  const debugInitiativeTable = () => {
    const table = getTable();
    console.log('Current initiatives in catalog table:', Array.from(table.entries()));
  };

  // Function to load initiatives
  const loadInitiatives = useCallback(() => {
    console.log('--- Debug: loadInitiatives called ---');
    
    // Log the current state of the initiatives table
    debugInitiativeTable();
    
    try {
      console.log('Loading initiatives for team:', teamId);
      
      // Get all initiatives and filter by teamId
      console.log('Calling queryEligibleInitiatives()...');
      const allInitiatives = queryEligibleInitiatives();
      console.log('All initiatives from queryEligibleInitiatives:', JSON.parse(JSON.stringify(allInitiatives)));
      
      // Get all teams to enrich the initiatives with team names
      console.log('Getting all teams...');
      const teams = getAllTeams();
      console.log('All teams:', teams);
      const teamMap = new Map(teams.map(team => [team.id, team]));
      console.log('Team map:', Object.fromEntries(teamMap));
      
      const filteredInitiatives = allInitiatives
        .filter(i => {
          const matches = i.teamId === teamId;
          console.log(`Checking initiative ${i.id} with teamId ${i.teamId} against ${teamId}: ${matches ? 'MATCH' : 'NO MATCH'}`);
          return matches;
        })
        .map(i => {
          const teamInfo = teamMap.get(i.teamId);
          return {
            ...i,
            status: getRandomStatus(), // Assign a random status for demo purposes
            teamName: teamInfo?.name || `Team ${i.teamId}`,
            name: i.name || `Initiative ${i.id}`,
            strategyName: i.strategyName || `Strategy for ${i.teamId}`,
          };
        });
      
      console.log('Processed initiatives for team:', filteredInitiatives);
      setInitiatives(filteredInitiatives);
      setError(null);
    } catch (err) {
      console.error('Error loading initiatives:', err);
      setError('Failed to load initiatives. Please try again.');
      setInitiatives([]);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  // Load initiatives on component mount and when teamId changes
  useEffect(() => {
    setIsLoading(true);
    loadInitiatives();
  }, [teamId, loadInitiatives]);

  // Function to handle initiative status change
  const onMoveInitiative = useCallback((initiativeId: string, newStatus: string) => {
    if (!STATUSES.includes(newStatus as Status)) {
      console.warn(`Invalid status: ${newStatus}`);
      return;
    }
    
    setInitiatives(prev =>
      prev.map(i => 
        i.id === initiativeId 
          ? { ...i, status: newStatus as Status } 
          : i
      )
    );
  }, []);

  console.log('Rendering with initiatives:', initiatives);
  
  if (isLoading) {
    return <div>Loading initiatives...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }
  
  if (initiatives.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No initiatives found for this team.</p>
        <button 
          onClick={loadInitiatives}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
        <div className="mt-4 text-sm text-gray-500">
          Make sure to seed the demo data first if you haven't already.
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Team Initiatives</h2>
        <button 
          onClick={loadInitiatives}
          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>
      
      <div className="flex flex-1 overflow-x-auto gap-4 p-4 bg-gray-50 rounded-lg">
        {STATUSES.map((status) => {
          const filtered = initiatives.filter(i => i.status === status);
          return (
            <div key={status} className="flex-1 min-w-64">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{status}</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {filtered.length}
                </span>
              </div>
              <div 
                className="bg-white rounded-lg shadow p-3 min-h-[400px] space-y-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("id");
                  if (id) onMoveInitiative(id, status);
                }}
              >
                {filtered.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-8">
                    No {status.toLowerCase()} initiatives
                  </div>
                ) : (
                  filtered.map(initiative => (
                    <KanbanInitiativeCard
                      key={initiative.id}
                      initiative={initiative}
                      onMove={onMoveInitiative}
                      statuses={STATUSES}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
