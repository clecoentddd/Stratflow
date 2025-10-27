
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, RotateCcw } from "lucide-react";
import { initialOrganizations as defaultOrgs } from "@/lib/data";
import type { Organization } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isCreateOrgOpen, setCreateOrgOpen] = useState(false);

  useEffect(() => {
    const storedOrgs = localStorage.getItem("organizations");
    if (storedOrgs) {
      try {
        setOrganizations(JSON.parse(storedOrgs));
      } catch (error) {
        console.error("Failed to parse organizations from localStorage", error);
        setOrganizations(defaultOrgs);
      }
    } else {
      setOrganizations(defaultOrgs);
    }
  }, []);

  useEffect(() => {
    // Only set localStorage if organizations have been loaded
    if (organizations.length > 0) {
      localStorage.setItem("organizations", JSON.stringify(organizations));
    }
  }, [organizations]);

  const handleCreateOrganization = (name: string, purpose: string, context: string, level: number) => {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      purpose,
      context,
      level,
      stream: {
        id: `stream-${Date.now()}`,
        name: `${name} Strategy Stream`,
        strategies: [],
      },
      radar: [],
    };
    setOrganizations(prev => [...prev, newOrg]);
  };
  
  const handleResetData = () => {
    localStorage.removeItem("organizations");
    window.location.reload();
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

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-headline">Organizations</h1>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all application data to its original state, deleting any changes you've made.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                                <Card key={org.id} className="hover:shadow-lg transition-shadow flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{org.name}</CardTitle>
                                        <CardDescription>{org.purpose}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-sm text-muted-foreground mb-4">{org.context}</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Link href={`/organization/${org.id}`} asChild>
                                                <Button>View Strategy Stream</Button>
                                            </Link>
                                            <Link href={`/organization/${org.id}/radar`} asChild>
                                                <Button variant="secondary">View Radar</Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-medium text-muted-foreground">No organizations yet.</h3>
                    <p className="text-muted-foreground mt-2">Get started by creating a new organization.</p>
                </div>
            )}
        </div>
      </main>      <CreateOrganizationDialog 
        isOpen={isCreateOrgOpen}
        onOpenChange={setCreateOrgOpen}
        onCreate={handleCreateOrganization}
      />
    </div>
  );
}
