
"use client";

import { User, LogOut, Settings, Download } from "lucide-react";
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
  const [user, setUser] = useState<{ userId: string; companyId?: string; teamIds?: string[] } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [allUsers, setAllUsers] = useState<{ userId: string; username?: string }[]>([]);

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

  useEffect(() => {
    fetch('/api/user/me')
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (data) setUser(data);
      })
      .catch(err => console.error("Failed to fetch user", err))
      .finally(() => setIsLoadingUser(false));

    // Fetch all users for switching
    fetch('/api/users/projection')
      .then(res => res.ok ? res.json() : [])
      .then(data => setAllUsers(data))
      .catch(err => console.error("Failed to fetch users", err));
  }, []);

  const applyTheme = (themeName: string) => {
    const root = document.documentElement;
    // Remove all theme classes first
    root.classList.remove('theme-pro', 'theme-rose', 'theme-amber', 'theme-slate');
    root.classList.add(themeName);
    localStorage.setItem('app-theme', themeName);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'theme-pro';
    applyTheme(savedTheme);
  }, []);

  const handleSwitchUser = async (userId: string) => {
    await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    window.location.reload();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  const effectiveCompanyId = companyId || user?.companyId;

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <StradarLogo size={32} />
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
          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-2 h-8 text-xs font-medium text-muted-foreground hover:text-primary">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                Theme
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => applyTheme('theme-pro')}>
                Pro Indigo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyTheme('theme-rose')}>
                Rose Stone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyTheme('theme-amber')}>
                Amber Zinc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyTheme('theme-slate')}>
                Slate Grey
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/" className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground">Companies</Link>
          {effectiveCompanyId && (
            <>
              {user?.teamIds && user.teamIds.length > 0 && (
                <Link
                  href={`/company/${effectiveCompanyId}/team/${user.teamIds[0]}/purpose`}
                  className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  My Team
                </Link>
              )}
              <Link
                href={`/company/${effectiveCompanyId}/teams`}
                className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                Teams
              </Link>
              <Link
                href={`/company/${effectiveCompanyId}/strategic-view`}
                className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                Strategic View
              </Link>
              <Link
                href={`/horizon?companyId=${effectiveCompanyId}`}
                className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                Horizon
              </Link>
              <Link
                href={`/company/${effectiveCompanyId}/kanban?type=initiatives`}
                className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                Kanban
              </Link>
              <Link href="/monitoring" className="text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground">Monitoring</Link>
            </>
          )}
        </nav>
        <Button
          variant="ghost"
          size="icon"
          title="Export Events"
          onClick={() => window.open('/api/admin/export-events', '_blank')}
        >
          <Download className="h-5 w-5" />
        </Button>
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
                <span className="text-sm font-medium leading-none">User</span>
                <span className="text-xs leading-none text-muted-foreground">
                  {isLoadingUser ? 'Loading...' : (user?.userId || 'Error: No user found')}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Dev: Switch Identity</DropdownMenuLabel>
            {allUsers.map(u => (
              <DropdownMenuItem key={u.userId} onClick={() => handleSwitchUser(u.userId)}>
                <span>{u.username || u.userId}</span>
                {u.userId === user?.userId && <span className="ml-auto text-xs text-muted-foreground">(Current)</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
