import type { RadarItemType, RadarCategory, RadarDistance, RadarImpact, RadarRisk } from '@/lib/types';

export const radarAttributes = {
  types: ['Threat', 'Opportunity'] as RadarItemType[],
  categories: ['Business', 'Operating Model', 'Capabilities', 'People & Knowledge'] as RadarCategory[],
  distances: ['Detected', 'Assessing', 'Assessed', 'Responding'] as RadarDistance[],
  impacts: ['Low', 'Medium', 'High'] as RadarImpact[],
  risks: ['High', 'Medium', 'Low'] as RadarRisk[],
};