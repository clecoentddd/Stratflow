"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Team, Company } from '@/lib/types';
import TeamsList from './TeamsList';
import { CreateTeamDialog } from './CreateTeamDialog';
import { EditTeamDialog } from './EditTeamDialog';

type Props = {
  teams: Team[];
  company: Company;
};

export default function TeamsListWrapper({ teams, company }: Props) {
  const router = useRouter();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleCreate = () => setCreateOpen(true);
  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setEditOpen(true);
  };

  const refresh = () => router.refresh();

  return (
    <>
      <TeamsList
        teams={teams}
        company={company}
        isLoading={false}
        onCreateClick={handleCreate}
        onEditClick={handleEdit}
      />

      <CreateTeamDialog
        isOpen={isCreateOpen}
        onOpenChange={setCreateOpen}
        onTeamCreated={() => {
          setCreateOpen(false);
          refresh();
        }}
        companyId={company.id}
      />

      {editingTeam && (
        <EditTeamDialog
          isOpen={isEditOpen}
          onOpenChange={setEditOpen}
          team={editingTeam}
          onTeamUpdated={() => {
            setEditingTeam(null);
            setEditOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
