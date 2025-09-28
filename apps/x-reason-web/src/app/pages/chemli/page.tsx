"use client";

import { ReasonDemo } from "@/app/components";
import { ReasonDemoProvider } from "@/app/context/ReasoningDemoContext";

export default function ChemliPage() {
  return (
    <ReasonDemoProvider>
      <ReasonDemo />
    </ReasonDemoProvider>
  );
}