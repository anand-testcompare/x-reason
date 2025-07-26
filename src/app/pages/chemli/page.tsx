"use client";

import { ReasonDemo } from "@/app/components";
import { ReasonDemoProvider } from "@/app/context/ReasoningDemoContext";
import { CredentialsModal } from "@/app/components/CredentialsModal";

export default function ChemliPage() {
  return (
    <ReasonDemoProvider>
      <CredentialsModal />
      <ReasonDemo />
    </ReasonDemoProvider>
  );
}