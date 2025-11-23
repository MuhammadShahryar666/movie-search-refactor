/**
 * Navigation Component
 *
 * IMPROVEMENTS:
 * - Preserves search query parameters when navigating between pages using sessionStorage
 * - When user searches for "cars" and navigates to favorites, clicking "Search Movies"
 *   will return to search page with "cars" query preserved (from sessionStorage)
 * - Works across different routes (not just URL params)
 * - Query persists only during browser session (cleared when browser closes)
 * - Logo link also preserves search state for better UX
 * - Mobile-responsive navigation with hamburger menu
 * - Active route highlighting
 */

'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Preserve search query when navigating back to search page
  // Use sessionStorage to persist across different routes
  const searchHref = useMemo(() => {
    // First try URL params (if we're on search page)
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      return `/?q=${encodeURIComponent(urlQuery)}`;
    }

    // Then try sessionStorage (if navigating from another page)
    if (typeof window !== 'undefined') {
      const savedQuery = sessionStorage.getItem('lastSearchQuery');
      if (savedQuery) {
        return `/?q=${encodeURIComponent(savedQuery)}`;
      }
    }

    return '/';
  }, [searchParams]);

  const navItems = [
    { href: searchHref, label: 'Search Movies', icon: '🔍' },
    { href: '/favorites', label: 'My Favorites', icon: '❤️' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-gradient-hero border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={searchHref} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">OMDb</span>
          </Link>

          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                  pathname === item.href
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-foreground hover:bg-secondary/50 transition-smooth"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    pathname === item.href
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

