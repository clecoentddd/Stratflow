"use client";

import React, { useCallback } from 'react';
import type {
  KanbanBoardData,
  EnrichedKanbanElement,
  KanbanColumnDefinition,
  KanbanSwimlaneDefinition,
} from '../types';
import { startDrag, setDragOverColumn, endDrag, getDragState } from '../drag-state';
import styles from './kanban-board.module.css';
import { Clock3 } from 'lucide-react';


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
  const teamsMap: Record<string, { teamId: string; teamName: string; teamLevel: number; elements: EnrichedKanbanElement[]; swimlanes: KanbanSwimlaneDefinition[] }> = {};

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
    state?: string;
    lanes: Array<{
      id: string;
      title: string;
      state?: string;
      elements: EnrichedKanbanElement[];
    }>;
  }

  const groupElementsByStrategy = (team: typeof teamsMap[string]) => {
    const laneLookup = new Map<string, KanbanSwimlaneDefinition>();
    team.swimlanes.forEach(sl => laneLookup.set(sl.id, sl));

    const strategyMap = new Map<string, StrategyGroup>();

    const getOrCreateGroup = (strategyId: string, fallback?: { title?: string; state?: string }) => {
      if (!strategyMap.has(strategyId)) {
        const swimlane = laneLookup.get(strategyId);
        strategyMap.set(strategyId, {
          id: strategyId,
          title: swimlane?.parentTitle || swimlane?.title || fallback?.title || 'Unassigned Strategy',
          state: swimlane?.parentState || swimlane?.state || fallback?.state,
          lanes: [],
        });
      } else {
        const group = strategyMap.get(strategyId)!;
        if (!group.title && fallback?.title) {
          group.title = fallback.title;
        }
        if (!group.state && fallback?.state) {
          group.state = fallback.state;
        }
      }
      return strategyMap.get(strategyId)!;
    };

    const attachLaneToGroup = (group: StrategyGroup, lane: KanbanSwimlaneDefinition) => {
      if (!group.lanes.some(existing => existing.id === lane.id)) {
        group.lanes.push({
          id: lane.id,
          title: lane.title,
          state: lane.state,
          elements: [],
        });
      }
    };

    // Initialize groups from swimlanes (where available)
    team.swimlanes.forEach(sl => {
      const strategyId = sl.parentId || sl.id || 'default';
      const group = getOrCreateGroup(strategyId, {
        title: sl.parentTitle || sl.title,
        state: sl.parentState || sl.state,
      });
      attachLaneToGroup(group, sl);
    });

    // Place elements into corresponding lanes
    team.elements.forEach(element => {
      const strategyId = element.metadata?.strategyId || 'default';
      const group = getOrCreateGroup(strategyId, {
        title: element.metadata?.strategyName,
        state: element.metadata?.strategyState,
      });

      const laneId = element.swimlaneId || strategyId;
      let lane = group.lanes.find(l => l.id === laneId);
      if (!lane) {
        const laneMeta = laneLookup.get(laneId);
        lane = {
          id: laneId,
          title: laneMeta?.title || element.metadata?.initiativeName || element.title,
          state: laneMeta?.state,
          elements: [],
        };
        group.lanes.push(lane);
      }
      lane.elements.push(element);
    });

    const sortedGroups = Array.from(strategyMap.values()).sort((a, b) => {
      if (a.state === 'Active' && b.state !== 'Active') return -1;
      if (a.state !== 'Active' && b.state === 'Active') return 1;
      return a.title.localeCompare(b.title);
    });

    sortedGroups.forEach(group => {
      group.lanes.sort((a, b) => a.title.localeCompare(b.title));
    });

    return sortedGroups;
  };

  // Set CSS variable for column count
  const columnCount = data.columns.length;
  return (
    <div className={`${styles.kanbanBoard} ${className}`}
      style={{ ['--kanban-column-count' as any]: columnCount }}>
      {/* Fixed column headers - offset by AppHeader height (4rem) */}
      <div className={styles.headerRow}>
        <div className={styles.columns}>
          {data.columns.map((column: KanbanColumnDefinition) => (
            <div key={column.id} className={styles.columnHeader}>
              <div className={styles.columnColorIndicator} style={{ backgroundColor: column.color }} />
              <h3 className={styles.columnTitle}>{column.title}</h3>
              {column.description && <p className={styles.columnDescription}>{column.description}</p>}
            </div>
          ))}
        </div>
      </div>
      {/* Grouped by level */}
      <div className="mt-8">
        {sortedLevels.map(level => (
          <div key={level} className="mb-12">
            {teamsByLevel[level]
              .sort((a, b) => a.teamName.localeCompare(b.teamName))
              .map(team => {
                const strategyGroups = groupElementsByStrategy(team);

                return (
                  <div key={team.teamId} className="mb-8">
                    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/50">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                        Level {level}
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {team.teamName}
                      </h2>
                    </div>

                    {strategyGroups.map(group => (
                      <div key={group.id} className="mb-6">
                        {group.id !== 'default' && (
                          <div className={styles.strategyHeader}>
                            <span className="flex-1">{group.title}</span>
                            {group.state && (
                              <span className={`${styles.statusBadge} ${group.state === 'Active' ? styles.statusActive : styles.statusDraft}`}>
                                {group.state}
                              </span>
                            )}
                          </div>
                        )}

                        {group.lanes.map(lane => {
                          const showLaneHeader = group.lanes.length > 1 || lane.title !== group.title;
                          return (
                            <div key={lane.id} className={styles.laneContainer}>
                              {showLaneHeader && (
                                <div className={styles.laneHeader}>
                                  <span className="flex-1">{lane.title}</span>
                                  {lane.state && (
                                    <span className={`${styles.statusBadge} ${lane.state === 'Active' ? styles.statusActive : styles.statusDraft}`}>
                                      {lane.state}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className={styles.columns}>
                                {data.columns.map((column: KanbanColumnDefinition) => (
                                  <KanbanColumn
                                    key={column.id}
                                    column={column}
                                    elements={lane.elements.filter(e => e.status === column.status)}
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
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )
              })}
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
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={styles.columnCount} style={{ textAlign: 'right', fontSize: 10, color: 'hsl(var(--muted-foreground))', marginBottom: 4, fontWeight: 600 }}>
        {elements.length > 0 ? `${elements.length} ${elements.length > 1 ? 'ITEMS' : 'ITEM'}` : ''}
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
  const normalizedStepKey = (element.metadata?.stepKey || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const isAction = normalizedStepKey === 'actions';
  const isProximate = normalizedStepKey === 'proximateobjectives';
  const elementClassName = [
    styles.element,
    isAction ? styles.elementAction : '',
    isProximate ? styles.elementProximate : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={elementClassName}
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
            {element.tags.map(tag => {
              const lowerTag = tag.toLowerCase();
              const tagClassName = [
                styles.tag,
                lowerTag === 'action' ? styles.tagAction : '',
                lowerTag === 'proximate objective' ? styles.tagProximate : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <span key={tag} className={tagClassName}>
                  {tag.toLowerCase() === 'proximate objective' && <Clock3 size={12} className="mr-1" />}
                  {tag}
                </span>
              );
            })}
          </div>
        )}
        <div className={styles.elementType}>{element.type}</div>
      </div>
    </div>
  );
}