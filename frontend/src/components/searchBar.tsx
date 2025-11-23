/**
 * BUGS FIXED:
 * 1. No validation - Added trim() and minimum length check
 * 2. Empty strings can be submitted - Now validates before submission
 *
 * IMPROVEMENTS:
 * - Added search debouncing (500ms) to reduce API calls
 * - Debouncing improves performance and reduces server load
 * - Proper validation: minimum 2 characters for search
 * - Allows empty query to clear search results
 * - Clean up on unmount to prevent memory leaks
 * - Better user experience with automatic search on typing
 * - Supports initialValue prop for URL state persistence
 */

import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

const SearchBar = ({ onSearch, initialValue = "" }: SearchBarProps) => {
  const [query, setQuery] = useState(initialValue);
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state with initialValue when it changes (e.g., navigating back with URL params)
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Debounce search - trigger search 500ms after user stops typing
  useEffect(() => {
    // Skip debounce on first render (initial mount with URL params)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const trimmedQuery = query.trim();

    // Allow empty query (to clear search) or minimum 2 characters
    if (trimmedQuery.length === 1) {
      return; // Block single character searches
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up debounce timer
    timeoutRef.current = setTimeout(() => {
      onSearch(trimmedQuery);
      timeoutRef.current = null;
    }, 500); // 500ms debounce

    // Clean up timeout on unmount or when query changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [query, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cancel any pending debounce timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const trimmedQuery = query.trim();

    // Validate and submit - allow empty (clear) or 2+ characters
    if (trimmedQuery.length === 0 || trimmedQuery.length >= 2) {
      onSearch(trimmedQuery);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <Input
        type="text"
        placeholder="Search for movies... (min 2 characters)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-12 h-14 text-lg bg-white border-gray-300 focus:border-blue-500 transition-colors text-black"
      />
    </form>
  );
};

export default SearchBar;
