import Link from "next/link";
import { initialOrganizations } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-headline">Organizations</h1>
          {/* Button to create new organization can be added here */}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initialOrganizations.map((org) => (
            <Link href={`/organizations/${org.id}`} key={org.id}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Click to view organization structure and strategy streams.
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
