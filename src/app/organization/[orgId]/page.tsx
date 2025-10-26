import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { initialOrganizations } from "@/lib/data";
import type { Organization } from "@/lib/types";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { OrganizationClientPage } from "./client-page";

// This is now a Server Component
export default function OrganizationStrategyPage({ params }: { params: { orgId: string } }) {
  const { orgId } = params;

  // In a real app, you would fetch this data from a database on the server.
  // For this example, we'll simulate it by accessing our initial data.
  // Note: We can't use localStorage on the server. This page will now
  // only work with the initial default data. A proper database is needed for persistence.
  const organization = initialOrganizations.find(o => o.id === orgId);

  if (!organization) {
    // If the org isn't in our "database", show a 404.
    notFound();
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <div className="mb-6">
          <Link href="/organizations">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
        </div>
        {/* We pass the server-fetched data to the Client Component */}
        <OrganizationClientPage initialOrganization={organization} />
      </main>
    </div>
  );
}
