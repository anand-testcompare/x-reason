"use client";

import React from 'react';
import { CredentialsProvider } from '../context/CredentialsContext';

interface CredentialsWrapperProps {
  children: React.ReactNode;
}

export function CredentialsWrapper({ children }: CredentialsWrapperProps) {
  // Server-side credentials only - no client-side credential prompts
  return (
    <CredentialsProvider>
      {children}
    </CredentialsProvider>
  );
}