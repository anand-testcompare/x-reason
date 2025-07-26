"use client";

import { RegieDemo } from "@/app/components";
import { ReasonDemoProvider } from "@/app/context/ReasoningDemoContext";
import { CredentialsModal } from "@/app/components/CredentialsModal";

export default function RegiePage() {
  return (
    <ReasonDemoProvider>
      <CredentialsModal />
      <RegieDemo />
    </ReasonDemoProvider>
  );
}