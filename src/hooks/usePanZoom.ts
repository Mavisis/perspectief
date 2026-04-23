import { useState, useCallback, useRef, useEffect } from "react";

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export function usePanZoom(initialScale = 1) {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: initialScale });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

    setTransform((t) => {
      const newScale = Math.min(Math.max(t.scale * zoomFactor, 0.3), 5);
      const scaleChange = newScale / t.scale;
      return {
        scale: newScale,
        x: mouseX - (mouseX - t.x) * scaleChange,
        y: mouseY - (mouseY - t.y) * scaleChange,
      };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: initialScale });
  }, [initialScale]);

  return { transform, containerRef, onMouseDown, onMouseMove, onMouseUp, resetView, setTransform };
}
