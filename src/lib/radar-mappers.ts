import type { RadarItem, RadarCategory, RadarDistance, RadarItemType, RadarImpact, RadarRisk } from './types';

// --- Translation Layer ---

// Quadrants (from Categories)
type RadarQuadrantId = 'QUADRANT_1' | 'QUADRANT_2' | 'QUADRANT_3' | 'QUADRANT_4';
export interface RadarQuadrant {
    id: RadarQuadrantId;
    name: RadarCategory;
    startAngle: number;
    endAngle: number;
}
export const radarQuadrants: RadarQuadrant[] = [
    { id: 'QUADRANT_1', name: 'Business', startAngle: 0, endAngle: Math.PI / 2 },
    { id: 'QUADRANT_2', name: 'Operating Model', startAngle: Math.PI / 2, endAngle: Math.PI },
    { id: 'QUADRANT_3', name: 'Capabilities', startAngle: Math.PI, endAngle: 3 * Math.PI / 2 },
    { id: 'QUADRANT_4', name: 'People & Knowledge', startAngle: 3 * Math.PI / 2, endAngle: 2 * Math.PI },
];

const categoryToQuadrant: Record<RadarCategory, RadarQuadrantId> = {
    'Business': 'QUADRANT_1',
    'Operating Model': 'QUADRANT_2',
    'Capabilities': 'QUADRANT_3',
    'People & Knowledge': 'QUADRANT_4',
};

// Rings (from Distances)
type RadarRingId = 'RING_0' | 'RING_1' | 'RING_2' | 'RING_3';
export interface RadarRing {
    id: RadarRingId;
    name: RadarDistance;
    radius: number; // 0 to 1
}
export const radarRings: RadarRing[] = [
    { id: 'RING_0', name: 'Responding', radius: 0.4 },
    { id: 'RING_1', name: 'Assessed', radius: 0.6 },
    { id: 'RING_2', name: 'Assessing', radius: 0.8 },
    { id: 'RING_3', name: 'Detected', radius: 1.0 },
];
const distanceToRing: Record<RadarDistance, RadarRingId | null> = {
    'Detected': 'RING_3',
    'Assessing': 'RING_2',
    'Assessed': 'RING_1',
    'Responding': 'RING_0',
    'Responded': null, // Will be filtered out
};


// Shape (from Type)
type RadarShape = 'TRIANGLE' | 'CIRCLE';
const typeToShape: Record<RadarItemType, RadarShape> = {
    'Threat': 'TRIANGLE',
    'Opportunity': 'CIRCLE',
};

// Size (from Impact)
const impactToSize: Record<RadarImpact, number> = {
    'Low': 8,
    'Medium': 12,
    'High': 16,
};

// Color (from Risk)
const riskToColor: Record<RadarRisk, string> = {
    'High': '#ef4444',    // Red
    'Medium': '#f97316',  // Amber
    'Low': '#16a34a',     // Green
};


// --- Mapped Item Type ---
export interface MappedRadarItem {
    id: string;
    name: string;
    quadrant: RadarQuadrantId;
    ring: RadarRingId;
    shape: RadarShape;
    size: number;
    color: string;
    // For tooltip display
    impactName: RadarImpact;
    riskLevel: RadarRisk;
}


// --- Mapper Function ---
export function mapRadarItems(items: RadarItem[]): MappedRadarItem[] {
    return items
        .map(item => {
            const ringId = distanceToRing[item.distance];
            if (ringId === null) {
                return null; // Filter out 'Responded' items
            }

            return {
                id: item.id,
                name: item.name,
                quadrant: categoryToQuadrant[item.category],
                ring: ringId,
                shape: typeToShape[item.type],
                size: impactToSize[item.impact],
                color: riskToColor[item.risk],
                impactName: item.impact,
                riskLevel: item.risk,
            };
        })
        .filter((item): item is MappedRadarItem => item !== null);
}
