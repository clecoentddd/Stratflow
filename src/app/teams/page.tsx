"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Company } from "@/lib/types";
import { Plus, ArrowRight } from "lucide-react";
import { CreateCompanyDialog } from "@/lib/domain/companies/ui/CreateCompanyDialog";

export default function TeamsHubPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateCompanyOpen, setCreateCompanyOpen] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/companies");
      const data = res.ok ? await res.json() : [];
      setCompanies(data);
    } catch {
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold font-headline">Select a company · Teams</h1>
            <Button onClick={() => setCreateCompanyOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Company
            </Button>
          </div>

          {isLoading ? (
            <p>Loading companies...</p>
          ) : companies.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
              <h3 className="text-xl font-medium text-muted-foreground">No companies yet.</h3>
              <p className="text-muted-foreground mt-2">Create a company to manage teams.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <Card key={company.id}>
                  <CardHeader>
                    <CardTitle>{company.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/company/${company.id}/teams`}>
                      <Button>
                        View Teams <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <CreateCompanyDialog
        isOpen={isCreateCompanyOpen}
        onOpenChange={setCreateCompanyOpen}
        onCompanyCreated={fetchCompanies}
      />
    </div>
  );
}
