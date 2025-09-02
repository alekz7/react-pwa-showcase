# Testing Guide

This guide covers testing strategies, tools, and best practices for the React PWA Showcase.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Stack](#testing-stack)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [PWA Testing](#pwa-testing)
- [Performance Testing](#performance-testing)
- [Accessibility Testing](#accessibility-testing)
- [Visual Regression Testing](#visual-regression-testing)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Testing Philosophy

Our testing approach follows the testing pyramid:

```
    /\     E2E Tests (Few)
   /  \    
  /____\   Integration Tests (Some)
 /______\  Unit Tests (Many)
```

### Principles

1. **Fast Feedback**: Unit tests provide quick feedback
2. **Confidence**: Integration tests ensure components work together
3. **User Focus**: E2E tests validate user workflows
4. **Maintainable**: Tests should be easy to understand and maintain
5. **Reliable**: Tests should be deterministic and not flaky

## Testing Stack

### Core Testing Tools

- **Vitest**: Fast unit test runner
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing framework
- **MSW**: API mocking for tests
- **@testing-library/jest-dom**: Custom Jest matchers

### Additional Tools

- **@testing-library/user-event**: User interaction simulation
- **@axe-core/react**: Accessibility testing
- **lighthouse-ci**: Performance and PWA testing
- **chromatic**: Visual regression testing

## Test Types

### 1. Unit Tests
- Test individual functions and components
- Fast execution
- High coverage
- Isolated from dependencies

### 2. Integration Tests
- Test component interactions
- Test custom hooks with context
- Test API integrations
- Medium execution time

### 3. E2E Tests
- Test complete user workflows
- Test across different browsers
- Slower execution
- High confidence

### 4. PWA Tests
- Service worker functionality
- Offline capabilities
- Installation flow
- Push notifications

## Running Tests

### Development

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- useLocation.test.ts

# Run tests matching pattern
npm test -- --grep "location"
```

### Production

```bash
# Run all tests once
npm run test:ci

# Run E2E tests
npm run test:e2e

# Run PWA tests
npm run test:pwa

# Run performance tests
npm run test:performance
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

## Unit Testing

### Testing Components

```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testing Custom Hooks

```typescript
// src/hooks/__tests__/useLocation.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocation } from '../useLocation';

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('useLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useLocation());

    expect(result.current.isTracking).toBe(false);
    expect(result.current.currentLocation).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('starts tracking location', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      },
    };

    mockGeolocation.watchPosition.mockImplementation((success) => {
      success(mockPosition);
      return 123; // watch ID
    });

    const { result } = renderHook(() => useLocation());

    await act(async () => {
      await result.current.startTracking();
    });

    expect(result.current.isTracking).toBe(true);
    expect(result.current.currentLocation).toEqual({
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
    });
  });
});
```

This comprehensive testing guide provides the foundation for testing all aspects of the React PWA Showcase application.