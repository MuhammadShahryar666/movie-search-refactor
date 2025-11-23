/**
 * BUGS FIXED (2 total):
 * 1. Inconsistent type definitions - Made totalResults string everywhere
 * 2. totalResults type mismatch - Was number in FavoritesResponse, now string to match API
 *
 * IMPROVEMENTS:
 * - Added comprehensive JSDoc comments for all interfaces
 * - Consistent totalResults type (string) across all response types
 * - Better type documentation
 * - Added year as string to support "1999-2000" format from OMDb API
 * - Proper type exports
 */

/**
 * Movie interface representing a single movie
 */
export interface Movie {
  /** Movie title */
  title: string;
  /** IMDb ID (format: tt1234567) */
  imdbID: string;
  /** Release year (can be a range like "1999-2000") */
  year: string | number;
  /** Poster URL or "N/A" if not available */
  poster: string;
  /** Whether this movie is in user's favorites */
  isFavorite?: boolean;
}

/**
 * Response structure for movie search API
 */
export interface SearchMoviesResponse {
  data: {
    /** Array of movies matching the search */
    movies: Movie[];
    /** Number of movies in this page */
    count: number;
    /** Total number of results available (as string from OMDb API) */
    totalResults: string;
  };
}

/**
 * Response structure for favorites list API
 */
export interface FavoritesResponse {
  data: {
    /** Array of favorite movies */
    favorites: Movie[];
    /** Number of favorites in this page */
    count: number;
    /** Total number of favorites (as string to match API) */
    totalResults: string;
    /** Current page number */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
  };
}
