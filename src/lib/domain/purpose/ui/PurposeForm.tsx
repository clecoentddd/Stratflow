"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import GetAIHelp from '@/lib/domain/nps-ai-coach/ui/GetAIHelp';
import type { Team } from '@/lib/types';
import type { UpdateTeamCommand } from '@/lib/domain/teams/commands';
import styles from './purpose.module.css';

type AiSuggestion = {
  nps: number;
  feedback: string;
  suggestedPurpose: string;
  confidence: number;
};

function npsColor(nps: number) {
  if (nps >= 4) return '#00cc88';
  if (nps === 3) return '#9B51E0';
  return '#ef4444';
}

function fakeAiSuggest(current: string | undefined, context: string | undefined, nps: number, hint?: string): AiSuggestion {
  const base = (current || '').trim() || 'Deliver value to customers';
  let suggested = base;
  let feedback = 'Looks good.';
  let confidence = 0.7;

  if (nps >= 4) {
    // tighten
    suggested = base.split(/\. |, /)[0];
    if (!/^(Deliver|Provide|Improve|Increase|Reduce|Support|Enable)/i.test(suggested)) {
      suggested = 'Deliver ' + suggested.charAt(0).toLowerCase() + suggested.slice(1);
    }
    feedback = 'Clear and focused. Consider adding a timeframe or metric.';
    confidence = 0.85;
  } else if (nps === 3) {
    suggested = base.split(/ by | for | to /)[0];
    suggested = suggested.replace(/\.$/, '');
    if (!/\b(users|customers|teams)\b/i.test(suggested) && context) {
      if (/user|customer/i.test(context)) suggested += ' for users';
    }
    suggested = suggested + ' — improve key outcomes in 6 months';
    feedback = 'Some ambiguity. Add a measurable target or clearer owner.';
    confidence = 0.6;
  } else {
    suggested = 'Provide a clear outcome for users and a measurable target. Example: Increase user engagement by 10% in 6 months.';
    feedback = 'Vague or unmeasurable. Add who benefits and how success is measured.';
    confidence = 0.45;
  }

  if (hint && hint.length > 8) feedback += ' Note: ' + hint.slice(0, 120);

  return { nps, feedback, suggestedPurpose: suggested, confidence };
}

interface PurposeFormProps {
  team: Team;
  onTeamUpdated?: () => void;
}

export default function PurposeForm({ team, onTeamUpdated }: PurposeFormProps) {
  const [purpose, setPurpose] = useState(team.purpose || '');
  const [name, setName] = useState(team.name || '');
  const [context, setContext] = useState(team.context || '');
  const [level, setLevel] = useState<number | undefined>(typeof team.level === 'number' ? team.level : undefined);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // AI modal state (delegated to GetAIHelp component)
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    setName(team.name || '');
    setPurpose(team.purpose || '');
    setContext(team.context || '');
    setLevel(typeof team.level === 'number' ? team.level : undefined);
  }, [team]);

  const isFormValid = purpose.trim().length > 0 && name.trim().length > 0;

  const handleSave = async () => {
    if (!isFormValid) {
      toast({ title: 'Missing purpose', description: 'Please provide a short purpose statement.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    const command: UpdateTeamCommand = {
      id: team.id,
      name: name.trim(),
      purpose: purpose.trim(),
      context: context.trim(),
      level: typeof level === 'number' ? level : undefined,
    };

    try {
      const res = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to save');
      }

      toast({ title: 'Saved', description: 'Team purpose updated.' });
  onTeamUpdated?.();
  setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.message || 'Unable to save.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // `GetAIHelp` component will manage generation and applying suggestions.

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ flex: 1 }}>
        {!isEditing ? (
          <div>
            <div className={styles.header}>
              <div className={styles.name}>{team.name || name || 'Team'}</div>
              <div className={styles.subtitle}>Team header</div>
            </div>

            <div className={styles.level}>Level: {typeof level === 'number' ? level : <span className={styles.muted}>Not set</span>}</div>

            <div className={styles.sectionTitle}>Purpose</div>
            <div className={styles.purposeText}>{purpose || <em>No purpose set</em>}</div>

            <div className={styles.sectionTitle}>Context</div>
            <div className={styles.contextText}>{context || <em>No context provided</em>}</div>

            <div className={styles.actions}>
              <Button onClick={() => setIsEditing(true)} className={styles.primaryButton}>Edit</Button>
              <Button variant="outline" onClick={() => setAiOpen(true)} className={styles.outlinePurple}>Get AI Help</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className={styles.editForm}>
              <div className={styles.field}>
                <Label htmlFor="team-name">Team name</Label>
                <Input id="team-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className={styles.field}>
                <Label htmlFor="level">Level</Label>
                <input id="level" type="number" value={typeof level === 'number' ? level : ''} onChange={(e) => setLevel(e.target.value === '' ? undefined : Number(e.target.value))} className="input" />
              </div>

              <div className={styles.field}>
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} />
              </div>

              <div className={styles.field}>
                <Label htmlFor="context">Context</Label>
                <Textarea id="context" value={context} onChange={(e) => setContext(e.target.value)} rows={6} />
              </div>

              

              <div className={styles.buttonGroup}>
                <Button onClick={handleSave} disabled={!isFormValid || isSaving} className={styles.primaryButton}>{isSaving ? 'Saving...' : 'Save'}</Button>
                <Button variant="outline" onClick={() => setAiOpen(true)} className={styles.outlinePurple}>Get AI Help!</Button>
                <Button variant="ghost" onClick={() => { setIsEditing(false); /* revert changes to original team values */ setPurpose(team.purpose || ''); setContext(team.context || ''); setLevel(typeof team.level === 'number' ? team.level : undefined); setName(team.name || ''); }} className={styles.ghostPurple}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <GetAIHelp
        open={aiOpen}
        onOpenChange={setAiOpen}
        currentPurpose={purpose}
        context={context}
        teamId={team.id}
        onApply={(s) => {
          setPurpose(s);
          setAiOpen(false);
        }}
      />
    </div>
  );
}
