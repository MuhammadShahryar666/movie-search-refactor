import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { SearchMoviesDto } from './dto/search-movies.dto';
import { MovieDto } from './dto/movie.dto';
import { PaginationDto } from './dto/pagination.dto';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

  // Mock MoviesService
  const mockMoviesService = {
    getMovieByTitle: jest.fn(),
    addToFavorites: jest.fn(),
    removeFromFavorites: jest.fn(),
    getFavorites: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('searchMovies', () => {
    const mockSearchResult = {
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

    it('should search movies successfully with default page', async () => {
      const searchDto: SearchMoviesDto = { q: 'matrix' };
      mockMoviesService.getMovieByTitle.mockResolvedValue(mockSearchResult);

      const result = await controller.searchMovies(searchDto);

      expect(result).toEqual(mockSearchResult);
      expect(service.getMovieByTitle).toHaveBeenCalledWith('matrix', 1);
      expect(service.getMovieByTitle).toHaveBeenCalledTimes(1);
    });

    it('should search movies successfully with custom page', async () => {
      const searchDto: SearchMoviesDto = { q: 'matrix', page: 2 };
      mockMoviesService.getMovieByTitle.mockResolvedValue(mockSearchResult);

      const result = await controller.searchMovies(searchDto);

      expect(result).toEqual(mockSearchResult);
      expect(service.getMovieByTitle).toHaveBeenCalledWith('matrix', 2);
    });

    it('should handle service errors and re-throw them', async () => {
      const searchDto: SearchMoviesDto = { q: 'matrix' };
      const error = new HttpException(
        'Search query cannot be empty',
        HttpStatus.BAD_REQUEST,
      );

      mockMoviesService.getMovieByTitle.mockRejectedValue(error);

      await expect(controller.searchMovies(searchDto)).rejects.toThrow(error);
      expect(service.getMovieByTitle).toHaveBeenCalledWith('matrix', 1);
    });

    it('should handle network errors from service', async () => {
      const searchDto: SearchMoviesDto = { q: 'matrix' };
      const error = new HttpException(
        'Unable to connect to OMDb API',
        HttpStatus.SERVICE_UNAVAILABLE,
      );

      mockMoviesService.getMovieByTitle.mockRejectedValue(error);

      await expect(controller.searchMovies(searchDto)).rejects.toThrow(error);
    });

    it('should handle empty results', async () => {
      const searchDto: SearchMoviesDto = { q: 'nonexistent' };
      const emptyResult = {
        data: {
          movies: [],
          count: 0,
          totalResults: '0',
        },
      };

      mockMoviesService.getMovieByTitle.mockResolvedValue(emptyResult);

      const result = await controller.searchMovies(searchDto);

      expect(result).toEqual(emptyResult);
      expect(service.getMovieByTitle).toHaveBeenCalledWith('nonexistent', 1);
    });
  });

  describe('addToFavorites', () => {
    const mockMovie: MovieDto = {
      title: 'The Matrix',
      imdbID: 'tt0133093',
      year: 1999,
      poster: 'https://example.com/poster.jpg',
    };

    const mockSuccessResponse = {
      data: {
        message: 'Movie added to favorites',
      },
    };

    it('should add movie to favorites successfully', () => {
      mockMoviesService.addToFavorites.mockReturnValue(mockSuccessResponse);

      const result = controller.addToFavorites(mockMovie);

      expect(result).toEqual(mockSuccessResponse);
      expect(service.addToFavorites).toHaveBeenCalledWith(mockMovie);
      expect(service.addToFavorites).toHaveBeenCalledTimes(1);
    });

    it('should throw error when movie already in favorites', () => {
      const error = new HttpException(
        'Movie already in favorites',
        HttpStatus.BAD_REQUEST,
      );

      mockMoviesService.addToFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.addToFavorites(mockMovie)).toThrow(error);
      expect(service.addToFavorites).toHaveBeenCalledWith(mockMovie);
    });

    it('should throw error for invalid movie data', () => {
      const invalidMovie = {
        title: 'The Matrix',
        imdbID: '', // Invalid: empty imdbID
        year: 1999,
        poster: 'https://example.com/poster.jpg',
      };

      const error = new HttpException(
        'Invalid movie data',
        HttpStatus.BAD_REQUEST,
      );

      mockMoviesService.addToFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.addToFavorites(invalidMovie as MovieDto)).toThrow(
        error,
      );
    });

    it('should handle service errors and re-throw them', () => {
      const error = new HttpException(
        'Failed to save favorites',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      mockMoviesService.addToFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.addToFavorites(mockMovie)).toThrow(error);
    });
  });

  describe('removeFromFavorites', () => {
    const mockSuccessResponse = {
      data: {
        message: 'Movie removed from favorites',
      },
    };

    it('should remove movie from favorites successfully', () => {
      mockMoviesService.removeFromFavorites.mockReturnValue(mockSuccessResponse);

      const result = controller.removeFromFavorites('tt0133093');

      expect(result).toEqual(mockSuccessResponse);
      expect(service.removeFromFavorites).toHaveBeenCalledWith('tt0133093');
      expect(service.removeFromFavorites).toHaveBeenCalledTimes(1);
    });

    it('should throw error when movie not found in favorites', () => {
      const error = new HttpException(
        'Movie not found in favorites',
        HttpStatus.NOT_FOUND,
      );

      mockMoviesService.removeFromFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.removeFromFavorites('tt0000000')).toThrow(error);
      expect(service.removeFromFavorites).toHaveBeenCalledWith('tt0000000');
    });

    it('should throw error for empty imdbID', () => {
      // Controller validates empty imdbID before calling service
      expect(() => controller.removeFromFavorites('')).toThrow('imdbID parameter is required');
    });

    it('should handle service errors and re-throw them', () => {
      const error = new HttpException(
        'Failed to save favorites',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      mockMoviesService.removeFromFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.removeFromFavorites('tt0133093')).toThrow(error);
    });
  });

  describe('getFavorites', () => {
    const mockFavoritesResult = {
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

    it('should get favorites successfully with default page', () => {
      const paginationDto: PaginationDto = {};
      mockMoviesService.getFavorites.mockReturnValue(mockFavoritesResult);

      const result = controller.getFavorites(paginationDto);

      expect(result).toEqual(mockFavoritesResult);
      expect(service.getFavorites).toHaveBeenCalledWith(1);
      expect(service.getFavorites).toHaveBeenCalledTimes(1);
    });

    it('should get favorites successfully with custom page', () => {
      const paginationDto: PaginationDto = { page: 2 };
      mockMoviesService.getFavorites.mockReturnValue(mockFavoritesResult);

      const result = controller.getFavorites(paginationDto);

      expect(result).toEqual(mockFavoritesResult);
      expect(service.getFavorites).toHaveBeenCalledWith(2);
    });

    it('should return empty array when no favorites', () => {
      const paginationDto: PaginationDto = {};
      const emptyResult = {
        data: {
          favorites: [],
          count: 0,
          totalResults: '0',
          currentPage: 1,
          totalPages: 0,
        },
      };

      mockMoviesService.getFavorites.mockReturnValue(emptyResult);

      const result = controller.getFavorites(paginationDto);

      expect(result).toEqual(emptyResult);
      expect(service.getFavorites).toHaveBeenCalledWith(1);
    });

    it('should handle pagination correctly', () => {
      const paginationDto: PaginationDto = { page: 2 };
      const paginatedResult = {
        data: {
          favorites: [
            {
              title: 'Movie 11',
              imdbID: 'tt0000011',
              year: 2021,
              poster: 'https://example.com/11.jpg',
            },
          ],
          count: 1,
          totalResults: '15',
          currentPage: 2,
          totalPages: 2,
        },
      };

      mockMoviesService.getFavorites.mockReturnValue(paginatedResult);

      const result = controller.getFavorites(paginationDto);

      expect(result).toEqual(paginatedResult);
      expect(result.data.currentPage).toBe(2);
      expect(result.data.totalPages).toBe(2);
    });

    it('should throw error for invalid page number', () => {
      const paginationDto: PaginationDto = { page: 0 };
      const error = new HttpException(
        'Page must be a positive integer',
        HttpStatus.BAD_REQUEST,
      );

      mockMoviesService.getFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.getFavorites(paginationDto)).toThrow(error);
    });

    it('should handle service errors and re-throw them', () => {
      const paginationDto: PaginationDto = { page: 1 };
      const error = new HttpException(
        'Failed to load favorites',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      mockMoviesService.getFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.getFavorites(paginationDto)).toThrow(error);
    });
  });

  describe('Error Logging', () => {
    it('should log errors in searchMovies', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const searchDto: SearchMoviesDto = { q: 'matrix' };
      const error = new Error('Test error');

      mockMoviesService.getMovieByTitle.mockRejectedValue(error);

      await expect(controller.searchMovies(searchDto)).rejects.toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in searchMovies controller:',
        error,
      );

      consoleSpy.mockRestore();
    });

    it('should log errors in addToFavorites', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMovie: MovieDto = {
        title: 'The Matrix',
        imdbID: 'tt0133093',
        year: 1999,
        poster: 'https://example.com/poster.jpg',
      };
      const error = new Error('Test error');

      mockMoviesService.addToFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.addToFavorites(mockMovie)).toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in addToFavorites controller:',
        error,
      );

      consoleSpy.mockRestore();
    });

    it('should log errors in removeFromFavorites', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      mockMoviesService.removeFromFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.removeFromFavorites('tt0133093')).toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in removeFromFavorites controller:',
        error,
      );

      consoleSpy.mockRestore();
    });

    it('should log errors in getFavorites', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const paginationDto: PaginationDto = { page: 1 };
      const error = new Error('Test error');

      mockMoviesService.getFavorites.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.getFavorites(paginationDto)).toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in getFavorites controller:',
        error,
      );

      consoleSpy.mockRestore();
    });
  });
});
