"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPurpose?: string;
  context?: string;
  teamId?: string;
  onApply?: (s: string) => void;
};

function npsColor(nps: number) {
  if (nps >= 4) return '#00cc88';
  if (nps === 3) return '#9B51E0';
  return '#ef4444';
}

export default function GetAIHelp({ open, onOpenChange, currentPurpose, context, teamId, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      try { console.debug('[GetAIHelp] sending generate request', { purpose: currentPurpose, context, teamId }); } catch (e) {}
      const res = await fetch('/api/nps-ai-coach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purposeText: currentPurpose || '', context, teamId }),
      });

      if (!res.ok) {
        // Try to read server JSON error message
        let body: any = null;
        try {
          body = await res.json();
        } catch (e) {
          // ignore parse error
        }
        const msg = body?.error ?? `AI provider error (status ${res.status})`;
        console.error('[GetAIHelp] generate failed:', res.status, body);
        toast({ title: 'AI error', description: msg, variant: 'destructive' });
        setLoading(false);
        return;
      }

      const json = await res.json();
      try { console.debug('[GetAIHelp] generate response', json); } catch (e) {}
      setResult(json);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'AI error', description: err?.message || 'Unable to generate suggestion', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    try { console.debug('[GetAIHelp] applying suggestion', result); } catch (e) {}
    const data = result?.data ?? result;
    onApply?.(data?.suggestion ?? data?.suggestions ?? data?.suggestions ?? '');
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!result) return toast({ title: 'No suggestion', description: 'Generate a suggestion first.' });
    try {
      const metadata = {
        potentialNPS: result?.potentialNPS ?? null,
        evaluations: result?.evaluations ?? null,
        suggestions: result?.suggestions ?? null,
        raw: result?.raw ?? null,
      };

      const res = await fetch('/api/nps-ai-coach/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, suggestion: result?.suggestions ?? result?.suggestions ?? '', metadata }),
      });
      if (!res.ok) {
        let body: any = null;
        try { body = await res.json(); } catch (e) {}
        throw new Error(body?.error ?? `Status ${res.status}`);
      }
      const saved = await res.json();
      toast({ title: 'Saved', description: 'Suggestion saved to mock DB.' });
      console.debug('Saved suggestion', saved);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Save error', description: err?.message || 'Unable to save suggestion', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="w-[90vw] max-w-[900px] sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Get AI Help</DialogTitle>
        </DialogHeader>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <Button onClick={handleGenerate} disabled={loading}>{loading ? 'Generating...' : 'Get AI suggestion'}</Button>
          </div>

          {result && (
            (() => {
              const data = result?.data ?? result;
              const potentialNPS = data?.potentialNPS ?? data?.nps ?? data?.rating ?? data?.score ?? '—';
              const evaluations = data?.evaluations ?? data?.evaluation ?? data?.details ?? '';
              const suggestions = data?.suggestions ?? data?.suggestion ?? data?.suggested ?? '';
              return (
                <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, maxHeight: '60vh', overflowY: 'auto' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>AI NPS Evaluation</div>
                  <div style={{ marginTop: 8 }}><strong>NPS:</strong> {potentialNPS}</div>
                  <div style={{ marginTop: 8 }}><strong>Evaluations:</strong>
                    <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{evaluations ?? ''}</div>
                  </div>
                  <div style={{ marginTop: 8 }}><strong>Suggestions:</strong>
                    <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{suggestions ?? ''}</div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button onClick={() => { handleApply(); }}>Apply to form</Button>
                    <Button variant="outline" onClick={handleSave}>Save suggestion</Button>
                    <Button variant="ghost" onClick={() => setShowRaw(s => !s)}>{showRaw ? 'Hide JSON' : 'Show JSON'}</Button>
                    <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>Source: {result?.source ?? (result?.data ? 'ai-coach-get-nps' : 'nps-ai-coach')}</div>
                  </div>

                  {showRaw && (
                    <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Raw JSON</div>
                        <Button variant="outline" size="sm" onClick={() => {
                          try {
                            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                            toast({ title: 'Copied', description: 'Raw JSON copied to clipboard.' });
                          } catch (e) {
                            toast({ title: 'Copy failed', description: 'Unable to copy JSON.' });
                          }
                        }}>Copy</Button>
                      </div>
                      <pre style={{ fontSize: 12, lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '40vh', overflow: 'auto', background: '#fafafa', padding: 12, borderRadius: 6 }}>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
