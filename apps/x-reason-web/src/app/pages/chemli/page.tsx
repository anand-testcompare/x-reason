"use client";

import { ReasonDemo } from "@/app/components";
import { ReasonDemoProvider } from "@/app/context/ReasoningDemoContext";
import { Suspense } from "react";

export default function ChemliPage() {
  return (
    <ReasonDemoProvider>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <ReasonDemo />
      </Suspense>
    </ReasonDemoProvider>
  );
}