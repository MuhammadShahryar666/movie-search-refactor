/**
 * BUGS FIXED:
 * 1. parseInt returns NaN with invalid input - now validated with @IsInt()
 * 2. Page can be 0 or negative - added @Min(1)
 * 3. Page parameter not type-transformed - added @Type(() => Number)
 * 4. No validation for page parameter - added comprehensive validation
 *
 * IMPROVEMENTS:
 * - Added validation decorators for pagination
 * - Automatic type transformation from string to number
 * - Minimum value validation (page >= 1)
 * - Optional with default value of 1
 * - Proper error messages
 */

import { IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for Pagination
 * Used for validating pagination parameters
 */
export class PaginationDto {
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
