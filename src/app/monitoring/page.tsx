import { getEventLogProjection } from '@/lib/domain/monitoring/projection';

export default async function MonitoringPage() {
  const events = await getEventLogProjection();

  return (
    <main style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Event Log</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Time</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Entity</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Aggregate ID</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, idx) => (
              <tr key={`${e.timestamp}-${e.aggregateId}-${e.type}-${idx}`}>
                <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
                  {new Date(e.timestamp).toLocaleString()}
                </td>
                <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{e.entity}</td>
                <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{e.type}</td>
                <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>{e.aggregateId}</td>
                <td style={{ verticalAlign: 'top', padding: '0.5rem', borderBottom: '1px solid #f3f4f6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '0.875rem' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
