import { initialOrganizations } from '@/lib/data';
import { AppHeader } from '@/components/header';
import { OrganizationView } from '@/components/organization-view';
import { Dashboard } from '@/components/dashboard';

export default function OrganizationPage({ params }: { params: { orgId: string } }) {
  const organization = initialOrganizations.find(org => org.id === params.orgId);

  if (!organization) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="p-4 md:p-6 flex-1 text-center">
          <h1 className="text-2xl font-bold">Organization not found</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <OrganizationView organization={organization} />
        <div className="mt-8">
            <Dashboard stream={organization.stream} />
        </div>
      </main>
    </div>
  );
}
