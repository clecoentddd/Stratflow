"use client";

import Link from "next/link";
import { Compass, TrendingUp, Radar } from "lucide-react";
import type { Team } from "@/lib/types";
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
            <Compass className={styles.icon} color="#9B51E0" />
          </button>
          <Link href={`/team/${team.id}/radar?companyId=${team.companyId}`}>
            <button className={styles.actionButton}>
              <Radar className={styles.icon} color="#00cc88" />
            </button>
          </Link>
          <Link href={`/team/${team.id}/dashboard?companyId=${team.companyId}`}>
            <button className={styles.actionButton}>
              <TrendingUp className={styles.icon} color="#388cfa" />
            </button>
          </Link>
        </div>
      </div>
      <div className={styles.cardContent}>
        <p className={styles.context}>{team.context}</p>
      </div>
    </div>
  );
}
