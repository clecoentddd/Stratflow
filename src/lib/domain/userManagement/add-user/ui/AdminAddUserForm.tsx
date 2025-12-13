"use client";
import { useState, useEffect } from 'react';
import styles from './add-user-form.module.css';
import type { Command } from '../Command';

export function AdminAddUserForm({ onSubmit }: { onSubmit: (cmd: Command) => void }) {
  const [username, setUsername] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; companyId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [companiesRes, teamsRes] = await Promise.all([
        fetch('/api/companies/projection'),
        fetch('/api/teams/projection'),
      ]);
      const companiesData = await companiesRes.json();
      const teamsData = await teamsRes.json();
      setCompanies(companiesData);
      setTeams(teamsData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredTeams = companyId ? teams.filter(t => t.companyId === companyId) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch('/api/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, company: companyId, teamIds }),
      });
      if (res.ok) {
        setSuccess('User added successfully!');
        setUsername('');
        setCompanyId('');
        setTeamIds([]);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      setError('Failed to add user');
    }
    setSubmitting(false);
  }

  return (
    <form className={styles.addUserForm} onSubmit={handleSubmit}>
      <label>
        Username
        <input value={username} onChange={e => setUsername(e.target.value)} required />
      </label>
      <label>
        Company
        <select value={companyId} onChange={e => { setCompanyId(e.target.value); setTeamIds([]); }} required>
          <option value="">Select a company</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label>
        Teams (select one or more)
        <select
          multiple
          value={teamIds}
          onChange={e => {
            const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
            setTeamIds(options);
          }}
          required={filteredTeams.length > 0}
          size={Math.min(5, filteredTeams.length || 1)}
          disabled={!companyId}
        >
          {filteredTeams.length === 0 && <option value="">No teams for this company</option>}
          {filteredTeams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={loading || submitting}>Add User</button>
      {success && <div className={styles.success}>{success}</div>}
      {error && <div className={styles.error}>{error}</div>}
    </form>
  );
}
