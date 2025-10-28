
// --- Commands ---
export type CreateTeamCommand = {
  companyId: string;
  name: string;
  purpose: string;
  context: string;
  level: number;
};

export type UpdateTeamCommand = {
    id: string;
    name: string;
    purpose: string;
    context: string;
};
