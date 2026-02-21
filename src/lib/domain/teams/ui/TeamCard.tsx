"use client";

import Link from "next/link";
import { Compass, TrendingUp, Radar, SquareKanban } from "lucide-react";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import styles from "./TeamCard.module.css";

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
}

export function TeamCard({ team, onEdit }: TeamCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>{team.name}</h3>
          <p className={styles.cardDescription}>{team.purpose}</p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={() => onEdit(team)}
            aria-label="Edit team"
            title="Team purpose"
          >
            <Compass className={`${styles.icon} text-indigo-500`} />
          </button>
          <Button asChild variant="ghost" className={styles.actionButton}>
            <Link href={`/company/${team.companyId}/team/${team.id}/radar`}>
              <Radar className={`${styles.icon} text-success`} />
            </Link>
          </Button>
          <Button asChild variant="ghost" className={styles.actionButton}>
            <Link href={`/company/${team.companyId}/team/${team.id}/dashboard`}>
              <TrendingUp className={`${styles.icon} text-primary`} />
            </Link>
          </Button>
          <Button asChild variant="ghost" className={styles.actionButton}>
            <Link href={`/company/${team.companyId}/team/${team.id}/kanban`}>
              <SquareKanban className={`${styles.icon} text-warning`} />
            </Link>
          </Button>
        </div>
      </div>
      <div className={styles.cardContent}>
        <p className={styles.context}>{team.context}</p>
      </div>
    </div>
  );
}
