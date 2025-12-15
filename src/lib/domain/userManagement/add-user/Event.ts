// Event for AddUser slice
export interface Event {
  type: 'UserAdded';
  payload: {
    userId: string;
    username: string;
    companyId: string;
    teamIds: string[];
    timestamp: string;
  };
  tenantId: string;
}
