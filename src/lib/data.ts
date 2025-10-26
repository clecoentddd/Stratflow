import type { InitiativeStep, Organization } from "./types";

const initiativeStepsTemplate: Omit<InitiativeStep, "items" | "icon"> & { iconName: string }[] = [
  {
    key: "diagnostic",
    title: "Diagnostic",
    iconName: "Search",
  },
  {
    key: "overallApproach",
    title: "Overall Approach",
    iconName: "Milestone",
  },
  {
    key: "actions",
    title: "Actions",
    iconName: "ListChecks",
  },
  {
    key: "proximateObjectives",
    title: "Proximate Objectives",
    iconName: "Target",
  },
];

const getInitiativeSteps = () => initiativeStepsTemplate.map(({iconName, ...rest}) => ({...rest, items: []}))

export const initialOrganizations: Organization[] = [
  {
    id: "org-1",
    name: "Innovate Inc.",
    stream: {
      id: "q4-2024-product-launch",
      name: "Q4 2024 Product Launch",
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
            {
              id: "init-1-2",
              name: "Alpha/Beta Testing Program",
              progression: 45,
              steps: [
                  { key: "diagnostic", title: "Diagnostic", iconName: "Search", items: [{ id: "item-5", text: "Identify potential beta testers" }] },
                  { key: "overallApproach", title: "Overall Approach", iconName: "Milestone", items: [{ id: "item-6", text: "Establish feedback collection mechanism" }] },
                  { key: "actions", title: "Actions", iconName: "ListChecks", items: [{ id: "item-7", text: "Onboard 20 beta testers" }, {id: "item-8", text: "Triage initial feedback reports"}] },
                  { key: "proximateObjectives", title: "Proximate Objectives", iconName: "Target", items: [{ id: "item-9", text: "Get 80% tester satisfaction" }] },
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
        {
          id: "strat-3",
          description: "Finalize legal and compliance documentation.",
          timeframe: "Q3 2024",
          state: "Closed",
          initiatives: [
              {
                  id: "init-3-1",
                  name: "Complete Compliance Review",
                  progression: 100,
                  steps: [
                      { key: "diagnostic", title: "Diagnostic", iconName: "Search", items: [] },
                      { key: "overallApproach", title: "Overall Approach", iconName: "Milestone", items: [] },
                      { key: "actions", title: "Actions", iconName: "ListChecks", items: [{ id: "item-10", text: "Get legal sign-off on ToS" }] },
                      { key: "proximateObjectives", title: "Proximate Objectives", iconName: "Target", items: [] },
                  ],
              }
          ],
        },
      ],
    },
    structure: [
      {
        id: 'node-1',
        title: 'Board of Directors',
        description: 'Oversees the company\'s direction.',
        level: 0,
        children: [
          {
            id: 'node-2',
            title: 'CEO',
            description: 'Chief Executive Officer',
            level: 1,
            children: [
              { id: 'node-3', title: 'CFO', description: 'Chief Financial Officer', level: 2, children: [] },
              { id: 'node-4', title: 'CTO', description: 'Chief Technology Officer', level: 2, children: [] },
              { id: 'node-5', title: 'CMO', description: 'Chief Marketing Officer', level: 2, children: [] },
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

export const newInitiativeTemplate = (id: string, name: string) => ({
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

import type { StrategyState } from "./types";
