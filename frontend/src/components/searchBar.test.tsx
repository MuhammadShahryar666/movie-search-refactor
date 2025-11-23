import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './searchBar';

// Mock the Input component
jest.mock('./ui/input', () => ({
  Input: ({ className, ...props }: any) => (
    <input className={className} {...props} />
  ),
}));

describe('SearchBar', () => {
  let mockOnSearch: jest.Mock;

  beforeEach(() => {
    mockOnSearch = jest.fn();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with placeholder text', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      expect(
        screen.getByPlaceholderText('Search for movies... (min 2 characters)')
      ).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="matrix" />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      ) as HTMLInputElement;
      expect(input.value).toBe('matrix');
    });

    it('should render search icon', () => {
      const { container } = render(<SearchBar onSearch={mockOnSearch} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-gray-500');
    });

    it('should render as a form', () => {
      const { container } = render(<SearchBar onSearch={mockOnSearch} />);

      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Input Changes', () => {
    it('should update local state on input change', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'test' } });

      expect(input.value).toBe('test');
    });

    it('should handle empty input', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="matrix" />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { value: '' } });

      expect(input.value).toBe('');
    });
  });

  describe('Debouncing', () => {
    it('should not call onSearch immediately on typing', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: 'matrix' } });

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should call onSearch after 500ms delay', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: 'matrix' } });

      // After 499ms - should not have been called
      jest.advanceTimersByTime(499);
      expect(mockOnSearch).not.toHaveBeenCalled();

      // After 500ms - should be called
      jest.advanceTimersByTime(1);
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('matrix');
    });

    it('should reset debounce timer on rapid typing', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      // Type "m"
      fireEvent.change(input, { target: { value: 'm' } });
      jest.advanceTimersByTime(300);

      // Type "ma" - should reset timer
      fireEvent.change(input, { target: { value: 'ma' } });
      jest.advanceTimersByTime(300);

      // Type "mat" - should reset timer again
      fireEvent.change(input, { target: { value: 'mat' } });
      jest.advanceTimersByTime(300);

      // Still not called yet (only 900ms total, but timer kept resetting)
      expect(mockOnSearch).not.toHaveBeenCalled();

      // Wait final 200ms to reach 500ms from last change
      jest.advanceTimersByTime(200);

      // Should be called with final value
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('mat');
    });

    it('should not trigger debounce on first render with initialValue', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="matrix" />);

      // Advance timers - should not call onSearch on initial render
      jest.advanceTimersByTime(500);

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should trigger debounce after first render when user types', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="matrix" />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      // User changes the input
      fireEvent.change(input, { target: { value: 'inception' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('inception');
    });

    it('should trim whitespace before calling onSearch', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: '  matrix  ' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).toHaveBeenCalledWith('matrix');
    });
  });

  describe('Validation', () => {
    it('should block single character searches (debounce does not trigger)', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: 'm' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should allow 2 character searches', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: 'ma' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('ma');
    });

    it('should allow empty query to clear search', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="matrix" />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: '' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('should treat whitespace-only input as empty', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: '   ' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('should block single character after trimming whitespace', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: '  m  ' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call onSearch on form submit with valid query', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: 'matrix' } });
      fireEvent.submit(form);

      expect(mockOnSearch).toHaveBeenCalledWith('matrix');
    });

    it('should call onSearch on form submit with empty query', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="matrix" />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.submit(form);

      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('should not call onSearch on form submit with single character', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: 'm' } });

      // Clear previous calls from state updates
      mockOnSearch.mockClear();

      fireEvent.submit(form);

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should prevent default form behavior', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );
      const form = input.closest('form')!;

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      fireEvent(form, submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should trim whitespace on form submit', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: '  matrix  ' } });
      fireEvent.submit(form);

      expect(mockOnSearch).toHaveBeenCalledWith('matrix');
    });

    it('should bypass debounce on manual form submit', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: 'matrix' } });

      // Clear any previous calls
      mockOnSearch.mockClear();

      // Submit immediately without waiting for debounce
      fireEvent.submit(form);

      // Should be called immediately, not waiting for 500ms
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('matrix');

      // Even after advancing timers, should still only be called once
      jest.advanceTimersByTime(500);
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('initialValue Prop', () => {
    it('should sync local state when initialValue changes', () => {
      const { rerender } = render(
        <SearchBar onSearch={mockOnSearch} initialValue="matrix" />
      );

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      ) as HTMLInputElement;

      expect(input.value).toBe('matrix');

      // Update initialValue prop (e.g., URL state change)
      rerender(<SearchBar onSearch={mockOnSearch} initialValue="inception" />);

      expect(input.value).toBe('inception');
    });

    it('should update to empty when initialValue becomes empty', () => {
      const { rerender } = render(
        <SearchBar onSearch={mockOnSearch} initialValue="matrix" />
      );

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      ) as HTMLInputElement;

      expect(input.value).toBe('matrix');

      rerender(<SearchBar onSearch={mockOnSearch} initialValue="" />);

      expect(input.value).toBe('');
    });

    it('should not trigger debounce when initialValue changes', () => {
      const { rerender } = render(
        <SearchBar onSearch={mockOnSearch} initialValue="matrix" />
      );

      // Change initialValue
      rerender(<SearchBar onSearch={mockOnSearch} initialValue="inception" />);

      // This will trigger a re-render and the debounce effect
      // But isFirstRender is already false, so it will set a timer
      jest.advanceTimersByTime(500);

      // Should be called once due to the initialValue change triggering debounce
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('inception');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid changes correctly', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      // Rapid typing
      fireEvent.change(input, { target: { value: 'ma' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(input, { target: { value: 'mat' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(input, { target: { value: 'matr' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(input, { target: { value: 'matri' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(input, { target: { value: 'matrix' } });

      // Wait for final debounce
      jest.advanceTimersByTime(500);

      // Should only be called once with final value
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('matrix');
    });

    it('should handle backspace to single character', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="matrix" />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      // User deletes characters down to 1
      fireEvent.change(input, { target: { value: 'm' } });

      jest.advanceTimersByTime(500);

      // Should not call onSearch with single character
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should handle special characters in search query', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: 'spider-man: homecoming' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).toHaveBeenCalledWith('spider-man: homecoming');
    });

    it('should handle unicode characters', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: 'amélie' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).toHaveBeenCalledWith('amélie');
    });

    it('should handle numbers in search query', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: '2001: a space odyssey' } });

      jest.advanceTimersByTime(500);

      expect(mockOnSearch).toHaveBeenCalledWith('2001: a space odyssey');
    });
  });

  describe('Cleanup', () => {
    it('should clean up timeout on unmount', () => {
      const { unmount } = render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      fireEvent.change(input, { target: { value: 'matrix' } });

      // Unmount before timeout completes
      unmount();

      jest.advanceTimersByTime(500);

      // Should not call onSearch after unmount
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should clean up timeout when query changes before timeout completes', () => {
      render(<SearchBar onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(
        'Search for movies... (min 2 characters)'
      );

      // First change
      fireEvent.change(input, { target: { value: 'matrix' } });
      jest.advanceTimersByTime(300);

      // Second change before first timeout completes
      fireEvent.change(input, { target: { value: 'inception' } });
      jest.advanceTimersByTime(500);

      // Should only be called once with the latest value
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('inception');
    });
  });
});
