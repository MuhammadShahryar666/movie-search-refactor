/**
 * Combined DTO for movie search with pagination
 * Combines search query and pagination into a single DTO
 */

import { IsString, IsNotEmpty, MinLength, IsOptional, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Data Transfer Object for Movie Search with Pagination
 * Used for validating movie search requests with optional pagination
 */
export class SearchMoviesDto {
  /**
   * Search query string (minimum 2 characters after trimming)
   * @example "matrix"
   */
  @IsString()
  @IsNotEmpty({ message: 'Search query cannot be empty' })
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  @Transform(({ value }) => value?.trim())
  q: string;

  /**
   * Page number (must be >= 1)
   * @example 1
   * @default 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;
}
