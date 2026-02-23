"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDiagramStore } from "@/lib/store/diagrams";

export default function SystemsHome() {
  const router = useRouter();
  const { diagrams, createDiagram, initialized, initialize } = useDiagramStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized) return;

    // If no diagrams exist, create a default one
    if (Object.keys(diagrams).length === 0) {
      const id = createDiagram("My First System");
      router.replace(`/systems/d/${id}`);
    } else {
      // Navigate to most recently updated diagram
      const sorted = Object.values(diagrams).sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
      router.replace(`/systems/d/${sorted[0].id}`);
    }
  }, [diagrams, createDiagram, router, initialized]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}
