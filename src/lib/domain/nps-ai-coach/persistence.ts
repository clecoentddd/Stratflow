// Persistence shim for nps-ai-coach that delegates to a DB adapter.
// The `db` adapter can be swapped between a mock and a real provider (Supabase/Postgres).

import db from './db';

export type SaveResult = {
  id: string;
  teamId?: string;
  suggestion: string;
  savedAt: string;
  metadata?: any;
};

export async function saveNpsSuggestion(teamId: string | undefined, suggestion: string, metadata?: any): Promise<SaveResult> {
  // Delegate to adapter implementation (mock or real DB)
  return db.saveSuggestion(teamId, suggestion, metadata);
}

export async function getSavedSuggestions(teamId?: string): Promise<SaveResult[]> {
  return db.getSuggestions(teamId);
}

// SaveResult is exported above via `export type SaveResult = ...`.
