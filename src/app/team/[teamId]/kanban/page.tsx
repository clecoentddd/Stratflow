import { redirect } from 'next/navigation';

type Props = {
  params: { teamId: string } | Promise<{ teamId: string }>;
  searchParams: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function KanbanPage({ params, searchParams }: Props) {
  const { teamId } = await params;
  const sp = await searchParams;
  const companyId = sp.companyId;
  
  let url = `/unified-kanban?teamId=${teamId}`;
  if (companyId) {
    url += `&companyId=${companyId}`;
  }
  
  redirect(url);
}
