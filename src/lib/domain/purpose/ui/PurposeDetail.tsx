"use client";

import React from 'react';
import type { Team } from '@/lib/types';
import TeamSteps from './TeamSteps';
import PurposeForm from './PurposeForm';

type Props = {
  team: Team;
  step: 'purpose' | 'radar' | 'dashboard';
};

export default function PurposeDetail({ team, step }: Props) {
  const stepTitle = step === 'radar' ? 'Radar' : step === 'dashboard' ? 'Strategy' : 'Purpose';

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TeamSteps teamId={team.id} companyId={team.companyId} active={step} />
        </div>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="text-3xl font-bold font-headline">{team.name} - {stepTitle}</h1>
        </div>

        <div style={{ width: 160 }} />
      </div>

      <section style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8, padding: 16 }}>
        {step === 'purpose' && (
          <div>
            <PurposeForm team={team} onTeamUpdated={() => { /* no-op; page will revalidate on navigation or you can implement re-fetch */ }} />
          </div>
        )}

        {step === 'radar' && (
          <div>
            <h2 style={{ marginTop: 0 }}>Radar</h2>
            <p style={{ color: '#444' }}>Radar data and visualization will appear here (placeholder).</p>
          </div>
        )}

        {step === 'dashboard' && (
          <div>
            <h2 style={{ marginTop: 0 }}>Strategy Dashboard</h2>
            <p style={{ color: '#444' }}>Strategy dashboard content will appear here (placeholder).</p>
          </div>
        )}
      </section>
    </div>
  );
}
