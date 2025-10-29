"use client";

import { Pencil, Trash2, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RadarItem } from "@/lib/types";
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface RadarItemCardProps {
  item: RadarItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function RadarItemCard({ item, onEdit, onDelete }: RadarItemCardProps) {
  const createdAt = item.created_at ? format(parseISO(item.created_at), "PPP") : 'N/A';
  const updatedAt = item.updated_at ? format(parseISO(item.updated_at), "PPP") : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{item.name}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={item.type === 'Threat' ? 'destructive' : 'default'}>{item.type}</Badge>
                    <Badge variant="secondary">{item.category}</Badge>
                    <Badge variant="secondary">{item.distance}</Badge>
                    <Badge variant="secondary">Impact: {item.impact}</Badge>
                    <Badge variant="secondary">Tolerance: {item.tolerance}</Badge>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold">What have you detected?</h4>
                <p className="text-sm text-muted-foreground">{item.detect}</p>
            </div>
            <div>
                <h4 className="font-semibold">What is your assessment?</h4>
                <p className="text-sm text-muted-foreground">{item.assess}</p>
            </div>
            <div>
                <h4 className="font-semibold">What decisions could you take?</h4>
                <p className="text-sm text-muted-foreground">{item.respond}</p>
            </div>
             {item.zoom_in && (
              <div className="pt-4 border-t">
                <Link href={item.zoom_in}>
                    <Button>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Linked Radar
                    </Button>
                </Link>
              </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
                {item.zoom_in && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href={item.zoom_in}>
                                    <Button variant="link" className="p-0 h-auto text-xs">
                                        Zoom In
                                        <ExternalLink className="ml-2 h-3 w-3" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Navigate to {item.zoom_in}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
             <div>
                <span>Created: {createdAt}</span>
                {updatedAt && <span className="ml-4"> | Updated: {updatedAt}</span>}
             </div>
      </CardFooter>
    </Card>
  );
}