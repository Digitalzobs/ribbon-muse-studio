"use client";

import { useEffect } from "react";

export default function RibbonStudioClient() {
  useEffect(() => {
    let cleanup = null;

    import("../js/app.js").then((mod) => {
      cleanup = mod.mountRibbonMuse?.(document.querySelector("#app"));
    });

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, []);

  return (
    <>
      <div className="page-glow page-glow-left"></div>
      <div className="page-glow page-glow-right"></div>
      <div id="app"></div>
    </>
  );
}
