// Event for AssignUserToOrganization slice
export interface Event {
  type: 'UserAssignedToOrganization';
  payload: {
    userId: string;
    companyId: string;
    teamId?: string; // Optional initial team assignment
    timestamp: string;
  };
}
