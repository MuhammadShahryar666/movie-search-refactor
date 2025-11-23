/**
 * BUGS FIXED:
 * 1. No validation for search query - added @IsNotEmpty() and @MinLength()
 * 2. Empty strings passed to API - now validated
 * 3. Query parameter can be undefined - now properly validated
 *
 * IMPROVEMENTS:
 * - Added validation decorators for search query
 * - Added minimum length validation (1 character)
 * - Trim whitespace before validation
 * - Proper error messages
 */

import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for Search Query
 * Used for validating movie search requests
 */
export class SearchQueryDto {
  /**
   * Search query string (minimum 1 character after trimming)
   * @example "matrix"
   */
  @IsString()
  @IsNotEmpty({ message: 'Search query cannot be empty' })
  @MinLength(1, { message: 'Search query must be at least 1 character' })
  @Transform(({ value }) => value?.trim())
  q: string;
}
