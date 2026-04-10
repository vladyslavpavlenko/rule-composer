import { useState, useRef, useCallback, useEffect, ReactNode } from "react";

interface PanelDef {
  key: string;
  minWidth: number;   // px
  initialFlex: number; // relative weight
  content: ReactNode;
}

interface Props {
  panels: PanelDef[];
}

export default function ResizablePanels({ panels }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flexes, setFlexes] = useState<number[]>(
    panels.map((p) => p.initialFlex)
  );
  const dragging = useRef<{ index: number; startX: number; startFlexes: number[] } | null>(null);

  // Keep flexes in sync if panels array length changes
  useEffect(() => {
    setFlexes((prev) =>
      prev.length === panels.length
        ? prev
        : panels.map((p) => p.initialFlex)
    );
  }, [panels.length]);

  const onMouseDown = useCallback(
    (dividerIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = {
        index: dividerIndex,
        startX: e.clientX,
        startFlexes: [...flexes],
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [flexes]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const d = dragging.current;
      if (!d || !containerRef.current) return;

      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const totalFlex = d.startFlexes.reduce((a, b) => a + b, 0);
      const pxPerFlex = containerWidth / totalFlex;

      const deltaPx = e.clientX - d.startX;
      const deltaFlex = deltaPx / pxPerFlex;

      const left = d.startFlexes[d.index] + deltaFlex;
      const right = d.startFlexes[d.index + 1] - deltaFlex;

      const leftMinFlex = (panels[d.index].minWidth / containerWidth) * totalFlex;
      const rightMinFlex = (panels[d.index + 1].minWidth / containerWidth) * totalFlex;

      if (left < leftMinFlex || right < rightMinFlex) return;

      setFlexes((prev) => {
        const next = [...prev];
        next[d.index] = left;
        next[d.index + 1] = right;
        return next;
      });
    };

    const onMouseUp = () => {
      dragging.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [panels]);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      {panels.map((panel, i) => (
        <div key={panel.key} className="flex" style={{ flex: flexes[i], minWidth: panel.minWidth }}>
          <div className="flex-1 overflow-hidden">{panel.content}</div>
          {i < panels.length - 1 && (
            <div
              onMouseDown={(e) => onMouseDown(i, e)}
              className="w-px flex-shrink-0 bg-white/[0.06] cursor-col-resize hover:bg-blue-500 active:bg-blue-400 transition-colors"
              style={{ touchAction: "none" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
