import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { Article } from "@/lib/types";
import { getOutlet } from "@/lib/data";
import { usePanZoom } from "@/hooks/usePanZoom";

interface IdeologicalCanvasProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

interface Positioned {
  article: Article;
  outletName: string;
  x: number;
  y: number;
}

const CANVAS_SIZE = 800;
const PADDING = 60;
const DOT_RADIUS = 8;

function ideologyToCanvas(x: number, y: number): { cx: number; cy: number } {
  const cx = PADDING + ((x + 1) / 2) * (CANVAS_SIZE - 2 * PADDING);
  const cy = PADDING + ((y + 1) / 2) * (CANVAS_SIZE - 2 * PADDING);
  return { cx, cy };
}

function getDotFill(x: number): string {
  if (x < -0.2) return "hsl(var(--dot-left))";
  if (x > 0.2) return "hsl(var(--dot-right))";
  return "hsl(var(--dot-center))";
}

function jitter(base: number, range = 0.08): number {
  return base + (Math.random() - 0.5) * 2 * range;
}

export function IdeologicalCanvas({ articles, onArticleClick }: IdeologicalCanvasProps) {
  const { transform, containerRef, onMouseDown, onMouseMove, onMouseUp, resetView, setTransform } =
    usePanZoom(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; article: Article } | null>(null);

  // Compute positions once per articles array — jitter is stable per render cycle
  const positioned = useMemo<Positioned[]>(() =>
    articles.map((article) => {
      const outlet = getOutlet(article.outletId);
      const base = outlet?.ideology ?? { x: 0, y: 0 };
      return {
        article,
        outletName: outlet?.name ?? article.outletId,
        x: jitter(base.x),
        y: jitter(base.y),
      };
    }),
    [articles]
  );

  // Centre the canvas on mount / when container size is known
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTransform({
      x: (rect.width - CANVAS_SIZE) / 2,
      y: (rect.height - CANVAS_SIZE) / 2,
      scale: Math.min(rect.width / (CANVAS_SIZE + 40), rect.height / (CANVAS_SIZE + 40), 1),
    });
  }, []);

  const handleDotHover = useCallback((article: Article, e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, article });
    setHoveredId(article.id);
  }, []);

  const gridLines = [];
  for (let i = 0; i <= 10; i++) {
    const pos = PADDING + (i / 10) * (CANVAS_SIZE - 2 * PADDING);
    gridLines.push(
      <line key={`h${i}`} x1={PADDING} y1={pos} x2={CANVAS_SIZE - PADDING} y2={pos}
        stroke="hsl(var(--canvas-grid))" strokeWidth="1"
        strokeDasharray={i === 5 ? "none" : "4 4"} opacity={i === 5 ? 0.6 : 0.3} />,
      <line key={`v${i}`} x1={pos} y1={PADDING} x2={pos} y2={CANVAS_SIZE - PADDING}
        stroke="hsl(var(--canvas-grid))" strokeWidth="1"
        strokeDasharray={i === 5 ? "none" : "4 4"} opacity={i === 5 ? 0.6 : 0.3} />
    );
  }

  const midX = CANVAS_SIZE / 2;
  const midY = CANVAS_SIZE / 2;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-surface-warm cursor-grab active:cursor-grabbing select-none rounded-lg border border-divider"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => { onMouseUp(); setTooltip(null); setHoveredId(null); }}
    >
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: Math.min(t.scale * 1.2, 5) }))}
          className="w-8 h-8 rounded bg-card border border-divider font-headline text-lg flex items-center justify-center hover:bg-secondary transition-colors"
        >+</button>
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: Math.max(t.scale / 1.2, 0.3) }))}
          className="w-8 h-8 rounded bg-card border border-divider font-headline text-lg flex items-center justify-center hover:bg-secondary transition-colors"
        >−</button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded bg-card border border-divider text-caption text-xs flex items-center justify-center hover:bg-secondary transition-colors"
        >⟳</button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 right-3 z-20 text-xs font-mono text-caption bg-card/70 px-2 py-1 rounded">
        {Math.round(transform.scale * 100)}%
      </div>

      <svg
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
        }}
        className="absolute top-0 left-0"
      >
        {/* Grid */}
        {gridLines}

        {/* Main axes */}
        <line x1={PADDING} y1={midY} x2={CANVAS_SIZE - PADDING} y2={midY}
          stroke="hsl(var(--canvas-axis))" strokeWidth="2" />
        <line x1={midX} y1={PADDING} x2={midX} y2={CANVAS_SIZE - PADDING}
          stroke="hsl(var(--canvas-axis))" strokeWidth="2" />

        {/* Axis arrows */}
        <polygon points={`${CANVAS_SIZE - PADDING + 8},${midY} ${CANVAS_SIZE - PADDING - 2},${midY - 5} ${CANVAS_SIZE - PADDING - 2},${midY + 5}`} fill="hsl(var(--canvas-axis))" />
        <polygon points={`${PADDING - 8},${midY} ${PADDING + 2},${midY - 5} ${PADDING + 2},${midY + 5}`} fill="hsl(var(--canvas-axis))" />
        <polygon points={`${midX},${CANVAS_SIZE - PADDING + 8} ${midX - 5},${CANVAS_SIZE - PADDING - 2} ${midX + 5},${CANVAS_SIZE - PADDING - 2}`} fill="hsl(var(--canvas-axis))" />
        <polygon points={`${midX},${PADDING - 8} ${midX - 5},${PADDING + 2} ${midX + 5},${PADDING + 2}`} fill="hsl(var(--canvas-axis))" />

        {/* Axis labels */}
        <text x={CANVAS_SIZE - PADDING + 12} y={midY + 5} fill="hsl(var(--canvas-axis))" fontSize="13" fontFamily="'Playfair Display', serif" fontWeight="600">Rechts →</text>
        <text x={PADDING - 52} y={midY + 5} fill="hsl(var(--canvas-axis))" fontSize="13" fontFamily="'Playfair Display', serif" fontWeight="600" textAnchor="end">← Links</text>
        <text x={midX} y={PADDING - 16} fill="hsl(var(--canvas-axis))" fontSize="13" fontFamily="'Playfair Display', serif" fontWeight="600" textAnchor="middle">↑ Progressief</text>
        <text x={midX} y={CANVAS_SIZE - PADDING + 28} fill="hsl(var(--canvas-axis))" fontSize="13" fontFamily="'Playfair Display', serif" fontWeight="600" textAnchor="middle">Conservatief ↓</text>

        {/* Article dots */}
        {positioned.map(({ article, outletName, x, y }) => {
          const { cx, cy } = ideologyToCanvas(x, y);
          const isHovered = hoveredId === article.id;
          return (
            <g key={article.id}>
              <circle cx={cx} cy={cy} r={isHovered ? 18 : 12}
                fill={getDotFill(x)} opacity={isHovered ? 0.15 : 0.08}
                className="transition-all duration-200" />
              <circle
                cx={cx} cy={cy} r={isHovered ? DOT_RADIUS + 2 : DOT_RADIUS}
                fill={getDotFill(x)} stroke="hsl(var(--background))" strokeWidth="2"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={(e) => handleDotHover(article, e)}
                onMouseLeave={() => { setTooltip(null); setHoveredId(null); }}
                onClick={(e) => { e.stopPropagation(); onArticleClick(article); }}
              />
              {transform.scale > 0.9 && (
                <text x={cx} y={cy + DOT_RADIUS + 14} textAnchor="middle"
                  fill="hsl(var(--caption))" fontSize="10"
                  fontFamily="'JetBrains Mono', monospace" opacity={0.7}>
                  {outletName}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none bg-card border border-divider shadow-lg rounded-md px-3 py-2 max-w-[240px]"
          style={{ left: tooltip.x + 16, top: tooltip.y - 8 }}
        >
          <p className="text-xs font-mono text-accent mb-1">
            {getOutlet(tooltip.article.outletId)?.name ?? tooltip.article.outletId}
          </p>
          <p className="text-sm font-headline font-semibold leading-tight text-headline">
            {tooltip.article.headline}
          </p>
        </div>
      )}
    </div>
  );
}
