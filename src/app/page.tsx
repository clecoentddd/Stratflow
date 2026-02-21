
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
import styles from './page.module.css';

export default function WelcomePage() {
  const [isCreateCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [compRes, teamRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/teams')
      ]);

      if (!compRes.ok || !teamRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [compData, teamData] = await Promise.all([
        compRes.json(),
        teamRes.json()
      ]);

      setCompanies(compData);
      setTeams(teamData);
    } catch (error) {
      console.error("Failed to fetch data from API", error);
      setCompanies([]);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompanyCreated = () => {
    fetchData();
  };

  const handleCreateDemo = async () => {
    await fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Synchronizing Workspaces...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-mesh">
      <main className="flex-1">
        {companies.length > 0 ? (
          <div className="max-w-6xl mx-auto px-4 py-12 md:px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground">
                  Your Workspaces
                </h1>
                <p className="text-muted-foreground mt-2 font-medium">
                  Select an organization to access strategic radars and team boards.
                </p>
              </div>
            </div>

            <div className={styles.companyGrid}>
              {companies.map((company: any) => {
                return (
                  <Link
                    key={company.id}
                    href={`/company/${company.id}/teams`}
                    className={styles.companyCard}
                  >
                    <div className={styles.cardGradient} />
                    <div className={styles.cardHeader}>
                      <div className={styles.iconBox}>
                        {company.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate leading-tight tracking-tight">{company.name}</h3>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}

              <button
                onClick={(e) => {
                  e.preventDefault();
                  setCreateCompanyOpen(true);
                }}
                className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/30 rounded-xl hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="mt-4 font-bold text-sm text-muted-foreground group-hover:text-primary tracking-tight transition-colors">Create New Workspace</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.heroSection}>
            <div className="max-w-4xl mx-auto text-center px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Introducing Stradar v2.0
              </div>

              <h1 className={styles.heroTitle}>
                The Strategic Radar for <br />
                <span className="text-primary italic">Modern Organizations</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Visualize complexity, align your teams, and execute high-impact strategies
                with the ultimate organization dashboard. Built for precision.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
                <Button
                  size="lg"
                  onClick={() => setCreateCompanyOpen(true)}
                  className={styles.primaryButton + " scale-110"}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Get Started for Free
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={handleCreateDemo}
                  className="rounded-full px-8 text-muted-foreground hover:text-foreground hover:bg-white/50 backdrop-blur-sm"
                >
                  Explore Demo Workspace
                </Button>
              </div>

              <div className="mt-20 relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 rounded-full"></div>
                <div className="relative glass-card p-4 rounded-2xl border-white/50 shadow-2xl">
                  {/* Placeholder for a future dashboard preview image */}
                  <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-muted-foreground font-medium">
                    [ Dashboard Preview Image ]
                  </div>
                </div>
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
