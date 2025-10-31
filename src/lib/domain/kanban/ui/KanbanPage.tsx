"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TeamKanbanBoard } from "./TeamKanbanBoard";
import { initialTeams } from "@/lib/data";

type Team = {
  id: string;
  name?: string;
  purpose?: string;
  context?: string;
  level?: number;
};

export function KanbanPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('KanbanPage: Loading teams...');
      
      // Use the initial teams data directly
      const teams = initialTeams.map(team => ({
        id: team.id,
        name: team.name,
        purpose: team.purpose,
        context: team.context,
        level: team.level
      }));
      
      console.log('KanbanPage: Retrieved teams:', teams);
      setTeams(teams);
      
      if (teams.length > 0) {
        // Try to maintain the same team selection if possible
        setSelectedTeamId(prevId => 
          teams.some(t => t.id === prevId) ? prevId : teams[0].id
        );
      } else {
        console.warn('KanbanPage: No teams found in initial data');
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
      setSeedError('Failed to load teams. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);
  
  const handleSeedDemo = async () => {
    try {
      setIsSeeding(true);
      setSeedError(null);
      console.log('Seeding demo data...');
      
      const response = await fetch('/api/dev/seed-demo', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log('Seed response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to seed demo data');
      }
      
      // Force a hard refresh to ensure all data is reloaded
      window.location.href = '/kanban';
    } catch (err) {
      console.error('Failed to seed demo data:', err);
      setSeedError(err instanceof Error ? err.message : 'Failed to seed demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading teams...</div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>No Teams Found</h1>
        <p style={{ marginBottom: '2rem' }}>There are no teams available. Would you like to seed the demo data?</p>
        <button
          onClick={handleSeedDemo}
          disabled={isSeeding}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isSeeding ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSeeding ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
          }}
        >
          {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
        </button>
        {seedError && (
          <div style={{ color: 'red', marginTop: '1rem' }}>
            {seedError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <label htmlFor="team-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Select Team:
          </label>
          <select
            id="team-select"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              minWidth: '200px',
            }}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name || `Team ${team.id}`}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isSeeding ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSeeding ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {isSeeding ? 'Seeding...' : 'Refresh Demo Data'}
          </button>
        </div>
      </div>
      
      {seedError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {seedError}
        </div>
      )}
      
      {selectedTeamId && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <TeamKanbanBoard teamId={selectedTeamId} />
        </div>
      )}
    </div>
  );
}
