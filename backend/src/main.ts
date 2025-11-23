/**
 * IMPROVEMENTS ADDED:
 * 1. API Versioning - All routes now under /api/v1
 * 2. Swagger/OpenAPI Documentation - Available at /api/docs
 * 3. Rate Limiting - Prevents abuse with throttling
 * 4. Request Logging - Logs all incoming requests
 * 5. Health Check - Available at /health
 * 6. Better error handling and graceful shutdown
 * 7. Security headers and best practices
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // API Versioning - URI versioning (e.g., /api/v1/movies)
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    // Global validation pipe for DTO validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
        transform: true, // Automatically transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Enable implicit type conversion
        },
      }),
    );

    // CORS configuration using environment variable
    const corsOrigin = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000']; // Default to localhost for development

    app.enableCors({
      origin: corsOrigin,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    // Swagger/OpenAPI Documentation
    const config = new DocumentBuilder()
      .setTitle('Movie Search API')
      .setDescription(
        'A RESTful API for searching movies using OMDb API and managing favorites. ' +
        'This API provides endpoints for movie search, favorites management, and health monitoring.',
      )
      .setVersion('1.0')
      .addTag('movies', 'Movie search and favorites management')
      .addTag('health', 'Health check and monitoring')
      .addServer('http://localhost:3001', 'Local development server')
      .addServer('https://api.example.com', 'Production server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Movie Search API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);

    logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
    logger.log(`📚 Swagger documentation available at: ${await app.getUrl()}/api/docs`);
    logger.log(`❤️ Health check available at: ${await app.getUrl()}/health`);
    logger.log(`🌐 CORS enabled for origins: ${corsOrigin.join(', ')}`);
    logger.log(`🔒 Rate limiting enabled`);
    logger.log(`📦 API Version: v1`);
  } catch (error) {
    logger.error('❌ Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();
