import React from 'react';
import PurposeDetail from '@/lib/domain/purpose/ui/PurposeDetail';
import { getTeamByIdProjection, getTeamsProjection } from '@/lib/db/projections';

export const revalidate = 0; // always server-render during dev

type Props = { searchParams?: { teamId?: string; step?: string; companyId?: string } };

export default async function Page({ searchParams }: Props) {
  // `searchParams` can be a Promise in some Next.js configurations; await it
  // so the code works whether it's synchronous or async.
  const sp = (await searchParams) as { teamId?: string; step?: string; companyId?: string } | undefined;
  let teamId = sp?.teamId;
  const companyId = sp?.companyId;
  // If no specific teamId provided but a companyId is present, pick the first
  // team for that company so /purpose?companyId=... behaves like the canonical
  // team purpose view for that company (useful for header links).
  if (!teamId && companyId) {
    const teams = await getTeamsProjection();
    const t = teams.find(t => t.companyId === companyId);
    if (t) teamId = t.id;
  }
  if (!teamId) {
    return (
      <main style={{ padding: 24 }}>
        <h1>No team selected</h1>
        <p>Select a team from the Teams page to view purpose, radar, or dashboard.</p>
      </main>
    );
  }

  const team = await getTeamByIdProjection(teamId);
  if (!team) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Team not found</h1>
        <p>The team id <strong>{teamId}</strong> does not exist in the projection.</p>
      </main>
    );
  }

  const stepParam = sp?.step;
  const step = stepParam === 'radar' ? 'radar' : stepParam === 'dashboard' ? 'dashboard' : 'purpose';

  return <PurposeDetail team={team} step={step} />;
}
