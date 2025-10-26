
"use client";

import Link from "next/link";
import type { Organization, OrgNode } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "./ui/button";

interface OrgNodeViewProps {
  node: OrgNode;
  orgId: string;
  isLast: boolean;
}

function OrgNodeView({ node, orgId, isLast }: OrgNodeViewProps) {
  return (
    <div className="relative pl-8">
      {/* Horizontal connector */}
      <div className="absolute left-0 top-9 w-8 h-px bg-border"></div>
      {/* Vertical connector */}
      {!isLast && <div className="absolute left-0 top-9 w-px h-full bg-border"></div>}
      
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
              <div>
                  <CardTitle>{node.title}</CardTitle>
                  <CardDescription>Level {node.level}</CardDescription>
              </div>
              <Link href={`/organization/${orgId}/${node.id}`}>
                  <Button variant="outline">View Strategy Stream</Button>
              </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{node.description}</p>
        </CardContent>
      </Card>
      
      {node.children && node.children.length > 0 && (
        <div className="mt-4 space-y-4">
          {node.children.map((child, index) => (
            <OrgNodeView 
              key={child.id} 
              node={child} 
              orgId={orgId} 
              isLast={index === node.children.length - 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}


interface OrganizationViewProps {
  organization: Organization;
}

export function OrganizationView({ organization }: OrganizationViewProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-2">{organization.name}</h1>
      <p className="text-muted-foreground mb-6">Organizational Structure</p>
      
      <div className="space-y-4">
        {organization.structure.map((node, index) => (
          <div key={node.id} className="relative">
            {/* Top-level vertical connector */}
            {organization.structure.length > 1 && index < organization.structure.length - 1 &&
              <div className="absolute left-4 top-14 w-px h-full bg-border -translate-x-1/2"></div>
            }
             <Card className="mb-4">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{node.title}</CardTitle>
                        <CardDescription>Level {node.level}</CardDescription>
                    </div>
                    <Link href={`/organization/${organization.id}/${node.id}`}>
                        <Button variant="outline">View Strategy Stream</Button>
                    </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{node.description}</p>
              </CardContent>
            </Card>

            {node.children && node.children.length > 0 && (
              <div className="pl-8 mt-4">
                {node.children.map((child, childIndex) => (
                  <OrgNodeView 
                    key={child.id} 
                    node={child} 
                    orgId={organization.id}
                    isLast={childIndex === node.children.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
