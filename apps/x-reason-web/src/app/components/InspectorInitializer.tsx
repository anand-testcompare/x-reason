"use client";

import { useEffect } from 'react';
import { initializeInspector } from '@/app/lib/inspector';

export function InspectorInitializer() {
  useEffect(() => {
    // Auto-initialize inspector in development mode
    if (process.env.NODE_ENV === 'development') {
      initializeInspector();
    }
  }, []);

  return null; // This component doesn't render anything
}