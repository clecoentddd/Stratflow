
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
import styles from "@/lib/domain/companies/ui/company.module.css";

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
        <div className={styles.loadingContainer}>
            <main className={styles.loadingMain}>
                <p>Loading Teams...</p>
            </main>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>{company?.name} · Teams</h1>
          <div className={styles.headerActions}>
            <Button onClick={() => setCreateTeamOpen(true)}>
              <Plus className={styles.icon} />
              New Team
            </Button>
          </div>
        </div>
        <div className={styles.teamsContainer}>
            {groupedTeams.length > 0 ? (
                groupedTeams.map(([level, orgs]) => (
                    <div key={level} className={styles.levelSection}>
                        <h2 className={styles.levelTitle}>
                            Level {level}
                        </h2>
                        <div className={styles.teamsGrid}>
                            {orgs.map((team) => (
                                <TeamCard key={team.id} team={team} onEdit={handleEditClick} />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                 <div className={styles.emptyState}>
                    <h3 className={styles.emptyStateTitle}>No teams yet for {company?.name}.</h3>
                    <p className={styles.emptyStateText}>Get started by creating a new team.</p>
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
