import type { RadarRisk } from '@/lib/types';

export const RADAR_DEFAULT_RISK: RadarRisk = 'Medium';

export type RadarRiskView = {
  level: RadarRisk;
  color: string;
  label: string;
};

const riskPalette: Record<RadarRisk, RadarRiskView> = {
  High: {
    level: 'High',
    color: '#ef4444',
    label: 'High',
  },
  Medium: {
    level: 'Medium',
    color: '#ffd580',
    label: 'Medium',
  },
  Low: {
    level: 'Low',
    color: '#16a34a',
    label: 'Low',
  },
};

export const radarRiskPalette = riskPalette;

export const radarLabels = {
  title: 'Title',
  type: 'Type',
  category: 'Category',
  distance: 'Distance',
  impact: 'Impact',
  risk: 'Risk',
  zoom: 'Zoom to radar',
};

export const radarTooltipCopy = {
  placeholder: 'Hover over items to see details',
  zoomMissing: 'Zoom In Not Selected',
};

export const radarTooltipLabels = {
  title: 'Title:',
  type: 'Type:',
  category: 'Category:',
  distance: 'Distance:',
  impact: 'Impact:',
  risk: 'Risk:',
  zoom: 'Zoom to radar:',
};

export function getRiskView(risk?: RadarRisk): RadarRiskView {
  return radarRiskPalette[risk ?? RADAR_DEFAULT_RISK];
}

export function getRiskColor(risk?: RadarRisk): string {
  return getRiskView(risk).color;
}
