
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as d3 from 'd3';
import { GetRadarName } from './GetRadarData';
import styles from './RadarChart.module.css';
import zoomStyles from './zoom.module.css';
import tooltipStyles from './RadarToolTip.module.css';
import { radarConfig } from './RadarConfig';
import { 
    parseRadarItems, 
    groupItemsForPositioning, 
    calculateItemPosition,
} from './radarDataParser';

const RadarChart: React.FC<{ items: any[], radius: number, onEditClick: (item: any) => void, onCreateClick: () => void }> = ({ items, radius, onEditClick, onCreateClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipData, setTooltipData] = useState({ visible: false, item: null as any | null });
    const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);
    const router = useRouter();

    const handleQuadrantZoom = (idx: number) => {
        setActiveQuadrant(activeQuadrant === idx ? null : idx);
    };

    const handleReset = () => setActiveQuadrant(null);
    
    const handleZoomInClick = (url: string) => {
        if (url) {
            router.push(url);
        }
    };

    const quadrantLabels = Object.values(radarConfig.categories)
    .sort((a, b) => a.label.localeCompare(b.label)) 
    .map(category => ({
        label: category.label,
        configIndex: category.quadrantIndex
    }));

    const drawQuadrants = (g: d3.Selection<SVGGElement, unknown, null, undefined>, radius: number) => {
        const visualQuadrantColors = [
            radarConfig.visual.quadrantColors[3],
            radarConfig.visual.quadrantColors[2],
            radarConfig.visual.quadrantColors[1],
            radarConfig.visual.quadrantColors[0],
        ];

        visualQuadrantColors.forEach((color, i) => {
            g.append("path")
                .attr("d", d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius)
                    .startAngle((Math.PI / 2) * i)
                    .endAngle((Math.PI / 2) * (i + 1)) as any
                )
                .attr("fill", color)
                .attr("stroke", radarConfig.visual.gridColor)
                .attr("data-quadrant", i); 
        });
    };

    const drawCategoryLabels = (g: d3.Selection<SVGGElement, unknown, null, undefined>, radius: number) => {
        const offset = radius * 1.15; // Place labels just outside the main circle
        Object.values(radarConfig.categories).forEach(cat => {
            const angle = ((Math.PI / 2) * cat.quadrantIndex) + (Math.PI / 4); // Center angle of the quadrant
            const x = offset * Math.cos(angle);
            const y = offset * Math.sin(angle);
            
            g.append("text")
                .attr("x", x) 
                .attr("y", y)
                .attr("text-anchor", "middle")
                .text(cat.label)
                .classed(styles.categoryLabel, true)
                .attr("data-quadrant", cat.quadrantIndex);
        });
    };

    const drawRadarGrid = (g: d3.Selection<SVGGElement, unknown, null, undefined>, radius: number) => {
        radarConfig.visual.distanceRings.forEach(multiplier => {
            g.append("circle")
                .attr("r", radius * multiplier)
                .classed(styles.radarGridCircle, true)
                .classed(multiplier === 1 ? styles.radarGridCircleOuter : styles.radarGridCircleInner, true);
        });
        for (let i = 0; i < radarConfig.visual.numberOfRadialLines; i++) {
            const angle = (Math.PI * 2 / radarConfig.visual.numberOfRadialLines) * i;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            g.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", y)
                .classed(styles.radialLine, true);
        }
    };
    
    const renderItems = (g: d3.Selection<SVGGElement, unknown, null, undefined>, groupedItems: { [key: string]: any[] }, radius: number) => {
        Object.entries(groupedItems).forEach(([categoryKey, items]) => {
            items.forEach((item, index) => {
                const position = calculateItemPosition(item, index, items.length, radius);
                renderSingleItem(g, item, position);
            });
        });
    };

    const renderSingleItem = (g: d3.Selection<SVGGElement, unknown, null, undefined>, item: any, position: { x: number, y: number }) => {
        const { x, y } = position;
        const size = item.size;
        
        const itemGroup = g.append('g')
                            .classed(styles.itemGroup, true)
                            .attr("data-quadrant", item.quadrantIndex);
        
        itemGroup
            .on('mouseover', async function () {
                d3.select(this).select('circle').attr('r', size * 2);
                let zoomData = null;
                if (item.zoom_in) {
                    const urlParts = item.zoom_in.split('/');
                    const orgId = urlParts[2];
                    const radarName = await fetchRadarName(orgId);
                    zoomData = { id: item.zoom_in, name: radarName };
                }
                setTooltipData({ visible: true, item: { ...item, zoom_in: zoomData } });
            })
            .on('mouseout', function () {
                d3.select(this).select('circle').attr('r', size);
            });

        if (item.type === 'Opportunity') drawOpportunity(itemGroup, item, x, y, size);
        else drawThreat(itemGroup, item, x, y, size);

        itemGroup.append('text')
            .attr('x', x)
            .attr('y', y - size - 5)
            .text(item.name)
            .classed(styles.chartTextNormal, true);
    };
    
    const fetchRadarName = async (orgId: string) => await GetRadarName(orgId);
    
    const getImpactClass = (impact: string) => {
        switch (impact) {
            case 'Low': return styles.lowImpact;
            case 'Medium': return styles.mediumImpact;
            case 'High': return styles.highImpact;
            default: return styles.defaultImpact;
        }
    };

    const darkenColor = (color: string, percent: number) => {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = ((num >> 8) & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return `#${(0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1)}`;
    };

    const drawOpportunity = (group: d3.Selection<SVGGElement, unknown, null, undefined>, item: any, x: number, y: number, size: number) => {
        const color = item.color || '#00cc88';
        const impactClass = getImpactClass(item.raw?.impact);
        group.append('circle').attr('cx', x).attr('cy', y).attr('r', size).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('class', impactClass || styles.defaultImpact);
        group.append('circle').attr('cx', x).attr('cy', y).attr('r', size * 0.7).attr('fill', color).attr('stroke', 'none').attr('class', impactClass || styles.defaultImpact);
    };

    const drawThreat = (group: d3.Selection<SVGGElement, unknown, null, undefined>, item: any, x: number, y: number, size: number) => {
        group.append('circle').attr('cx', x).attr('cy', y).attr('r', size).attr('fill', item.color).attr('stroke', 'none');
        const triangleSize = size * 0.6;
        const trianglePoints = [
            [x, y - triangleSize],
            [x - triangleSize * 0.866, y + triangleSize * 0.5],
            [x + triangleSize * 0.866, y + triangleSize * 0.5],
        ];
        group.append('polygon').attr('points', trianglePoints.map(p => p.join(',')).join(' ')).attr('fill', darkenColor(item.color, -20));
    };


    useEffect(() => {
        if (!svgRef.current) return;
        const padding = 20;
        const svgSize = radius * 2 + 120; // Added padding for labels
        const totalWidth = svgSize + padding * 2;
        const zoomFactor = 2;
        
        const shiftFactor = 0.5;

        const svg = d3.select(svgRef.current)
            .attr('width', totalWidth)
            .attr('height', svgSize);

        svg.selectAll('*').remove();
        svg.append('defs').html(`
            <radialGradient id="g">
                <stop stop-color="#00f" offset="0.1"/>
                <stop stop-color="rgba(0,0,255,0.5)" offset="0.8"/>
            </radialGradient>
            <filter id="sofGlow" width="300%" height="300%" x="-100%" y="-100%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blurred" />
            </filter>
        `);
        const g = svg.append('g').attr('class', 'main-radar-group');
        
        let transformString = `translate(${totalWidth / 2}, ${svgSize / 2})`;

        if (activeQuadrant !== null) {
            let tX = 0, tY = 0;
            const translationValue = radius * shiftFactor;
            
            switch (activeQuadrant) {
                case 0: tX = -translationValue; tY = -translationValue; break; 
                case 1: tX = translationValue;  tY = -translationValue; break; 
                case 2: tX = translationValue;  tY = translationValue; break;  
                case 3: tX = -translationValue; tY = translationValue; break;  
            }

            transformString = `translate(${totalWidth / 2}, ${svgSize / 2}) scale(${zoomFactor}) translate(${tX}, ${tY})`;
        }
        
        drawQuadrants(g, radius);
        drawCategoryLabels(g, radius);
        drawRadarGrid(g, radius);
        
        const normalizedItems = parseRadarItems(items);
        const groupedItems = groupItemsForPositioning(normalizedItems);
        
        renderItems(g, groupedItems, radius);

        g.transition()
            .duration(750)
            .attr('transform', transformString);
            
    }, [items, radius, activeQuadrant]);

    useEffect(() => {
        if (tooltipData.visible && tooltipData.item && tooltipRef.current) {
            tooltipRef.current.classList.remove(styles.blink);
            void tooltipRef.current.offsetWidth;
            tooltipRef.current.classList.add(styles.blink);
        }
    }, [tooltipData.item?.id]);

    return (
        <div className={styles.centeringWrapper}>
            <div className={styles.middlePanel}>
                <svg ref={svgRef} className={styles.radarWrapper}></svg>
            </div>
            <div className={styles.leftPanel}>
                <button className={styles.createButton} onClick={onCreateClick}>
                    Create Radar Item
                </button>
                <div className={zoomStyles.zoomControls}>
                    <span className={zoomStyles.zoomTitle}>Zoom into a quadrant:</span>
                    
                    {quadrantLabels.map((category, idx) => ( 
                            <button 
                                key={idx} 
                                className={`${zoomStyles.zoomButton} ${activeQuadrant === category.configIndex ? zoomStyles.active : ''}`} 
                                onClick={() => handleQuadrantZoom(category.configIndex)} 
                            >
                                {category.label}
                            </button>
                        ))}

                    {activeQuadrant !== null && (
                        <button className={`${zoomStyles.zoomButton} ${zoomStyles.resetButton}`} onClick={handleReset}>
                            ↺ Show All
                        </button>
                    )}
                </div>
                <div className={tooltipStyles.tooltipPanel} 
                    onMouseEnter={() => {}}
                    onMouseLeave={() => setTooltipData({ visible: false, item: null })}
                >
                    {tooltipData.visible && tooltipData.item ? (
                        <div ref={tooltipRef} className={tooltipStyles.tooltip}>
                            <div className={tooltipStyles.row}><span className={tooltipStyles.label}>Name:</span><span className={tooltipStyles.value}>{tooltipData.item.name}</span></div>
                            <div className={tooltipStyles.row}><span className={tooltipStyles.label}>Type:</span><span className={tooltipStyles.value}>{tooltipData.item.type}</span></div>
                            <div className={tooltipStyles.row}><span className={tooltipStyles.label}>Category:</span><span className={tooltipStyles.value}>{tooltipData.item.raw.category}</span></div>
                            <div className={tooltipStyles.row}><span className={tooltipStyles.label}>Distance:</span><span className={tooltipStyles.value}>{tooltipData.item.raw.distance}</span></div>
                            <div className={tooltipStyles.row}><span className={tooltipStyles.label}>Impact:</span><span className={tooltipStyles.value}>{tooltipData.item.raw.impact}</span></div>
                            <div className={tooltipStyles.row}><span className={tooltipStyles.label}>Tolerance:</span><span className={tooltipStyles.value}>{tooltipData.item.raw.tolerance}</span></div>
                            {tooltipData.item.zoom_in && (
                                <div className={tooltipStyles.row}>
                                    <span className={tooltipStyles.label}>Zoom to:</span>
                                    <span 
                                        className={tooltipStyles.link} 
                                        onClick={() => handleZoomInClick(tooltipData.item.zoom_in.id)}
                                    >
                                        {tooltipData.item.zoom_in.name}
                                    </span>
                                </div>
                            )}
                            {onEditClick && (
                                <button className={tooltipStyles.editButton} onClick={() => onEditClick(tooltipData.item)}>
                                    <span className={tooltipStyles.editIcon}>✏️</span><span>Edit</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={tooltipStyles.tooltipPlaceholder}>Hover over items to see details</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RadarChart;

    
