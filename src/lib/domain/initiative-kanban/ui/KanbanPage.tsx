"use client";
import React from "react";
import { KanbanBoard } from "./KanbanBoard";
import { notFound } from "next/navigation";

interface KanbanPageProps {
  params: { teamId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function KanbanPage({ params, searchParams }: KanbanPageProps) {
  // Next.js migration: params may be a Promise in future versions
  // Use React.use() to unwrap if needed
  // @ts-ignore
  const unwrappedParams = typeof params?.then === 'function' ? React.use(params) : params;
  const teamId = (unwrappedParams as { teamId?: string })?.teamId;
  if (!teamId) {
    notFound();
  }
  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 600, marginBottom: "1.5rem" }}>
        Team Kanban Board
      </h1>
      <KanbanBoard teamId={teamId} />
    </main>
  );
}
