export interface DragState {
  x: number;
  y: number;
  vx: number; // px/sec
  vy: number; // px/sec
  dragging: boolean;
}

export type Axis = "x" | "y" | "both";

export interface DragBounds {
  type: "window" | "parent" | "element";
  ref?: React.RefObject<HTMLElement>;
}

export interface UseDragOptions {
  axis?: Axis;
  bounds?: DragBounds;
  threshold?: number;
  disabled?: boolean;

  /** Momentum */
  momentum?: boolean;
  friction?: number; // 0.92–0.98

  /** Spring */
  spring?: boolean;
  springStiffness?: number;
  springDamping?: number;

  onDragStart?: (state: DragState) => void;
  onDrag?: (state: DragState) => void;
  onDragEnd?: (state: DragState) => void;
}
