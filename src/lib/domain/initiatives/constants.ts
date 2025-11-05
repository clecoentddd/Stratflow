import type { Initiative, InitiativeStep } from '@/lib/types';

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

export const newInitiativeTemplate = (id: string, name: string): Initiative => ({
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