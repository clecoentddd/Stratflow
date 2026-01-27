"use client";
import { KanbanBoard } from '@/lib/domain/unified-kanban/ui/kanban-board';
import { AddInitiativeDialog } from '@/lib/domain/unified-kanban/ui/AddInitiativeDialog';
import { InitiativeCardDialog } from '@/lib/domain/unified-kanban/ui/InitiativeCardDialog';
import { CreateStrategyDialog } from '@/lib/domain/strategies/ui/CreateStrategyDialog';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { Initiative, RadarItem } from '@/lib/types';
import type { CreateStrategyCommand } from "@/lib/domain/strategies/commands";
import { useToast } from "@/hooks/use-toast";
import styles from './page.module.css';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface KanbanPageProps {
    params: Promise<{ companyId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Team {
    id: string;
    name: string;
}

export default function KanbanPage({ params, searchParams }: KanbanPageProps) {
    const router = useRouter();
    const [boardData, setBoardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddInitiativeOpen, setIsAddInitiativeOpen] = useState(false);
    const [isCreateStrategyOpen, setCreateStrategyOpen] = useState(false);
    const [selectedInitiative, setSelectedInitiative] = useState<{ initiative: Initiative, strategyId: string, strategyName?: string, radarItems: RadarItem[], teamId: string } | null>(null);

    // Multi-team selection state
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [companyId, setCompanyId] = useState<string>('');

    const { toast } = useToast();
    const [activeType, setActiveType] = useState<'initiatives' | 'items'>('initiatives');

    // Initialization: Fetch teams, user, and parse params
    useEffect(() => {
        const init = async () => {
            try {
                const p = await params;
                const sParams = await searchParams;

                const urlCompanyId = p.companyId;
                const urlTeamId = sParams.teamId as string;
                const urlType = sParams.type as string;

                setCompanyId(urlCompanyId);

                let teamsUrl = '/api/teams';
                if (urlCompanyId) {
                    teamsUrl += `?companyId=${urlCompanyId}`;
                }

                const [teamsRes, userRes] = await Promise.all([
                    fetch(teamsUrl),
                    fetch('/api/user/me')
                ]);

                let teams = await teamsRes.json();

                // Filter teams by company if companyId is present (redundant if API does it, but safe)
                if (urlCompanyId) {
                    teams = teams.filter((t: any) => t.companyId === urlCompanyId);
                }

                setAvailableTeams(teams);

                if (urlType === 'items' || urlType === 'initiatives') {
                    setActiveType(urlType);
                } else {
                    setActiveType('initiatives');
                }

                let initialSelection: string[] = [];
                if (urlTeamId) {
                    initialSelection = urlTeamId.split(',');
                } else if (userRes.ok) {
                    const user = await userRes.json();
                    if (user.teamId) {
                        // Only select user's team if it belongs to the current company
                        const userTeam = teams.find((t: any) => t.id === user.teamId);
                        if (userTeam) {
                            initialSelection = [user.teamId];
                        }
                    }
                }

                setSelectedTeamIds(initialSelection);
                setIsInitialized(true);
            } catch (e) {
                console.error("Failed to initialize", e);
                setIsInitialized(true);
            }
        };
        init();
    }, [params, searchParams]);

    const fetchBoard = React.useCallback(async () => {
        if (!isInitialized || !companyId) return;

        setLoading(true);
        setError(null);
        try {
            const basePath = activeType === 'items' ? '/api/kanban/items' : '/api/kanban/initiatives';
            let apiUrl = `${basePath}?companyId=${companyId}`;

            const res = await fetch(apiUrl, { cache: 'no-store' });
            const payload = await res.json().catch(() => null);
            if (!res.ok) {
                const message = typeof payload?.error === 'string' ? payload.error : `Failed to load board (${res.status})`;
                throw new Error(message);
            }
            if (payload?.elements && Array.isArray(payload.elements)) {
                payload.elements = payload.elements.filter((element: any) => {
                    const normalizedStepKey = (element?.metadata?.stepKey || '')
                        .toString()
                        .toLowerCase()
                        .replace(/[^a-z]/g, '');
                    return normalizedStepKey !== 'diagnosis' && normalizedStepKey !== 'overallapproach';
                });
            }
            setBoardData(payload);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [activeType, isInitialized, companyId]);

    const applyTypeChange = React.useCallback((nextType: 'initiatives' | 'items') => {
        setActiveType(nextType);

        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        params.set('type', nextType);

        // We don't set companyId in query anymore as it is in path

        if (selectedTeamIds.length > 0) {
            params.set('teamId', selectedTeamIds.join(','));
        } else {
            params.delete('teamId');
        }

        const query = params.toString();
        const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
        router.replace(url, { scroll: false });
    }, [router, selectedTeamIds]);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    // Filter boardData based on selectedTeamIds
    const filteredBoardData = React.useMemo(() => {
        if (!boardData) return null;
        if (selectedTeamIds.length === 0) return boardData;

        const allowedTeamIds = new Set(selectedTeamIds);

        const filteredSwimlanes = boardData.swimlanes.filter((s: any) => s.teamId && allowedTeamIds.has(s.teamId));
        const filteredElements = boardData.elements.filter((e: any) => e.metadata?.teamId && allowedTeamIds.has(e.metadata.teamId));

        return {
            ...boardData,
            swimlanes: filteredSwimlanes,
            elements: filteredElements
        };
    }, [boardData, selectedTeamIds]);

    const handleTeamToggle = (teamId: string) => {
        setSelectedTeamIds(prev => {
            if (prev.includes(teamId)) {
                return prev.filter(id => id !== teamId);
            } else {
                return [...prev, teamId];
            }
        });
    };

    const handleMoveElement = async (elementId: string, fromStatus: string, toStatus: string, elementType?: string) => {
        console.log('[PAGE] handleMoveElement called:', { elementId, fromStatus, toStatus });
        try {
            const res = await fetch(`/api/kanban/items/${elementId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromStatus,
                    toStatus,
                    boardId: 'unified-board',
                    elementType: elementType || (elementId.startsWith('initiative-') ? 'initiative' : 'initiative-item')
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error?.message || json.error || 'Failed to move element');
            }

            fetchBoard();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to move element');
            fetchBoard(); // Revert
        }
    };

    const handleCreateStrategy = async (description: string, timeframe: string, selectedTeamId?: string) => {
        setCreateStrategyOpen(false);

        const targetTeamId = selectedTeamId || selectedTeamIds[0];

        if (!targetTeamId) {
            toast({
                title: "Error",
                description: "Please select a team to create a strategy.",
                variant: "destructive",
            });
            return;
        }

        const command: CreateStrategyCommand = { description, timeframe };

        try {
            const response = await fetch(`/api/strategies?teamId=${encodeURIComponent(targetTeamId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(command),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to create strategy.`);
            }

            toast({
                title: "Success",
                description: "Strategy has been created.",
            });
            fetchBoard();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create strategy",
                variant: "destructive",
            });
        }
    };

    const handleInitiativeCreated = (initiative: Initiative, strategyId: string, radarItems: RadarItem[], createdTeamId: string) => {
        fetchBoard();
        setSelectedInitiative({ initiative, strategyId, radarItems, teamId: createdTeamId });
    };

    const handleElementClick = async (element: any) => {
        if (element.type === 'initiative') {
            const tId = element.metadata?.teamId;
            const initiativeId = element.metadata?.initiativeId;
            const metadataStrategyName = element.metadata?.strategyName;
            if (!tId || !initiativeId) return;

            try {
                const res = await fetch(`/api/teams/${tId}`);
                if (!res.ok) throw new Error("Failed to fetch team data");
                const data = await res.json();

                const radarItems = data.radar || [];
                let foundInitiative: Initiative | undefined;
                let foundStrategyId: string | undefined;
                let foundStrategyName: string | undefined;

                if (data.dashboard && data.dashboard.strategies) {
                    for (const s of data.dashboard.strategies) {
                        const init = s.initiatives?.find((i: Initiative) => i.id === initiativeId);
                        if (init) {
                            foundInitiative = init;
                            foundStrategyId = s.id;
                            foundStrategyName = s.name;
                            break;
                        }
                    }
                }

                if (foundInitiative && foundStrategyId) {
                    setSelectedInitiative({
                        initiative: foundInitiative,
                        strategyId: foundStrategyId,
                        strategyName: foundStrategyName || metadataStrategyName,
                        radarItems,
                        teamId: tId
                    });
                }
            } catch (err) {
                console.error("Failed to load initiative details", err);
                setError("Failed to load initiative details");
            }
        }
    };

    return (
        <div className={styles.pageContainer} data-type={activeType}>
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">Kanban Board - {companyId.replace('company-', '')}</h1>
                    <div className="flex gap-2 items-center">
                        {/* Team Selector */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-8 border-dashed">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Teams
                                    {selectedTeamIds.length > 0 && (
                                        <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                                            {selectedTeamIds.length}
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <ScrollArea className="h-72 p-4">
                                    <div className="space-y-4">
                                        <h4 className="font-medium leading-none">Filter Teams</h4>
                                        <div className="space-y-2">
                                            {availableTeams.map((team) => (
                                                <div key={team.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`team-${team.id}`}
                                                        checked={selectedTeamIds.includes(team.id)}
                                                        onCheckedChange={() => handleTeamToggle(team.id)}
                                                    />
                                                    <Label htmlFor={`team-${team.id}`} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {team.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        {activeType === 'initiatives' && (
                            <Button
                                onClick={() => setCreateStrategyOpen(true)}
                                className={styles.addInitiativeButton}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Strategy
                            </Button>
                        )}
                        {activeType === 'initiatives' && (
                            <Button onClick={() => setIsAddInitiativeOpen(true)} className={styles.addInitiativeButton}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Initiative
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex gap-4 mb-4">
                    <Button
                        variant={activeType === 'initiatives' ? 'default' : 'secondary'}
                        onClick={() => applyTypeChange('initiatives')}
                    >
                        Initiatives
                    </Button>
                    <Button
                        variant={activeType === 'items' ? 'default' : 'secondary'}
                        onClick={() => applyTypeChange('items')}
                    >
                        Initiative Items
                    </Button>
                </div>
            </div>
            <div className="kanban-container">
                {loading && <div>Loading...</div>}
                {error && <div style={{ color: 'red' }}>{error}</div>}
                {filteredBoardData && (
                    <KanbanBoard
                        data={filteredBoardData}
                        onMoveElement={(elementId, fromStatus, toStatus) => {
                            const element = filteredBoardData?.elements?.find((el: any) => el.id === elementId);
                            const elementType = element?.type;
                            return handleMoveElement(elementId, fromStatus, toStatus, elementType);
                        }}
                        onElementClick={handleElementClick}
                    />
                )}
            </div>

            {activeType === 'initiatives' && (
                <AddInitiativeDialog
                    isOpen={isAddInitiativeOpen}
                    onOpenChange={setIsAddInitiativeOpen}
                    teamId={selectedTeamIds[0] || undefined}
                    onInitiativeCreated={handleInitiativeCreated}
                />
            )}

            {selectedInitiative && (
                <InitiativeCardDialog
                    isOpen={!!selectedInitiative}
                    onOpenChange={(open) => !open && setSelectedInitiative(null)}
                    initiative={selectedInitiative.initiative}
                    radarItems={selectedInitiative.radarItems}
                    orgId={selectedInitiative.teamId}
                    strategyId={selectedInitiative.strategyId}
                    strategyName={selectedInitiative.strategyName}
                    onUpdate={fetchBoard}
                />
            )}

            <CreateStrategyDialog
                isOpen={isCreateStrategyOpen}
                onOpenChange={setCreateStrategyOpen}
                onCreate={handleCreateStrategy}
                teamId={selectedTeamIds[0] || undefined}
            />
        </div>
    );
}
