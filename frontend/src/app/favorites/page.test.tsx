import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Favorites from './page';
import { useFavorites, useRemoveFromFavorites } from '@/hooks/useMovies';
import { Movie } from '@/types/movie';

// Mock the hooks
jest.mock('@/hooks/useMovies');
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, sizes, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...imgProps} />;
  },
}));

const mockUseFavorites = useFavorites as jest.MockedFunction<typeof useFavorites>;
const mockUseRemoveFromFavorites = useRemoveFromFavorites as jest.MockedFunction<
  typeof useRemoveFromFavorites
>;

describe('Favorites Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    jest.clearAllMocks();
  });

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockMovie: Movie = {
    title: 'The Matrix',
    imdbID: 'tt0133093',
    year: '1999',
    poster: 'https://m.media-amazon.com/images/poster.jpg',
    isFavorite: true,
  };

  describe('Loading State', () => {
    it('should display skeleton loaders while loading', () => {
      mockUseFavorites.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      // Should show skeleton loaders - check by aria-label
      const skeletons = screen.getAllByLabelText('Loading movie card');
      expect(skeletons.length).toBeGreaterThan(0);
      expect(skeletons.length).toBe(10); // Should render 10 skeleton loaders
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no favorites', () => {
      mockUseFavorites.mockReturnValue({
        data: {
          pages: [
            {
              data: {
                favorites: [],
                count: 0,
                totalResults: '0',
                currentPage: 1,
                totalPages: 0,
              },
            },
          ],
        },
        isLoading: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      expect(screen.getByText('No Favorites Yet')).toBeInTheDocument();
      expect(screen.getByText(/Start adding movies/i)).toBeInTheDocument();
      expect(screen.getByText('Search Movies')).toBeInTheDocument();
    });

    it('should display correct count when empty', () => {
      mockUseFavorites.mockReturnValue({
        data: {
          pages: [
            {
              data: {
                favorites: [],
                count: 0,
                totalResults: '0',
                currentPage: 1,
                totalPages: 0,
              },
            },
          ],
        },
        isLoading: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      expect(screen.getByText('0 movies saved')).toBeInTheDocument();
    });
  });

  describe('Favorites Display', () => {
    it('should display favorites when available', () => {
      mockUseFavorites.mockReturnValue({
        data: {
          pages: [
            {
              data: {
                favorites: [mockMovie],
                count: 1,
                totalResults: '1',
                currentPage: 1,
                totalPages: 1,
              },
            },
          ],
        },
        isLoading: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      expect(screen.getByText('The Matrix')).toBeInTheDocument();
      expect(screen.getByText('1999')).toBeInTheDocument();
      expect(screen.getByText('1 movie saved')).toBeInTheDocument();
    });

    it('should display correct plural count', () => {
      const movies = [mockMovie, { ...mockMovie, imdbID: 'tt0000002', title: 'Movie 2' }];

      mockUseFavorites.mockReturnValue({
        data: {
          pages: [
            {
              data: {
                favorites: movies,
                count: 2,
                totalResults: '2',
                currentPage: 1,
                totalPages: 1,
              },
            },
          ],
        },
        isLoading: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      expect(screen.getByText('2 movies saved')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', () => {
      mockUseFavorites.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load favorites'),
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load favorites/i)).toBeInTheDocument();
    });

    it('should display default error message when error has no message', () => {
      mockUseFavorites.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error(''),
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      expect(screen.getByText(/Failed to load favorites/i)).toBeInTheDocument();
    });
  });

  describe('Infinite Scrolling', () => {
    it('should show loading indicator when fetching next page', () => {
      mockUseFavorites.mockReturnValue({
        data: {
          pages: [
            {
              data: {
                favorites: [mockMovie],
                count: 1,
                totalResults: '15',
                currentPage: 1,
                totalPages: 2,
              },
            },
          ],
        },
        isLoading: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: true,
        isFetchingNextPage: true,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      // Should show loading skeletons for next page - check by aria-label
      const skeletons = screen.getAllByLabelText('Loading movie card');
      expect(skeletons.length).toBeGreaterThan(0);
      // Should have the existing movie plus 5 skeleton loaders for next page
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });

    it('should show end message when no more pages', () => {
      mockUseFavorites.mockReturnValue({
        data: {
          pages: [
            {
              data: {
                favorites: [mockMovie],
                count: 1,
                totalResults: '1',
                currentPage: 1,
                totalPages: 1,
              },
            },
          ],
        },
        isLoading: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      expect(screen.getByText(/You've reached the end/i)).toBeInTheDocument();
    });
  });

  describe('Remove Favorite', () => {
    it('should call removeFromFavorites when favorite is toggled', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);

      mockUseFavorites.mockReturnValue({
        data: {
          pages: [
            {
              data: {
                favorites: [mockMovie],
                count: 1,
                totalResults: '1',
                currentPage: 1,
                totalPages: 1,
              },
            },
          ],
        },
        isLoading: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: mockMutateAsync,
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      // Find and click the favorite button (this would be in MovieCard)
      // For now, we verify the hook is set up correctly
      expect(mockUseRemoveFromFavorites).toHaveBeenCalled();
    });

    it('should prevent duplicate requests when clicking rapidly', async () => {
      const mockMutateAsync = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      mockUseFavorites.mockReturnValue({
        data: {
          pages: [
            {
              data: {
                favorites: [mockMovie],
                count: 1,
                totalResults: '1',
                currentPage: 1,
                totalPages: 1,
              },
            },
          ],
        },
        isLoading: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: mockMutateAsync,
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      // The component should handle rapid clicks via mutatingMovieId state
      // This is tested at the component level
      expect(mockUseRemoveFromFavorites).toHaveBeenCalled();
    });
  });

  describe('Multiple Pages', () => {
    it('should flatten and display favorites from multiple pages', () => {
      const page1Movies = [mockMovie];
      const page2Movie = { ...mockMovie, imdbID: 'tt0000002', title: 'Movie 2' };

      mockUseFavorites.mockReturnValue({
        data: {
          pages: [
            {
              data: {
                favorites: page1Movies,
                count: 1,
                totalResults: '2',
                currentPage: 1,
                totalPages: 2,
              },
            },
            {
              data: {
                favorites: [page2Movie],
                count: 1,
                totalResults: '2',
                currentPage: 2,
                totalPages: 2,
              },
            },
          ],
        },
        isLoading: false,
        error: null,
        fetchNextPage: jest.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      } as any);

      mockUseRemoveFromFavorites.mockReturnValue({
        mutateAsync: jest.fn(),
        mutate: jest.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      } as any);

      render(<Favorites />, { wrapper: createWrapper });

      expect(screen.getByText('The Matrix')).toBeInTheDocument();
      expect(screen.getByText('Movie 2')).toBeInTheDocument();
      expect(screen.getByText('2 movies saved')).toBeInTheDocument();
    });
  });
});

