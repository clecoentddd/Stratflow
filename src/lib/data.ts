

import type { Organization, StrategyState, RadarItemType, RadarCategory, RadarDistance, RadarImpact, RadarTolerance } from "./types";

const newInitiativeTemplate = (id: string, name: string) => ({
    id,
    name,
    progression: 0,
    steps: initiativeStepsTemplate.map(step => ({
      key: step.key,
      title: step.title,
      iconName: step.iconName,
      items: []
    })),
    linkedRadarItemIds: [],
});

const initiativeStepsTemplate: {
  key: 'diagnostic' | 'overallApproach' | 'actions' | 'proximateObjectives';
  title: string;
  iconName: string;
}[] = [
  { key: "diagnostic", title: "Diagnostic", iconName: "Search" },
  { key: "overallApproach", title: "Overall Approach", iconName: "Milestone" },
  { key: "actions", title: "Actions", iconName: "ListChecks" },
  { key: "proximateObjectives", title: "Proximate Objectives", iconName: "Target" },
];

export const initialOrganizations: Organization[] = [
  {
    id: "org-bod",
    name: "Board of Directors",
    purpose: "Oversees the company's direction.",
    context: "Highest governing body.",
    level: 0,
    dashboard: {
      id: "stream-bod",
      name: "Board-Level Strategic Goals",
      strategies: [
        { id: "bod-strat-1", description: "Grow market share by 5% YoY", timeframe: "2025", state: "Open", initiatives: [] },
      ]
    },
    radar: [],
  },
  {
    id: "org-ceo",
    name: "CEO",
    purpose: "Leads the company and executes the board's vision.",
    context: "Chief Executive Officer.",
    level: 1,
    dashboard: {
      id: "stream-ceo",
      name: "CEO Directives",
      strategies: [
        { id: "ceo-strat-1", description: "Execute on Q4 2024 Product Launch", timeframe: "Q4 2024", state: "Open", initiatives: [] },
        { id: "ceo-strat-2", description: "Improve operational efficiency", timeframe: "2025", state: "Draft", initiatives: [] },
      ]
    },
    radar: [],
  },
  { 
    id: 'org-cfo', 
    name: 'CFO', 
    purpose: 'Manages the company\'s finances.',
    context: 'Chief Financial Officer', 
    level: 2, 
    dashboard: { id: 'stream-cfo', name: 'Financial Strategy', strategies: [] },
    radar: [],
  },
  { 
    id: 'org-cto', 
    name: 'CTO', 
    purpose: 'Leads technology and engineering.',
    context: 'Chief Technology Officer', 
    level: 2, 
    dashboard: {
      id: "cto-stream-1",
      name: "Technology Roadmap",
      strategies: [
        {
          id: "strat-1",
          description: "Develop and launch the new 'Innovate' feature set.",
          timeframe: "Q4 2024",
          state: "Open",
          initiatives: [
            {
              id: "init-1-1",
              name: "Market Research & Analysis",
              progression: 80,
              steps: [
                { key: "diagnostic", title: "Diagnostic", iconName: "Search", items: [{ id: "item-1", text: "Analyze competitor pricing" }, {id: "item-2", text: "Survey target user base"}] },
                { key: "overallApproach", title: "Overall Approach", iconName: "Milestone", items: [{ id: "item-3", text: "Define phased rollout plan" }] },
                { key: "actions", title: "Actions", iconName: "ListChecks", items: [] },
                { key: "proximateObjectives", title: "Proximate Objectives", iconName: "Target", items: [{ id: "item-4", text: "Achieve 500 survey responses" }] },
              ],
              linkedRadarItemIds: ['radar-item-1'],
            },
          ],
        },
          {
          id: "strat-2",
          description: "Marketing and go-to-market strategy.",
          timeframe: "Q4 2024",
          state: "Draft",
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
        {
            id: 'radar-item-2',
            radarId: 'org-cto',
            name: 'Event Modeling',
            detect: 'A collaborative process of exploring, discovering, and documenting a system by focusing on the events that occur within it.',
            assess: 'Can lead to more robust and understandable systems that are easier to change.',
            respond: 'Train the team on Event Modeling and apply it to the next new service we build.',
            type: 'Opportunity',
            category: 'Capabilities',
            distance: 'Assessing',
            impact: 'Medium',
            tolerance: 'High',
            zoom_in: null,
            created_at: '2024-05-20T10:00:00.000Z',
            updated_at: null
        },
        {
            id: 'radar-item-3',
            radarId: 'org-cto',
            name: 'Forward-Deployed Engineer',
            detect: 'Engineers embedded directly within business teams to accelerate product development.',
            assess: 'Can significantly reduce communication overhead and speed up delivery, but requires engineers with strong communication skills.',
            respond: 'Pilot the concept with one business team for one quarter.',
            type: 'Opportunity',
            category: 'People & Knowledge',
            distance: 'Detected',
            impact: 'Medium',
            tolerance: 'Medium',
            zoom_in: null,
            created_at: '2024-05-21T11:00:00.000Z',
            updated_at: null
        },
        {
            id: 'radar-item-4',
            radarId: 'org-cto',
            name: 'Slice Architecture',
            detect: 'Designing systems as vertical slices of functionality, rather than horizontal layers.',
            assess: 'Improves team autonomy and speed of delivery.',
            respond: 'Evaluate for our next-generation platform architecture.',
            type: 'Opportunity',
            category: 'Operating Model',
            distance: 'Assessing',
            impact: 'High',
            tolerance: 'Medium',
            zoom_in: null,
            created_at: '2024-05-22T12:00:00.000Z',
            updated_at: null
        },
        {
            id: 'radar-item-5',
            radarId: 'org-cto',
            name: 'Event Sourcing',
            detect: 'Storing the full series of events that have affected the state of a system.',
            assess: 'Provides a strong audit log and enables powerful analytics, but can increase storage costs and complexity.',
            respond: 'Use for our core transaction processing system.',
            type: 'Opportunity',
            category: 'Capabilities',
            distance: 'Responding',
            impact: 'High',
            tolerance: 'Medium',
            zoom_in: null,
            created_at: '2024-05-23T13:00:00.000Z',
            updated_at: null
        },
        {
            id: 'radar-item-6',
            radarId: 'org-cto',
            name: 'Roles of SM, BA, PM',
            detect: 'Ambiguity and overlap in the roles of Scrum Master, Business Analyst, and Product Manager.',
            assess: 'Causes confusion, duplicated work, and can slow down decision-making.',
            respond: 'Run a workshop to clarify roles and responsibilities for each product team.',
            type: 'Threat',
            category: 'People & Knowledge',
            distance: 'Assessed',
            impact: 'Medium',
            tolerance: 'Low',
            zoom_in: null,
            created_at: '2024-05-24T14:00:00.000Z',
            updated_at: '2024-05-24T15:00:00.000Z'
        },
        {
            id: 'radar-item-7',
            radarId: 'org-cto',
            name: 'Lack of Modelization',
            detect: 'Teams are building services without a clear, shared understanding of the underlying business domain.',
            assess: 'Leads to inconsistent APIs, data duplication, and high integration costs.',
            respond: 'Mandate the use of Domain-Driven Design (DDD) and collaborative modeling sessions for all new projects.',
            type: 'Threat',
            category: 'Capabilities',
            distance: 'Detected',
            impact: 'High',
            tolerance: 'Low',
            zoom_in: null,
            created_at: '2024-05-25T15:00:00.000Z',
            updated_at: null
        },
        {
            id: 'radar-item-8',
            radarId: 'org-cto',
            name: 'Inertia / Proxy',
            detect: 'Decisions are being delayed because teams are waiting for approval from a single person or committee.',
            assess: 'This is a major bottleneck that is killing our agility and frustrating teams.',
            respond: 'Empower teams to make decisions within their domain and clearly define escalation paths.',
            type: 'Threat',
            category: 'Operating Model',
            distance: 'Responding',
            impact: 'High',
            tolerance: 'Low',
            zoom_in: null,
            created_at: '2024-05-26T16:00:00.000Z',
            updated_at: null
        },
        {
            id: 'radar-item-9',
            radarId: 'org-cto',
            name: 'Accidental Complexity',
            detect: 'Our core systems are becoming overly complex due to a series of short-term fixes and a lack of refactoring.',
            assess: 'This is increasing the cost of change and the risk of outages. It is a major threat to our long-term viability.',
            respond: 'Allocate 20% of our capacity each quarter to dedicated refactoring and simplification efforts.',
            type: 'Threat',
            category: 'Capabilities',
            distance: 'Assessed',
            impact: 'High',
            tolerance: 'Low',
            zoom_in: 'org-cmo',
            created_at: '2024-05-28T10:52:29.323Z',
            updated_at: '2024-05-28T21:47:22.807Z'
        }
    ],
  },
  { 
    id: 'org-cmo', 
    name: 'CMO', 
    purpose: 'Leads marketing and growth initiatives.',
    context: 'Chief Marketing Officer', 
    level: 2, 
    dashboard: { id: 'stream-cmo', name: 'Marketing & Growth', strategies: [] },
    radar: [],
  },
];


export const strategyStates: {
  value: StrategyState;
  label: string;
  iconName: 'FilePenLine' | 'Rocket' | 'CheckCircle2' | 'Archive';
  colorClass: string;
}[] = [
  { value: "Draft", label: "Draft", iconName: 'FilePenLine', colorClass: "text-blue-600" },
  { value: "Open", label: "Open", iconName: 'Rocket', colorClass: "text-green-600" },
  { value: "Closed", label: "Closed", iconName: 'CheckCircle2', colorClass: "text-gray-500" },
  { value: "Obsolete", label: "Obsolete", iconName: 'Archive', colorClass: "text-gray-500" },
];

export const radarAttributes = {
  types: ['Threat', 'Opportunity'] as RadarItemType[],
  categories: ['Business', 'Operating Model', 'Capabilities', 'People & Knowledge'] as RadarCategory[],
  distances: ['Detected', 'Assessing', 'Assessed', 'Responding', 'Responded'] as RadarDistance[],
  impacts: ['Low', 'Medium', 'High'] as RadarImpact[],
  tolerances: ['High', 'Medium', 'Low'] as RadarTolerance[],
};

export { newInitiativeTemplate };
