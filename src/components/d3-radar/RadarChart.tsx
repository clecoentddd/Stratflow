
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
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

const RadarChart: React.FC<{ items: any[], radius: number, onEditClick: (item: any) => void }> = ({ items, radius, onEditClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipData, setTooltipData] = useState({ visible: false, item: null as any | null });
    const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);
    const router = useRouter();

    const handleQuadrantZoom = useCallback((idx: number) => {
        const svg = d3.select(svgRef.current);
        const zoomBehavior = (svg.node() as any).__zoom;
        if (!zoomBehavior) return;

        const newActiveQuadrant = activeQuadrant === idx ? null : idx;
        setActiveQuadrant(newActiveQuadrant);

        const transition = svg.transition().duration(750);
        const centerX = parseFloat(svg.attr('width')) / 2;
        const centerY = parseFloat(svg.attr('height')) / 2;

        if (newActiveQuadrant !== null) {
            const scale = 2;
            const quadrantCenterRadius = radius / 2;
            const angle = (Math.PI / 2) * newActiveQuadrant + Math.PI / 4;
            
            const newTransform = d3.zoomIdentity
                .translate(centerX, centerY)
                .scale(scale)
                .translate(-quadrantCenterRadius * Math.cos(angle), -quadrantCenterRadius * Math.sin(angle));

            transition.call(zoomBehavior.transform, newTransform);
        } else {
            transition.call(zoomBehavior.transform, d3.zoomIdentity.translate(centerX, centerY)); // Reset zoom to centered
        }
    }, [activeQuadrant, radius]);

    const handleReset = useCallback(() => {
        const svg = d3.select(svgRef.current);
        const zoomBehavior = (svg.node() as any).__zoom;
        if (zoomBehavior) {
             const centerX = parseFloat(svg.attr('width')) / 2;
             const centerY = parseFloat(svg.attr('height')) / 2;
             const initialTransform = d3.zoomIdentity.translate(centerX, centerY);
             svg.transition().duration(750).call(zoomBehavior.transform, initialTransform);
        }
        setActiveQuadrant(null);
    }, []);
    
    const handleZoomInClick = (url: string) => {
        if (url) {
            router.push(url);
        }
    };

    const quadrantLabels = Object.values(radarConfig.categories)
    .sort((a, b) => a.quadrantIndex - b.quadrantIndex) // Ensure order is 0, 1, 2, 3
    .map(category => ({
        label: category.label,
        configIndex: category.quadrantIndex
    }));

    const drawQuadrants = (g: d3.Selection<SVGGElement, unknown, null, undefined>, radius: number) => {
        g.selectAll(".quadrant-fill").remove();

        const visualQuadrantColors = [
            radarConfig.visual.quadrantColors[0], // People & Knowledge (Bottom-Right)
            radarConfig.visual.quadrantColors[1], // Operating Model (Bottom-Left)
            radarConfig.visual.quadrantColors[2], // Business (Top-Left)
            radarConfig.visual.quadrantColors[3]  // Capabilities (Top-Right)
        ];
    
        visualQuadrantColors.forEach((color, i) => {
            const path = d3.arc()
                .innerRadius(0)
                .outerRadius(radius)
                .startAngle((Math.PI / 2) * i)
                .endAngle((Math.PI / 2) * (i + 1));
            
            g.append("path")
                .attr("d", path as any)
                .attr("fill", color)
                .attr("stroke", radarConfig.visual.gridColor)
                .attr("data-quadrant", i);
        });
    };

    const drawCategoryLabels = (g: d3.Selection<SVGGElement, unknown, null, undefined>, radius: number) => {
        const offset = radius * 1.05; 

        Object.values(radarConfig.categories).forEach(cat => {
            const angle = (Math.PI / 2) * cat.quadrantIndex + (Math.PI / 4); 
            
            let x = offset * Math.cos(angle);
            let y = offset * Math.sin(angle);
            
            // Further adjust y for top/bottom placement
            if (cat.quadrantIndex === 2 || cat.quadrantIndex === 3) { // Top quadrants
                y *= 1.2;
            } else { // Bottom quadrants
                y *= 1.2;
            }

            g.append("text")
                .attr("x", x) 
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em") 
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
        const svgSize = radius * 2 + 120;
        const totalWidth = svgSize + padding * 2;
        
        const svg = d3.select(svgRef.current)
            .attr('width', totalWidth)
            .attr('height', svgSize);

        svg.selectAll('*').remove();
        
        const g = svg.append('g').attr('class', 'main-radar-group');
        const centerX = totalWidth / 2;
        const centerY = svgSize / 2;
        
        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 8])
            .on("zoom", (event) => {
                g.attr('transform', event.transform.toString());
            });

        svg.call(zoomBehavior);
        (svg.node() as any).__zoom = zoomBehavior;

        // Apply initial transform to center the group without triggering a zoom event
        const initialTransform = d3.zoomIdentity.translate(centerX, centerY);
        zoomBehavior.transform(svg as any, initialTransform);
        
        drawQuadrants(g, radius);
        drawCategoryLabels(g, radius);
        drawRadarGrid(g, radius);
        
        if (items && items.length > 0) {
            const normalizedItems = parseRadarItems(items);
            const groupedItems = groupItemsForPositioning(normalizedItems);
            renderItems(g, groupedItems, radius);
        }
            
    }, [items, radius, router]);

    // This effect handles the visual opacity change when a quadrant is zoomed
    useEffect(() => {
        if (!svgRef.current) return;
        const g = d3.select(svgRef.current).select('g.main-radar-group');
        const allElements = g.selectAll('path, circle, line, text, g');
        
        if (activeQuadrant !== null) {
            allElements.each(function() {
                const el = d3.select(this);
                const quad = el.attr('data-quadrant');
                if (quad && +quad !== activeQuadrant) {
                    el.transition().duration(300).style('opacity', 0.1);
                } else {
                    el.transition().duration(300).style('opacity', 1);
                }
            });
        } else {
            allElements.transition().duration(300).style('opacity', 1);
        }
    }, [activeQuadrant]);


    useEffect(() => {
        if (tooltipData.visible && tooltipData.item && tooltipRef.current) {
            tooltipRef.current.classList.remove(tooltipStyles.blink);
            void tooltipRef.current.offsetWidth;
            tooltipRef.current.classList.add(tooltipStyles.blink);
        }
    }, [tooltipData.item?.id]);

    return (
        <div className={styles.centeringWrapper}>
            <div className={styles.middlePanel}>
                <svg ref={svgRef} className={styles.radarWrapper}></svg>
            </div>
            <div className={styles.leftPanel}>
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

    

    




    










