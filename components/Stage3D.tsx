import { useEffect, useRef } from "react";
import type { InstrumentId } from "../lib/score";
import type { StageState } from "../lib/stage-scene";

export default function Stage3D({
  state,
  onSelect,
  onReady,
}: {
  state: StageState;
  onSelect: (id: InstrumentId) => void;
  onReady: (ready: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ state, onSelect, onReady });
  live.current = { state, onSelect, onReady };
  useEffect(() => {
    let cancelled = false;
    let stage:
      ReturnType<typeof import("../lib/stage-scene").createStage> | undefined;
    const lost = (event: Event) => {
      event.preventDefault();
      stage?.canvas.removeEventListener("webglcontextlost", lost);
      stage?.dispose();
      stage = undefined;
      live.current.onReady(false);
    };
    import("../lib/stage-scene")
      .then(({ createStage }) => {
        if (cancelled || !host.current) return;
        try {
          stage = createStage(
            host.current,
            () => live.current.state,
            (id) => live.current.onSelect(id),
          );
          stage.canvas.addEventListener("webglcontextlost", lost);
          live.current.onReady(true);
        } catch {
          // The same section buttons and SVG plan remain available without WebGL.
          host.current.replaceChildren();
          live.current.onReady(false);
        }
      })
      .catch(() => {
        if (!cancelled) live.current.onReady(false);
      });
    return () => {
      cancelled = true;
      stage?.canvas.removeEventListener("webglcontextlost", lost);
      stage?.dispose();
    };
  }, []);
  return <div className="stage-three" ref={host} />;
}
