"use client";

import { useEffect } from "react";

type ModelViewerProps = React.HTMLAttributes<HTMLElement> & {
  src?: string;
  alt?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  poster?: string;
  ar?: boolean;
  arModes?: string;
  [key: string]: any;
};

export default function ModelViewer(props: ModelViewerProps) {
  useEffect(() => {
    const load = async () => {
      try {
        // Prefer local package if available
        await import("@google/model-viewer");
      } catch {
        // Fallback to CDN if package is not installed
        const existing = document.querySelector(
          'script[src*="@google/model-viewer"],script[src*="model-viewer.min.js"]'
        ) as HTMLScriptElement | null;
        if (!existing) {
          const script = document.createElement("script");
          script.type = "module";
          script.src =
            "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
          document.head.appendChild(script);
        }
      }
    };
    load();
  }, []);

  // Cast the custom element to any to avoid TS intrinsic-elements error
  const ModelViewerElement = 'model-viewer' as any;
  return <ModelViewerElement {...props} />;
}