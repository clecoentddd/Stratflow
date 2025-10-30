"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

export type CatalogNode = {
  id: string;
  name: string;
  teamId: string;
  teamName?: string;
  teamLevel?: number;
};

export type LinkEdge = { fromInitiativeId: string; toInitiativeId: string };

export default function BubbleGraph({ nodes, edges }: { nodes: CatalogNode[]; edges: LinkEdge[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Compute levels present and a radius scale (smaller level number => bigger radius)
  const { levelOrder, radiusOf, yOf } = useMemo(() => {
    const levels = Array.from(new Set(nodes.map(n => n.teamLevel ?? 0))).sort((a,b) => a - b);
    const levelIndex = new Map<number, number>();
    levels.forEach((lv, i) => levelIndex.set(lv, i));
    const R = 32; // fixed radius for all bubbles (bigger)
    const yScale = (h: number, lv?: number) => {
      const idx = levelIndex.get(lv ?? 0) ?? 0;
      const rowCount = Math.max(levels.length, 1);
      const paddingTop = 48;
      const paddingBottom = 48;
      const usable = Math.max(0, h - paddingTop - paddingBottom);
      return paddingTop + (idx + 0.5) * (usable / rowCount);
    };
    return {
      levelOrder: levels,
      radiusOf: (_lv?: number) => R,
      yOf: (h: number, lv?: number) => yScale(h, lv),
    };
  }, [nodes]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svgRef.current) return;

    const resize = () => {
      const parent = svgRef.current?.parentElement;
      const w = Math.max(640, parent?.clientWidth || 960);
      const h = Math.max(400, Math.round((parent?.clientHeight || 600)));
      setSize({ w, h });
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (svgRef.current?.parentElement) ro.observe(svgRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || size.w === 0 || size.h === 0) return;

    const w = size.w;
    const h = size.h;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Fallback color scale by level (brown base -> lighter by level)
    const base = d3.color('#cc9966')!;
    const color = (lv: number) => d3.color(base)?.brighter(Math.max(0, Math.min(10, lv)) * 0.25)!.formatHex();

    // Build node/edge maps
    const nodeMap = new Map(nodes.map(n => [n.id, n] as const));
    const simNodes = nodes.map(n => ({ id: n.id, name: n.name, level: n.teamLevel ?? 0, x: Math.random()*w, y: yOf(h, n.teamLevel), fx: undefined as number | undefined, fy: undefined as number | undefined, targetX: undefined as number | undefined }));
    const simLinks = edges
      .filter(e => nodeMap.has(e.fromInitiativeId) && nodeMap.has(e.toInitiativeId))
      .map(e => ({ source: e.fromInitiativeId, target: e.toInitiativeId }));

    // DEBUG: log levels, target rows, and colors
    try {
      const sample = simNodes.map(d => ({
        id: d.id,
        name: d.name,
        level: d.level,
        yTarget: yOf(h, d.level),
        color: color(Math.max(0, Math.min(10, d.level ?? 0)))
      }));
      // limit output size
      console.table(sample.slice(0, 20));
      console.log('[BubbleGraph] totals', { nodes: simNodes.length, links: simLinks.length, levels: levelOrder });
    } catch {}

    // Compute per-level x slots to spread nodes horizontally with extra space
    const marginX = 56;
    const groups = d3.group(simNodes, d => d.level);
    for (const [lv, arr] of groups) {
      const band = d3.scaleBand<number>().domain(d3.range(arr.length) as unknown as number[]).range([marginX, w - marginX]).paddingInner(0.4).paddingOuter(0.2);
      arr.forEach((d, i) => { d.targetX = (band(i) ?? (w/2)) + (band.bandwidth()/2); });
    }

    // Layout: force with y targeting rows by level, x to per-level slots, collisions by radius
    const forceY = d3.forceY<any>(d => yOf(h, d.level)).strength(0.9);
    const forceX = d3.forceX<any>(d => d.targetX ?? (w / 2)).strength(0.2);
    const repel = d3.forceManyBody<any>().strength(-300);
    const collide = d3.forceCollide<any>(d => radiusOf(d.level) + 24).strength(1);
    const link = d3.forceLink<any, any>(simLinks).id(d => d.id).distance(300).strength(0.08);
    const sim = d3.forceSimulation(simNodes)
      .force("y", forceY)
      .force("x", forceX)
      .force("charge", repel)
      .force("collide", collide)
      .force("link", link)
      .alpha(1)
      .alphaDecay(0.06);

    // Draw links first
    const g = svg.append("g");

    // Draw level guide lines and labels
    const guides = g.append("g").attr("opacity", 0.25);
    guides.selectAll("line")
      .data(levelOrder)
      .join("line")
      .attr("x1", 24)
      .attr("x2", w - 24)
      .attr("y1", lv => yOf(h, lv))
      .attr("y2", lv => yOf(h, lv))
      .attr("stroke", "#cbd5e1")
      .attr("stroke-dasharray", "4 4");
    guides.selectAll("text")
      .data(levelOrder)
      .join("text")
      .attr("x", 8)
      .attr("y", lv => yOf(h, lv))
      .attr("dy", "0.35em")
      .attr("font-size", 10)
      .attr("fill", "#64748b")
      .text(lv => `Level ${lv}`);
    const linkSel = g
      .append("g")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(simLinks)
      .join("line");

    // Draw nodes
    const nodeGroup = g
      .append("g")
      .selectAll("g")
      .data(simNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = undefined;
          d.fy = undefined;
        })
      );

    nodeGroup
      .append("circle")
      .attr("r", d => radiusOf(d.level))
      .attr("data-level", d => d.level)
      .attr("fill", d => color(Math.max(0, Math.min(10, d.level ?? 0))))
      .attr("stroke-width", 0);

    // Single-line label, larger text, slight compression to fit within bubble
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "18px")
      .style("font-weight", 600)
      .style("font-family", "inherit")
      .style("white-space", "nowrap")
      .style("pointer-events", "none")
      .text(d => d.name);

    sim.on("tick", () => {
      linkSel
        .attr("x1", (d: any) => (d.source.x))
        .attr("y1", (d: any) => (d.source.y))
        .attr("x2", (d: any) => (d.target.x))
        .attr("y2", (d: any) => (d.target.y));

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // DEBUG: final positions
    sim.on('end', () => {
      try {
        const final = (simNodes as any[]).map(d => ({ id: d.id, level: d.level, x: Math.round(d.x), y: Math.round(d.y) }));
        console.table(final.slice(0, 20));
      } catch {}
    });

    return () => void sim.stop();
  }, [nodes, edges, radiusOf, yOf, size]);

  return (
    <div style={{ width: '100%', height: '70vh', border: '1px solid #e5e7eb', borderRadius: 8, touchAction: 'none' as any }}>
      <svg ref={svgRef} width={size.w} height={size.h} style={{ touchAction: 'none' as any }} />
    </div>
  );
}
