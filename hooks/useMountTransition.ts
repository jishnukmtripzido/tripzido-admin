"use client";

import { useEffect, useState } from "react";

type Phase = "enter" | "entered" | "exit";

/**
 * For a component that's always mounted by its parent, toggled via a
 * boolean prop (e.g. Sidebar's `open`) rather than conditionally
 * rendered. On open: mounts immediately, phase starts at "enter"
 * (initial/off state), then flips to "entered" on the next frame so
 * the transition actually plays instead of snapping. On close: phase
 * flips to "exit" and the component stays mounted for `duration`ms so
 * the exit transition can finish, then unmounts.
 */
export function useMountTransition(isOpen: boolean, duration = 250) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [phase, setPhase] = useState<Phase>(isOpen ? "entered" : "exit");

  useEffect(() => {
    let raf1: number;
    let raf2: number;
    let timeout: ReturnType<typeof setTimeout>;

    if (isOpen) {
      setShouldRender(true);
      setPhase("enter");
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setPhase("entered"));
      });
    } else if (shouldRender) {
      setPhase("exit");
      timeout = setTimeout(() => setShouldRender(false), duration);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return { shouldRender, phase };
}
