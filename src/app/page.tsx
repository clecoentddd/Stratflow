
"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import { CreateCompanyDialog } from "@/components/create-company-dialog";

export default function WelcomePage() {
  const [isCreateCompanyOpen, setCreateCompanyOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold font-headline tracking-tight">
            Welcome to StratFlow
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            The ultimate tool for visualizing, planning, and executing your
            organizational strategy. Turn your vision into actionable
            initiatives and track your progress with clarity.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setCreateCompanyOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Company
            </Button>
            <Link href="/organizations" asChild>
              <Button size="lg" variant="outline">
                Go to My Organizations
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <CreateCompanyDialog
        isOpen={isCreateCompanyOpen}
        onOpenChange={setCreateCompanyOpen}
      />
    </div>
  );
}
