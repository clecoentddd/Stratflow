
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

interface RadarItemCardProps {
  item: RadarItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function RadarItemCard({ item, onEdit, onDelete }: RadarItemCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{item.title}</CardTitle>
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
                <p className="text-sm text-muted-foreground">{item.detection}</p>
            </div>
            <div>
                <h4 className="font-semibold">What is your assessment?</h4>
                <p className="text-sm text-muted-foreground">{item.assessment}</p>
            </div>
            <div>
                <h4 className="font-semibold">What decisions could you take?</h4>
                <p className="text-sm text-muted-foreground">{item.decision}</p>
            </div>
        </div>
      </CardContent>
      {item.zoomInLink && (
        <CardFooter>
            <Link href={item.zoomInLink} target="_blank" rel="noopener noreferrer">
                <Button variant="link" className="p-0 h-auto">
                    Zoom In
                    <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
            </Link>
        </CardFooter>
      )}
    </Card>
  );
}
