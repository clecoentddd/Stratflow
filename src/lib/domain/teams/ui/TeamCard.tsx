"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pencil, TrendingUp, Radar } from "lucide-react";
import type { Team } from "@/lib/types";

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
}

export function TeamCard({ team, onEdit }: TeamCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col bg-card">
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle>{team.name}</CardTitle>
          <CardDescription>{team.purpose}</CardDescription>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(team)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Link href={`/team/${team.id}?companyId=${team.companyId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 group">
              <TrendingUp className="h-5 w-5 text-blue-600 group-hover:text-blue-600" />
            </Button>
          </Link>
          <Link href={`/team/${team.id}/radar?companyId=${team.companyId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 group">
              <Radar className="h-5 w-5 text-amber-600 group-hover:text-red-600" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{team.context}</p>
      </CardContent>
    </Card>
  );
}
