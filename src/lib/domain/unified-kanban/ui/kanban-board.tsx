"use client";

import React, { useCallback } from 'react';
import type { KanbanBoardData, EnrichedKanbanElement, KanbanColumnDefinition } from '../types';
import { startDrag, setDragOverColumn, endDrag, getDragState } from '../drag-state';
import styles from './kanban-board.module.css';


export function KanbanBoard({ data, onMoveElement, onElementClick, className = '' }: {
  data: KanbanBoardData;
  onMoveElement: (elementId: string, fromStatus: string, toStatus: string, elementType?: string) => Promise<void>;
  onElementClick?: (element: EnrichedKanbanElement) => void;
  className?: string;
}) {
  const handleDragStart = useCallback((element: EnrichedKanbanElement) => {
    startDrag(element);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    setDragOverColumn(columnStatus);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling

    const dragState = getDragState();
    const { draggedElement } = dragState;
    
    if (!draggedElement || draggedElement.status === toStatus) {
      endDrag();
      return;
    }

    // Clear drag state immediately to prevent double-submission
    endDrag();

    try {
      await onMoveElement(draggedElement.id, draggedElement.status, toStatus, draggedElement.type);
    } catch (error) {
      console.error('Failed to move element:', error);
    }
  }, [onMoveElement]);

  // Group teams by level
  const teamsMap: Record<string, { teamId: string; teamName: string; teamLevel: number; elements: EnrichedKanbanElement[]; swimlanes: any[] }> = {};

  const ensureTeam = (id: string, name?: string, level?: number) => {
    if (!teamsMap[id]) {
      teamsMap[id] = { 
        teamId: id, 
        teamName: name || 'Team ' + id, 
        teamLevel: level ?? 0, 
        elements: [],
        swimlanes: []
      };
    } else {
      if (name) teamsMap[id].teamName = name;
      if (level !== undefined) teamsMap[id].teamLevel = level;
    }
    return teamsMap[id];
  };

  // 1. Process Swimlanes
  if (data.swimlanes) {
    for (const sl of data.swimlanes) {
      const team = ensureTeam(sl.teamId || 'unknown', sl.teamName, sl.teamLevel);
      team.swimlanes.push(sl);
    }
  }

  // 2. Process Elements
  if (data.elements) {
    for (const element of data.elements) {
      const teamId = element.metadata?.teamId || 'unknown';
      const team = ensureTeam(teamId, element.metadata?.teamName, element.metadata?.teamLevel);
      team.elements.push(element);
    }
  }

  const sortedLevels = Array.from(new Set(Object.values(teamsMap).map(t => t.teamLevel))).sort((a, b) => a - b);
  const teamsByLevel: Record<number, typeof teamsMap[string][]> = {};
  
  Object.values(teamsMap).forEach(team => {
    if (!teamsByLevel[team.teamLevel]) teamsByLevel[team.teamLevel] = [];
    teamsByLevel[team.teamLevel].push(team);
  });

  const dragState = getDragState();

  interface StrategyGroup {
    id: string;
    title: string;
    state: string;
    elements: EnrichedKanbanElement[];
  }

  // Helper to group by strategy
  const groupElementsByStrategy = (team: typeof teamsMap[string]) => {
    const groups: StrategyGroup[] = [];
    const processedElementIds = new Set<string>();

    // 1. Create groups for defined swimlanes
    team.swimlanes.forEach(sl => {
       const elements = team.elements.filter(e => e.metadata?.strategyId === sl.id);
       elements.forEach(e => processedElementIds.add(e.id));
       groups.push({
          id: sl.id,
          title: sl.title,
          state: sl.state,
          elements
       });
    });

    // 2. Find uncategorized elements
    const uncategorized = team.elements.filter(e => !processedElementIds.has(e.id));
    if (uncategorized.length > 0) {
       const otherGroups: Record<string, StrategyGroup> = {};
       uncategorized.forEach(e => {
          const sId = e.metadata?.strategyId || 'default';
          if (!otherGroups[sId]) {
             otherGroups[sId] = {
                id: sId,
                title: e.metadata?.strategyName || 'Uncategorized',
                state: e.metadata?.strategyState || '',
                elements: []
              };
          }
          otherGroups[sId].elements.push(e);
       });
       groups.push(...Object.values(otherGroups));
    }

    return groups.sort((a, b) => {
      // Active first
      if (a.state === 'Active' && b.state !== 'Active') return -1;
      if (a.state !== 'Active' && b.state === 'Active') return 1;
      // Then by title
      return a.title.localeCompare(b.title);
    });
  };

  // Set CSS variable for column count
  const columnCount = data.columns.length;
  return (
    <div className={`${styles.kanbanBoard} ${className}`}
      style={{ ['--kanban-column-count' as any]: columnCount }}>
      {/* Fixed column headers */}
      <div className={styles.columns} style={{ position: 'sticky', top: 0, zIndex: 2, background: '#fff' }}>
        {data.columns.map((column: KanbanColumnDefinition) => (
          <div key={column.id} className={styles.columnHeader} style={{ backgroundColor: column.color }}>
            <h3 className={styles.columnTitle}>{column.title}</h3>
            {column.description && <p className={styles.columnDescription}>{column.description}</p>}
          </div>
        ))}
      </div>
      {/* Grouped by level */}
      <div>
        {sortedLevels.map(level => (
          <div key={level} style={{ marginBottom: 40 }}>
            <div style={{ fontWeight: 700, fontSize: 20, margin: '24px 0 12px 0', color: '#3b82f6', letterSpacing: 1 }}>
              Level {level}
            </div>
            {teamsByLevel[level]
              .sort((a, b) => a.teamName.localeCompare(b.teamName))
              .map(team => {
                const strategyGroups = groupElementsByStrategy(team);
                
                return (
                <div key={team.teamId} style={{ marginBottom: 32 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
                    {team.teamName}
                  </div>
                  
                  {strategyGroups.map(group => (
                    <div key={group.id} className={styles.swimlane} style={{ marginBottom: 16, borderLeft: '4px solid #3b82f6', borderRadius: 6, background: '#f9fafb' }}>
                      {group.id !== 'default' && (
                        <div className={styles.swimlaneHeaderRow} style={{ 
                          fontWeight: 600, 
                          fontSize: 14, 
                          color: '#0f172a', 
                          background: '#e0e7ef', 
                          padding: '6px 12px', 
                          borderRadius: '6px 6px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>{group.title}</span>
                          {group.state && (
                            <span style={{ 
                              fontSize: '11px', 
                              padding: '2px 8px', 
                              borderRadius: '12px',
                              backgroundColor: group.state === 'Active' ? '#dcfce7' : '#f1f5f9',
                              color: group.state === 'Active' ? '#166534' : '#64748b',
                              fontWeight: 500
                            }}>
                              {group.state}
                            </span>
                          )}
                        </div>
                      )}
                      <div className={styles.columns}>
                        {data.columns.map((column: KanbanColumnDefinition) => (
                          <KanbanColumn
                            key={column.id}
                            column={column}
                            elements={group.elements.filter(e => e.status === column.status)}
                            isDragOver={dragState.dragOverColumn === column.status}
                            onDragStart={handleDragStart}
                            onDragOver={(e) => handleDragOver(e, column.status)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.status)}
                            onElementClick={onElementClick}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )})}
          </div>
        ))}
      </div>
    </div>
  );
}
interface KanbanColumnProps {
  column: KanbanColumnDefinition;
  elements: EnrichedKanbanElement[];
  isDragOver: boolean;
  onDragStart: (element: EnrichedKanbanElement) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onElementClick?: (element: EnrichedKanbanElement) => void;
}

export function KanbanColumn({
  column,
  elements,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onElementClick
}: KanbanColumnProps) {
  return (
    <div
      className={`${styles.column} ${isDragOver ? styles.dragOver : ''}`}
      style={!isDragOver && column.color ? { backgroundColor: column.color } : undefined}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={styles.columnCount} style={{ textAlign: 'right', fontSize: 12, color: '#888', marginBottom: 4 }}>
        {elements.length > 0 ? `${elements.length} item${elements.length > 1 ? 's' : ''}` : ''}
      </div>
      <div className={styles.columnContent}>
        {elements.length === 0 ? (
          <div className={styles.emptyColumn}>
            No items
          </div>
        ) : (
          elements.map(element => (
            <KanbanElement
              key={element.id}
              element={element}
              onDragStart={() => onDragStart(element)}
              onClick={() => onElementClick?.(element)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanElementProps {
  element: EnrichedKanbanElement;
  onDragStart: () => void;
  onClick?: () => void;
}

export function KanbanElement({ element, onDragStart, onClick }: KanbanElementProps) {
  return (
    <div
      className={styles.element}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'grab' }}
    >
      <div className={styles.elementContent}>
        <div className={styles.elementTitle}>{element.title}</div>
        {element.description && (
          <div className={styles.elementDescription}>{element.description}</div>
        )}
        {element.tags && element.tags.length > 0 && (
          <div className={styles.elementTags}>
            {element.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
        <div className={styles.elementType}>{element.type}</div>
      </div>
    </div>
  );
}