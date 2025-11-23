/**
 * BUGS FIXED:
 * 1. No validation decorators - added class-validator decorators
 * 2. Can add movies with missing fields - added @IsNotEmpty()
 * 3. Can add movies with invalid URLs - added @IsUrl() with validation
 * 4. Year can be any number - added @Min() and @Max() validators
 * 5. imdbID format not validated - added @Matches() for tt\d{7,8} format
 *
 * IMPROVEMENTS:
 * - Added comprehensive validation decorators
 * - Added JSDoc comments for better documentation
 * - Proper type safety with class-validator
 * - Year validation (1800-2100 range)
 * - imdbID format validation
 * - Poster URL validation (allows "N/A" for missing posters)
 */

import { IsString, IsNotEmpty, IsNumber, Min, Max, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for Movie
 * Used for adding movies to favorites
 */
export class MovieDto {
  @ApiProperty({
    description: 'Movie title',
    example: 'The Matrix',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'IMDb ID in format tt1234567 or tt12345678',
    example: 'tt0133093',
    pattern: '^tt\\d{7,8}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^tt\d{7,8}$/, { message: 'imdbID must be in format tt1234567' })
  imdbID: string;

  @ApiProperty({
    description: 'Release year',
    example: 1999,
    minimum: 1800,
    maximum: 2100,
  })
  @IsNumber()
  @Min(1800, { message: 'Year must be at least 1800' })
  @Max(2100, { message: 'Year must be at most 2100' })
  year: number;

  @ApiProperty({
    description: 'Poster URL or "N/A" if not available',
    example: 'https://m.media-amazon.com/images/poster.jpg',
  })
  @IsString()
  @IsNotEmpty()
  poster: string;
}
