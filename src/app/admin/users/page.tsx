"use client";
import { useEffect, useState } from 'react';

interface User {
  userId: string;
  username: string;
  companyId: string;
  teamIds: string[];
  timestamp: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await fetch('/api/users/projection');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError('Failed to load users');
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>All Users</h1>
      {loading && <div>Loading users...</div>}
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>User ID</th>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Username</th>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Company ID</th>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Team IDs</th>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.userId}>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace' }}>{user.userId}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{user.username}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{user.companyId}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{user.teamIds.join(', ')}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{new Date(user.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
