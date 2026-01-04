"use client";

import React, {
  forwardRef,
  cloneElement,
  isValidElement,
  ReactElement,
} from "react";
import { useDrag } from "./useDrag";
import type { UseDragOptions } from "./types";

export interface DragProps extends UseDragOptions {
  children: ReactElement;
}

/**
 * <Drag />
 *
 * High-performance draggable wrapper.
 * Built on @layer-kit/gesture.
 *
 * Features:
 * - Momentum / inertia
 * - Spring snapping
 * - Axis locking
 * - Bounds (window / parent / element)
 * - Zero re-renders
 *
 * Usage:
 * <Drag>
 *   <div>Drag me</div>
 * </Drag>
 */
export const Drag = forwardRef<HTMLElement, DragProps>(
  ({ children, ...options }, forwardedRef) => {
    const drag = useDrag(options);

    if (!isValidElement(children)) {
      if (__DEV__) {
        console.warn("<Drag> expects a single React element as a child.");
      }
      return children;
    }

    /**
     * Merge:
     * - useDrag ref
     * - forwarded ref
     * - child ref
     */
    const setRef = (node: HTMLElement | null) => {
      // hook ref
      drag.ref.current = node;

      // forwarded ref
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) (forwardedRef as any).current = node;

      // child ref
      const childRef = (children as any).ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef) childRef.current = node;
    };

    return cloneElement(children, {
      ...drag.bind,
      ref: setRef,

      /** Accessibility */
      tabIndex: children.props.tabIndex ?? 0,
      role: children.props.role ?? "button",
      "aria-roledescription": "draggable",

      /** Style merge */
      style: {
        ...drag.bind.style,
        ...children.props.style,
      },
    });
  }
);

Drag.displayName = "Drag";
