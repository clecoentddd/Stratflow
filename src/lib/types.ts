
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
};

export type Strategy = {
  id: string;
  description: string;
  timeframe: string;
  state: StrategyState;
  initiatives: Initiative[];
};

export type Stream = {
  id:string;
  name: string;
  strategies: Strategy[];
};

// Radar Types
export type RadarItemType = 'Threat' | 'Opportunity';
export type RadarCategory = 'Business' | 'Operating Model' | 'Capabilities' | 'People & Knowledge';
export type RadarDistance = 'Detected' | 'Assessing' | 'Assessed' | 'Responding';
export type RadarImpact = 'Low' | 'Medium' | 'High';
export type RadarTolerance = 'High' | 'Medium';

export type RadarItem = {
  id: string;
  title: string;
  detection: string;
  assessment: string;
  decision: string;
  type: RadarItemType;
  category: RadarCategory;
  distance: RadarDistance;
  impact: RadarImpact;
  tolerance: RadarTolerance;
  zoomInLink?: string;
};


export type Organization = {
  id: string;
  name: string;
  purpose: string;
  context: string;
  level: number;
  stream: Stream;
  radar: RadarItem[];
};
