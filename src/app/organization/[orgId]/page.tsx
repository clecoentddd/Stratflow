
import { initialOrganizations } from '@/lib/data';
import { AppHeader } from '@/components/header';
import { OrganizationView } from '@/components/organization-view';
import { notFound } from 'next/navigation';

export default function OrganizationPage({ params }: { params: { orgId: string } }) {
  const organization = initialOrganizations.find(org => org.id === params.orgId);

  if (!organization) {
    // This is a temporary solution. In a real app, you would fetch this data
    // or handle the "not found" case more robustly.
    const tempOrg = { id: params.orgId, name: "New Organization", structure: [] };
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="p-4 md:p-6 flex-1">
          <OrganizationView organization={tempOrg} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <OrganizationView organization={organization} />
      </main>
    </div>
  );
}
