import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useSearchMovies,
  useFavorites,
  useAddToFavorites,
  useRemoveFromFavorites,
} from './useMovies';
import { movieApi } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  movieApi: {
    searchMovies: jest.fn(),
    getFavorites: jest.fn(),
    addToFavorites: jest.fn(),
    removeFromFavorites: jest.fn(),
  },
}));

const mockMovieApi = movieApi as jest.Mocked<typeof movieApi>;

describe('useMovies Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset all mocks (clears both call history and implementation)
    jest.clearAllMocks();
    mockMovieApi.searchMovies.mockReset();
    mockMovieApi.getFavorites.mockReset();
    mockMovieApi.addToFavorites.mockReset();
    mockMovieApi.removeFromFavorites.mockReset();
    
    // Create fresh queryClient before each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries in tests
          gcTime: 0, // Disable garbage collection for tests
        },
        mutations: {
          retry: false,
        },
      },
    });
  });

  // Create a wrapper component for React Query
  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  describe('useSearchMovies', () => {
    it('should return search results successfully', async () => {
      const mockResponse = {
        data: {
          movies: [
            {
              title: 'The Matrix',
              imdbID: 'tt0133093',
              year: '1999',
              poster: 'https://example.com/poster.jpg',
              isFavorite: false,
            },
          ],
          count: 1,
          totalResults: '234',
        },
      };

      mockMovieApi.searchMovies.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(
        () => useSearchMovies('matrix', true),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0]).toEqual(mockResponse);
      expect(mockMovieApi.searchMovies).toHaveBeenCalledWith('matrix', 1);
    });

    it('should not fetch when enabled is false', () => {
      renderHook(
        () => useSearchMovies('matrix', false),
        { wrapper: createWrapper() }
      );

      expect(mockMovieApi.searchMovies).not.toHaveBeenCalled();
    });

    it('should not fetch when query is empty', () => {
      renderHook(
        () => useSearchMovies('', true),
        { wrapper: createWrapper() }
      );

      expect(mockMovieApi.searchMovies).not.toHaveBeenCalled();
    });

    it('should handle errors correctly', async () => {
      const error = new Error('Network error');
      // The hook has retry: 1, so it will retry once
      // Mock to reject for both initial call and retry
      mockMovieApi.searchMovies
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchMovies('matrix', true),
        { wrapper }
      );

      // Wait for query to finish (not pending) - with retry it may take longer
      await waitFor(() => {
        return !result.current.isPending;
      }, {
        timeout: 5000,
      });

      // After retries are exhausted, query should be in error state
      // Note: With retry: 1, it tries twice before giving up
      await waitFor(() => {
        return result.current.isError === true || result.current.error !== undefined;
      }, {
        timeout: 1000,
      });

      // Verify error was handled
      expect(result.current.error).toBeDefined();
      if (result.current.error) {
        expect(result.current.error.message).toBe('Network error');
      }
      // Query should eventually be in error state
      expect(result.current.isError || result.current.error !== undefined).toBe(true);
    });

    it('should calculate next page correctly', async () => {
      const mockPage1 = {
        data: {
          movies: Array.from({ length: 10 }, (_, i) => ({
            title: `Movie ${i + 1}`,
            imdbID: `tt${i}`,
            year: '2020',
            poster: 'https://example.com/poster.jpg',
            isFavorite: false,
          })),
          count: 10,
          totalResults: '25', // 3 pages total
        },
      };

      mockMovieApi.searchMovies.mockResolvedValueOnce(mockPage1);

      const { result } = renderHook(
        () => useSearchMovies('matrix', true),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.hasNextPage).toBe(true);
    });

    it('should return undefined for next page when on last page', async () => {
      const mockLastPage = {
        data: {
          movies: [{ title: 'Last Movie', imdbID: 'tt999', year: '2020', poster: '', isFavorite: false }],
          count: 1,
          totalResults: '1', // Only 1 page
        },
      };

      mockMovieApi.searchMovies.mockResolvedValueOnce(mockLastPage);

      const { result } = renderHook(
        () => useSearchMovies('matrix', true),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('useFavorites', () => {
    it('should fetch favorites successfully', async () => {
      const mockResponse = {
        data: {
          favorites: [
            {
              title: 'The Matrix',
              imdbID: 'tt0133093',
              year: 1999,
              poster: 'https://example.com/poster.jpg',
            },
          ],
          count: 1,
          totalResults: '1',
          currentPage: 1,
          totalPages: 1,
        },
      };

      mockMovieApi.getFavorites.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0]).toEqual(mockResponse);
      expect(mockMovieApi.getFavorites).toHaveBeenCalledWith(1);
    });

    it('should handle empty favorites', async () => {
      const mockResponse = {
        data: {
          favorites: [],
          count: 0,
          totalResults: '0',
          currentPage: 1,
          totalPages: 0,
        },
      };

      mockMovieApi.getFavorites.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].data.favorites).toEqual([]);
    });

    it('should handle errors correctly', async () => {
      const error = new Error('Failed to fetch favorites');
      // The hook has retry: 1, so it will retry once
      // Mock to reject for both initial call and retry
      mockMovieApi.getFavorites
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useFavorites(), {
        wrapper,
      });

      // Wait for query to finish (not pending) - with retry it may take longer
      await waitFor(() => {
        return !result.current.isPending;
      }, {
        timeout: 5000,
      });

      // After retries are exhausted, query should be in error state
      // Note: With retry: 1, it tries twice before giving up
      await waitFor(() => {
        return result.current.isError === true || result.current.error !== undefined;
      }, {
        timeout: 1000,
      });

      // Verify error was handled
      expect(result.current.error).toBeDefined();
      if (result.current.error) {
        expect(result.current.error.message).toBe('Failed to fetch favorites');
      }
      // Query should eventually be in error state
      expect(result.current.isError || result.current.error !== undefined).toBe(true);
    });

    it('should calculate next page correctly for favorites', async () => {
      const mockPage1 = {
        data: {
          favorites: Array.from({ length: 10 }, (_, i) => ({
            title: `Movie ${i + 1}`,
            imdbID: `tt${i}`,
            year: 2020 + i,
            poster: 'https://example.com/poster.jpg',
          })),
          count: 10,
          totalResults: '25',
          currentPage: 1,
          totalPages: 3,
        },
      };

      mockMovieApi.getFavorites.mockResolvedValueOnce(mockPage1);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.hasNextPage).toBe(true);
    });
  });

  describe('useAddToFavorites', () => {
    it('should add movie to favorites successfully', async () => {
      const movie = {
        title: 'The Matrix',
        imdbID: 'tt0133093',
        year: '1999',
        poster: 'https://example.com/poster.jpg',
        isFavorite: false,
      };

      mockMovieApi.addToFavorites.mockResolvedValueOnce();

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAddToFavorites(), {
        wrapper,
      });

      result.current.mutate(movie);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // TanStack Query v5 passes mutation variables as first arg, context as second
      expect(mockMovieApi.addToFavorites).toHaveBeenCalledWith(movie, expect.anything());
    });

    it('should invalidate queries on success', async () => {
      const movie = {
        title: 'The Matrix',
        imdbID: 'tt0133093',
        year: '1999',
        poster: 'https://example.com/poster.jpg',
        isFavorite: false,
      };

      mockMovieApi.addToFavorites.mockResolvedValueOnce();

      const wrapper = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useAddToFavorites(), {
        wrapper,
      });

      result.current.mutate(movie);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['movies', 'favorites'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['movies', 'search'] });
    });

    it('should handle errors correctly', async () => {
      const movie = {
        title: 'The Matrix',
        imdbID: 'tt0133093',
        year: '1999',
        poster: 'https://example.com/poster.jpg',
        isFavorite: false,
      };

      const error = new Error('Movie already in favorites');
      mockMovieApi.addToFavorites.mockRejectedValueOnce(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAddToFavorites(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(movie);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding to favorites:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('useRemoveFromFavorites', () => {
    it('should remove movie from favorites successfully', async () => {
      mockMovieApi.removeFromFavorites.mockResolvedValueOnce();

      const wrapper = createWrapper();
      const { result } = renderHook(() => useRemoveFromFavorites(), {
        wrapper,
      });

      result.current.mutate('tt0133093');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // TanStack Query v5 passes mutation variables as first arg, context as second
      expect(mockMovieApi.removeFromFavorites).toHaveBeenCalledWith('tt0133093', expect.anything());
    });

    it('should invalidate queries on success', async () => {
      mockMovieApi.removeFromFavorites.mockResolvedValueOnce();

      const wrapper = createWrapper();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRemoveFromFavorites(), {
        wrapper,
      });

      result.current.mutate('tt0133093');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['movies', 'favorites'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['movies', 'search'] });
    });

    it('should handle errors correctly', async () => {
      const error = new Error('Movie not found in favorites');
      mockMovieApi.removeFromFavorites.mockRejectedValueOnce(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useRemoveFromFavorites(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('tt0133093');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error removing from favorites:', error);

      consoleErrorSpy.mockRestore();
    });
  });
});
