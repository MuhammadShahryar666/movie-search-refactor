/**
 * BUGS FIXED (11 total):
 *
 * Input Validation (7 bugs):
 * 1. No validation decorators on DTOs - Added validation with class-validator
 * 2. Not validating query parameter - Now using SearchMoviesDto with validation
 * 3. Not handling missing query - ValidationPipe rejects missing required fields
 * 4. Empty string query - Validated with @IsNotEmpty() and @MinLength()
 * 5. parseInt returns NaN - Fixed with @Type() and @IsInt() decorators
 * 6. No validation that page is positive - Added @Min(1) validator
 * 7. Not checking if movieToAdd is null - ValidationPipe handles this
 *
 * Error Handling (3 bugs):
 * 8. No try-catch blocks - Added comprehensive error handling
 * 9. Not handling service HttpException - HttpExceptions bubble up correctly
 * 10. No error logging - Added logging with context
 *
 * Type Safety (1 bug):
 * 11. Query parameters treated as numbers without validation - Fixed with @Type()
 *
 * IMPROVEMENTS ADDED:
 * - API Versioning (v1)
 * - Comprehensive Swagger/OpenAPI documentation
 * - Rate limiting decorators
 * - Better API responses documentation
 * - Example requests and responses
 * - HTTP status code documentation
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import type { SearchResult, FavoritesResult } from './movies.service';
import { MovieDto } from './dto/movie.dto';
import { PaginationDto } from './dto/pagination.dto';
import { SearchMoviesDto } from './dto/search-movies.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  /**
   * Search for movies by title
   * @param searchDto - Validated search DTO with query and pagination
   * @returns Search results with movies and pagination info
   */
  @Get('search')
  @Throttle({ default: { limit: 30, ttl: 30000 } }) // 30 requests per 30 seconds
  @ApiOperation({
    summary: 'Search for movies',
    description:
      'Search for movies using the OMDb API. Returns paginated results with favorite status. Minimum 2 characters required.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query (minimum 2 characters)',
    example: 'matrix',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved search results',
    schema: {
      example: {
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
          count: 10,
          totalResults: '234',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async searchMovies(@Query() searchDto: SearchMoviesDto): Promise<SearchResult> {
    try {
      const page = searchDto.page || 1;
      return await this.moviesService.getMovieByTitle(searchDto.q, page);
    } catch (error) {
      console.error('Error in searchMovies controller:', error);
      throw error; // Re-throw to let NestJS handle it
    }
  }

  /**
   * Add a movie to favorites
   * @param movieToAdd - Validated movie DTO
   * @returns Success message
   */
  @Post('favorites')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 30000 } }) // 20 requests per 30 seconds
  @ApiOperation({
    summary: 'Add movie to favorites',
    description: 'Add a movie to your favorites list. Movie must have valid OMDb data.',
  })
  @ApiBody({
    type: MovieDto,
    description: 'Movie object to add to favorites',
    examples: {
      movie: {
        summary: 'Example movie',
        value: {
          title: 'The Matrix',
          imdbID: 'tt0133093',
          year: 1999,
          poster: 'https://example.com/poster.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Movie successfully added to favorites',
    schema: {
      example: {
        data: {
          message: 'Movie added to favorites',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid movie data or movie already in favorites',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  addToFavorites(@Body() movieToAdd: MovieDto) {
    try {
      return this.moviesService.addToFavorites(movieToAdd);
    } catch (error) {
      console.error('Error in addToFavorites controller:', error);
      throw error; // Re-throw to let NestJS handle it
    }
  }

  /**
   * Remove a movie from favorites
   * @param imdbID - IMDb ID of the movie to remove
   * @returns Success message
   */
  @Delete('favorites/:imdbID')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 30000 } }) // 20 requests per 30 seconds
  @ApiOperation({
    summary: 'Remove movie from favorites',
    description: 'Remove a movie from your favorites list by its IMDb ID.',
  })
  @ApiParam({
    name: 'imdbID',
    type: String,
    description: 'IMDb ID of the movie (format: tt1234567)',
    example: 'tt0133093',
  })
  @ApiResponse({
    status: 200,
    description: 'Movie successfully removed from favorites',
    schema: {
      example: {
        data: {
          message: 'Movie removed from favorites',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Movie not found in favorites',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  removeFromFavorites(@Param('imdbID') imdbID: string) {
    try {
      // Validate param exists (NestJS ensures this)
      if (!imdbID) {
        throw new Error('imdbID parameter is required');
      }
      return this.moviesService.removeFromFavorites(imdbID);
    } catch (error) {
      console.error('Error in removeFromFavorites controller:', error);
      throw error; // Re-throw to let NestJS handle it
    }
  }

  /**
   * Get paginated list of favorite movies
   * @param paginationDto - Validated pagination DTO
   * @returns Paginated favorites list
   */
  @Get('favorites/list')
  @Throttle({ default: { limit: 30, ttl: 30000 } }) // 30 requests per 30 seconds
  @ApiOperation({
    summary: 'Get favorites list',
    description:
      'Retrieve a paginated list of your favorite movies. Returns empty array if no favorites.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved favorites list',
    schema: {
      example: {
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
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid page parameter',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  getFavorites(@Query() paginationDto: PaginationDto): FavoritesResult {
    try {
      const page = paginationDto.page || 1;
      return this.moviesService.getFavorites(page);
    } catch (error) {
      console.error('Error in getFavorites controller:', error);
      throw error; // Re-throw to let NestJS handle it
    }
  }
}
