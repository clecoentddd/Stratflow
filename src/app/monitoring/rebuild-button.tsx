"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function RebuildButton() {
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dev/rebuild-projections', { method: 'POST' });
      // ignore body
    } catch {}
    setLoading(false);
    startTransition(() => router.refresh());
  };

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={loading || pending}>
      {loading || pending ? 'Rebuilding…' : 'Rebuild Projections'}
    </Button>
  );
}
