"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NavigationContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  // Responsive navbar: collapsed on small screens, expanded on large screens
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed for SSR safety
  const [userToggledNav, setUserToggledNav] = useState(false);

  useEffect(() => {
    // Set initial state after hydration and handle resize
    const handleResize = () => {
      if (!userToggledNav) {
        // Collapse when horizontal space is constrained (split screen, narrow windows)
        // This gives more space to content when screen real estate is limited
        const shouldCollapse = window.innerWidth < 1440;
        setIsCollapsed(shouldCollapse);
      }
    };

    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userToggledNav]);

  const setIsCollapsedWithUserControl = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    setUserToggledNav(true); // Mark as user-controlled
  };

  return (
    <NavigationContext.Provider value={{ 
      isCollapsed, 
      setIsCollapsed: setIsCollapsedWithUserControl 
    }}>
      {children}
    </NavigationContext.Provider>
  );
} 