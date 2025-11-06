
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as d3 from 'd3';
import { GetRadarName } from './GetRadarData';
import styles from './radar-styles.module.css';
import { radarConfig, LEGEND1, LEGEND2, LEGEND3 } from './RadarConfig';
import { 
    parseRadarItems, 
    groupItemsForPositioning, 
    calculateItemPosition,
} from './radarDataParser';

const RadarChart: React.FC<{ 
  items: any[], 
  radius: number, 
  onEditClick: (item: any) => void,
  theme?: 'dark' | 'light' | 'cyberpunk' | 'ocean' | 'sunset'
}> = ({ items, radius, onEditClick, theme = 'dark' }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipData, setTooltipData] = useState({ visible: false, item: null as any | null });
    const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);
    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'cyberpunk' | 'ocean' | 'sunset'>(theme);
    const router = useRouter();

    // Dynamic theme switching
    const getThemeClass = () => {
        switch(currentTheme) {
            case 'cyberpunk': return styles.cyberpunkTheme;
            case 'light': return styles.lightTheme;
            case 'ocean': return styles.oceanTheme;
            case 'sunset': return styles.sunsetTheme;
            case 'dark': 
            default: return styles.darkTheme;
        }
    };

    // Get current theme colors based on selected theme - improved color harmony
    const getCurrentThemeColors = () => {
        switch(currentTheme) {
            case 'cyberpunk':
                return {
                    primary: '#00ff41',
                    secondary: '#39ff14',
                    gridPrimary: '#00ff41',
                    gridSecondary: '#39ff14',
                    quadrantDark: '#001100',
                    quadrantLight: '#002200',
                    textSecondary: '#39ff14'
                };
            case 'light':
                return {
                    primary: '#1d4ed8',
                    secondary: '#2563eb',
                    gridPrimary: '#374151',
                    gridSecondary: '#6b7280',
                    quadrant0: '#dcfce7',    // pastel green
                    quadrant1: '#fecaca',    // pastel red  
                    quadrant2: '#dbeafe',    // pastel blue
                    quadrant3: '#fef3c7',    // pastel yellow
                    quadrantDark: '#dbeafe',
                    quadrantLight: '#fef3c7',
                    textSecondary: '#1e40af'
                };
            case 'ocean':
                return {
                    primary: '#00d4ff',
                    secondary: '#0ea5e9',
                    gridPrimary: '#00d4ff',
                    gridSecondary: '#0ea5e9',
                    quadrantDark: '#001122',
                    quadrantLight: '#002244',
                    textSecondary: '#7dd3fc'
                };
            case 'sunset':
                return {
                    primary: '#a855f7',
                    secondary: '#c084fc',
                    gridPrimary: '#a855f7',
                    gridSecondary: '#c084fc',
                    quadrantDark: '#1e1b4b',
                    quadrantLight: '#312e81',
                    textSecondary: '#c4b5fd'
                };
            case 'dark':
            default:
                return {
                    primary: '#10b981',
                    secondary: '#34d399',
                    gridPrimary: '#10b981',
                    gridSecondary: '#6ee7b7',
                    quadrantDark: '#064e3b',
                    quadrantLight: '#065f46',
                    textSecondary: '#a7f3d0'
                };
        }
    };

    const themes = [
        { key: 'dark', label: '🌙 Dark', emoji: '🌙' },
        { key: 'light', label: '☀️ Light', emoji: '☀️' },
        { key: 'cyberpunk', label: '🎮 Cyberpunk', emoji: '🎮' },
        { key: 'ocean', label: '🌊 Ocean', emoji: '🌊' },
        { key: 'sunset', label: '🌅 Sunset', emoji: '🌅' }
    ] as const;

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
        const themeColors = getCurrentThemeColors();
        console.log('🎨 Theme colors for', currentTheme, ':', themeColors);
        
        // Create gradient definitions for radar-like appearance
        const defs = g.append("defs");
        
        // Radial gradient for quadrants - more pronounced radar effect
        const radialGradient = defs.append("radialGradient")
            .attr("id", `quadrant-gradient-${currentTheme}`)
            .attr("cx", "50%")
            .attr("cy", "50%")
            .attr("r", "70%");
            
        radialGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", themeColors.quadrantLight)
            .attr("stop-opacity", 0.6);
            
        radialGradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", themeColors.quadrantDark)
            .attr("stop-opacity", 0.3);
            
        radialGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", themeColors.quadrantDark)
            .attr("stop-opacity", 0.1);

        // Individual quadrant colors for light theme, alternating pattern for others
        [0, 1, 2, 3].forEach((i) => {
            let fillColor;
            
            if (currentTheme === 'light' && themeColors[`quadrant${i}` as keyof typeof themeColors]) {
                // Use individual pastel colors for light theme
                fillColor = themeColors[`quadrant${i}` as keyof typeof themeColors] as string;
            } else {
                // Use alternating pattern for other themes
                const isLight = i % 2 === 0;
                fillColor = isLight ? `url(#quadrant-gradient-${currentTheme})` : themeColors.quadrantDark;
            }
            
            g.append("path")
                .attr("d", d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius)
                    .startAngle((Math.PI / 2) * i)
                    .endAngle((Math.PI / 2) * (i + 1)) as any
                )
                .attr("fill", fillColor)
                .attr("fill-opacity", currentTheme === 'light' ? 0.6 : (i % 2 === 0 ? 0.8 : 0.4))
                .attr("stroke", themeColors.gridPrimary)
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.6)
                .attr("data-quadrant", i); 
        });
    };

    const drawCategoryLabels = (g: d3.Selection<SVGGElement, unknown, null, undefined>, radius: number) => {
        const themeColors = getCurrentThemeColors();
        const offset = radius * 1.05; // Place labels just outside the main circle
        const verticalPadding = 80;
    
        Object.values(radarConfig.categories).forEach(cat => {
            const angle = ((Math.PI / 2) * cat.quadrantIndex) + (Math.PI / 4); // Center angle of the quadrant
            const x = offset * Math.cos(angle);
            let y = offset * Math.sin(angle);
    
            // Adjust y position: move up for top quadrants, down for bottom quadrants
            if (cat.quadrantIndex === 2 || cat.quadrantIndex === 3) {
                y -= verticalPadding; // Move up
            } else {
                y += verticalPadding; // Move down
            }
            
            g.append("text")
                .attr("x", x) 
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .text(cat.label)
                .attr("fill", themeColors.primary)
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("font-family", "Arial, sans-serif")
                .attr("data-quadrant", cat.quadrantIndex);
        });
    };

    const drawRadarGrid = (g: d3.Selection<SVGGElement, unknown, null, undefined>, radius: number) => {
        const themeColors = getCurrentThemeColors();
        
        // Draw concentric circles with gradient effects
        radarConfig.visual.distanceRings.forEach((multiplier, index) => {
            const isOuter = multiplier === 1;
            const opacity = isOuter ? 0.8 : 0.4 - (index * 0.1);
            
            g.append("circle")
                .attr("r", radius * multiplier)
                .attr("fill", "none")
                .attr("stroke", isOuter ? themeColors.gridPrimary : themeColors.gridSecondary)
                .attr("stroke-width", isOuter ? 2 : 1)
                .attr("stroke-opacity", opacity)
                .attr("filter", isOuter ? `drop-shadow(0 0 8px ${themeColors.gridPrimary}40)` : "none");
        });
        
        // Draw radial lines with gradient effect
        for (let i = 0; i < radarConfig.visual.numberOfRadialLines; i++) {
            const angle = (Math.PI * 2 / radarConfig.visual.numberOfRadialLines) * i;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            // Create a linear gradient for each line
            const lineGradient = g.select("defs").append("linearGradient")
                .attr("id", `line-gradient-${currentTheme}-${i}`)
                .attr("x1", "0%").attr("y1", "0%")
                .attr("x2", "100%").attr("y2", "0%");
                
            lineGradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", themeColors.gridPrimary)
                .attr("stop-opacity", 0.8);
                
            lineGradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", themeColors.gridSecondary)
                .attr("stop-opacity", 0.2);
            
            g.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", y)
                .attr("stroke", `url(#line-gradient-${currentTheme}-${i})`)
                .attr("stroke-width", 1)
                .attr("opacity", 0.5);
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

        const themeColors = getCurrentThemeColors();
        itemGroup.append('text')
            .attr('x', x)
            .attr('y', y - size - 5)
            .text(item.name)
            .attr('fill', themeColors.primary)
            .attr('font-size', '11px')
            .attr('font-family', 'Arial, sans-serif')
            .attr('text-anchor', 'middle');
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
        const themeColors = getCurrentThemeColors();
        const color = item.color || themeColors.primary;
        const impactClass = getImpactClass(item.raw?.impact);
        
        // Visible ring
        group.append('circle').attr('cx', x).attr('cy', y).attr('r', size).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('class', impactClass || styles.defaultImpact);
        
        // Center dot
        group.append('circle').attr('cx', x).attr('cy', y).attr('r', size * 0.7).attr('fill', color).attr('stroke', 'none').attr('class', impactClass || styles.defaultImpact);
    };

    const drawThreat = (group: d3.Selection<SVGGElement, unknown, null, undefined>, item: any, x: number, y: number, size: number) => {
        const themeColors = getCurrentThemeColors();
        const color = item.color || themeColors.primary;
        group.append('circle').attr('cx', x).attr('cy', y).attr('r', size).attr('fill', color).attr('stroke', 'none');
        const triangleSize = size * 0.6;
        const trianglePoints = [
            [x, y - triangleSize],
            [x - triangleSize * 0.866, y + triangleSize * 0.5],
            [x + triangleSize * 0.866, y + triangleSize * 0.5],
        ];
        group.append('polygon').attr('points', trianglePoints.map(p => p.join(',')).join(' ')).attr('fill', darkenColor(color, -20));
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
            // Draw the legend labels above the center at configured radius percentages
            const drawLegends = (g: d3.Selection<SVGGElement, unknown, null, undefined>, radius: number) => {
                const themeColors = getCurrentThemeColors();
                const legends = [LEGEND1, LEGEND2, LEGEND3];
                    legends.forEach(l => {
                        g.append('text')
                            .attr('x', 0)
                            .attr('y', -radius * l.radiusPct)
                            .attr('text-anchor', 'middle')
                            .attr('dominant-baseline', 'middle')
                            .attr('fill', themeColors.primary)
                            .attr('font-size', '12px')
                            .attr('font-family', 'Arial, sans-serif')
                            .text(l.label);
                    });
            };

            drawLegends(g, radius);
        
        if (items && items.length > 0) {
            const normalizedItems = parseRadarItems(items);
            const groupedItems = groupItemsForPositioning(normalizedItems);
            renderItems(g, groupedItems, radius);
        }

        g.transition()
            .duration(750)
            .attr('transform', transformString);
            
    }, [items, radius, activeQuadrant, currentTheme]);

    useEffect(() => {
        if (tooltipData.visible && tooltipData.item && tooltipRef.current) {
            tooltipRef.current.classList.remove(styles.blink);
            void tooltipRef.current.offsetWidth;
            tooltipRef.current.classList.add(styles.blink);
        }
    }, [tooltipData.item?.id]);



    return (
        <div className={`${styles.centeringWrapper} ${getThemeClass()}`}>
            <div className={styles.middlePanel}>
                <svg ref={svgRef} className={styles.radarWrapper}></svg>
            </div>
            <div className={styles.leftPanel}>
                <div className={styles.zoomBar}>
                    {/* Theme Selector */}
                    <div className={styles.zoomControls}>
                        <span className={styles.zoomTitle}>🎨 Theme: {currentTheme}</span>
                        {themes.map((themeOption) => (
                            <button
                                key={themeOption.key}
                                className={`${styles.themeButton} ${currentTheme === themeOption.key ? styles.active : ''}`}
                                onClick={() => {
                                    console.log('🎨 Switching theme to:', themeOption.key);
                                    setCurrentTheme(themeOption.key);
                                }}
                                title={themeOption.label}
                            >
                                {themeOption.emoji} {themeOption.key}
                            </button>
                        ))}
                    </div>

                    {/* Zoom Controls */}
                    <div className={styles.zoomControls}>
                    <span className={styles.zoomTitle}>Zoom into a quadrant:</span>
                    
                    {quadrantLabels.map((category, idx) => ( 
                            <button 
                                key={idx} 
                                className={`${styles.zoomButton} ${activeQuadrant === category.configIndex ? styles.active : ''}`} 
                                onClick={() => handleQuadrantZoom(category.configIndex)} 
                            >
                                {category.label}
                            </button>
                        ))}

                    {activeQuadrant !== null && (
                        <button className={`${styles.zoomButton} ${styles.resetButton}`} onClick={handleReset}>
                            ↺ Show All
                        </button>
                    )}
                    </div>
                </div>
                <div className={styles.tooltipPanel} 
                    onMouseEnter={() => {}}
                    onMouseLeave={() => setTooltipData({ visible: false, item: null })}
                >
                    {tooltipData.visible && tooltipData.item ? (
                        <div ref={tooltipRef} className={styles.tooltip}>
                            <div className={styles.row}><span className={styles.label}>Name:</span><span className={styles.value}>{tooltipData.item.name}</span></div>
                            <div className={styles.row}><span className={styles.label}>Type:</span><span className={styles.value}>{tooltipData.item.type}</span></div>
                            <div className={styles.row}><span className={styles.label}>Category:</span><span className={styles.value}>{tooltipData.item.raw.category}</span></div>
                            <div className={styles.row}><span className={styles.label}>Distance:</span><span className={styles.value}>{tooltipData.item.raw.distance}</span></div>
                            <div className={styles.row}><span className={styles.label}>Impact:</span><span className={styles.value}>{tooltipData.item.raw.impact}</span></div>
                            <div className={styles.row}><span className={styles.label}>Tolerance:</span><span className={styles.value}>{tooltipData.item.raw.tolerance}</span></div>
                            {tooltipData.item.zoom_in && (
                                <div className={styles.row}>
                                    <span className={styles.label}>Zoom to:</span>
                                    <span 
                                        className={styles.link} 
                                        onClick={() => handleZoomInClick(tooltipData.item.zoom_in.id)}
                                    >
                                        {tooltipData.item.zoom_in.name}
                                    </span>
                                </div>
                            )}
                            {onEditClick && (
                                <button className={styles.editButton} onClick={() => onEditClick(tooltipData.item)}>
                                    <span className={styles.editIcon}>✏️</span><span>Edit</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.tooltipPlaceholder}>Hover over items to see details</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RadarChart;

    



    

    


