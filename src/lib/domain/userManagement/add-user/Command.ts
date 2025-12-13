// Command for AddUser slice
export interface Command {
  userId?: string;
  username: string;
  company: string; // companyId
  teamIds: string[];
}
