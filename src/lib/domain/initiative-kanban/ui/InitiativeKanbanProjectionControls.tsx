"use client";

import { ProjectionControls } from "@/components/ui/projection-controls";
import { useEffect, useState } from "react";
import styles from "@/lib/domain/monitoring/styles/monitoring.module.css";


interface InitiativeKanbanProjectionControlsProps {
  currentView: string;
  renderTableBelowHeading?: boolean;
}


export function InitiativeKanbanProjectionControls({ currentView, renderTableBelowHeading }: InitiativeKanbanProjectionControlsProps) {
  const [kanban, setKanban] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKanban = () => {
    setLoading(true);
    setError(null);
    fetch("/api/initiative-kanban-status-mapped-projection/projection")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch Kanban board");
        return res.json();
      })
      .then(setKanban)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (currentView !== "kanban") return;
    fetchKanban();
  }, [currentView]);

  return (
    <div>
      <ProjectionControls
        domainName="Initiative Kanban"
        projectionEndpoint="/api/initiative-kanban-status-mapped-projection/projection"
        currentView={currentView}
        viewName="kanban"
        isQueryTime={false}
        canEmpty={true}
        onAfterAction={fetchKanban}
      />
      {currentView === "kanban" && renderTableBelowHeading && (
        <div className={styles.main}>
          <h2 className={styles.heading} style={{ fontSize: '1.1rem' }}>Kanban Board (All Teams)</h2>
          <div className={styles.tableWrap}>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div style={{ color: "red" }}>{error}</div>
            ) : kanban.length === 0 ? (
              <div>No Kanban items found.</div>
            ) : (
              kanban.map((team) => (
                <div key={team.teamId} style={{ marginBottom: 32 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8, fontSize: '1.05rem', color: '#2563eb' }}>Team: {team.teamId}</div>
                  <table className={styles.table}>
                    <thead className={styles.thead}>
                      <tr>
                        <th>Item ID</th>
                        <th>Initiative ID</th>
                        <th>Text</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className={styles.tbody}>
                      {team.items.map((item: any) => (
                        <tr key={item.itemId}>
                          <td>{item.itemId}</td>
                          <td>{item.initiativeId}</td>
                          <td>{item.text}</td>
                          <td>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
