export type AddInitiativeItemPayload = {
  initiativeId: string;
  stepKey: string;
  item: { text: string };
};

export type UpdateInitiativeItemPayload = {
  initiativeId: string;
  itemId: string;
  text: string;
};

export function addInitiativeItem(teamId: string, payload: AddInitiativeItemPayload): Promise<Response> {
  return fetch(`/api/teams/${teamId}/initiative-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateInitiativeItem(teamId: string, itemId: string, payload: UpdateInitiativeItemPayload): Promise<Response> {
  return fetch(`/api/teams/${teamId}/initiative-items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteInitiativeItem(teamId: string, itemId: string, initiativeId: string): Promise<Response> {
  return fetch(`/api/teams/${teamId}/initiative-items/${itemId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initiativeId }),
  });
}
