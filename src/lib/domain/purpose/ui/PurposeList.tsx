"use client";

import React from 'react';
import type { PurposeRow } from '@/lib/domain/purpose/projection';

type Props = {
  teams: PurposeRow[];
  selectedTeamId?: string | null;
};

export default function PurposeList({ teams, selectedTeamId }: Props) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Purpose — Teams (read-only)</h1>
      <p style={{ marginTop: 8, color: '#555' }}>This page renders the purpose projection in read-only mode.</p>

      <div style={{ marginTop: 16 }}>
        {teams.length === 0 ? (
          <div style={{ color: '#888' }}>No teams found.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {teams.map(t => (
              <li
                key={t.id}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #e6e6e6',
                  borderRadius: 6,
                  marginBottom: 8,
                  background: t.id === selectedTeamId ? '#f0f9ff' : '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ color: '#666', marginTop: 6 }}>{t.purpose || <em>No purpose set</em>}</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 120 }}>
                    <div style={{ color: '#888' }}>Level</div>
                    <div style={{ fontWeight: 700, marginTop: 4 }}>{typeof t.level === 'number' ? t.level : '—'}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
