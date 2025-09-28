"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CredentialsProvider } from '../context/CredentialsContext';
import { CredentialsModal } from './CredentialsModal';

interface CredentialsWrapperProps {
  children: React.ReactNode;
}

export function CredentialsWrapper({ children }: CredentialsWrapperProps) {
  const pathname = usePathname();
  const [hasServerCredentials, setHasServerCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Only show credentials modal on demo pages
  const isDemoPage = pathname?.startsWith('/pages/');

  useEffect(() => {
    const checkServerCredentials = async () => {
      // Always set loading to false first
      setIsLoading(true);
      
      // Only check server credentials for demo pages
      if (!isDemoPage) {
        setHasServerCredentials(true); // Don't show modal on non-demo pages
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/credentials/check');
        const data = await response.json();
        setHasServerCredentials(data.hasServerCredentials);
      } catch (error) {
        console.error('Failed to check server credentials:', error);
        // If we can't check, assume no server credentials
        setHasServerCredentials(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkServerCredentials();
  }, [isDemoPage, pathname]); // Re-run when pathname changes

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <CredentialsProvider hasServerCredentials={hasServerCredentials}>
      <CredentialsModal />
      {children}
    </CredentialsProvider>
  );
}