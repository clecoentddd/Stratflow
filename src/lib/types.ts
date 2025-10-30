
export type StrategyState = 'Draft' | 'Active' | 'Closed' | 'Obsolete' | 'Deleted';

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
  tempId?: string; // Add temporary ID for optimistic UI
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

export type Company = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  companyId: string;
  name: string;
  purpose: string;
  context: string;
  level: number;
  dashboard: Dashboard;
  radar: RadarItem[];
};
