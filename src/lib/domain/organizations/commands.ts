
// --- Commands ---
export type CreateOrganizationCommand = {
  companyId: string;
  name: string;
  purpose: string;
  context: string;
  level: number;
};

export type UpdateOrganizationCommand = {
    id: string;
    name: string;
    purpose: string;
    context: string;
};
