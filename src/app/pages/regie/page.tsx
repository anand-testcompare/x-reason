"use client"

import React from 'react';
import { ReasonDemoProvider, EngineTypes } from '../../context/ReasoningDemoContext';
import { RegieDemo } from '../../components/regie/RegieDemo';

export default function RegiePage() {
  return (
    <ReasonDemoProvider engineType={EngineTypes.REGIE}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <RegieDemo />
        </div>
      </div>
    </ReasonDemoProvider>
  );
}