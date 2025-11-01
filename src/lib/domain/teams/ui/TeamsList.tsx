"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Team, Company } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { TeamCard } from "@/lib/domain/teams/ui/TeamCard";
import styles from "@/lib/domain/companies/ui/company.module.css";

type TeamsListProps = {
  teams: Team[];
  company: Company | null;
  isLoading: boolean;
  onCreateClick: () => void;
  onEditClick: (team: Team) => void;
};

export default function TeamsList({ teams, company, isLoading, onCreateClick, onEditClick }: TeamsListProps) {
  const groupedTeams = useMemo(() => {
    const groups: { [key: number]: Team[] } = {};
    teams.forEach((team) => {
      if (!groups[team.level]) groups[team.level] = [];
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
            <Button onClick={onCreateClick}>
              <Plus className={styles.icon} />
              New Team
            </Button>
          </div>
        </div>
        <div className={styles.teamsContainer}>
          {groupedTeams.length > 0 ? (
            groupedTeams.map(([level, orgs]) => (
              <div key={level} className={styles.levelSection}>
                <h2 className={styles.levelTitle}>Level {level}</h2>
                <div className={styles.teamsGrid}>
                  {orgs.map((team) => (
                    <TeamCard key={team.id} team={team} onEdit={onEditClick} />
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
    </div>
  );
}
