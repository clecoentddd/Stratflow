
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Organization, OrgNode } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { AddNodeDialog } from "./add-node-dialog";
import { newInitiativeTemplate } from "@/lib/data";

interface OrgNodeViewProps {
  node: OrgNode;
  orgId: string;
  isLast: boolean;
  onAddNode: (parentId: string, title: string, description: string) => void;
}

function OrgNodeView({ node, orgId, isLast, onAddNode }: OrgNodeViewProps) {
  const [isAddNodeOpen, setAddNodeOpen] = useState(false);

  const handleAddNode = (title: string, description: string) => {
    onAddNode(node.id, title, description);
  };

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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAddNodeOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Sub-level
                </Button>
                <Link href={`/organization/${orgId}/${node.id}`}>
                    <Button>View Strategy Stream</Button>
                </Link>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{node.description}</p>
        </CardContent>
      </Card>
      
      {node.children && node.children.length > 0 && (
        <div className="mt-4">
          {node.children.map((child, index) => (
            <OrgNodeView 
              key={child.id} 
              node={child} 
              orgId={orgId} 
              isLast={index === node.children.length - 1}
              onAddNode={onAddNode}
            />
          ))}
        </div>
      )}
      <AddNodeDialog
        isOpen={isAddNodeOpen}
        onOpenChange={setAddNodeOpen}
        onCreate={handleAddNode}
        parentNodeName={node.title}
      />
    </div>
  );
}


interface OrganizationViewProps {
  organization: Organization;
  onUpdateOrganization: (org: Organization) => void;
}

export function OrganizationView({ organization, onUpdateOrganization }: OrganizationViewProps) {
  const [isAddNodeOpen, setAddNodeOpen] = useState(false);

  const findNodeAndAddChild = (nodes: OrgNode[], parentId: string, newNode: OrgNode): OrgNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        // Parent found, add new node to its children
        return {
          ...node,
          children: [...node.children, newNode],
        };
      }
      if (node.children && node.children.length > 0) {
        // Recursively search in children
        return {
          ...node,
          children: findNodeAndAddChild(node.children, parentId, newNode),
        };
      }
      return node; // No match, return node as is
    });
  };
  
  const findNodeLevel = (nodes: OrgNode[], nodeId: string): number => {
      for (const node of nodes) {
          if (node.id === nodeId) {
              return node.level;
          }
          if (node.children && node.children.length > 0) {
              const foundLevel = findNodeLevel(node.children, nodeId);
              if (foundLevel !== -1) {
                  return foundLevel;
              }
          }
      }
      return -1; // Indicates node not found
  };

  const handleAddNode = (parentId: string, title: string, description: string) => {
    // Deep clone the organization to ensure we trigger a state update
    const newOrg = JSON.parse(JSON.stringify(organization));

    let parentLevel = -1; // Default for root nodes
    if (parentId !== newOrg.id) {
        parentLevel = findNodeLevel(newOrg.structure, parentId);
    }
   
    const newNode: OrgNode = {
      id: `node-${Date.now()}`,
      title,
      description,
      level: parentLevel + 1, // Child level is parent level + 1
      children: [],
      stream: {
        id: `stream-${Date.now()}`,
        name: `${title} Strategy Stream`,
        strategies: [],
      },
    };

    if (parentId === newOrg.id) {
        // Add as a top-level (root) node
        newOrg.structure.push(newNode);
    } else {
        // Add as a child to an existing node
        newOrg.structure = findNodeAndAddChild(newOrg.structure, parentId, newNode);
    }

    // Pass the entire updated organization object up to the parent
    onUpdateOrganization(newOrg);
  };
  
  const handleAddRootNode = (title: string, description: string) => {
    // Use the organization's ID as the parentId for root nodes
    handleAddNode(organization.id, title, description);
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline mb-2">{organization.name}</h1>
            <p className="text-muted-foreground">Organizational Structure</p>
        </div>
        <Button onClick={() => setAddNodeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Top-Level Node
        </Button>
      </div>
      
      <div className="space-y-4">
        {organization.structure.length > 0 ? (
          organization.structure.map((node, index) => (
            <OrgNodeView 
              key={node.id} 
              node={node} 
              orgId={organization.id}
              isLast={index === organization.structure.length - 1}
              onAddNode={handleAddNode}
            />
          ))
        ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-medium text-muted-foreground">This organization has no structure yet.</h3>
                <p className="text-muted-foreground mt-2">Get started by adding a top-level node.</p>
            </div>
        )}
      </div>
       <AddNodeDialog
        isOpen={isAddNodeOpen}
        onOpenChange={setAddNodeOpen}
        onCreate={handleAddRootNode}
        parentNodeName={organization.name}
      />
    </div>
  );
}
