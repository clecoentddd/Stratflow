
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { initialOrganizations as defaultOrgs } from "@/lib/data";
import type { Organization } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";

export default function Home() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isCreateOrgOpen, setCreateOrgOpen] = useState(false);

  useEffect(() => {
    // In a real app, you might fetch this from localStorage or a backend
    const storedOrgs = localStorage.getItem("organizations");
    if (storedOrgs) {
      setOrganizations(JSON.parse(storedOrgs));
    } else {
      setOrganizations(defaultOrgs);
    }
  }, []);

  useEffect(() => {
    // Persist to localStorage whenever organizations change
    if (organizations.length > 0) {
      localStorage.setItem("organizations", JSON.stringify(organizations));
    }
  }, [organizations]);


  const handleCreateOrganization = (name: string) => {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      structure: [], // Start with an empty structure
    };
    setOrganizations(prev => [...prev, newOrg]);
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
