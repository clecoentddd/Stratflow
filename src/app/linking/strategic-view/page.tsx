import { redirect } from 'next/navigation';

export default async function LegacyStrategicViewRedirect({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (typeof v === 'string' && v.length > 0) sp.set(k, v);
  });
  const qs = sp.toString();
  redirect(qs ? `/strategic-view?${qs}` : '/strategic-view');
}
