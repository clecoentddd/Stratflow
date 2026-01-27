import { redirect } from 'next/navigation';

export default async function LinkingRootRedirect({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (typeof v === 'string' && v.length > 0) sp.set(k, v);
  });
  const companyId = sp.get('companyId');
  if (companyId) {
    sp.delete('companyId');
    const qs = sp.toString();
    redirect(`/company/${companyId}/strategic-view${qs ? `?${qs}` : ''}`);
  }
  const qs = sp.toString();
  redirect(qs ? `/strategic-view?${qs}` : '/strategic-view'); // Fallback for legacy calls? Or error?
}
