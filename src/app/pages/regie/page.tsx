"use client";

import { RegieDemo } from "@/app/components";
import { ReasonDemoProvider } from "@/app/context/ReasoningDemoContext";

export default function RegiePage() {
  return (
    <ReasonDemoProvider>
      <RegieDemo />
    </ReasonDemoProvider>
  );
}