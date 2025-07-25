"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/pages/chemli', label: 'Chemli Demo' },
    { href: '/pages/regie', label: 'Regie Demo' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '?');
  };

  return (
    <nav 
      className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card text-card-foreground p-4"
      style={{
        backgroundColor: '#f9fafb',
        color: '#1f2937',
        borderRight: '1px solid #d1d5db'
      }}
    >
      <div className="mb-8">
        <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity">
          <Image 
            src="/icon_cherry_blossom.png" 
            alt="X-Reason" 
            width={180} 
            height={60} 
            priority
            className="object-contain"
          />
        </Link>
      </div>
      
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block px-3 py-2 rounded-md transition-colors ${
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted hover:text-muted-foreground'
              }`}
              style={{
                backgroundColor: isActive(item.href) ? '#6FB85F' : 'transparent',
                color: isActive(item.href) ? '#ffffff' : '#1f2937'
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}