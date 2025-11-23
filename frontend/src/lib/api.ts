/**
 * BUGS FIXED (18 total):
 *
 * Configuration (1 bug):
 * 1. Hardcoded API URL - Now using NEXT_PUBLIC_API_URL environment variable
 *
 * Input Validation (3 bugs):
 * 2. No input validation - Added validation for all inputs
 * 3. Missing encodeURIComponent - Added URL encoding for all parameters
 * 4. No validation that movie has required fields - Added validation before adding
 *
 * Error Handling (9 bugs):
 * 5. No try-catch blocks - Added comprehensive error handling
 * 6. Doesn't check response.ok - Now checks before parsing
 * 7. Doesn't handle 404 properly - Returns empty array for empty favorites
 * 8. Backend HttpException not detected - Properly handles backend error format
 * 9. response.json() might fail if not OK - Checks response.ok first
 * 10. No timeout handling - Added 10 second timeout using AbortSignal
 * 11. Error messages not descriptive - Added detailed error messages
 * 12. No retry logic - Handled by React Query, not needed here
 * 13. No network error detection - Detects and handles network errors
 *
 * Response Handling (5 bugs):
 * 14. Backend returns HttpException object - Detects and throws properly
 * 15. Checking status !== 200 instead of !response.ok - Fixed
 * 16. Even if status 200, might have error - Checks response body for errors
 * 17. Not checking for error structure - Properly detects backend errors
 * 18. getFavorites crashes on 404 - Returns empty result instead
 *
 * IMPROVEMENTS:
 * - Custom ApiError class for better error handling
 * - Comprehensive input validation
 * - URL encoding for all parameters
 * - Request timeout handling
 * - Proper error messages with context
 * - Handles backend NestJS HttpException format
 * - Returns empty array for 404 on favorites (empty state)
 * - Type-safe API calls
 * - Better code organization
 */

import { Movie, SearchMoviesResponse, FavoritesResponse } from '@/types/movie';

/**
 * Custom API Error class for better error handling
 */
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Get API base URL from environment variable with fallback
// API uses versioning: /api/v1/movies
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1/movies';

/**
 * Helper function to create abort signal with timeout
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortSignal that aborts after timeout
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Helper function to handle fetch errors
 * @param response - Fetch response
 * @returns Parsed JSON or throws ApiError
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Check if response is OK (status 200-299)
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      // Handle NestJS HttpException format {message, statusCode, error}
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If JSON parsing fails, use default error message
    }

    throw new ApiError(errorMessage, response.status);
  }

  // Parse response JSON
  const data = await response.json();

  // Check if response body contains error (backend might return 200 with error object)
  // NestJS HttpException format: {message, statusCode, error}
  if (data.statusCode && data.message) {
    throw new ApiError(data.message, data.statusCode);
  }

  return data;
}

/**
 * Movie API client
 */
