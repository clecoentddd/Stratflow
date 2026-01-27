import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ teamId: string; companyId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function KanbanPage({ params }: Props) {
  const { teamId, companyId } = await params;

  if (companyId) {
    redirect(`/company/${companyId}/kanban?teamId=${teamId}`);
  } else {
    // Fallback: This path is deprecated, but if no companyId, we can't route to /company/...
    // Ideally we should fetch companyId for the team, but for now let's error or allow legacy if it exists.
    // Since we delete unified-kanban, this will 404 if we don't fix it.
    // However, without async DB call here we can't know companyId.
    // For now, let's redirect to a 'select company' or home?
    // Actually, let's try to redirect to /teams which might handle it?
    // Better: redirect to root with teamId param? 
    // Let's assume companyId is available or we redirect to home.
    redirect(`/?teamId=${teamId}&error=missing_company`);
  }


}
