
"use client";

import { User, LogOut, Settings } from "lucide-react";
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StradarLogo } from "./icons";

interface AppHeaderProps {
    companyName?: string;
}

export function AppHeader({ companyName }: AppHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Defer company detection until after mount to avoid hydration mismatches
  const [companyId, setCompanyId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const companyMatch = (pathname || '').match(/\/company\/([^\/]+)/);
      const companyIdFromPath = companyMatch ? companyMatch[1] : null;
      const companyIdFromQuery = searchParams?.get('companyId') || null;
      setCompanyId(companyIdFromPath || companyIdFromQuery);
    } catch (err) {
      setCompanyId(null);
    }
  }, [pathname, searchParams]);

  const hasCompany = !!companyId;
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
            <StradarLogo className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-headline font-semibold hidden sm:block">Stradar</h1>
        </Link>
        {companyName && (
            <div className="flex items-center gap-2">
                <div className="w-[1px] h-6 bg-border"></div>
                <h2 className="text-xl font-semibold text-foreground">{companyName}</h2>
            </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <nav className="hidden sm:flex items-center gap-2 mr-2">
          <Link href="/" className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground">Companies</Link>
          <Link
            href={hasCompany ? `/company/${companyId}/teams` : `/teams`}
            className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            Teams
          </Link>
          <Link
            href={hasCompany ? `/strategic-view?companyId=${companyId}` : `/strategic-view`}
            className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            Strategic View
          </Link>
          <Link
            href={hasCompany ? `/horizon?companyId=${companyId}` : `/horizon`}
            className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            Horizon
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground">
                Kanban ▼
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href={hasCompany ? `/kanban?companyId=${companyId}` : `/kanban`}>
                  Teams Initiatives
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/monitoring?view=kanban">
                  Initiative Actions and Objectives
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/monitoring" className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground">Monitoring</Link>
        </nav>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">User</p>
              <p className="text-xs leading-none text-muted-foreground">
                user@example.com
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
