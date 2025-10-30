
"use client";

import { User, LogOut, Settings } from "lucide-react";
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

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
import { StratFlowLogo } from "./icons";

interface AppHeaderProps {
    companyName?: string;
}

export function AppHeader({ companyName }: AppHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const companyMatch = pathname.match(/\/company\/([^\/]+)/);
  const companyIdFromPath = companyMatch ? companyMatch[1] : null;
  const companyIdFromQuery = searchParams?.get('companyId') || null;
  const companyId = companyIdFromPath || companyIdFromQuery;
  const hasCompany = !!companyId;
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
            <StratFlowLogo className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-headline font-semibold hidden sm:block">StratFlow</h1>
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
          {!hasCompany ? (
            <span className="text-sm px-2 py-1 rounded-md text-muted-foreground opacity-60 cursor-not-allowed select-none">Teams</span>
          ) : (
            <Link href={`/company/${companyId}/teams`} className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground">Teams</Link>
          )}
          {!hasCompany ? (
            <span className="text-sm px-2 py-1 rounded-md text-muted-foreground opacity-60 cursor-not-allowed select-none">Strategic View</span>
          ) : (
            <Link href={`/strategic-view?companyId=${companyId}`} className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground">Strategic View</Link>
          )}
          {!hasCompany ? (
            <span className="text-sm px-2 py-1 rounded-md text-muted-foreground opacity-60 cursor-not-allowed select-none">Horizon</span>
          ) : (
            <Link href={`/horizon?companyId=${companyId}`} className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground">Horizon</Link>
          )}
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
