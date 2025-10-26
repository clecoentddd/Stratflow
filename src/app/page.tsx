
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { initialOrganizations as defaultOrgs } from "@/lib/data";
import type { Organization } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";

export default function Home() {
  const [organizations, setOrganizations] = useState<Organization[]>(defaultOrgs);
  const [isCreateOrgOpen, setCreateOrgOpen] = useState(false);

  const handleCreateOrganization = (name: string) => {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      structure: [
        {
          id: 'node-1',
          title: 'Board of Directors',
          description: 'Oversees the company\'s direction.',
          level: 0,
          stream: {
            id: 'stream-bod',
            name: 'Board-Level Strategic Goals',
            strategies: []
          },
          children: [
            {
              id: 'node-2',
              title: 'CEO',
              description: 'Chief Executive Officer',
              level: 1,
              stream: {
                id: 'stream-ceo',
                name: 'CEO Directives',
                strategies: []
              },
              children: []
            }
          ]
        }
      ]
    };
    setOrganizations(prev => [...prev, newOrg]);
    setCreateOrgOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-headline">Organizations</h1>
          <Button onClick={() => setCreateOrgOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link href={`/organization/${org.id}`} key={org.id}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Click to view organization structure and strategy streams.
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <CreateOrganizationDialog 
        isOpen={isCreateOrgOpen}
        onOpenChange={setCreateOrgOpen}
        onCreate={handleCreateOrganization}
      />
    </div>
  );
}
