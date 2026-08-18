"use client";

import { useEffect, useState } from "react";

/**
 * For modals mounted via a parent's conditional render
 * ({open && <Modal/>}) rather than an always-mounted isOpen prop.
 * Plays the enter transition automatically on mount. dismiss() plays
 * the exit transition for `duration`ms, THEN calls the real
 * onClose/onCancel — so the parent only unmounts after the animation
 * finishes, without the parent needing to know anything changed.
 */
export function useDismissTransition(onDismiss: () => void, duration = 200) {
  const [phase, setPhase] = useState<"enter" | "entered" | "exit">("enter");

  useEffect(() => {
    let raf1: number;
    let raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase("entered"));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  function dismiss() {
    setPhase("exit");
    setTimeout(onDismiss, duration);
  }

  return { phase, dismiss };
}
