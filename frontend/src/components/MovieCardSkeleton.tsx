/**
 * MovieCardSkeleton Component
 *
 * Skeleton loader for MovieCard to provide better UX during loading states.
 * Shows animated placeholder while movie data is being fetched.
 *
 * IMPROVEMENTS:
 * - Smooth loading animation with shimmer effect
 * - Matches MovieCard dimensions and layout
 * - Accessible with aria-label
 * - Reusable component for both search and favorites
 */

import React from "react";

const MovieCardSkeleton = React.memo(() => {
  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse"
      aria-label="Loading movie card"
      role="status"
    >
      {/* Poster skeleton */}
      <div className="relative aspect-[2/3] bg-gray-200">
        {/* Favorite button skeleton */}
        <div className="absolute top-2 right-2 w-8 h-8 bg-gray-300 rounded-full" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton - 2 lines */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Year skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
});

MovieCardSkeleton.displayName = "MovieCardSkeleton";

export default MovieCardSkeleton;
