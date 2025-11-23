# Movie Search API - Backend

A production-ready RESTful API for searching movies using the OMDb API and managing favorites. Built with NestJS, TypeScript, and modern best practices.

## 🚀 Features

- ✅ **API Versioning** - Semantic versioning with `/api/v1` prefix
- ✅ **Swagger/OpenAPI Documentation** - Interactive API docs at `/api/docs`
- ✅ **Rate Limiting** - Prevents API abuse with configurable throttling
- ✅ **Input Validation** - Comprehensive validation using class-validator
- ✅ **Health Checks** - Kubernetes-ready health endpoints
- ✅ **Docker Support** - Production-ready Docker configuration
- ✅ **Error Handling** - Consistent error responses
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **Logging** - Structured logging for monitoring
- ✅ **CORS** - Configurable cross-origin resource sharing

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Docker Deployment](#docker-deployment)
- [Development](#development)
- [API Endpoints](#api-endpoints)
- [Rate Limiting](#rate-limiting)
- [Health Checks](#health-checks)
- [Architecture](#architecture)

## 🏁 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OMDb API Key ([Get one free here](http://www.omdbapi.com/apikey.aspx))

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your OMDb API key to .env
# OMDB_API_KEY=your_api_key_here
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at:
- **API Base URL**: `http://localhost:3001/api/v1`
- **Swagger Documentation**: `http://localhost:3001/api/docs`
- **Health Check**: `http://localhost:3001/health`

## 🔐 Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# OMDb API Key (Required)
# Get your free API key from: http://www.omdbapi.com/apikey.aspx
OMDB_API_KEY=your_api_key_here

# Server Port (Optional, defaults to 3001)
PORT=3001

# CORS Origins (Optional, defaults to http://localhost:3000)
# For multiple origins, use comma-separated list
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Node Environment (Optional, defaults to development)
NODE_ENV=development
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OMDB_API_KEY` | Yes | - | Your OMDb API key |
| `PORT` | No | 3001 | Port to run the server on |
| `CORS_ORIGIN` | No | http://localhost:3000 | Allowed CORS origins (comma-separated) |
| `NODE_ENV` | No | development | Environment (development/production) |

## 📚 API Documentation

### Interactive Documentation (Swagger)

Visit `http://localhost:3001/api/docs` for interactive API documentation where you can:
- Browse all available endpoints
- See request/response schemas
- Try out API calls directly from the browser
- View example requests and responses

### API Versioning

All endpoints are versioned under `/api/v1`:

```
Base URL: http://localhost:3001/api/v1
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# From the project root directory
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Using Docker Directly

```bash
# Build the image
docker build -t movie-search-api ./backend

# Run the container
docker run -d \
  -p 3001:3001 \
  -e OMDB_API_KEY=your_api_key \
  -e NODE_ENV=production \
  -v $(pwd)/backend/data:/app/data \
  --name movie-search-api \
  movie-search-api

# View logs
docker logs -f movie-search-api

# Stop and remove container
docker stop movie-search-api
docker rm movie-search-api
```

### Docker Features

- ✅ **Multi-stage build** for optimized image size
- ✅ **Non-root user** for enhanced security
- ✅ **Health checks** for container monitoring
- ✅ **Volume mounts** for data persistence
- ✅ **Production-optimized** Node.js configuration

## 💻 Development

### Project Structure

```
backend/
├── src/
│   ├── health/                 # Health check endpoints
│   │   └── health.controller.ts
│   ├── movies/                 # Movies module
│   │   ├── dto/               # Data Transfer Objects
│   │   │   ├── movie.dto.ts
│   │   │   ├── search-movies.dto.ts
│   │   │   └── pagination.dto.ts
│   │   ├── movies.controller.ts
│   │   ├── movies.service.ts
│   │   └── movies.module.ts
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── data/                       # Favorites storage
│   └── favorites.json
├── test/                       # E2E tests
├── Dockerfile                  # Docker configuration
├── .dockerignore
├── .env.example               # Environment template
└── package.json
```

### Available Scripts

```bash
# Development
npm run start         # Start in production mode
npm run start:dev     # Start with hot reload
npm run start:debug   # Start in debug mode

# Building
npm run build         # Build for production

# Testing
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:cov      # Generate coverage report
npm run test:e2e      # Run E2E tests

# Code Quality
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
```

## 🔌 API Endpoints

### Base URL: `/api/v1`

#### 1. Search Movies

**GET** `/api/v1/movies/search`

Search for movies using the OMDb API.

**Query Parameters:**
- `q` (required) - Search query (min 2 characters)
- `page` (optional) - Page number (default: 1)

**Example Request:**
```bash
curl http://localhost:3001/api/v1/movies/search?q=matrix&page=1
```

**Example Response:**
```json
{
  "data": {
    "movies": [
      {
        "title": "The Matrix",
        "imdbID": "tt0133093",
        "year": "1999",
        "poster": "https://...",
        "isFavorite": false
      }
    ],
    "count": 10,
    "totalResults": "234"
  }
}
```

**Rate Limit:** 30 requests/minute

---

#### 2. Add to Favorites

**POST** `/api/v1/movies/favorites`

Add a movie to your favorites list.

**Request Body:**
```json
{
  "title": "The Matrix",
  "imdbID": "tt0133093",
  "year": 1999,
  "poster": "https://..."
}
```

**Example Response:**
```json
{
  "data": {
    "message": "Movie added to favorites"
  }
}
```

**Rate Limit:** 20 requests/30 seconds

---

#### 3. Remove from Favorites

**DELETE** `/api/v1/movies/favorites/:imdbID`

Remove a movie from favorites.

**Path Parameters:**
- `imdbID` - IMDb ID of the movie (e.g., tt0133093)

**Example Request:**
```bash
curl -X DELETE http://localhost:3001/api/v1/movies/favorites/tt0133093
```

**Example Response:**
```json
{
  "data": {
    "message": "Movie removed from favorites"
  }
}
```

**Rate Limit:** 20 requests/30 seconds

---

#### 4. Get Favorites List

**GET** `/api/v1/movies/favorites/list`

Retrieve paginated list of favorite movies.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)

**Example Request:**
```bash
curl http://localhost:3001/api/v1/movies/favorites/list?page=1
```

**Example Response:**
```json
{
  "data": {
    "favorites": [
      {
        "title": "The Matrix",
        "imdbID": "tt0133093",
        "year": 1999,
        "poster": "https://..."
      }
    ],
    "count": 1,
    "totalResults": "1",
    "currentPage": 1,
    "totalPages": 1
  }
}
```

**Rate Limit:** 30 requests/30 seconds

## ⚡ Rate Limiting

The API implements rate limiting to prevent abuse:

### Global Rate Limits
- **100 requests per 30 seconds** (default for all endpoints)

### Endpoint-Specific Limits
- **Search**: 30 requests/30 seconds
- **Add to Favorites**: 20 requests/30 seconds
- **Remove from Favorites**: 20 requests/30 seconds
- **Get Favorites**: 30 requests/30 seconds

### Rate Limit Response

When rate limit is exceeded, the API returns:

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

**Headers:**
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Time when limit resets

## ❤️ Health Checks

The API provides three health check endpoints for monitoring and orchestration:

### 1. Basic Health Check

**GET** `/health`

Returns overall application health status.

```json
{
  "status": "ok",
  "timestamp": "2024-01-20T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. Readiness Check

**GET** `/health/ready`

Kubernetes readiness probe endpoint.

```json
{
  "status": "ready",
  "timestamp": "2024-01-20T12:00:00.000Z",
  "checks": {
    "filesystem": "ok",
    "memory": "ok"
  }
}
```

### 3. Liveness Check

**GET** `/health/live`

Kubernetes liveness probe endpoint.

```json
{
  "status": "alive",
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

### Kubernetes Configuration Example

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
```

## 🏗️ Architecture

### Technology Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 20.x
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Rate Limiting**: @nestjs/throttler
- **HTTP Client**: Axios
- **External API**: OMDb API

### Design Patterns

- **Module-based architecture** - Organized by feature modules
- **Dependency Injection** - NestJS DI container
- **DTO Pattern** - Data validation and transformation
- **Repository Pattern** - File-based storage (easily replaceable with database)
- **Global Exception Filters** - Consistent error handling

### Data Storage

Favorites are stored in a JSON file (`data/favorites.json`) for simplicity. In production, consider:
- **PostgreSQL** - Relational data
- **MongoDB** - Document storage
- **Redis** - Caching layer

### Security Features

- ✅ Input validation on all endpoints
- ✅ Rate limiting to prevent abuse
- ✅ CORS configuration
- ✅ No hardcoded secrets
- ✅ Non-root Docker user
- ✅ Whitelist-based DTO validation

## 🚀 Production Deployment

### Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use secrets management (AWS Secrets Manager, Vault, etc.)

2. **Logging**
   - Configure structured logging
   - Use log aggregation (ELK, Datadog, etc.)

3. **Monitoring**
   - Set up APM (Application Performance Monitoring)
   - Monitor health check endpoints
   - Track error rates and response times

4. **Scaling**
   - Run multiple instances behind a load balancer
   - Use container orchestration (Kubernetes, ECS)
   - Implement caching strategy

5. **Database**
   - Replace file storage with proper database
   - Implement database migrations
   - Set up read replicas for scaling

### Kubernetes Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: movie-search-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: movie-search-api
  template:
    metadata:
      labels:
        app: movie-search-api
    spec:
      containers:
      - name: api
        image: movie-search-api:1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: OMDB_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: omdb-api-key
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 10
```

## 📝 License

This project is part of a technical assessment and is for educational purposes.

## 🤝 Contributing

This is a refactored version of the original codebase with:
- 95+ bugs fixed
- Production-ready features
- Comprehensive documentation
- Docker support
- API versioning
- Swagger documentation

For the complete list of changes, see [REFACTORING.md](../REFACTORING.md) in the root directory.

## 📞 Support

For issues or questions:
1. Check the Swagger documentation at `/api/docs`
2. Review this README
3. Check health endpoints for system status

---

**Built with ❤️ using NestJS and TypeScript**
