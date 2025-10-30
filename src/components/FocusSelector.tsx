"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function FocusSelector({
  options,
  selectedId,
  label = "Focus initiative",
}: {
  options: { id: string; label: string }[];
  selectedId?: string;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || undefined;
    const sp = new URLSearchParams(searchParams?.toString());
    if (id) sp.set("id", id);
    else sp.delete("id");
    router.replace(`${pathname}?${sp.toString()}`);
  };

  return (
    <div style={{ marginBottom: "1rem", display: "flex", gap: 8, alignItems: "center" }}>
      <label htmlFor="focus-id" style={{ fontSize: 14 }}>{label}</label>
      <select
        id="focus-id"
        name="id"
        value={selectedId ?? ""}
        onChange={onChange}
        style={{ border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: 6, minWidth: 300 }}
      >
        <option value="">All connected</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
