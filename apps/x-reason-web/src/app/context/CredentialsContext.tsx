"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface APICredentials {
  openaiApiKey?: string;
  geminiApiKey?: string;
}

interface CredentialsContextType {
  credentials: APICredentials;
  setCredentials: (credentials: APICredentials) => void;
  hasAnyCredentials: boolean;
  needsCredentials: boolean;
  setNeedsCredentials: (needs: boolean) => void;
  clearCredentials: () => void;
  availableProviders: string[];
}

const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

interface CredentialsProviderProps {
  children: ReactNode;
  hasServerCredentials?: boolean;
}

export function CredentialsProvider({ children, hasServerCredentials = false }: CredentialsProviderProps) {
  const [credentials, setCredentialsState] = useState<APICredentials>({});
  const [needsCredentials, setNeedsCredentials] = useState(!hasServerCredentials);

  const hasAnyCredentials = Boolean(
    credentials.openaiApiKey || 
    credentials.geminiApiKey ||
    hasServerCredentials
  );

  const availableProviders = React.useMemo(() => {
    const providers: string[] = [];
    if (credentials.openaiApiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      providers.push('openai');
    }
    if (credentials.geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      providers.push('gemini');
    }
    return providers;
  }, [credentials.openaiApiKey, credentials.geminiApiKey]);

  const setCredentials = (newCredentials: APICredentials) => {
    setCredentialsState(newCredentials);
    // Auto-dismiss the need for credentials if any are provided
    if (newCredentials.openaiApiKey || newCredentials.geminiApiKey) {
      setNeedsCredentials(false);
    }
  };

  const clearCredentials = useCallback(() => {
    setCredentialsState({});
    if (!hasServerCredentials) {
      setNeedsCredentials(true);
    }
  }, [hasServerCredentials]);

  // Clear credentials when the user navigates away or closes the tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      clearCredentials();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Clear credentials when tab becomes hidden
        clearCredentials();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasServerCredentials, clearCredentials]);

  return (
    <CredentialsContext.Provider value={{
      credentials,
      setCredentials,
      hasAnyCredentials,
      needsCredentials,
      setNeedsCredentials,
      clearCredentials,
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