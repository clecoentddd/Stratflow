
// radarConfig.js
// Central configuration for the radar chart

export const radarConfig = {
  // Visual settings
  visual: {
    numberOfRadialLines: 16,
    distanceRings: [0.25, 0.5, 0.75, 1],
    quadrantColors: ['hsl(var(--background))', 'hsl(var(--muted))', 'hsl(var(--background))', 'hsl(var(--muted))'],
    gridColor: 'hsl(var(--chart-1))',
  },

 categories: {
  'Business': {
    quadrantIndex: 2, // top-left
    label: 'Business',
  },
  'Capabilities': {
    quadrantIndex: 3, // top-right
    label: 'Capabilities',
  },
  'Operating Model': {
    quadrantIndex: 1, // bottom-left
    label: 'Operating Model',
 
  },
  'People & Knowledge': {
    quadrantIndex: 0, // bottom-right
    label: 'People & Knowledge',
  }
},

  // Distance/maturity mapping - maps raw distance names to ring positions
  distances: {
    'Detected': { ringIndex: 3, radiusMultiplier: 1.0 },
    'Assessing': { ringIndex: 2, radiusMultiplier: 0.75 },
    'Assessed': { ringIndex: 1, radiusMultiplier: 0.5 },
    'Responding': { ringIndex: 0, radiusMultiplier: 0.25 }
  },

  // Impact styling
  impacts: {
    'Low': {
      color: 'hsl(var(--chart-1))',
      opportunityClass: 'opportunityLow'
    },
    'Medium': {
      color: 'hsl(var(--chart-2))',
      opportunityClass: 'opportunityMedium'
    },
    'High': {
      color: 'hsl(var(--chart-3))',
      opportunityClass: 'opportunityHigh'
    }
  },

  // Tolerance sizing
  tolerances: {
    'High': { radius: 14 },
    'Medium': { radius: 10 },
    'Low': { radius: 7 }
  },

  // Default values
  defaults: {
    impact: 'Medium',
    tolerance: 'Medium',
    color: 'hsl(var(--chart-4))',
    size: 10
  }
};

export default radarConfig;
