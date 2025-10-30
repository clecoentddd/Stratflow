export type UpdateInitiativePayload = {
  initiativeId: string;
  name?: string;
  progression?: number;
  linkedRadarItemIds?: string[];
};

export type CreateInitiativePayload = {
  strategyId: string;
  name: string;
  tempId: string;
};

export function createInitiative(teamId: string, payload: CreateInitiativePayload): Promise<Response> {
  return fetch(`/api/teams/${teamId}/initiatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateInitiative(teamId: string, initiativeId: string, payload: UpdateInitiativePayload): Promise<Response> {
  return fetch(`/api/teams/${teamId}/initiatives/${initiativeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteInitiative(teamId: string, initiativeId: string, strategyId: string): Promise<Response> {
  return fetch(`/api/teams/${teamId}/initiatives/${initiativeId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategyId }),
  });
}

export function linkRadarItems(teamId: string, initiativeId: string, linkedRadarItemIds: string[]): Promise<Response> {
  return updateInitiative(teamId, initiativeId, { initiativeId, linkedRadarItemIds });
}
