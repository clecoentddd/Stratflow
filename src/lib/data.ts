import {
  Archive,
  CheckCircle2,
  CircleDotDashed,
  FilePenLine,
  ListChecks,
  Milestone,
  Search,
  Target,
} from "lucide-react";
import type { Stream, StrategyState, InitiativeStep } from "./types";

const initiativeStepsTemplate: Omit<InitiativeStep, "items">[] = [
  {
    key: "diagnostic",
    title: "Diagnostic",
    icon: Search,
  },
  {
    key: "overallApproach",
    title: "Overall Approach",
    icon: Milestone,
  },
  {
    key: "actions",
    title: "Actions",
    icon: ListChecks,
  },
  {
    key: "proximateObjectives",
    title: "Proximate Objectives",
    icon: Target,
  },
];

export const initialStreams: Stream[] = [
  {
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
              { ...initiativeStepsTemplate[0], items: [{ id: "item-1", text: "Analyze competitor pricing" }, {id: "item-2", text: "Survey target user base"}] },
              { ...initiativeStepsTemplate[1], items: [{ id: "item-3", text: "Define phased rollout plan" }] },
              { ...initiativeStepsTemplate[2], items: [] },
              { ...initiativeStepsTemplate[3], items: [{ id: "item-4", text: "Achieve 500 survey responses" }] },
            ],
          },
          {
            id: "init-1-2",
            name: "Alpha/Beta Testing Program",
            progression: 45,
            steps: [
                { ...initiativeStepsTemplate[0], items: [{ id: "item-5", text: "Identify potential beta testers" }] },
                { ...initiativeStepsTemplate[1], items: [{ id: "item-6", text: "Establish feedback collection mechanism" }] },
                { ...initiativeStepsTemplate[2], items: [{ id: "item-7", text: "Onboard 20 beta testers" }, {id: "item-8", text: "Triage initial feedback reports"}] },
                { ...initiativeStepsTemplate[3], items: [{ id: "item-9", text: "Get 80% tester satisfaction" }] },
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
                    { ...initiativeStepsTemplate[0], items: [] },
                    { ...initiativeStepsTemplate[1], items: [] },
                    { ...initiativeStepsTemplate[2], items: [{ id: "item-10", text: "Get legal sign-off on ToS" }] },
                    { ...initiativeStepsTemplate[3], items: [] },
                ],
            }
        ],
      },
    ],
  },
  {
    id: "h1-2025-expansion",
    name: "H1 2025 Market Expansion",
    strategies: [
        {
            id: "strat-4",
            description: "Explore and enter the European market.",
            timeframe: "H1 2025",
            state: "Draft",
            initiatives: [],
        }
    ],
  },
];

export const strategyStates: {
  value: StrategyState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "Draft", label: "Draft", icon: FilePenLine },
  { value: "Open", label: "Open", icon: CircleDotDashed },
  { value: "Closed", label: "Closed", icon: CheckCircle2 },
  { value: "Obsolete", label: "Obsolete", icon: Archive },
];

export const newInitiativeTemplate = (id: string, name: string) => ({
    id,
    name,
    progression: 0,
    steps: initiativeStepsTemplate.map(step => ({...step, items: []})),
})
