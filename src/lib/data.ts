import type { Organization, StrategyState } from "./types";

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
    id: "org-1",
    name: "Innovate Inc.",
    structure: [
      {
        id: 'node-1',
        title: 'Board of Directors',
        description: 'Oversees the company\'s direction.',
        level: 0,
        stream: {
          id: 'stream-bod',
          name: 'Board-Level Strategic Goals',
          strategies: [
            { id: 'bod-strat-1', description: 'Grow market share by 5% YoY', timeframe: '2025', state: 'Open', initiatives: [] },
          ]
        },
        children: [
          {
            id: 'node-2',
            title: 'CEO',
            description: 'Chief Executive Officer',
            level: 1,
            stream: {
              id: 'stream-ceo',
              name: 'CEO Directives',
              strategies: [
                { id: 'ceo-strat-1', description: 'Execute on Q4 2024 Product Launch', timeframe: 'Q4 2024', state: 'Open', initiatives: [] },
                { id: 'ceo-strat-2', description: 'Improve operational efficiency', timeframe: '2025', state: 'Draft', initiatives: [] },
              ]
            },
            children: [
              { 
                id: 'node-3', 
                title: 'CFO', 
                description: 'Chief Financial Officer', 
                level: 2, 
                stream: { id: 'stream-cfo', name: 'Financial Strategy', strategies: [] }, 
                children: [] 
              },
              { 
                id: 'node-4', 
                title: 'CTO', 
                description: 'Chief Technology Officer', 
                level: 2, 
                stream: {
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
                children: [] 
              },
              { 
                id: 'node-5', 
                title: 'CMO', 
                description: 'Chief Marketing Officer', 
                level: 2, 
                stream: { id: 'stream-cmo', name: 'Marketing & Growth', strategies: [] }, 
                children: [] 
              },
            ]
          }
        ]
      }
    ]
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

export { newInitiativeTemplate };
