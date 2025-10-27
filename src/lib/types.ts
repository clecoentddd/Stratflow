

export type StrategyState = 'Draft' | 'Open' | 'Closed' | 'Obsolete' | 'Deleted';

export type InitiativeItem = {
  id: string;
  text: string;
};

export type InitiativeStepKey = 'diagnostic' | 'overallApproach' | 'actions' | 'proximateObjectives';

export type InitiativeStep = {
  key: InitiativeStepKey;
  title: string;
  iconName: string;
  items: InitiativeItem[];
};

export type Initiative = {
  id:string;
  name: string;
  progression: number;
  steps: InitiativeStep[];
  linkedRadarItemIds?: string[];
};

export type Strategy = {
  id: string;
  description: string;
  timeframe: string;
  state: StrategyState;
  initiatives: Initiative[];
};

export type Dashboard = {
  id:string;
  name: string;
  strategies: Strategy[];
};

// Radar Types
export type RadarItemType = 'Threat' | 'Opportunity';
export type RadarCategory = 'Business' | 'Operating Model' | 'Capabilities' | 'People & Knowledge';
export type RadarDistance = 'Detected' | 'Assessing' | 'Assessed' | 'Responding' | 'Responded';
export type RadarImpact = 'Low' | 'Medium' | 'High';
export type RadarTolerance = 'High' | 'Medium' | 'Low';

export type RadarItem = {
  id: string;
  radarId: string;
  name: string;
  detect: string;
  assess: string;
  respond: string;
  type: RadarItemType;
  category: RadarCategory;
  distance: RadarDistance;
  impact: RadarImpact;
  tolerance: RadarTolerance;
  zoom_in: string | null;
  created_at: string;
  updated_at: string | null;
};


export type Organization = {
  id: string;
  companyId: string; // <-- New field
  name: string;
  purpose: string;
  context: string;
  level: number;
  dashboard: Dashboard;
  radar: RadarItem[];
};


// Event Sourcing and CQRS Types
export type Event<T extends string, P> = {
    type: T;
    payload: P;
    timestamp: string;
    aggregateId: string;
};

export type OrganizationCreatedEvent = Event<'OrganizationCreated', {
    id: string;
    companyId: string; // <-- New field
    name: string;
    purpose: string;
    context: string;
    level: number;
}>;

// Union of all events related to an Organization
export type OrganizationEvent = OrganizationCreatedEvent; // Add more events like OrganizationUpdated, etc.

// --- Commands ---
export type CreateOrganizationCommand = {
    companyId: string; // <-- New field
    name: string;
    purpose: string;
    context: string;
    level: number;
};
