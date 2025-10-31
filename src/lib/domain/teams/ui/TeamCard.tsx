"use client";

import Link from "next/link";
import { Pencil, TrendingUp, Radar } from "lucide-react";
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
          >
            <Pencil className={styles.icon} />
          </button>
          <Link href={`/team/${team.id}/radar?companyId=${team.companyId}`}>
            <button className={styles.actionButton}>
              <Radar className={styles.icon} color="#0c8" />
            </button>
          </Link>
          <Link href={`/team/${team.id}?companyId=${team.companyId}`}>
            <button className={styles.actionButton}>
              <TrendingUp className={styles.icon} color="#2563eb" />
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
