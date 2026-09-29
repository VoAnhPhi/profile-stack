"use client";

import { Component, type ReactNode } from "react";
import { setMarksState } from "./runtime";

/**
 * Keeps a failure in the 3D layer inside it. A context that cannot be created, or a
 * shader that will not compile, then costs the page its 3D - the header's posters stay
 * up - and nothing else; uncaught, it unmounted the whole page.
 */
export class MarkBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    setMarksState("failed");
    console.warn("3D marks turned off:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
