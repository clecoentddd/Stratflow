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
  return fetch(`/api/initiatives?teamId=${teamId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, teamId }),
  });
}

export function updateInitiative(teamId: string, initiativeId: string, payload: UpdateInitiativePayload): Promise<Response> {
  return fetch(`/api/initiatives?teamId=${teamId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, teamId }),
  });
}

export function deleteInitiative(teamId: string, initiativeId: string, strategyId: string): Promise<Response> {
  return fetch(`/api/initiatives?teamId=${teamId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, initiativeId, strategyId }),
  });
}

export function linkRadarItems(teamId: string, initiativeId: string, linkedRadarItemIds: string[]): Promise<Response> {
  return updateInitiative(teamId, initiativeId, { initiativeId, linkedRadarItemIds });
}
