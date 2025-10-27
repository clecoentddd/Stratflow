// radarDataParser.js
// Transforms raw data into normalized format for the radar chart

import {radarConfig} from './RadarConfig';
import styles from './RadarChart.module.css'; // import CSS module here
import type { RadarItem } from '@/lib/types';

/**
 * Parses raw items into normalized radar data
 * @param {Array} rawItems - Raw items from the database
 * @returns {Array} Normalized items for radar rendering
 */
export const parseRadarItems = (rawItems: RadarItem[]) => {
  return rawItems.map(item => normalizeItem(item));
};

/**
 * Normalizes a single item
 */
const normalizeItem = (rawItem: RadarItem) => {
  const categoryKey = rawItem.category?.trim();
  const category = (radarConfig.categories as any)[categoryKey];
  const distance = (radarConfig.distances as any)[rawItem.distance];
  const impact = (radarConfig.impacts as any)[rawItem.impact] || (radarConfig.impacts as any)[radarConfig.defaults.impact];
  const tolerance = (radarConfig.tolerances as any)[rawItem.tolerance] || (radarConfig.tolerances as any)[radarConfig.defaults.tolerance];

  if (!category) console.warn(`[RadarParser] Unknown category: "${rawItem.category}" for item ${rawItem.name}`);
  if (!distance) console.warn(`[RadarParser] Unknown distance: "${rawItem.distance}" for item ${rawItem.name}`);

  let opportunityClass = styles.opportunityLow;
  switch (impact.opportunityClass) {
    case 'opportunityLow': opportunityClass = styles.opportunityLow; break;
    case 'opportunityMedium': opportunityClass = styles.opportunityMedium; break;
    case 'opportunityHigh': opportunityClass = styles.opportunityHigh; break;
  }

  // Map category to quadrant index
  const quadrantIndex = category?.quadrantIndex ?? 0;

  const normalizedItem = {
    id: rawItem.id,
    name: rawItem.name,
    type: rawItem.type,
    zoom_in: rawItem.zoom_in,

    quadrantIndex,            
    radiusMultiplier: distance?.radiusMultiplier ?? 1.0,

    color: impact.color,
    size: tolerance.radius,
    opportunityClass,

    raw: {
      ...rawItem
    }
  };

  return normalizedItem;
};



/**
 * Groups items by quadrant and distance for positioning
 * @param {Array} normalizedItems - Items from parseRadarItems
 * @returns {Object} Grouped items keyed by "quadrantIndex-radiusMultiplier"
 */
export const groupItemsForPositioning = (normalizedItems: any[]) => {
  return normalizedItems.reduce((acc, item) => {
    const key = `${item.quadrantIndex}-${item.radiusMultiplier}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as {[key: string]: any[]});
};

/**
 * Calculate position for an item within its group
 * @param {Object} item - Normalized item
 * @param {number} indexInGroup - Index within the group
 * @param {number} totalInGroup - Total items in the group
 * @param {number} radius - Chart radius
 * @returns {Object} {x, y} coordinates
 */
export const calculateItemPosition = (item: any, indexInGroup: number, totalInGroup: number, radius: number) => {
    const quadrantAngleStart = (Math.PI / 2) * item.quadrantIndex;
    
    // Add a small offset from the edge to avoid items on the lines
    const anglePadding = Math.PI / 18; // 10 degrees in radians
    
    // Spread items within the quadrant, leaving padding
    const availableAngle = (Math.PI / 2) - (2 * anglePadding);
    const angleStep = availableAngle / (totalInGroup > 1 ? totalInGroup -1 : 1);
    
    let angle;
    if (totalInGroup === 1) {
        // Center the single item
        angle = quadrantAngleStart + Math.PI / 4;
    } else {
        angle = quadrantAngleStart + anglePadding + (angleStep * indexInGroup);
    }
    
    const distRadius = radius * item.radiusMultiplier;

    const finalX = distRadius * Math.cos(angle);
    const finalY = distRadius * Math.sin(angle);
    
    // D3's coordinate system has Y increasing downwards.
    // Our quadrants start top-right (quadrant 0) and go clockwise.
    // Visual mapping needs to be adjusted based on D3's default angle calculation.
    // Let's adjust based on expected visual quadrants (Top-Right, Top-Left, Bottom-Left, Bottom-Right)
    
    const visualAngle = angle - (Math.PI/2); // Rotate by -90 degrees

    return {
        x: distRadius * Math.cos(visualAngle),
        y: distRadius * Math.sin(visualAngle)
    };
};

/**
 * Get category labels with positions
 * @param {number} radius - Chart radius
 * @returns {Array} Category label data
 */
export const getCategoryLabels = (radius: number) => {
  return Object.entries(radarConfig.categories).map(([categoryName, config]: [string, any]) => {
    const { quadrantIndex, label, labelPosition } = config;
    let x = 0;
    let y = 0;

    return { text: label, x, y, anchor: 'middle' };
  });
};


export default {
  parseRadarItems,
  groupItemsForPositioning,
  calculateItemPosition,
  getCategoryLabels
};
