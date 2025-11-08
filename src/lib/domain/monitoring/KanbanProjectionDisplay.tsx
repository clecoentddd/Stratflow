
import React from 'react';

export function KanbanProjectionDisplay({ projection }: { projection: any }) {
  if (!projection) return null;
  const elements = projection.elements || [];
  return (
    <div style={{ margin: '1em 0', padding: '1em', background: '#f8f8f8', border: '1px solid #ccc' }}>
      <h3>Kanban Projection (Table View)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Type</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Status</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Name/Title</th>
          </tr>
        </thead>
        <tbody>
          {elements.map((el: any) => (
            <tr key={el.id}>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>{el.id}</td>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>{el.type}</td>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>{el.status}</td>
              <td style={{ border: '1px solid #ccc', padding: 4 }}>{el.title || el.name || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
