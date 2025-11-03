// DB adapter interface + mock implementation for nps-ai-coach
// Provides a small abstraction so the persistence layer can be swapped (supabase, postgres, etc.)

import type { SaveResult } from './persistence';

export interface NpsDb {
  saveSuggestion(teamId: string | undefined, suggestion: string, metadata?: any): Promise<SaveResult>;
  getSuggestions(teamId?: string): Promise<SaveResult[]>;
}

// Simple in-memory mock implementation. Suitable for local dev and tests.
const memory: { items: SaveResult[] } = { items: [] };

export const mockDb: NpsDb = {
  async saveSuggestion(teamId, suggestion, metadata) {
    const id = `nps-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const savedAt = new Date().toISOString();
    const record: SaveResult = { id, teamId, suggestion, savedAt, metadata };
    memory.items.push(record);
    return record;
  },
  async getSuggestions(teamId) {
    if (!teamId) return [...memory.items];
    return memory.items.filter((i) => i.teamId === teamId);
  },
};

// Export a default adapter instance. Replace this assignment when wiring a real DB.
export const db: NpsDb = mockDb;

export default db;
