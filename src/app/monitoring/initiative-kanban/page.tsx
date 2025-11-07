"use client";
import React, { useState } from "react";
import { getKanbanBoardForTeam, emptyKanbanProjection, rebuildKanbanProjection } from "@/lib/domain/initiative-kanban/projection";

export default function KanbanMonitoringPage() {
  const [teamId, setTeamId] = useState("");
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleQuery = () => {
    setBoard(getKanbanBoardForTeam(teamId));
  };

  const handleEmpty = () => {
    emptyKanbanProjection();
    setBoard([]);
  };

  const handleRebuild = () => {
    setLoading(true);
    rebuildKanbanProjection();
    setTimeout(() => {
      setBoard(getKanbanBoardForTeam(teamId));
      setLoading(false);
    }, 500); // Wait for rebuild
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Kanban Projection Monitoring</h1>
      <div style={{ margin: "16px 0" }}>
        <input
          type="text"
          placeholder="Team ID"
          value={teamId}
          onChange={e => setTeamId(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={handleQuery}>Query</button>
        <button onClick={handleEmpty} style={{ marginLeft: 8 }}>Empty</button>
        <button onClick={handleRebuild} style={{ marginLeft: 8 }}>Rebuild</button>
      </div>
      {loading && <div>Rebuilding projection...</div>}
      <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 4 }}>
        {JSON.stringify(board, null, 2)}
      </pre>
    </main>
  );
}
