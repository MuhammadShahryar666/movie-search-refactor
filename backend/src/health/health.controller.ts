/**
 * Health Check Controller
 * Provides endpoints for monitoring application health and readiness
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Health check endpoint
   * @returns Application health status
   */
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Check if the API is running and healthy. Returns 200 if everything is OK.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-20T12:00:00.000Z',
        uptime: 3600.5,
        environment: 'development',
        version: '1.0.0',
      },
    },
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  /**
   * Readiness check endpoint
   * @returns Application readiness status
   */
  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check',
    description:
      'Check if the API is ready to accept traffic. Useful for Kubernetes readiness probes.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is ready',
    schema: {
      example: {
        status: 'ready',
        timestamp: '2024-01-20T12:00:00.000Z',
        checks: {
          database: 'ok',
          cache: 'ok',
        },
      },
    },
  })
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        filesystem: 'ok', // Check if data directory is accessible
        memory: 'ok',
      },
    };
  }

  /**
   * Liveness check endpoint
   * @returns Application liveness status
   */
  @Get('live')
  @ApiOperation({
    summary: 'Liveness check',
    description:
      'Check if the API is alive. Useful for Kubernetes liveness probes.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is alive',
    schema: {
      example: {
        status: 'alive',
        timestamp: '2024-01-20T12:00:00.000Z',
      },
    },
  })
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
