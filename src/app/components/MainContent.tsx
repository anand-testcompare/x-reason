"use client";

import { ReactNode } from 'react';
import { useNavigation } from './NavigationWrapper';

export function MainContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useNavigation();

  return (
    <main 
      className={`transition-all duration-300 ${
        isCollapsed 
          ? 'ml-16' 
          : 'ml-64'
      }`}
    >
      <div className="px-4 xl:px-0">
        {children}
      </div>
    </main>
  );
} 