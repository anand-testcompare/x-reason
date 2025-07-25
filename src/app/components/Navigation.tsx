"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, Home, Beaker, Users } from 'lucide-react';
import { useNavigation } from './NavigationWrapper';

export function Navigation() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useNavigation();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/pages/chemli', label: 'Chemli Demo', icon: Beaker },
    { href: '/pages/regie', label: 'Regie Demo', icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '?');
  };

  return (
    <>
      {/* Navigation */}
      <nav 
        className={`fixed left-0 top-0 h-full border-r border-border bg-card text-card-foreground z-50 transition-all duration-300 ${
          // Always visible, responsive width with manual override
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        style={{
          backgroundColor: '#f9fafb',
          color: '#1f2937',
          borderRight: '1px solid #d1d5db'
        }}
      >
        {/* Toggle button for all screen sizes */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 p-1 rounded-full bg-card border border-border hover:bg-muted transition-colors"
          style={{
            backgroundColor: '#f9fafb',
            borderColor: '#d1d5db'
          }}
        >
          <Menu size={14} />
        </button>

        <div className={`p-4 ${isCollapsed ? 'lg:p-2' : ''}`}>
          {/* Logo */}
          <div className={`mb-8 ${isCollapsed ? 'lg:mb-4' : ''}`}>
            <Link 
              href="/" 
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
              onClick={() => setIsMobileOpen(false)}
            >
                             {isCollapsed ? (
                 <div 
                   className="hidden lg:block w-8 h-8 flex items-center justify-center"
                 >
                   <Image 
                     src="/icon_cherry_blossom_small.png" 
                     alt="X-Reason" 
                     width={28} 
                     height={28} 
                     className="object-contain"
                   />
                 </div>
               ) : (
                <Image 
                  src="/icon_cherry_blossom.png" 
                  alt="X-Reason" 
                  width={180} 
                  height={60} 
                  priority
                  className="object-contain"
                />
              )}
            </Link>
          </div>
          
          {/* Navigation items */}
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-md transition-colors ${
                      isCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2 justify-start'
                    } ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted hover:text-muted-foreground'
                    }`}
                    style={{
                      backgroundColor: isActive(item.href) ? '#6FB85F' : 'transparent',
                      color: isActive(item.href) ? '#ffffff' : '#1f2937'
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} className={isCollapsed ? '' : 'mr-3'} />
                    <span className={isCollapsed ? 'hidden' : 'inline'}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}