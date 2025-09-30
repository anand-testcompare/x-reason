"use client";

import React, { createContext, useContext, ReactNode } from 'react';

export interface APICredentials {
  openaiApiKey?: string;
  geminiApiKey?: string;
}

interface CredentialsContextType {
  credentials: APICredentials;
  hasAnyCredentials: boolean;
  availableProviders: string[];
}

const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

interface CredentialsProviderProps {
  children: ReactNode;
}

export function CredentialsProvider({ children }: CredentialsProviderProps) {
  // Server-side credentials only - no client-side storage
  const credentials: APICredentials = {};
  const hasAnyCredentials = true; // Always true since we use server credentials

  // Available providers are determined server-side
  // All providers accessible via AI_GATEWAY_API_KEY
  const availableProviders = ['openai', 'gemini', 'xai'];

  return (
    <CredentialsContext.Provider value={{
      credentials,
      hasAnyCredentials,
      availableProviders
    }}>
      {children}
    </CredentialsContext.Provider>
  );
}

export function useCredentials() {
  const context = useContext(CredentialsContext);
  if (context === undefined) {
    throw new Error('useCredentials must be used within a CredentialsProvider');
  }
  return context;
}