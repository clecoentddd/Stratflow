import type { StrategyState } from '@/lib/types';

export const strategyStates: {
  value: StrategyState;
  label: string;
  iconName: 'FilePenLine' | 'Rocket' | 'CheckCircle2' | 'Archive';
  colorClass: string;
}[] = [
  { value: 'Draft', label: 'Draft', iconName: 'FilePenLine', colorClass: 'text-blue-600' },
  { value: 'Active', label: 'Active', iconName: 'Rocket', colorClass: 'text-green-600' },
  { value: 'Closed', label: 'Closed', iconName: 'CheckCircle2', colorClass: 'text-gray-500' },
  { value: 'Obsolete', label: 'Obsolete', iconName: 'Archive', colorClass: 'text-gray-500' },
];