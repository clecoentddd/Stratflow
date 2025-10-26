"use client";

import type { Organization, OrgNode } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface OrgNodeViewProps {
  node: OrgNode;
}

function OrgNodeView({ node }: OrgNodeViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{node.title}</CardTitle>
        <CardDescription>Level {node.level}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{node.description}</p>
        {node.children && node.children.length > 0 && (
          <div className="mt-4 pl-6 border-l-2 border-border space-y-4">
            {node.children.map((child) => (
              <OrgNodeView key={child.id} node={child} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
        {organization.structure.map((node) => (
          <OrgNodeView key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
