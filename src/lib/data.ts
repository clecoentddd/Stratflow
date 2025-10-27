
import type {
  Organization,
  StrategyState,
  RadarItemType,
  RadarCategory,
  RadarDistance,
  RadarImpact,
  RadarTolerance,
} from './types';

const newInitiativeTemplate = (id: string, name: string) => ({
  id,
  name,
  progression: 0,
  steps: initiativeStepsTemplate.map((step) => ({
    key: step.key,
    title: step.title,
    iconName: step.iconName,
    items: [],
  })),
  linkedRadarItemIds: [],
});

const initiativeStepsTemplate: {
  key: 'diagnostic' | 'overallApproach' | 'actions' | 'proximateObjectives';
  title: string;
  iconName: string;
}[] = [
  { key: 'diagnostic', title: 'Diagnostic', iconName: 'Search' },
  { key: 'overallApproach', title: 'Overall Approach', iconName: 'Milestone' },
  { key: 'actions', title: 'Actions', iconName: 'ListChecks' },
  { key: 'proximateObjectives', title: 'Proximate Objectives', iconName: 'Target' },
];

export const initialOrganizations: Omit<Organization, 'companyId'>[] = [
  {
    id: 'org-bod',
    name: 'Board of Directors',
    purpose: 'Oversees the company\'s direction.',
    context: 'Highest governing body.',
    level: 0,
    dashboard: {
      id: 'dashboard-bod',
      name: 'Board-Level Strategic Goals',
      strategies: [
        {
          id: 'bod-strat-1',
          description: 'Grow market share by 5% YoY',
          timeframe: '2025',
          state: 'Open',
          initiatives: [],
        },
      ],
    },
    radar: [],
  },
  {
    id: 'org-ceo',
    name: 'CEO',
    purpose: 'Leads the company and executes the board\'s vision.',
    context: 'Chief Executive Officer.',
    level: 1,
    dashboard: {
      id: 'dashboard-ceo',
      name: 'CEO Directives',
      strategies: [
        {
          id: 'ceo-strat-1',
          description: 'Execute on Q4 2024 Product Launch',
          timeframe: 'Q4 2024',
          state: 'Open',
          initiatives: [],
        },
        {
          id: 'ceo-strat-2',
          description: 'Improve operational efficiency',
          timeframe: '2025',
          state: 'Draft',
          initiatives: [],
        },
      ],
    },
    radar: [],
  },
  {
    id: 'org-cfo',
    name: 'CFO',
    purpose: 'Manages the company\'s finances.',
    context: 'Chief Financial Officer',
    level: 2,
    dashboard: { id: 'dashboard-cfo', name: 'Financial Strategy', strategies: [] },
    radar: [],
  },
  {
    id: 'org-cto',
    name: 'CTO',
    purpose: 'Leads technology and engineering.',
    context: 'Chief Technology Officer',
    level: 2,
    dashboard: {
      id: 'dashboard-cto-1',
      name: 'Technology Roadmap',
      strategies: [
        {
          id: 'strat-1',
          description: 'Develop and launch the new \'Innovate\' feature set.',
          timeframe: 'Q4 2024',
          state: 'Open',
          initiatives: [
            {
              id: 'init-1-1',
              name: 'Market Research & Analysis',
              progression: 80,
              steps: [
                {
                  key: 'diagnostic',
                  title: 'Diagnostic',
                  iconName: 'Search',
                  items: [
                    { id: 'item-1', text: 'Analyze competitor pricing' },
                    { id: 'item-2', text: 'Survey target user base' },
                  ],
                },
                {
                  key: 'overallApproach',
                  title: 'Overall Approach',
                  iconName: 'Milestone',
                  items: [{ id: 'item-3', text: 'Define phased rollout plan' }],
                },
                { key: 'actions', title: 'Actions', iconName: 'ListChecks', items: [] },
                {
                  key: 'proximateObjectives',
                  title: 'Proximate Objectives',
                  iconName: 'Target',
                  items: [{ id: 'item-4', text: 'Achieve 500 survey responses' }],
                },
              ],
              linkedRadarItemIds: ['radar-item-1'],
            },
          ],
        },
        {
          id: 'strat-2',
          description: 'Marketing and go-to-market strategy.',
          timeframe: 'Q4 2024',
          state: 'Draft',
          initiatives: [],
        },
      ],
    },
    radar: [
      {
        id: 'radar-item-1',
        radarId: 'org-cto',
        name: 'AI-driven Automation',
        detect: 'Competitors are leveraging AI to automate customer support.',
        assess: 'This poses a medium-term threat to our market position if we don\'t adapt. It could reduce our operational costs significantly.',
        respond: 'Initiate a pilot project to explore AI chatbot solutions for customer service.',
        type: 'Opportunity',
        category: 'Operating Model',
        distance: 'Detected',
        impact: 'Medium',
        tolerance: 'Medium',
        zoom_in: null,
        created_at: new Date().toISOString(),
        updated_at: null,
      },
      // ... other radar items
    ],
  },
  {
    id: 'org-cmo',
    name: 'CMO',
    purpose: 'Leads marketing and growth initiatives.',
    context: 'Chief Marketing Officer',
    level: 2,
    dashboard: { id: 'dashboard-cmo', name: 'Marketing & Growth', strategies: [] },
    radar: [],
  },
];


export const strategyStates: {
  value: StrategyState;
  label: string;
  iconName: 'FilePenLine' | 'Rocket' | 'CheckCircle2' | 'Archive';
  colorClass: string;
}[] = [
  { value: 'Draft', label: 'Draft', iconName: 'FilePenLine', colorClass: 'text-blue-600' },
  { value: 'Open', label: 'Open', iconName: 'Rocket', colorClass: 'text-green-600' },
  { value: 'Closed', label: 'Closed', iconName: 'CheckCircle2', colorClass: 'text-gray-500' },
  { value: 'Obsolete', label: 'Obsolete', iconName: 'Archive', colorClass: 'text-gray-500' },
];

export const radarAttributes = {
  types: ['Threat', 'Opportunity'] as RadarItemType[],
  categories: ['Business', 'Operating Model', 'Capabilities', 'People & Knowledge'] as RadarCategory[],
  distances: ['Detected', 'Assessing', 'Assessed', 'Responding'] as RadarDistance[],
  impacts: ['Low', 'Medium', 'High'] as RadarImpact[],
  tolerances: ['High', 'Medium', 'Low'] as RadarTolerance[],
};

export { newInitiativeTemplate };
