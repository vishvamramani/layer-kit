import { useRef, useCallback, useLayoutEffect } from "react";
import type { DragState, UseDragOptions } from "./types";

/* -------------------------------------------------------------------------- */
/* Utils                                                                       */
/* -------------------------------------------------------------------------- */

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const rubberBand = (
  distance: number,
  dimension: number,
  elasticity: number
) =>
  (distance * dimension * elasticity) /
  (dimension + elasticity * distance);

/* -------------------------------------------------------------------------- */
/* Hook                                                                         */
/* -------------------------------------------------------------------------- */

export function useDrag({
  axis = "both",
  bounds,
  threshold = 0,
  disabled = false,

  momentum = true,
  friction = 0.95,

  spring = false,
  springStiffness = 0.12,
  springDamping = 0.8,

  overflow = "elastic", // clamp | elastic | free
  elasticity = 0.35,

  onDragStart,
  onDrag,
  onDragEnd,
}: UseDragOptions = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const raf = useRef<number | null>(null);

  const state = useRef<DragState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    dragging: false,
  });

  const startPointer = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0, t: 0 });

  const startRect = useRef<DOMRect | null>(null);
  const boundsRect = useRef<DOMRect | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Lifecycle                                                                 */
  /* ------------------------------------------------------------------------ */

  useLayoutEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Bounds resolution                                                         */
  /* ------------------------------------------------------------------------ */

  const resolveBounds = () => {
    if (!bounds || !ref.current) return null;

    if (bounds.type === "window") {
      return document.documentElement.getBoundingClientRect();
    }

    if (bounds.type === "parent") {
      return ref.current.parentElement?.getBoundingClientRect() ?? null;
    }

    return bounds.ref?.current?.getBoundingClientRect() ?? null;
  };

  const applyOverflow = (
    value: number,
    min: number,
    max: number,
    dimension: number
  ) => {
    if (value >= min && value <= max) return value;

    if (overflow === "clamp") {
      return clamp(value, min, max);
    }

    if (overflow === "elastic") {
      if (value < min) {
        return min - rubberBand(min - value, dimension, elasticity);
      }
      return max + rubberBand(value - max, dimension, elasticity);
    }

    return value; // free
  };

  const applyBounds = (x: number, y: number) => {
    if (!boundsRect.current || !startRect.current) return { x, y };

    const b = boundsRect.current;
    const s = startRect.current;

    const minX = b.left - s.left;
    const maxX = b.right - s.right;
    const minY = b.top - s.top;
    const maxY = b.bottom - s.bottom;

    return {
      x:
        axis !== "y"
          ? applyOverflow(x, minX, maxX, b.width)
          : 0,
      y:
        axis !== "x"
          ? applyOverflow(y, minY, maxY, b.height)
          : 0,
    };
  };

  const getSnapTarget = () => {
    if (!boundsRect.current || !startRect.current) {
      return { x: state.current.x, y: state.current.y };
    }

    const b = boundsRect.current;
    const s = startRect.current;

    return {
      x: clamp(state.current.x, b.left - s.left, b.right - s.right),
      y: clamp(state.current.y, b.top - s.top, b.bottom - s.bottom),
    };
  };

  /* ------------------------------------------------------------------------ */
  /* Drag update                                                               */
  /* ------------------------------------------------------------------------ */

  const update = (clientX: number, clientY: number) => {
    const now = performance.now();
    const dt = Math.max(now - lastPointer.current.t, 16);

    const rawX =
      axis !== "y" ? clientX - startPointer.current.x : 0;
    const rawY =
      axis !== "x" ? clientY - startPointer.current.y : 0;

    const pos = applyBounds(rawX, rawY);

    state.current.vx = ((pos.x - state.current.x) / dt) * 1000;
    state.current.vy = ((pos.y - state.current.y) / dt) * 1000;
    state.current.x = pos.x;
    state.current.y = pos.y;

    lastPointer.current = { x: clientX, y: clientY, t: now };

    if (ref.current) {
      ref.current.style.transform =
        `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    }

    onDrag?.(state.current);
  };

  /* ------------------------------------------------------------------------ */
  /* Animations                                                                */
  /* ------------------------------------------------------------------------ */

  const animateMomentum = () => {
    state.current.vx *= friction;
    state.current.vy *= friction;

    state.current.x += state.current.vx / 60;
    state.current.y += state.current.vy / 60;

    const pos = applyBounds(state.current.x, state.current.y);
    state.current.x = pos.x;
    state.current.y = pos.y;

    if (ref.current) {
      ref.current.style.transform =
        `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    }

    if (
      Math.abs(state.current.vx) > 5 ||
      Math.abs(state.current.vy) > 5
    ) {
      raf.current = requestAnimationFrame(animateMomentum);
    }
  };

  const animateSpring = () => {
    const target = getSnapTarget();

    state.current.vx +=
      (target.x - state.current.x) * springStiffness;
    state.current.vy +=
      (target.y - state.current.y) * springStiffness;

    state.current.vx *= springDamping;
    state.current.vy *= springDamping;

    state.current.x += state.current.vx;
    state.current.y += state.current.vy;

    if (ref.current) {
      ref.current.style.transform =
        `translate3d(${state.current.x}px, ${state.current.y}px, 0)`;
    }

    if (
      Math.abs(state.current.vx) > 0.5 ||
      Math.abs(state.current.vy) > 0.5
    ) {
      raf.current = requestAnimationFrame(animateSpring);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Pointer events                                                            */
  /* ------------------------------------------------------------------------ */

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!state.current.dragging) {
        const dist = Math.hypot(
          e.clientX - startPointer.current.x,
          e.clientY - startPointer.current.y
        );
        if (dist < threshold) return;

        state.current.dragging = true;
        onDragStart?.(state.current);
      }

      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() =>
        update(e.clientX, e.clientY)
      );
    },
    [threshold]
  );

  const onPointerUp = useCallback(() => {
    state.current.dragging = false;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);

    onDragEnd?.(state.current);

    if (spring) animateSpring();
    else if (momentum) animateMomentum();
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;

      startRect.current =
        ref.current?.getBoundingClientRect() ?? null;
      boundsRect.current = resolveBounds();

      startPointer.current = {
        x: e.clientX - state.current.x,
        y: e.clientY - state.current.y,
      };

      lastPointer.current = {
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [disabled]
  );

  /* ------------------------------------------------------------------------ */
  /* API                                                                       */
  /* ------------------------------------------------------------------------ */

  return {
    ref,
    bind: {
      onPointerDown,
      style: {
        touchAction: "none",
        userSelect: "none",
        willChange: "transform",
        cursor: "grab",
      },
    },
    state: state.current,
  };
}
