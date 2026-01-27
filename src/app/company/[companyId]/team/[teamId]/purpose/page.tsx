import React from 'react';
import PurposeDetail from '@/lib/domain/purpose/ui/PurposeDetail';
import { getTeamByIdProjection } from '@/lib/db/projections';

export const revalidate = 0;

type Props = { params: { teamId: string } | Promise<{ teamId: string }>; searchParams?: { companyId?: string } | Promise<{ companyId?: string }> };

export default async function Page({ params }: Props) {
  const p = (await params) as { teamId: string } | undefined;
  const teamId = p?.teamId;
  if (!teamId) {
    return (
      <main style={{ padding: 24 }}>
        <h1>No team selected</h1>
        <p>Missing team id.</p>
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

  return <PurposeDetail team={team} step={'purpose'} />;
}
