import { render, screen, fireEvent } from '@testing-library/react';
import MovieCard from './MovieCard';
import { Movie } from '@/types/movie';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('MovieCard', () => {
  const mockMovie: Movie = {
    title: 'The Matrix',
    imdbID: 'tt0133093',
    year: '1999',
    poster: 'https://m.media-amazon.com/images/poster.jpg',
    isFavorite: false,
  };

  const mockOnToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render movie title', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('The Matrix')).toBeInTheDocument();
    });

    it('should render movie year', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('1999')).toBeInTheDocument();
    });

    it('should render movie poster from allowed domain', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const image = screen.getByAlt('The Matrix');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockMovie.poster);
    });

    it('should show fallback UI for invalid poster domain', () => {
      const movieWithInvalidPoster = {
        ...mockMovie,
        poster: 'https://invalid-domain.com/poster.jpg',
      };

      render(
        <MovieCard
          movie={movieWithInvalidPoster}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('No Image')).toBeInTheDocument();
      expect(screen.queryByAlt('The Matrix')).not.toBeInTheDocument();
    });

    it('should show fallback UI for "N/A" poster', () => {
      const movieWithNAPoster = {
        ...mockMovie,
        poster: 'N/A',
      };

      render(
        <MovieCard
          movie={movieWithNAPoster}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('No Image')).toBeInTheDocument();
    });

    it('should show fallback UI for empty poster', () => {
      const movieWithEmptyPoster = {
        ...mockMovie,
        poster: '',
      };

      render(
        <MovieCard
          movie={movieWithEmptyPoster}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('No Image')).toBeInTheDocument();
    });
  });

  describe('Favorite Button', () => {
    it('should show unfavorite button when isFavorite is false', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const button = screen.getByLabelText('Add to favorites');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-white/80');
    });

    it('should show favorite button when isFavorite is true', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={true}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const button = screen.getByLabelText('Remove from favorites');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-red-500');
    });

    it('should call onToggleFavorite when button is clicked', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const button = screen.getByLabelText('Add to favorites');
      fireEvent.click(button);

      expect(mockOnToggleFavorite).toHaveBeenCalledTimes(1);
      expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockMovie);
    });

    it('should disable button when isLoading is true', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          isLoading={true}
        />
      );

      const button = screen.getByLabelText('Add to favorites');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('should show loading spinner when isLoading is true', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          isLoading={true}
        />
      );

      // Check for loading spinner
      const spinner = screen.getByLabelText('Add to favorites').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not call onToggleFavorite when disabled', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          isLoading={true}
        />
      );

      const button = screen.getByLabelText('Add to favorites');
      fireEvent.click(button);

      expect(mockOnToggleFavorite).not.toHaveBeenCalled();
    });
  });

  describe('Image Error Handling', () => {
    it('should show fallback UI when image fails to load', () => {
      const { rerender } = render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const image = screen.getByAlt('The Matrix');

      // Simulate image error
      fireEvent.error(image);

      // Rerender to reflect state change
      rerender(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      // Should show fallback after error
      expect(screen.getByText('No Image')).toBeInTheDocument();
    });
  });

  describe('Component Memoization', () => {
    it('should have displayName for debugging', () => {
      expect(MovieCard.displayName).toBe('MovieCard');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for add to favorites button', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
    });

    it('should have proper aria-label for remove from favorites button', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={true}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
    });

    it('should have alt text for movie poster', () => {
      render(
        <MovieCard
          movie={mockMovie}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const image = screen.getByAlt('The Matrix');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle movie with special characters in title', () => {
      const movieWithSpecialChars = {
        ...mockMovie,
        title: "The Matrix: Reloaded & Revolutions",
      };

      render(
        <MovieCard
          movie={movieWithSpecialChars}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText("The Matrix: Reloaded & Revolutions")).toBeInTheDocument();
    });

    it('should handle very long movie titles', () => {
      const movieWithLongTitle = {
        ...mockMovie,
        title: "The Very Long Title That Should Be Truncated With Line Clamp But Still Display Properly In The UI",
      };

      render(
        <MovieCard
          movie={movieWithLongTitle}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const titleElement = screen.getByText(movieWithLongTitle.title);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('line-clamp-2');
    });

    it('should handle year ranges (e.g., "2020-2021")', () => {
      const movieWithYearRange = {
        ...mockMovie,
        year: "2020-2021",
      };

      render(
        <MovieCard
          movie={movieWithYearRange}
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText("2020-2021")).toBeInTheDocument();
    });
  });
});
