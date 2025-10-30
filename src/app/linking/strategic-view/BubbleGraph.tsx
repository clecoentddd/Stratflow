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
    const maxLevel = levels.length ? Math.max(...levels) : 0;
    const minLevel = levels.length ? Math.min(...levels) : 0;
    const rScale = d3.scaleLinear().domain([minLevel, maxLevel || 1]).range([28, 12]).clamp(true);
    const yScale = (h: number, lv?: number) => {
      const idx = levelIndex.get(lv ?? 0) ?? 0;
      const rowCount = Math.max(levels.length, 1);
      const paddingTop = 40;
      const paddingBottom = 40;
      const usable = Math.max(0, h - paddingTop - paddingBottom);
      return paddingTop + (idx + 0.5) * (usable / rowCount);
    };
    return {
      levelOrder: levels,
      radiusOf: (lv?: number) => rScale(lv ?? minLevel),
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

    // Build node/edge maps
    const nodeMap = new Map(nodes.map(n => [n.id, n] as const));
    const simNodes = nodes.map(n => ({ id: n.id, name: n.name, level: n.teamLevel ?? 0, x: Math.random()*w, y: yOf(h, n.teamLevel), fx: undefined as number | undefined, fy: undefined as number | undefined }));
    const simLinks = edges
      .filter(e => nodeMap.has(e.fromInitiativeId) && nodeMap.has(e.toInitiativeId))
      .map(e => ({ source: e.fromInitiativeId, target: e.toInitiativeId }));

    // Layout: force with y targeting rows by level, x spreading, collisions by radius
    const forceY = d3.forceY<any>(d => yOf(h, d.level)).strength(0.3);
    const forceX = d3.forceX<any>(w / 2).strength(0.05);
    const collide = d3.forceCollide<any>(d => radiusOf(d.level) + 4).strength(0.9);
    const link = d3.forceLink<any, any>(simLinks).id(d => d.id).distance(80).strength(0.2);
    const sim = d3.forceSimulation(simNodes).force("y", forceY).force("x", forceX).force("collide", collide).force("link", link).alpha(1).alphaDecay(0.05);

    // Draw links first
    const g = svg.append("g");
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
      .attr("fill", "#93c5fd")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 1.5);

    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "10px")
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

    return () => void sim.stop();
  }, [nodes, edges, radiusOf, yOf, size]);

  return (
    <div style={{ width: '100%', height: '70vh', border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <svg ref={svgRef} width={size.w} height={size.h} />
    </div>
  );
}
