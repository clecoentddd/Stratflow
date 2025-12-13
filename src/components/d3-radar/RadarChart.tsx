
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
import { radarTooltipCopy, radarTooltipLabels } from '@/lib/radar/viewModel';

type ThemeTokens = {
    primary: string;
    secondary: string;
    gridPrimary: string;
    gridSecondary: string;
    quadrantDark: string;
    quadrantLight: string;
    textSecondary: string;
    textMuted: string;
    quadrantPalette: string[];
};

const defaultThemeTokens: ThemeTokens = {
    primary: '#10b981',
    secondary: '#34d399',
    gridPrimary: '#10b981',
    gridSecondary: '#6ee7b7',
    quadrantDark: '#064e3b',
    quadrantLight: '#065f46',
    textSecondary: '#a7f3d0',
    textMuted: '#9ca3af',
    quadrantPalette: ['', '', '', ''],
};

type ThemeOption = {
    key: string;
    label: string;
    emoji: string;
};

const sanitizeCssVar = (raw: string, fallback: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return fallback;
    const isQuoted = (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"));
    if (isQuoted) {
        const unquoted = trimmed.slice(1, -1).trim();
        return unquoted || fallback;
    }
    return trimmed;
};

const readCssVar = (computed: CSSStyleDeclaration, name: string, fallback: string): string => {
    const raw = computed.getPropertyValue(name);
    return raw ? sanitizeCssVar(raw, fallback) : fallback;
};

const resolveThemeTokens = (element: HTMLElement | null): ThemeTokens => {
    if (!element) return defaultThemeTokens;
    const computed = getComputedStyle(element);
    return {
        primary: readCssVar(computed, '--radar-primary', defaultThemeTokens.primary),
        secondary: readCssVar(computed, '--radar-secondary', defaultThemeTokens.secondary),
        gridPrimary: readCssVar(computed, '--radar-grid-primary', defaultThemeTokens.gridPrimary),
        gridSecondary: readCssVar(
            computed,
            '--radar-grid-secondary',
            readCssVar(computed, '--radar-grid-primary', defaultThemeTokens.gridPrimary)
        ),
        quadrantDark: readCssVar(computed, '--radar-quadrant-dark', defaultThemeTokens.quadrantDark),
        quadrantLight: readCssVar(computed, '--radar-quadrant-light', defaultThemeTokens.quadrantLight),
        textSecondary: readCssVar(computed, '--radar-text-secondary', defaultThemeTokens.textSecondary),
        textMuted: readCssVar(computed, '--radar-text-muted', defaultThemeTokens.textMuted),
        quadrantPalette: [0, 1, 2, 3].map(idx => readCssVar(computed, `--radar-quadrant-${idx}`, '')),
    };
};

const readThemeRegistry = (element: HTMLElement | null): ThemeOption[] => {
    if (!element) return [];
    const computed = getComputedStyle(element);
    const rawKeys = readCssVar(computed, '--radar-theme-keys', '');
    if (!rawKeys) return [];
    const keys = rawKeys.split(',').map(key => key.trim()).filter(Boolean);
    return keys.map((key) => ({
        key,
        label: readCssVar(computed, `--radar-theme-${key}-label`, key),
        emoji: readCssVar(computed, `--radar-theme-${key}-emoji`, '🎨'),
    }));
};

type RadarChartProps = {
    items: any[];
    radius: number;
    onEditClick: (item: any) => void;
    theme?: string;
};

const DEFAULT_THEME_KEY = 'dark';

const RadarChart: React.FC<RadarChartProps> = ({ items, radius, onEditClick, theme = DEFAULT_THEME_KEY }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const themeRootRef = useRef<HTMLDivElement>(null);
    const [tooltipData, setTooltipData] = useState({ visible: false, item: null as any | null });
    const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);
    const [currentTheme, setCurrentTheme] = useState<string>(theme);
    const [availableThemes, setAvailableThemes] = useState<ThemeOption[]>([]);
    const router = useRouter();

    // Dynamic theme switching
    const getThemeClass = () => {
        const themeStyles = styles as Record<string, string>;
        return themeStyles[`${currentTheme}Theme`] ?? themeStyles[`${DEFAULT_THEME_KEY}Theme`];
    };

    useEffect(() => {
        if (!themeRootRef.current) return;
        const registry = readThemeRegistry(themeRootRef.current);
        if (!registry.length) return;

        setAvailableThemes(registry);

        setCurrentTheme((prev) => {
            if (theme && registry.some(option => option.key === theme)) return theme;
            if (registry.some(option => option.key === prev)) return prev;
            return registry[0]?.key ?? DEFAULT_THEME_KEY;
        });
    }, [theme]);

    const activeThemeMeta = availableThemes.find(option => option.key === currentTheme);
    const currentThemeLabel = activeThemeMeta?.label ?? currentTheme;

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

    const drawQuadrants = (
        g: d3.Selection<SVGGElement, unknown, null, undefined>,
        radius: number,
        themeColors: ThemeTokens,
        themeKey: string
    ) => {
        const defs = g.append("defs");
        const gradientId = `quadrant-gradient-${themeKey}`;

        const radialGradient = defs.append("radialGradient")
            .attr("id", gradientId)
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
            const customQuadrant = themeColors.quadrantPalette[i];
            const useCustom = Boolean(customQuadrant);
            const isEven = i % 2 === 0;
            const fillColor = useCustom ? customQuadrant : (isEven ? `url(#${gradientId})` : themeColors.quadrantDark);
            const opacity = useCustom ? 0.65 : (isEven ? 0.8 : 0.4);
            
            g.append("path")
                .attr("d", d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius)
                    .startAngle((Math.PI / 2) * i)
                    .endAngle((Math.PI / 2) * (i + 1)) as any
                )
                .attr("fill", fillColor)
                .attr("fill-opacity", opacity)
                .attr("stroke", themeColors.gridPrimary)
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.6)
                .attr("data-quadrant", i); 
        });
    };

    const drawCategoryLabels = (
        g: d3.Selection<SVGGElement, unknown, null, undefined>,
        radius: number,
        themeColors: ThemeTokens
    ) => {
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

    const drawRadarGrid = (
        g: d3.Selection<SVGGElement, unknown, null, undefined>,
        radius: number,
        themeColors: ThemeTokens,
        themeKey: string
    ) => {
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
            const existingDefs = g.select('defs');
            const defs = existingDefs.empty() ? g.append('defs') : existingDefs;
            const lineGradient = defs.append("linearGradient")
                .attr("id", `line-gradient-${themeKey}-${i}`)
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
                .attr("stroke", `url(#line-gradient-${themeKey}-${i})`)
                .attr("stroke-width", 1)
                .attr("opacity", 0.5);
        }
    };
    
    const renderItems = (
        g: d3.Selection<SVGGElement, unknown, null, undefined>,
        groupedItems: { [key: string]: any[] },
        radius: number,
        themeColors: ThemeTokens
    ) => {
        Object.entries(groupedItems).forEach(([categoryKey, items]) => {
            items.forEach((item, index) => {
                const position = calculateItemPosition(item, index, items.length, radius);
                renderSingleItem(g, item, position, themeColors);
            });
        });
    };

    const renderSingleItem = (
        g: d3.Selection<SVGGElement, unknown, null, undefined>,
        item: any,
        position: { x: number, y: number },
        themeColors: ThemeTokens
    ) => {
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

        if (item.type === 'Opportunity') drawOpportunity(itemGroup, item, x, y, size, themeColors);
        else drawThreat(itemGroup, item, x, y, size, themeColors);

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

    const drawOpportunity = (
        group: d3.Selection<SVGGElement, unknown, null, undefined>,
        item: any,
        x: number,
        y: number,
        size: number,
        themeColors: ThemeTokens
    ) => {
        const color = item.color || themeColors.primary;
        const impactClass = getImpactClass(item.raw?.impact);
        
        // Visible ring
        group.append('circle').attr('cx', x).attr('cy', y).attr('r', size).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('class', impactClass || styles.defaultImpact);
        
        // Center dot
        group.append('circle').attr('cx', x).attr('cy', y).attr('r', size * 0.7).attr('fill', color).attr('stroke', 'none').attr('class', impactClass || styles.defaultImpact);
    };

    const drawThreat = (
        group: d3.Selection<SVGGElement, unknown, null, undefined>,
        item: any,
        x: number,
        y: number,
        size: number,
        themeColors: ThemeTokens
    ) => {
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

    const drawLegends = (
        g: d3.Selection<SVGGElement, unknown, null, undefined>,
        radius: number,
        themeColors: ThemeTokens
    ) => {
        const legends = [LEGEND1, LEGEND2, LEGEND3];
        const legendColor = themeColors.textMuted || defaultThemeTokens.textMuted;

        legends.forEach(l => {
            g.append('text')
                .attr('x', 0)
                .attr('y', -radius * l.radiusPct)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('fill', legendColor)
                .attr('font-size', '12px')
                .attr('font-family', 'Arial, sans-serif')
                .text(l.label);
        });
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
        
        const themeColors = resolveThemeTokens(themeRootRef.current);

        drawQuadrants(g, radius, themeColors, currentTheme);
        drawCategoryLabels(g, radius, themeColors);
        drawRadarGrid(g, radius, themeColors, currentTheme);
        drawLegends(g, radius, themeColors);
        
        if (items && items.length > 0) {
            const normalizedItems = parseRadarItems(items);
            const groupedItems = groupItemsForPositioning(normalizedItems);
            renderItems(g, groupedItems, radius, themeColors);
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
        <div ref={themeRootRef} className={`${styles.centeringWrapper} ${getThemeClass()}`}>
            <div className={styles.middlePanel}>
                <svg ref={svgRef} className={styles.radarWrapper}></svg>
            </div>
            <div className={styles.leftPanel}>
                <div className={styles.zoomBar}>
                    {/* Theme Selector */}
                    <div className={styles.zoomControls}>
                        <span className={styles.zoomTitle}>🎨 Theme: {currentThemeLabel}</span>
                        {availableThemes.map((themeOption) => (
                            <button
                                key={themeOption.key}
                                className={`${styles.themeButton} ${currentTheme === themeOption.key ? styles.active : ''}`}
                                onClick={() => {
                                    console.log('🎨 Switching theme to:', themeOption.key);
                                    setCurrentTheme(themeOption.key);
                                }}
                                title={themeOption.label}
                            >
                                {themeOption.emoji} {themeOption.label}
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
                            <div className={styles.row}><span className={styles.label}>{radarTooltipLabels.title}</span><span className={styles.value}>{tooltipData.item.name}</span></div>
                            <div className={styles.row}><span className={styles.label}>{radarTooltipLabels.type}</span><span className={styles.value}>{tooltipData.item.type}</span></div>
                            <div className={styles.row}><span className={styles.label}>{radarTooltipLabels.category}</span><span className={styles.value}>{tooltipData.item.raw.category}</span></div>
                            <div className={styles.row}><span className={styles.label}>{radarTooltipLabels.distance}</span><span className={styles.value}>{tooltipData.item.raw.distance}</span></div>
                            <div className={styles.row}><span className={styles.label}>{radarTooltipLabels.impact}</span><span className={styles.value}>{tooltipData.item.raw.impact}</span></div>
                            <div className={styles.row}><span className={styles.label}>{radarTooltipLabels.risk}</span><span className={styles.value}>{tooltipData.item.raw.risk}</span></div>
                            {tooltipData.item.zoom_in && (
                                <div className={styles.row}>
                                    <span className={styles.label}>{radarTooltipLabels.zoom}</span>
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
                        <div className={styles.tooltipPlaceholder}>{radarTooltipCopy.placeholder}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RadarChart;

    



    

    


