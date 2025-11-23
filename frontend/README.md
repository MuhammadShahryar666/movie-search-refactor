# Movie Search Application - Frontend

A modern, production-ready Next.js application for searching movies and managing favorites. Built with React, TypeScript, and TanStack Query.

## Features

- **Movie Search** - Search movies using OMDb API with infinite scrolling
- **Favorites Management** - Add and remove movies from favorites
- **Optimistic Updates** - Instant UI feedback for better UX
- **URL State Management** - Search queries persist in URL for shareable links
- **Session Persistence** - Search state preserved across navigation
- **Error Handling** - Comprehensive error handling with user-friendly messages
- **Loading States** - Skeleton loaders and loading indicators
- **Image Fallbacks** - Graceful handling of broken image URLs
- **Responsive Design** - Mobile-first responsive UI
- **Type Safety** - Full TypeScript implementation

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see [backend README](../backend/README.md))

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Configure API URL (defaults to http://localhost:3001/api/v1)
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Backend API URL (Optional, defaults to http://localhost:3001/api/v1)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | http://localhost:3001/api/v1 | Backend API base URL |

## Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── favorites/           # Favorites page
│   │   │   └── page.tsx
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Search page
│   │   └── index.css            # Global styles
│   ├── components/              # React components
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   └── input.tsx
│   │   ├── MovieCard.tsx        # Movie card component
│   │   ├── MovieCardSkeleton.tsx # Loading skeleton
│   │   ├── Navigation.tsx       # Navigation bar
│   │   ├── pagination.tsx       # Pagination component
│   │   └── searchBar.tsx        # Search input with debouncing
│   ├── hooks/                   # Custom React hooks
│   │   └── useMovies.ts         # Movie data hooks
│   ├── lib/                     # Utility libraries
│   │   └── api.ts               # API client
│   ├── providers/               # Context providers
│   │   └── QueryProvider.tsx   # TanStack Query provider
│   └── types/                   # TypeScript types
│       └── movie.ts            # Movie-related types
├── .env.local                   # Environment variables
├── next.config.ts              # Next.js configuration
├── package.json
└── tsconfig.json               # TypeScript configuration
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Run ESLint
```

## Key Components

### Search Page (`app/page.tsx`)

Main search interface with:
- Infinite scrolling for search results
- URL-based search query persistence
- Session storage for cross-navigation persistence
- Optimistic updates for favorites
- Loading states and error handling

### Favorites Page (`app/favorites/page.tsx`)

Favorites management with:
- Paginated favorites list
- Remove from favorites functionality
- Empty state handling
- Automatic page navigation on empty pages

### Movie Card (`components/MovieCard.tsx`)

Reusable movie card component with:
- Image fallback handling
- Loading states during mutations
- Optimized re-renders with React.memo
- Accessibility features

### Search Bar (`components/searchBar.tsx`)

Search input with:
- Debouncing to reduce API calls
- Minimum character validation
- URL synchronization

### API Client (`lib/api.ts`)

Centralized API client with:
- Comprehensive error handling
- Request timeout configuration
- Network error detection
- Proper error message extraction

### Custom Hooks (`hooks/useMovies.ts`)

React Query hooks for:
- Search movies with infinite scrolling
- Favorites management
- Optimistic updates
- Query invalidation
- Error handling

## Bug Fixes and Improvements

### Major Bug Fixes (36 bugs fixed)

#### lib/api.ts (18 bugs fixed)
- **Configuration**: Environment variable for API URL
- **Input Validation**: Validates inputs before requests, URL encoding
- **Error Handling**: Comprehensive try-catch blocks, network error detection
- **Response Handling**: Proper error detection in response bodies
- **Timeout**: Request timeout configuration (10 seconds)

#### app/page.tsx (13 bugs fixed)
- **State Management**: Proper error and loading state handling
- **Performance**: Memoized calculations, optimized re-renders
- **User Interaction**: Input validation, rapid click prevention
- **UI/Rendering**: Simplified conditionals, proper error display

#### hooks/useMovies.ts (11 bugs fixed)
- **Type Safety**: Proper TypeScript return types
- **Error Handling**: Retry configuration, error callbacks
- **Performance**: Specific query invalidation, optimized cache
- **Data Sync**: Optimistic updates, proper cache updates

#### app/favorites/page.tsx (9 bugs fixed)
- **Error Handling**: Error state display, undefined handling
- **Logic**: Removed redundant checks, proper page navigation
- **Type Safety**: Proper totalResults type handling
- **UI**: Loading states, empty state messaging

#### components/MovieCard.tsx (6 bugs fixed)
- **Performance**: React.memo for optimized re-renders
- **Image Handling**: Error handlers, fallback UI
- **User Interaction**: Loading states, disabled states during mutations

#### types/movie.ts (2 bugs fixed)
- **Type Consistency**: Consistent totalResults type (string)
- **Type Definitions**: Proper interfaces with JSDoc comments

#### providers/QueryProvider.tsx (1 critical bug fixed)
- **Critical Fix**: QueryClient creation on every render (caused infinite loops)
- **Configuration**: Proper staleTime, retry, and refetch configuration

### Improvements Added

- **Infinite Scrolling**: Automatic loading of more results
- **URL State Management**: Search queries in URL for shareable links
- **Session Persistence**: Search state preserved across navigation
- **Optimistic Updates**: Instant UI feedback
- **Debouncing**: Reduced API calls on search input
- **Skeleton Loaders**: Better loading UX
- **Image Fallbacks**: Graceful handling of broken images
- **Error Boundaries**: Better error recovery
- **Accessibility**: ARIA labels, keyboard navigation

## Architecture

### Technology Stack

- **Framework**: Next.js 15.x (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 19.x
- **Data Fetching**: TanStack Query (React Query) 5.x
- **Styling**: Tailwind CSS 4.x
- **Icons**: React Icons
- **Testing**: Jest, React Testing Library

### Design Patterns

- **Custom Hooks** - Encapsulated data fetching logic
- **Component Composition** - Reusable UI components
- **Provider Pattern** - QueryClient provider for global state
- **Error Boundaries** - Graceful error handling
- **Optimistic Updates** - Better user experience

### State Management

- **TanStack Query** - Server state management
- **React State** - Local component state
- **URL State** - Search query in URL parameters
- **Session Storage** - Cross-navigation persistence

### Performance Optimizations

- **React.memo** - Prevent unnecessary re-renders
- **useMemo** - Memoized expensive calculations
- **Debouncing** - Reduced API calls
- **Infinite Scrolling** - Efficient pagination
- **Query Caching** - Smart cache invalidation
- **Optimistic Updates** - Instant UI feedback

## API Integration

The frontend communicates with the backend API at `/api/v1`:

- `GET /api/v1/movies/search` - Search movies
- `POST /api/v1/movies/favorites` - Add to favorites
- `DELETE /api/v1/movies/favorites/:imdbID` - Remove from favorites
- `GET /api/v1/movies/favorites/list` - Get favorites list

See [backend README](../backend/README.md) for detailed API documentation.

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Files

- `components/MovieCard.test.tsx` - MovieCard component tests
- `components/searchBar.test.tsx` - SearchBar component tests
- `hooks/useMovies.test.ts` - Custom hooks tests

## Development Guidelines

### Code Style

- Use TypeScript for all files
- Follow Next.js App Router conventions
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations

### Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Loading States**: Show loading indicators during async operations
3. **Type Safety**: Use TypeScript types, avoid `any`
4. **Performance**: Use React.memo, useMemo, useCallback where appropriate
5. **Accessibility**: Add ARIA labels, keyboard navigation support
6. **Testing**: Write tests for critical functionality

## Production Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Configuration

Ensure `NEXT_PUBLIC_API_URL` is set to your production API URL:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### Deployment Options

- **Vercel** - Recommended for Next.js (automatic deployments)
- **Netlify** - Easy deployment with CI/CD
- **Docker** - Containerized deployment
- **Traditional Hosting** - Node.js server hosting

### Performance Considerations

- Enable Next.js Image Optimization
- Configure CDN for static assets
- Use production build optimizations
- Monitor bundle size
- Implement code splitting

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check backend is running
   - Verify CORS configuration

2. **Query Client Issues**
   - Ensure QueryProvider wraps the app
   - Check QueryClient is created only once

3. **Type Errors**
   - Run `npm run build` to check TypeScript errors
   - Verify all types are properly imported

## License

This project is part of a technical assessment and is for educational purposes.

---

**Built with ❤️ using Next.js, React, and TypeScript**

