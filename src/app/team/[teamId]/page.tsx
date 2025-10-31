
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, Plus, Radar } from "lucide-react";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StrategyDashboard } from "@/lib/domain/strategies/ui";
import { useToast } from "@/hooks/use-toast";

export default function TeamStrategyPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateStrategyOpen, setCreateStrategyOpen] = useState(false);
  const { toast } = useToast();

  const fetchTeamData = useCallback(async (showLoading = true) => {
    if (!teamId) return;
    
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (response.status === 404) {
        notFound();
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch team data');
      }
      const data = await response.json();
      if (!data) {
        notFound();
        return;
      }
      setTeam(data);
    } catch (error) {
      console.error("Failed to fetch team from API", error);
      toast({ title: "Error", description: "Could not load team data.", variant: "destructive" });
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [teamId, toast]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
            <p>Loading Strategy Dashboard...</p>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
       <div className="flex flex-col min-h-screen">
        <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Team Not Found</h1>
                <p className="text-muted-foreground">The team you are looking for does not exist.</p>
                <Link href="/" className="mt-4 inline-block">
                    <Button>Back to Companies</Button>
                </Link>
            </div>
        </main>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                 <Link href={`/company/${team.companyId}/teams`}>
                    <Button variant="outline">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Teams
                    </Button>
                </Link>
                 <Link href={`/team/${teamId}/radar?companyId=${team?.companyId || ''}`}>
                    <Button
                      className="text-white bg-[#0c8] hover:bg-[#0a6] border-[#0c8] hover:border-[#0a6] transition-colors"
                    >
                        <Radar className="mr-2 h-4 w-4" />
                        View Radar
                    </Button>
                </Link>
            </div>
            <div className="flex-1 text-center">
                 <h1 className="text-3xl font-bold font-headline">{team.name} - Strategy</h1>
            </div>
            <div className="flex items-center gap-4">
                <Button 
                    onClick={() => setCreateStrategyOpen(true)}
                    className="bg-[#388cfa] hover:bg-[#2a7ae8] text-white"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Strategy
                </Button>
            </div>
        </div>
        <StrategyDashboard 
            initialDashboard={team.dashboard}
            radarItems={team.radar || []}
            orgId={teamId}
            onDataChange={() => fetchTeamData(false)}
            isCreateStrategyOpen={isCreateStrategyOpen}
            setCreateStrategyOpen={setCreateStrategyOpen}
        />
      </main>
    </div>
  );
}
