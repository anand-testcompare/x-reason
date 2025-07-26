"use client";

let inspectorInitialized = false;

export async function initializeInspector() {
  if (typeof window === 'undefined' || inspectorInitialized) {
    return;
  }

  try {
    const { createBrowserInspector } = await import('@statelyai/inspect');
    
    // Initialize the inspector globally - this will automatically inspect all actors
    const inspector = createBrowserInspector({
      autoStart: false,
    });
    
    inspectorInitialized = true;
    console.log('✅ XState Inspector initialized! All state machines will be automatically inspected.');
    console.log('📋 Open your browser DevTools and look for the "Stately Inspector" tab.');
    
    return inspector;
  } catch (error) {
    console.error('❌ Failed to initialize XState inspector:', error);
    throw error;
  }
}

export function isInspectorInitialized() {
  return inspectorInitialized;
}