
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Radar, TrendingUp, Building } from "lucide-react";
import type { Organization, Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import { EditOrganizationDialog } from "@/components/edit-organization-dialog";
import { notFound, useParams } from "next/navigation";

export default function OrganizationsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isCreateOrgOpen, setCreateOrgOpen] = useState(false);
  const [isEditOrgOpen, setEditOrgOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanyAndOrgs = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      // Fetch all companies to find the current one by ID
      const companiesRes = await fetch('/api/companies');
      if (!companiesRes.ok) throw new Error('Failed to fetch companies');
      const companies: Company[] = await companiesRes.json();
      const currentCompany = companies.find(c => c.id === companyId);
      
      if (!currentCompany) {
        notFound();
        return;
      }
      setCompany(currentCompany);

      // Fetch all organizations and filter by companyId
      const orgsRes = await fetch('/api/organizations');
      if (!orgsRes.ok) {
        throw new Error('Failed to fetch organizations');
      }
      const allOrgs: Organization[] = await orgsRes.json();
      const companyOrgs = allOrgs.filter(org => org.companyId === companyId);
      setOrganizations(companyOrgs);

    } catch (error) {
      console.error("Failed to fetch data from API", error);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompanyAndOrgs();
  }, [fetchCompanyAndOrgs]);

  const handleEditClick = (org: Organization) => {
    setEditingOrg(org);
    setEditOrgOpen(true);
  };

  const groupedOrganizations = useMemo(() => {
    const groups: { [key: number]: Organization[] } = {};
    organizations.forEach(org => {
      if (!groups[org.level]) {
        groups[org.level] = [];
      }
      groups[org.level].push(org);
    });
    return Object.entries(groups).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [organizations]);

  if (isLoading) {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader companyName={company?.name || 'Loading...'} />
            <main className="p-4 md:p-6 flex-1 flex items-center justify-center">
                <p>Loading Organizations...</p>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader companyName={company?.name} />
      <main className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-headline">Organizations</h1>
          <div className="flex items-center gap-2">
            <Link href="/">
                <Button variant="outline">
                    <Building className="mr-2 h-4 w-4" />
                    All Companies
                </Button>
            </Link>
            <Button onClick={() => setCreateOrgOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Organization
            </Button>
          </div>
        </div>
        <div className="space-y-8">
            {groupedOrganizations.length > 0 ? (
                groupedOrganizations.map(([level, orgs]) => (
                    <div key={level}>
                        <h2 className="text-2xl font-semibold font-headline mb-4 pb-2 border-b">
                            Level {level}
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {orgs.map((org) => (
                                <Card key={org.id} className="hover:shadow-lg transition-shadow flex flex-col bg-card">
                                    <CardHeader className="flex flex-row justify-between items-start">
                                        <div>
                                            <CardTitle>{org.name}</CardTitle>
                                            <CardDescription>{org.purpose}</CardDescription>
                                        </div>
                                        <div className="flex items-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(org)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Link href={`/organization/${org.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600">
                                                    <TrendingUp className="h-5 w-5" />
                                                </Button>
                                            </Link>
                                            <Link href={`/organization/${org.id}/radar`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                                                    <Radar className="h-5 w-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-sm text-muted-foreground">{org.context}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
                    <h3 className="text-xl font-medium text-muted-foreground">No organizations yet for {company?.name}.</h3>
                    <p className="text-muted-foreground mt-2">Get started by creating a new organization.</p>
                </div>
            )}
        </div>
      </main>
      <CreateOrganizationDialog 
        isOpen={isCreateOrgOpen}
        onOpenChange={setCreateOrgOpen}
        onOrganizationCreated={fetchCompanyAndOrgs}
        companyId={companyId}
      />
      {editingOrg && (
        <EditOrganizationDialog
            isOpen={isEditOrgOpen}
            onOpenChange={setEditOrgOpen}
            organization={editingOrg}
            onOrganizationUpdated={() => {
                setEditingOrg(null);
                fetchCompanyAndOrgs();
            }}
        />
      )}
    </div>
  );
}
