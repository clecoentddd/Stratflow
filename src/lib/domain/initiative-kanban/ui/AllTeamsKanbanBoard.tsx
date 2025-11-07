"use client";

import React, { useEffect, useState } from 'react';
import styles from './kanban.module.css';

interface KanbanItem {
  itemId: string;
  initiativeId: string;
  teamId: string;
  name: string;
  text: string;
  status: 'ToDo' | 'Doing' | 'Done';
}

interface TeamKanbanData {
  teamId: string;
  items: KanbanItem[];
}

interface AllTeamsKanbanBoardProps {
  initialData?: TeamKanbanData[];
}

export function AllTeamsKanbanBoard({ initialData }: AllTeamsKanbanBoardProps) {
  const [kanbanData, setKanbanData] = useState<TeamKanbanData[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return; // Use initial data if provided

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/initiative-kanban-status-mapped-projection/projection');
        if (!response.ok) {
          throw new Error('Failed to fetch kanban data');
        }
        const data = await response.json();
        setKanbanData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData]);

  if (loading) {
    return (
      <div className={styles.kanbanBoard}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Loading all teams kanban board...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.kanbanBoard}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
          Error loading kanban board: {error}
        </div>
      </div>
    );
  }

  // Group items by team and status
  const teamsData = kanbanData.map(teamData => {
    const itemsByStatus = {
      ToDo: teamData.items.filter(item => item.status === 'ToDo'),
      Doing: teamData.items.filter(item => item.status === 'Doing'),
      Done: teamData.items.filter(item => item.status === 'Done'),
    };

    return {
      teamId: teamData.teamId,
      itemsByStatus,
      totalItems: teamData.items.length
    };
  });

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Initiative Actions and Objectives - All Teams
        </h1>
        <p style={{ color: '#6b7280' }}>
          Kanban board showing all initiative items from all teams, organized by team
        </p>
      </div>

      {teamsData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          No kanban items found across all teams.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {teamsData.map(team => (
            <div key={team.teamId} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#2563eb',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.5rem'
              }}>
                Team: {team.teamId} ({team.totalItems} items)
              </div>

              <div className={styles.kanbanBoard}>
                <KanbanColumn
                  title="To Do"
                  items={team.itemsByStatus.ToDo}
                  emptyMessage="No items to do"
                />
                <KanbanColumn
                  title="Doing"
                  items={team.itemsByStatus.Doing}
                  emptyMessage="No items in progress"
                />
                <KanbanColumn
                  title="Done"
                  items={team.itemsByStatus.Done}
                  emptyMessage="No completed items"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  title: string;
  items: KanbanItem[];
  emptyMessage?: string;
}

function KanbanColumn({ title, items, emptyMessage = "No items" }: KanbanColumnProps) {
  return (
    <div className={styles.kanbanColumn}>
      <div className={styles.kanbanColumnHeader}>
        <h3 className={styles.kanbanColumnTitle}>{title}</h3>
        <span className={styles.kanbanColumnCount}>({items.length})</span>
      </div>
      <div className={styles.kanbanColumnContent}>
        {items.length === 0 ? (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            {emptyMessage}
          </div>
        ) : (
          items.map(item => (
            <div key={item.itemId} className={styles.kanbanCard}>
              <div className={styles.kanbanCardContent}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {item.text || item.name || 'Unnamed Item'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Item: {item.itemId}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Initiative: {item.initiativeId}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}