export const movieApi = {
  /**
   * Search movies by title
   * @param query - Search query (must be non-empty)
   * @param page - Page number (must be >= 1)
   * @returns Search results
   * @throws ApiError if request fails
   */
  searchMovies: async (
    query: string,
    page: number = 1,
  ): Promise<SearchMoviesResponse> => {
    // Validate inputs
    if (!query || query.trim().length === 0) {
      throw new ApiError('Search query cannot be empty', 400);
    }
    if (page < 1 || !Number.isInteger(page)) {
      throw new ApiError('Page must be a positive integer', 400);
    }

    try {
      // Use encodeURIComponent to handle special characters
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `${API_BASE_URL}/search?q=${encodedQuery}&page=${page}`;

      // Make request with 10 second timeout
      const response = await fetch(url, {
        signal: createTimeoutSignal(10000),
      });

      return await handleResponse<SearchMoviesResponse>(response);
    } catch (error) {
      // Handle specific error types
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, error);
        }
        if (error.message.includes('fetch')) {
          throw new ApiError('Network error: Unable to connect to server', 0, error);
        }
      }
      throw new ApiError('Failed to search movies', 500, error);
    }
  },

  /**
   * Get favorites list
   * @param page - Page number (must be >= 1)
   * @returns Favorites list
   * @throws ApiError if request fails (except for 404 which returns empty)
   */
  getFavorites: async (page: number = 1): Promise<FavoritesResponse> => {
    // Validate input
    if (page < 1 || !Number.isInteger(page)) {
      throw new ApiError('Page must be a positive integer', 400);
    }

    try {
      const url = `${API_BASE_URL}/favorites/list?page=${page}`;

      // Make request with 10 second timeout
      const response = await fetch(url, {
        signal: createTimeoutSignal(10000),
      });

      // Handle 404 as empty favorites (not an error)
      if (response.status === 404) {
        return {
          data: {
            favorites: [],
            count: 0,
            totalResults: '0',
            currentPage: page,
            totalPages: 0,
          },
        };
      }

      return await handleResponse<FavoritesResponse>(response);
    } catch (error) {
      // Handle specific error types
      if (error instanceof ApiError) {
        // 404 is not an error for favorites
        if (error.statusCode === 404) {
          return {
            data: {
              favorites: [],
              count: 0,
              totalResults: '0',
              currentPage: page,
              totalPages: 0,
            },
          };
        }
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, error);
        }
        if (error.message.includes('fetch')) {
          throw new ApiError('Network error: Unable to connect to server', 0, error);
        }
      }
      throw new ApiError('Failed to get favorites', 500, error);
    }
  },

  /**
   * Add movie to favorites
   * @param movie - Movie to add (must have all required fields)
   * @returns void
   * @throws ApiError if request fails
   */
  addToFavorites: async (movie: Movie): Promise<void> => {
    // Validate input - ensure movie has all required fields
    if (!movie || !movie.imdbID || !movie.title) {
      throw new ApiError('Invalid movie data: missing required fields', 400);
    }

    // Validate year
    if (movie.year === undefined || movie.year === null) {
      throw new ApiError('Invalid movie data: year is required', 400);
    }

    // Validate poster
    if (!movie.poster) {
      throw new ApiError('Invalid movie data: poster is required', 400);
    }

    try {
      const url = `${API_BASE_URL}/favorites`;

      // Make request with 10 second timeout
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: movie.title,
          imdbID: movie.imdbID,
          year: typeof movie.year === 'string' ? parseInt(movie.year) : movie.year,
          poster: movie.poster,
        }),
        signal: createTimeoutSignal(10000),
      });

      // Use handleResponse to check for errors
      await handleResponse(response);
    } catch (error) {
      // Handle specific error types
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, error);
        }
        if (error.message.includes('fetch')) {
          throw new ApiError('Network error: Unable to connect to server', 0, error);
        }
      }
      throw new ApiError('Failed to add movie to favorites', 500, error);
    }
  },

  /**
   * Remove movie from favorites
   * @param imdbID - IMDb ID of movie to remove
   * @returns void
   * @throws ApiError if request fails
   */
  removeFromFavorites: async (imdbID: string): Promise<void> => {
    // Validate input
    if (!imdbID || imdbID.trim().length === 0) {
      throw new ApiError('IMDb ID is required', 400);
    }

    try {
      // Use encodeURIComponent for URL parameter
      const encodedId = encodeURIComponent(imdbID.trim());
      const url = `${API_BASE_URL}/favorites/${encodedId}`;

      // Make request with 10 second timeout
      const response = await fetch(url, {
        method: 'DELETE',
        signal: createTimeoutSignal(10000),
      });

      // Use handleResponse to check for errors
      await handleResponse(response);
    } catch (error) {
      // Handle specific error types
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, error);
        }
        if (error.message.includes('fetch')) {
          throw new ApiError('Network error: Unable to connect to server', 0, error);
        }
      }
      throw new ApiError('Failed to remove movie from favorites', 500, error);
    }
  },
};
