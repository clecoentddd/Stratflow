
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, Building } from "lucide-react";
import type { Team, Company } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateTeamDialog } from "@/lib/domain/teams/ui/CreateTeamDialog";
import { EditTeamDialog } from "@/lib/domain/teams/ui/EditTeamDialog";
import { notFound, useParams } from "next/navigation";
import { TeamCard } from "@/lib/domain/teams/ui/TeamCard";

export default function TeamsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [teams, setTeams] = useState<Team[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isCreateTeamOpen, setCreateTeamOpen] = useState(false);
  const [isEditTeamOpen, setEditTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanyAndTeams = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      // Fetch all companies to find the current one by ID
      const companiesRes = await fetch('/api/companies');
      if (!companiesRes.ok) throw new Error('Failed to fetch companies');
      const companies: Company[] = await companiesRes.json();
      const currentCompany = companies.find(c => c.id === companyId);
      
      if (!currentCompany) {
        notFound();
        return;
      }
      setCompany(currentCompany);

      // Fetch all teams and filter by companyId
      const teamsRes = await fetch('/api/teams');
      if (!teamsRes.ok) {
        throw new Error('Failed to fetch teams');
      }
      const allTeams: Team[] = await teamsRes.json();
      const companyTeams = allTeams.filter(org => org.companyId === companyId);
      setTeams(companyTeams);

    } catch (error) {
      console.error("Failed to fetch data from API", error);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompanyAndTeams();
  }, [fetchCompanyAndTeams]);

  const handleEditClick = (team: Team) => {
    setEditingTeam(team);
    setEditTeamOpen(true);
  };

  const groupedTeams = useMemo(() => {
    const groups: { [key: number]: Team[] } = {};
    teams.forEach(team => {
      if (!groups[team.level]) {
        groups[team.level] = [];
      }
      groups[team.level].push(team);
    });
    return Object.entries(groups).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [teams]);

  if (isLoading) {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
                <p>Loading Teams...</p>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-headline">{company?.name} · Teams</h1>
          <div className="flex items-center gap-2">
            <Link href="/">
                <Button variant="outline">
                    <Building className="mr-2 h-4 w-4" />
                    All Companies
                </Button>
            </Link>
            <Button onClick={() => setCreateTeamOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
          </div>
        </div>
        <div className="space-y-8">
            {groupedTeams.length > 0 ? (
                groupedTeams.map(([level, orgs]) => (
                    <div key={level}>
                        <h2 className="text-2xl font-semibold font-headline mb-4 pb-2 border-b">
                            Level {level}
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {orgs.map((team) => (
                                <TeamCard key={team.id} team={team} onEdit={handleEditClick} />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
                    <h3 className="text-xl font-medium text-muted-foreground">No teams yet for {company?.name}.</h3>
                    <p className="text-muted-foreground mt-2">Get started by creating a new team.</p>
                </div>
            )}
        </div>
      </main>
      <CreateTeamDialog 
        isOpen={isCreateTeamOpen}
        onOpenChange={setCreateTeamOpen}
        onTeamCreated={fetchCompanyAndTeams}
        companyId={companyId}
      />
      {editingTeam && (
        <EditTeamDialog
            isOpen={isEditTeamOpen}
            onOpenChange={setEditTeamOpen}
            team={editingTeam}
            onTeamUpdated={() => {
                setEditingTeam(null);
                fetchCompanyAndTeams();
            }}
        />
      )}
    </div>
  );
}
