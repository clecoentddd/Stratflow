
"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import { CreateCompanyDialog } from "@/lib/domain/companies/ui/CreateCompanyDialog";
import type { Company } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WelcomePage() {
  const [isCreateCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Failed to fetch companies from API", error);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCompanyCreated = () => {
    fetchCompanies();
  };

  const handleCreateDemo = async () => {
    try {
      const res = await fetch('/api/dev/seed-demo', { method: 'POST' });
      if (!res.ok) throw new Error('Seed failed');
      await fetchCompanies();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <p>Loading...</p>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-6">
        {companies.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">Your Companies</h1>
                <Button onClick={() => setCreateCompanyOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Company
                </Button>
            </div>
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
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-bold font-headline tracking-tight">
                Welcome to Stradar
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                The ultimate tool for visualizing, planning, and executing your
                organizational strategy. Get started by creating your first company.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => setCreateCompanyOpen(true)}>
                  <Plus className="mr-2 h-5 w-5" />
                  Create Company
                </Button>
                <Button size="lg" variant="outline" onClick={handleCreateDemo}>
                  Create Demo Company
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <CreateCompanyDialog
        isOpen={isCreateCompanyOpen}
        onOpenChange={setCreateCompanyOpen}
        onCompanyCreated={handleCompanyCreated}
      />
    </div>
  );
}
