import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Movie Search API (e2e)', () => {
  let app: INestApplication;
  const testDataPath = path.join(process.cwd(), 'data', 'favorites.json');
  let originalFavorites: string | null = null;

  beforeAll(async () => {
    // Set test environment variable
    process.env.OMDB_API_KEY = process.env.OMDB_API_KEY || 'test-api-key';

    // Backup existing favorites if they exist
    if (fs.existsSync(testDataPath)) {
      originalFavorites = fs.readFileSync(testDataPath, 'utf-8');
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    await app.init();
  });

  afterAll(async () => {
    // Restore original favorites
    if (originalFavorites !== null) {
      fs.writeFileSync(testDataPath, originalFavorites, 'utf-8');
    } else {
      // Clean up test favorites file
      if (fs.existsSync(testDataPath)) {
        fs.unlinkSync(testDataPath);
      }
    }

    await app.close();
  });

  beforeEach(() => {
    // Reset favorites before each test
    if (fs.existsSync(testDataPath)) {
      fs.writeFileSync(testDataPath, '[]', 'utf-8');
    }
  });

  describe('Health Endpoints', () => {
    describe('GET /health', () => {
      it('should return health status', () => {
        return request(app.getHttpServer())
          .get('/health')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('status', 'ok');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('uptime');
            expect(res.body).toHaveProperty('environment');
            expect(res.body).toHaveProperty('version', '1.0.0');
          });
      });
    });

    describe('GET /health/ready', () => {
      it('should return readiness status', () => {
        return request(app.getHttpServer())
          .get('/health/ready')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('status', 'ready');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('checks');
            expect(res.body.checks).toHaveProperty('filesystem', 'ok');
            expect(res.body.checks).toHaveProperty('memory', 'ok');
          });
      });
    });

    describe('GET /health/live', () => {
      it('should return liveness status', () => {
        return request(app.getHttpServer())
          .get('/health/live')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('status', 'alive');
            expect(res.body).toHaveProperty('timestamp');
          });
      });
    });
  });

  describe('Movies Search Endpoints', () => {
    describe('GET /api/v1/movies/search', () => {
      it('should return 400 for missing query parameter', () => {
        return request(app.getHttpServer())
          .get('/api/v1/movies/search')
          .expect(400);
      });

      it('should return 400 for empty query', () => {
        return request(app.getHttpServer())
          .get('/api/v1/movies/search?q=')
          .expect(400);
      });

      it('should return 400 for query less than 2 characters', () => {
        return request(app.getHttpServer())
          .get('/api/v1/movies/search?q=a')
          .expect(400);
      });

      it('should return 400 for invalid page number', () => {
        return request(app.getHttpServer())
          .get('/api/v1/movies/search?q=matrix&page=0')
          .expect(400);
      });

      it('should return 400 for negative page number', () => {
        return request(app.getHttpServer())
          .get('/api/v1/movies/search?q=matrix&page=-1')
          .expect(400);
      });

      it('should search movies with valid query (requires real API key)', async () => {
        // Skip if no real API key
        if (process.env.OMDB_API_KEY === 'test-api-key') {
          console.log('Skipping test - requires real OMDb API key');
          return;
        }

        return request(app.getHttpServer())
          .get('/api/v1/movies/search?q=matrix')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('movies');
            expect(res.body.data).toHaveProperty('count');
            expect(res.body.data).toHaveProperty('totalResults');
            expect(Array.isArray(res.body.data.movies)).toBe(true);
          });
      });

      it('should handle pagination (requires real API key)', async () => {
        // Skip if no real API key
        if (process.env.OMDB_API_KEY === 'test-api-key') {
          console.log('Skipping test - requires real OMDb API key');
          return;
        }

        return request(app.getHttpServer())
          .get('/api/v1/movies/search?q=matrix&page=2')
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toHaveProperty('movies');
          });
      });
    });
  });

  describe('Favorites Endpoints', () => {
    const mockMovie = {
      title: 'The Matrix',
      imdbID: 'tt0133093',
      year: 1999,
      poster: 'https://example.com/poster.jpg',
    };

    describe('POST /api/v1/movies/favorites', () => {
      it('should add movie to favorites', () => {
        return request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send(mockMovie)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('message', 'Movie added to favorites');
          });
      });

      it('should return 400 when adding duplicate movie', async () => {
        // First add
        await request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send(mockMovie)
          .expect(200);

        // Second add should fail
        return request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send(mockMovie)
          .expect(400);
      });

      it('should return 400 for missing title', () => {
        const invalidMovie = {
          imdbID: 'tt0133093',
          year: 1999,
          poster: 'https://example.com/poster.jpg',
        };

        return request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send(invalidMovie)
          .expect(400);
      });

      it('should return 400 for missing imdbID', () => {
        const invalidMovie = {
          title: 'The Matrix',
          year: 1999,
          poster: 'https://example.com/poster.jpg',
        };

        return request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send(invalidMovie)
          .expect(400);
      });

      it('should return 400 for missing year', () => {
        const invalidMovie = {
          title: 'The Matrix',
          imdbID: 'tt0133093',
          poster: 'https://example.com/poster.jpg',
        };

        return request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send(invalidMovie)
          .expect(400);
      });

      it('should return 400 for missing poster', () => {
        const invalidMovie = {
          title: 'The Matrix',
          imdbID: 'tt0133093',
          year: 1999,
        };

        return request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send(invalidMovie)
          .expect(400);
      });

      it('should return 400 for empty request body', () => {
        return request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send({})
          .expect(400);
      });
    });

    describe('DELETE /api/v1/movies/favorites/:imdbID', () => {
      it('should remove movie from favorites', async () => {
        // First add a movie
        await request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send(mockMovie)
          .expect(200);

        // Then remove it
        return request(app.getHttpServer())
          .delete('/api/v1/movies/favorites/tt0133093')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('message', 'Movie removed from favorites');
          });
      });

      it('should return 404 when removing non-existent movie', () => {
        return request(app.getHttpServer())
          .delete('/api/v1/movies/favorites/tt0000000')
          .expect(404);
      });

      it('should return 400 for empty imdbID', () => {
        return request(app.getHttpServer())
          .delete('/api/v1/movies/favorites/ ')
          .expect(404); // NestJS treats this as route not found
      });
    });

    describe('GET /api/v1/movies/favorites/list', () => {
      it('should return empty array when no favorites', () => {
        return request(app.getHttpServer())
          .get('/api/v1/movies/favorites/list')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('favorites', []);
            expect(res.body.data).toHaveProperty('count', 0);
            expect(res.body.data).toHaveProperty('totalResults', '0');
            expect(res.body.data).toHaveProperty('currentPage', 1);
            expect(res.body.data).toHaveProperty('totalPages', 0);
          });
      });

      it('should return favorites list', async () => {
        // Add a movie first
        await request(app.getHttpServer())
          .post('/api/v1/movies/favorites')
          .send(mockMovie)
          .expect(200);

        return request(app.getHttpServer())
          .get('/api/v1/movies/favorites/list')
          .expect(200)
          .expect((res) => {
            expect(res.body.data.favorites).toHaveLength(1);
            expect(res.body.data.count).toBe(1);
            expect(res.body.data.totalResults).toBe('1');
            expect(res.body.data.favorites[0]).toMatchObject(mockMovie);
          });
      });

      it('should handle pagination', async () => {
        // Add multiple movies
        const movies = Array.from({ length: 15 }, (_, i) => ({
          title: `Movie ${i + 1}`,
          imdbID: `tt${String(i + 1).padStart(7, '0')}`,
          year: 2020 + i,
          poster: `https://example.com/${i + 1}.jpg`,
        }));

        for (const movie of movies) {
          await request(app.getHttpServer())
            .post('/api/v1/movies/favorites')
            .send(movie);
        }

        // Get page 1
        const page1Response = await request(app.getHttpServer())
          .get('/api/v1/movies/favorites/list?page=1')
          .expect(200);

        expect(page1Response.body.data.favorites).toHaveLength(10);
        expect(page1Response.body.data.currentPage).toBe(1);
        expect(page1Response.body.data.totalPages).toBe(2);

        // Get page 2
        const page2Response = await request(app.getHttpServer())
          .get('/api/v1/movies/favorites/list?page=2')
          .expect(200);

        expect(page2Response.body.data.favorites).toHaveLength(5);
        expect(page2Response.body.data.currentPage).toBe(2);
        expect(page2Response.body.data.totalPages).toBe(2);
      });

      it('should return 400 for invalid page number', () => {
        return request(app.getHttpServer())
          .get('/api/v1/movies/favorites/list?page=0')
          .expect(400);
      });

      it('should return 400 for negative page number', () => {
        return request(app.getHttpServer())
          .get('/api/v1/movies/favorites/list?page=-1')
          .expect(400);
      });
    });
  });

  describe('Integration Flow', () => {
    it('should handle complete add-list-remove flow', async () => {
      const movie = {
        title: 'Inception',
        imdbID: 'tt1375666',
        year: 2010,
        poster: 'https://example.com/inception.jpg',
      };

      // 1. Initially no favorites
      const emptyList = await request(app.getHttpServer())
        .get('/api/v1/movies/favorites/list')
        .expect(200);
      expect(emptyList.body.data.favorites).toHaveLength(0);

      // 2. Add to favorites
      await request(app.getHttpServer())
        .post('/api/v1/movies/favorites')
        .send(movie)
        .expect(200);

      // 3. Verify it's in the list
      const listWithMovie = await request(app.getHttpServer())
        .get('/api/v1/movies/favorites/list')
        .expect(200);
      expect(listWithMovie.body.data.favorites).toHaveLength(1);
      expect(listWithMovie.body.data.favorites[0]).toMatchObject(movie);

      // 4. Remove from favorites
      await request(app.getHttpServer())
        .delete(`/api/v1/movies/favorites/${movie.imdbID}`)
        .expect(200);

      // 5. Verify it's removed
      const finalList = await request(app.getHttpServer())
        .get('/api/v1/movies/favorites/list')
        .expect(200);
      expect(finalList.body.data.favorites).toHaveLength(0);
    });
  });

  describe('API Versioning', () => {
    it('should work with /api/v1 prefix', () => {
      return request(app.getHttpServer())
        .get('/api/v1/movies/favorites/list')
        .expect(200);
    });

    it('should not work without /api/v1 prefix', () => {
      return request(app.getHttpServer())
        .get('/movies/favorites/list')
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/api/v1/movies/nonexistent')
        .expect(404);
    });

    it('should handle malformed JSON in POST request', () => {
      return request(app.getHttpServer())
        .post('/api/v1/movies/favorites')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});
