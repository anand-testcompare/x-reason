"use client";

import { RegieDemo } from "@/app/components";
import { ReasonDemoProvider } from "@/app/context/ReasoningDemoContext";
import { Suspense } from "react";

export default function RegiePage() {
  return (
    <ReasonDemoProvider>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <RegieDemo />
      </Suspense>
    </ReasonDemoProvider>
  );
}