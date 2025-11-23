import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MoviesService } from './movies.service';
import axios from 'axios';
import * as path from 'path';

// Mock modules
jest.mock('axios');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const fs = require('fs');

describe('MoviesService', () => {
  let service: MoviesService;
  const testDataPath = path.join(process.cwd(), 'data', 'favorites.json');

  beforeEach(async () => {
    // Set up environment variable
    process.env.OMDB_API_KEY = 'test-api-key';

    // Reset mocks
    jest.clearAllMocks();

    // Set up default fs mock implementations
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => undefined);
    fs.readFileSync.mockReturnValue('[]');
    fs.writeFileSync.mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [MoviesService],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw error if OMDB_API_KEY is not set', () => {
      delete process.env.OMDB_API_KEY;
      expect(() => new MoviesService()).toThrow('OMDB_API_KEY environment variable is required');
    });

    it('should create data directory if it does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      const newService = new MoviesService();
      await newService.onModuleInit();
      expect(fs.mkdirSync).toHaveBeenCalled();
    });
  });

  describe('searchMovies', () => {
    it('should search movies successfully', async () => {
      const mockResponse = {
        data: {
          Response: 'True',
          Search: [
            {
              Title: 'The Matrix',
              imdbID: 'tt0133093',
              Year: '1999',
              Poster: 'https://example.com/poster.jpg',
            },
          ],
          totalResults: '234',
        },
      };

      mockedAxios.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.searchMovies('matrix', 1);

      expect(result).toEqual({
        movies: mockResponse.data.Search,
        totalResults: '234',
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('s=matrix'),
        expect.objectContaining({ timeout: 10000 }),
      );
    });

    it('should return empty array when no movies found', async () => {
      const mockResponse = {
        data: {
          Response: 'False',
          Error: 'Movie not found!',
        },
      };

      mockedAxios.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.searchMovies('nonexistent', 1);

      expect(result).toEqual({
        movies: [],
        totalResults: '0',
      });
    });

    it('should throw error for empty title', async () => {
      await expect(service.searchMovies('', 1)).rejects.toThrow(HttpException);
      await expect(service.searchMovies('', 1)).rejects.toThrow('Search query cannot be empty');
    });

    it('should accept title with 1 character (validation in DTO)', async () => {
      const mockResponse = {
        data: {
          Response: 'False',
          Error: 'Movie not found!',
        },
      };

      mockedAxios.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.searchMovies('a', 1);
      expect(result).toEqual({ movies: [], totalResults: '0' });
    });

    it('should throw error for invalid page number (zero)', async () => {
      await expect(service.searchMovies('matrix', 0)).rejects.toThrow(HttpException);
      await expect(service.searchMovies('matrix', 0)).rejects.toThrow('Page must be a positive integer');
    });

    it('should throw error for negative page number', async () => {
      await expect(service.searchMovies('matrix', -1)).rejects.toThrow(HttpException);
    });

    it('should handle ENOTFOUND network error', async () => {
      const error = {
        code: 'ENOTFOUND',
        isAxiosError: true,
      };
      mockedAxios.get = jest.fn().mockRejectedValue(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(service.searchMovies('matrix', 1)).rejects.toThrow(HttpException);
      await expect(service.searchMovies('matrix', 1)).rejects.toThrow('DNS lookup failed');
    });

    it('should handle request timeout', async () => {
      const error = {
        code: 'ECONNABORTED',
        isAxiosError: true,
      };
      mockedAxios.get = jest.fn().mockRejectedValue(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(service.searchMovies('matrix', 1)).rejects.toThrow(HttpException);
      await expect(service.searchMovies('matrix', 1)).rejects.toThrow('timeout');
    });

    it('should handle 401 unauthorized error', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          statusText: 'Unauthorized',
        },
      };
      mockedAxios.get = jest.fn().mockRejectedValue(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(service.searchMovies('matrix', 1)).rejects.toThrow(HttpException);
      await expect(service.searchMovies('matrix', 1)).rejects.toThrow('Invalid OMDb API key');
    });

    it('should encode special characters in search query', async () => {
      const mockResponse = {
        data: {
          Response: 'True',
          Search: [],
          totalResults: '0',
        },
      };

      mockedAxios.get = jest.fn().mockResolvedValue(mockResponse);

      await service.searchMovies('matrix & reloaded', 1);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('matrix%20%26%20reloaded'),
        expect.any(Object),
      );
    });
  });

  describe('getMovieByTitle', () => {
    it('should return movies with favorite status', async () => {
      const favoritesList = [
        {
          title: 'The Matrix',
          imdbID: 'tt0133093',
          year: 1999,
          poster: 'https://example.com/poster.jpg',
        },
      ];

      // Set up mock BEFORE creating service instance
      fs.readFileSync.mockReturnValue(JSON.stringify(favoritesList));

      // Create new service instance with favorites loaded
      const testService = new MoviesService();
      await testService.onModuleInit();

      const mockSearchResponse = {
        data: {
          Response: 'True',
          Search: [
            {
              Title: 'The Matrix',
              imdbID: 'tt0133093',
              Year: '1999',
              Poster: 'https://example.com/poster.jpg',
            },
          ],
          totalResults: '1',
        },
      };

      mockedAxios.get = jest.fn().mockResolvedValue(mockSearchResponse);

      const result = await testService.getMovieByTitle('matrix', 1);

      expect(result.data.movies).toHaveLength(1);
      expect(result.data.movies[0]).toHaveProperty('isFavorite', true);
    });

    it('should return movies with isFavorite false when not in favorites', async () => {
      const mockSearchResponse = {
        data: {
          Response: 'True',
          Search: [
            {
              Title: 'The Matrix',
              imdbID: 'tt0133093',
              Year: '1999',
              Poster: 'https://example.com/poster.jpg',
            },
          ],
          totalResults: '1',
        },
      };

      mockedAxios.get = jest.fn().mockResolvedValue(mockSearchResponse);
      fs.readFileSync.mockReturnValue('[]');

      const result = await service.getMovieByTitle('matrix', 1);

      expect(result.data.movies[0].isFavorite).toBe(false);
    });
  });

  describe('addToFavorites', () => {
    it('should add movie to favorites successfully', async () => {
      fs.readFileSync.mockReturnValue('[]');

      const movieToAdd = {
        title: 'The Matrix',
        imdbID: 'tt0133093',
        year: 1999,
        poster: 'https://example.com/poster.jpg',
      };

      const result = await service.addToFavorites(movieToAdd);

      expect(result.data.message).toBe('Movie added to favorites');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should throw error when movie already exists in favorites', () => {
      const existingFavorite = {
        title: 'The Matrix',
        imdbID: 'tt0133093',
        year: 1999,
        poster: 'https://example.com/poster.jpg',
      };

      fs.readFileSync.mockReturnValue(JSON.stringify([existingFavorite]));

      expect(() => service.addToFavorites(existingFavorite)).toThrow(HttpException);
      expect(() => service.addToFavorites(existingFavorite)).toThrow('already in favorites');
    });

    it('should accept movie with missing title (validation in DTO)', () => {
      fs.readFileSync.mockReturnValue('[]');

      const invalidMovie = {
        imdbID: 'tt0133093',
        year: 1999,
        poster: 'https://example.com/poster.jpg',
      } as any;

      // Service doesn't validate title, only checks for imdbID
      const result = service.addToFavorites(invalidMovie);
      expect(result.data.message).toBe('Movie added to favorites');
    });

    it('should throw error for invalid movie data (missing imdbID)', () => {
      const invalidMovie = {
        title: 'The Matrix',
        year: 1999,
        poster: 'https://example.com/poster.jpg',
      } as any;

      expect(() => service.addToFavorites(invalidMovie)).toThrow(HttpException);
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove movie from favorites successfully', async () => {
      const existingFavorite = {
        title: 'The Matrix',
        imdbID: 'tt0133093',
        year: 1999,
        poster: 'https://example.com/poster.jpg',
      };

      fs.readFileSync.mockReturnValue(JSON.stringify([existingFavorite]));

      const result = await service.removeFromFavorites('tt0133093');

      expect(result.data.message).toBe('Movie removed from favorites');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testDataPath,
        '[]',
        'utf-8',
      );
    });

    it('should throw error when movie not found in favorites', () => {
      fs.readFileSync.mockReturnValue('[]');

      expect(() => service.removeFromFavorites('tt0133093')).toThrow(HttpException);
      expect(() => service.removeFromFavorites('tt0133093')).toThrow('not found in favorites');
    });

    it('should throw error for empty imdbID', () => {
      expect(() => service.removeFromFavorites('')).toThrow(HttpException);
      expect(() => service.removeFromFavorites('')).toThrow('Movie ID is required');
    });

    it('should throw error for whitespace-only imdbID', () => {
      expect(() => service.removeFromFavorites('   ')).toThrow(HttpException);
    });
  });

  describe('getFavorites', () => {
    it('should return paginated favorites', async () => {
      const favorites = [
        {
          title: 'Movie 1',
          imdbID: 'tt0000001',
          year: 2020,
          poster: 'https://example.com/1.jpg',
        },
        {
          title: 'Movie 2',
          imdbID: 'tt0000002',
          year: 2021,
          poster: 'https://example.com/2.jpg',
        },
      ];

      fs.readFileSync.mockReturnValue(JSON.stringify(favorites));

      const result = await service.getFavorites(1, 10);

      expect(result.data.favorites).toHaveLength(2);
      expect(result.data.count).toBe(2);
      expect(result.data.totalResults).toBe('2');
      expect(result.data.currentPage).toBe(1);
      expect(result.data.totalPages).toBe(1);
    });

    it('should return empty array when no favorites', async () => {
      fs.readFileSync.mockReturnValue('[]');

      const result = await service.getFavorites(1, 10);

      expect(result.data.favorites).toEqual([]);
      expect(result.data.count).toBe(0);
      expect(result.data.totalResults).toBe('0');
    });

    it('should handle pagination correctly', async () => {
      const favorites = Array.from({ length: 15 }, (_, i) => ({
        title: `Movie ${i + 1}`,
        imdbID: `tt${String(i + 1).padStart(7, '0')}`,
        year: 2020 + i,
        poster: `https://example.com/${i + 1}.jpg`,
      }));

      fs.readFileSync.mockReturnValue(JSON.stringify(favorites));

      const result = await service.getFavorites(2, 10);

      expect(result.data.favorites).toHaveLength(5);
      expect(result.data.currentPage).toBe(2);
      expect(result.data.totalPages).toBe(2);
    });

    it('should throw error for invalid page number', () => {
      expect(() => service.getFavorites(0, 10)).toThrow(HttpException);
      expect(() => service.getFavorites(-1, 10)).toThrow(HttpException);
    });

    it('should throw error for invalid page size', () => {
      expect(() => service.getFavorites(1, 0)).toThrow(HttpException);
      expect(() => service.getFavorites(1, -1)).toThrow(HttpException);
    });

    it('should handle corrupted favorites file', async () => {
      fs.readFileSync.mockReturnValue('invalid json');

      // Should reset to empty array and not throw
      const result = await service.getFavorites(1, 10);
      expect(result.data.favorites).toEqual([]);
    });
  });

  describe('File Operations', () => {
    it('should handle file read errors gracefully', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = await service.getFavorites(1, 10);
      expect(result.data.favorites).toEqual([]);
    });

    it('should reload favorites before checking existence', () => {
      const movie = {
        title: 'The Matrix',
        imdbID: 'tt0133093',
        year: 1999,
        poster: 'https://example.com/poster.jpg',
      };

      // Setup: file contains the movie
      fs.readFileSync.mockReturnValue(JSON.stringify([movie]));

      // Trying to add same movie should reload and detect duplicate
      expect(() => service.addToFavorites(movie)).toThrow('already in favorites');

      // Should have called readFileSync to reload favorites
      expect(fs.readFileSync).toHaveBeenCalled();
    });
  });
});
