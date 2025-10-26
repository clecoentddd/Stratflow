import { AppHeader } from "@/components/header";
import { Dashboard } from "@/components/dashboard";
import { initialOrganizations } from "@/lib/data";
import type { OrgNode } from "@/lib/types";
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function findNodeById(nodes: OrgNode[], nodeId: string): OrgNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    const found = findNodeById(node.children, nodeId);
    if (found) {
      return found;
    }
  }
  return null;
}

export default function NodeStrategyPage({ params }: { params: { orgId: string, nodeId: string } }) {
  const organization = initialOrganizations.find(org => org.id === params.orgId);
  if (!organization) {
    notFound();
  }

  const node = findNodeById(organization.structure, params.nodeId);
  if (!node) {
    notFound();
  }
  
  const streamName = `${node.title} - ${node.stream.name}`;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <div className="mb-6">
          <Link href={`/organization/${organization.id}`}>
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to {organization.name}
            </Button>
          </Link>
        </div>
        <Dashboard stream={node.stream} streamName={streamName} />
      </main>
    </div>
  );
}
