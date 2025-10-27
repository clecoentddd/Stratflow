
"use client";

import React, { useRef, useEffect, useState, use } from 'react';
import * as d3 from 'd3';
import type { RadarItem } from '@/lib/types';
import type { MappedRadarItem, RadarQuadrant, RadarRing } from '@/lib/radar-mappers';
import { radarQuadrants, radarRings } from '@/lib/radar-mappers';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RadarChartProps {
    items: MappedRadarItem[];
    onEditItem: (item: RadarItem) => void;
    rawItems: RadarItem[];
}

interface Blip extends MappedRadarItem {
    x: number;
    y: number;
    size: number;
    color: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ items, onEditItem, rawItems }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedBlip, setSelectedBlip] = useState<Blip | null>(null);
    const popoverTargetRef = useRef<SVGCircleElement | null>(null);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height: Math.min(width, 600) });
            }
        });

        if (svgRef.current?.parentElement) {
            resizeObserver.observe(svgRef.current.parentElement);
        }

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (dimensions.width === 0 || !svgRef.current) return;
        
        const { width } = dimensions;
        const height = width;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 40, right: 40, bottom: 40, left: 40 };
        const radius = Math.min(width, height) / 2 - Math.max(margin.top, margin.right);

        const g = svg.attr('width', width).attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Quadrants
        const quadrantArc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius)
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle);

        g.selectAll('.quadrant')
            .data(radarQuadrants)
            .enter().append('path')
            .attr('class', 'quadrant')
            .attr('d', quadrantArc as any)
            .attr('fill', (d, i) => d3.schemeSet3[i + 4])
            .attr('opacity', 0.1);
        
        // Quadrant Labels
        g.selectAll('.quadrant-label')
            .data(radarQuadrants)
            .enter().append('text')
            .attr('class', 'quadrant-label font-headline text-xs md:text-sm fill-current text-muted-foreground')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .text(d => d.name)
            .attr('transform', d => {
                const angle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI) - 90;
                const r = radius * 1.08;
                return `translate(${r * Math.cos(angle * Math.PI / 180)}, ${r * Math.sin(angle * Math.PI / 180)})`;
            });

        // Rings
        g.selectAll('.ring')
            .data(radarRings)
            .enter().append('circle')
            .attr('class', 'ring')
            .attr('r', d => d.radius * radius)
            .attr('fill', 'none')
            .attr('stroke', 'hsl(var(--border))')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2');
            
        // Ring Labels
        g.selectAll('.ring-label')
            .data(radarRings)
            .enter().append('text')
            .attr('class', 'ring-label text-xs fill-current text-muted-foreground')
            .attr('y', d => -d.radius * radius - 4)
            .attr('text-anchor', 'middle')
            .text(d => d.name);

        // Blips
        const blips: Blip[] = items.map(item => {
            const quadrant = radarQuadrants.find(q => q.id === item.quadrant);
            const ring = radarRings.find(r => r.id === item.ring);

            if (!quadrant || !ring) return null;

            // Add some randomness to avoid perfect overlap
            const angleJitter = (Math.random() - 0.5) * (quadrant.endAngle - quadrant.startAngle) * 0.8;
            const radiusJitter = (Math.random() - 0.5) * (radius / radarRings.length) * 0.5;

            const angle = (quadrant.startAngle + quadrant.endAngle) / 2 + angleJitter;
            const r = ring.radius * radius + radiusJitter;
            
            return {
                ...item,
                x: r * Math.cos(angle - Math.PI / 2),
                y: r * Math.sin(angle - Math.PI / 2),
                size: item.size,
                color: item.color,
            };
        }).filter((item): item is Blip => item !== null);
        
        const blipGroups = g.selectAll('.blip')
            .data(blips)
            .enter().append('g')
            .attr('class', 'blip')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .style('cursor', 'pointer');
            
        // Render shapes based on type
        const opportunities = blipGroups.filter(d => d.shape === 'CIRCLE');
        opportunities.append('circle')
            .attr('r', d => d.size)
            .attr('fill', d => d.color)
            .attr('opacity', 0.3)
            .attr('stroke', d => d.color)
            .attr('stroke-width', 2);
        opportunities.append('circle')
            .attr('r', d => d.size / 2.5)
            .attr('fill', d => d.color);


        const threats = blipGroups.filter(d => d.shape === 'TRIANGLE');
        const triangle = d3.symbol().type(d3.symbolTriangle).size(d => d.size * d.size * 1.5);
        threats.append('circle')
            .attr('r', d => d.size)
            .attr('fill', d => d.color)
            .attr('opacity', 0.8);
        threats.append('path')
            .attr('d', triangle as any)
            .attr('fill', 'hsl(var(--background))')
            .attr('transform', 'rotate(180)');


        blipGroups.each(function(d) {
            // Append a larger, invisible circle for easier hover/click
            d3.select(this).append('circle')
                .attr('r', d.size + 5)
                .attr('fill', 'transparent')
                .attr('class', 'interaction-circle')
                 .on('click', (event, d_clicked) => {
                    popoverTargetRef.current = event.currentTarget as SVGCircleElement;
                    setSelectedBlip(d_clicked as Blip);
                    setPopoverOpen(true);
                });
        });

    }, [dimensions, items]);

    const findRawItem = (mappedItem: MappedRadarItem | null): RadarItem | null => {
        if (!mappedItem) return null;
        return rawItems.find(item => item.id === mappedItem.id) || null;
    }

    return (
        <div className="w-full relative">
            <svg ref={svgRef}></svg>
            {selectedBlip && (
                 <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                     <PopoverTrigger asChild>
                        <div style={{
                             position: 'absolute',
                             left: `${selectedBlip.x + dimensions.width / 2}px`,
                             top: `${selectedBlip.y + dimensions.height / 2}px`,
                             width: '1px',
                             height: '1px'
                        }} />
                     </PopoverTrigger>
                    <PopoverContent className="w-80" align="start" side="right">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium leading-none">{selectedBlip.name}</h4>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                        const rawItem = findRawItem(selectedBlip);
                                        if (rawItem) onEditItem(rawItem);
                                        setPopoverOpen(false);
                                    }}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    <Badge variant={selectedBlip.shape === 'TRIANGLE' ? 'destructive' : 'default'}>{selectedBlip.shape === 'TRIANGLE' ? 'Threat' : 'Opportunity'}</Badge>
                                    <Badge variant="secondary">{radarQuadrants.find(q => q.id === selectedBlip.quadrant)?.name}</Badge>
                                    <Badge variant="secondary">{radarRings.find(r => r.id === selectedBlip.ring)?.name}</Badge>
                                </div>
                            </div>
                            <div className="grid gap-2 text-sm">
                                <p><strong className="font-medium">Impact:</strong> {selectedBlip.impactName}</p>
                                <div>
                                    <strong className="font-medium">Tolerance:</strong>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-3 w-3 rounded-full",
                                            selectedBlip.color === 'hsl(var(--chart-2))' && 'bg-green-500',
                                            selectedBlip.color === 'hsl(var(--chart-4))' && 'bg-amber-500',
                                            selectedBlip.color === 'hsl(var(--chart-1))' && 'bg-red-500',
                                        )}></div>
                                        <span>{selectedBlip.toleranceName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                 </Popover>
            )}
        </div>
    );
};

export default RadarChart;

    