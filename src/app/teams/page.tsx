"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeamsRedirectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const user = await res.json();
          if (user.companyId) {
            router.replace(`/company/${user.companyId}/teams`);
            return;
          }
        }
        // If no user or no companyId, go to companies list
        router.replace("/companies");
      } catch (err) {
        console.error("Failed to fetch user for redirection", err);
        router.replace("/companies");
      }
    };

    redirect();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
