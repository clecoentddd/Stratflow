import { notFound } from 'next/navigation';
import type { Team, Company } from '@/lib/types';
import TeamsListWrapper from '@/lib/domain/teams/ui/TeamsListWrapper';
import { fetchCompanies } from '@/lib/domain/companies/getCompanies';
import { getTeamsProjection } from '@/lib/domain/teams/projection';

type Props = {
  params: { companyId: string } | Promise<{ companyId: string }>;
};

export default async function TeamsPage({ params }: Props) {
  const { companyId } = await params;

  // --- Use shared helper directly, no HTTP fetch ---
  const companies = await fetchCompanies();
  const company = companies.find((c) => c.id === companyId);
  if (!company) return notFound();

  // --- Teams from DB directly ---
  const teams = await getTeamsProjection();
  const companyTeams = teams.filter((t) => t.companyId === companyId);

  return <TeamsListWrapper teams={companyTeams} company={company} />;
}
