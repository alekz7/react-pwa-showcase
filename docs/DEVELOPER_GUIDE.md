# Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [API Integration Patterns](#api-integration-patterns)
5. [State Management](#state-management)
6. [Component Development](#component-development)
7. [Testing Strategies](#testing-strategies)
8. [Performance Optimization](#performance-optimization)
9. [Deployment](#deployment)
10. [Best Practices](#best-practices)

## Architecture Overview

The React PWA Showcase follows a modular, scalable architecture designed for maintainability and educational value.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React App Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Components  │  Pages  │  Hooks  │  Context  │  Services   │
├─────────────────────────────────────────────────────────────┤
│                    Device APIs Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Camera  │  Audio  │  Location  │  Motion  │  FileSystem   │
├─────────────────────────────────────────────────────────────┤
│                      PWA Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Service Worker  │  Manifest  │  Caching  │  Offline       │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Progressive Enhancement**: Features work on all browsers, enhanced on capable ones
2. **Graceful Degradation**: Fallbacks for unsupported APIs
3. **Separation of Concerns**: Clear boundaries between UI, logic, and data
4. **Type Safety**: TypeScript throughout for better developer experience
5. **Accessibility First**: WCAG 2.1 compliance and screen reader support

## Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── common/             # Shared components (Header, ErrorBoundary)
│   ├── demos/              # Feature demonstration components
│   └── ui/                 # Basic UI building blocks
├── pages/                  # Route-level page components
├── hooks/                  # Custom React hooks
│   ├── device/            # Device API hooks
│   ├── ui/                # UI-related hooks
│   └── utils/             # Utility hooks
├── services/              # Business logic and API abstractions
│   ├── device/           # Device API services
│   ├── storage/          # Storage services
│   └── network/          # Network and Socket.IO services
├── context/              # React Context providers
├── utils/                # Utility functions and constants
├── theme/                # Material-UI theme configuration
├── types/                # TypeScript type definitions
└── __tests__/            # Global test utilities and setup
```

## Core Concepts

### 1. Device API Abstraction

Each device API is wrapped in a service layer that provides:

- **Consistent Interface**: Uniform API across different device capabilities
- **Error Handling**: Standardized error responses and recovery
- **Permission Management**: Centralized permission request flows
- **Feature Detection**: Runtime capability checking

Example service structure:

```typescript
// src/services/device/cameraService.ts
export class CameraService {
  private stream: MediaStream | null = null;
  
  async checkSupport(): Promise<boolean> {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }
  
  async requestPermission(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state;
    } catch {
      return 'prompt';
    }
  }
  
  async getStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    if (!await this.checkSupport()) {
      throw new Error('Camera not supported');
    }
    
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: constraints?.video || true,
      audio: constraints?.audio || false
    });
    
    return this.stream;
  }
  
  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}
```

### 2. Hook-Based Architecture

Custom hooks encapsulate device API logic and provide React-friendly interfaces:

```typescript
// src/hooks/device/useCamera.ts
export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>('prompt');
  
  const cameraService = useMemo(() => new CameraService(), []);
  
  const startCamera = useCallback(async (constraints?: MediaStreamConstraints) => {
    try {
      setError(null);
      const newStream = await cameraService.getStream(constraints);
      setStream(newStream);
      setIsActive(true);
      setPermission('granted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access failed');
      setPermission('denied');
    }
  }, [cameraService]);
  
  const stopCamera = useCallback(() => {
    cameraService.stopStream();
    setStream(null);
    setIsActive(false);
  }, [cameraService]);
  
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  return {
    stream,
    isActive,
    error,
    permission,
    startCamera,
    stopCamera,
    isSupported: cameraService.checkSupport()
  };
};
```

### 3. Context-Based State Management

Global state is managed through React Context with useReducer for complex state logic:

```typescript
// src/context/DeviceContext.tsx
interface DeviceState {
  permissions: Record<string, PermissionState>;
  capabilities: Record<string, boolean>;
  activeStreams: Record<string, MediaStream | null>;
}

type DeviceAction = 
  | { type: 'SET_PERMISSION'; payload: { device: string; state: PermissionState } }
  | { type: 'SET_CAPABILITY'; payload: { device: string; supported: boolean } }
  | { type: 'SET_STREAM'; payload: { device: string; stream: MediaStream | null } };

const deviceReducer = (state: DeviceState, action: DeviceAction): DeviceState => {
  switch (action.type) {
    case 'SET_PERMISSION':
      return {
        ...state,
        permissions: {
          ...state.permissions,
          [action.payload.device]: action.payload.state
        }
      };
    // ... other cases
    default:
      return state;
  }
};

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(deviceReducer, initialState);
  
  return (
    <DeviceContext.Provider value={{ state, dispatch }}>
      {children}
    </DeviceContext.Provider>
  );
};
```

## API Integration Patterns

### 1. Permission Request Pattern

```typescript
const requestPermissionWithFallback = async (
  permissionName: PermissionName,
  fallbackAction?: () => void
): Promise<PermissionState> => {
  try {
    // Try modern Permissions API first
    const result = await navigator.permissions.query({ name: permissionName });
    
    if (result.state === 'prompt') {
      // Show user-friendly explanation before requesting
      const userConsent = await showPermissionDialog(permissionName);
      if (!userConsent) {
        return 'denied';
      }
    }
    
    return result.state;
  } catch (error) {
    // Fallback for browsers without Permissions API
    console.warn('Permissions API not available, using fallback');
    fallbackAction?.();
    return 'prompt';
  }
};
```

### 2. Feature Detection Pattern

```typescript
const detectDeviceCapabilities = (): DeviceCapabilities => {
  return {
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    location: 'geolocation' in navigator,
    motion: 'DeviceMotionEvent' in window,
    orientation: 'DeviceOrientationEvent' in window,
    fileSystem: 'showOpenFilePicker' in window,
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    webShare: 'share' in navigator
  };
};
```

### 3. Error Handling Pattern

```typescript
class DeviceAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'DeviceAPIError';
  }
}

const handleDeviceError = (error: unknown): DeviceAPIError => {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return new DeviceAPIError(
          'Permission denied. Please allow access in browser settings.',
          'PERMISSION_DENIED',
          true
        );
      case 'NotFoundError':
        return new DeviceAPIError(
          'Device not found. Please check your hardware.',
          'DEVICE_NOT_FOUND',
          false
        );
      case 'NotSupportedError':
        return new DeviceAPIError(
          'Feature not supported in this browser.',
          'NOT_SUPPORTED',
          false
        );
      default:
        return new DeviceAPIError(
          `Device access failed: ${error.message}`,
          'UNKNOWN_ERROR',
          true
        );
    }
  }
  
  return new DeviceAPIError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    true
  );
};
```

## State Management

### Context Architecture

The application uses a multi-context architecture to avoid prop drilling and provide focused state management:

```typescript
// App-level providers
<AppProvider>
  <DeviceProvider>
    <SocketProvider>
      <ThemeProvider>
        <Router>
          <App />
        </Router>
      </ThemeProvider>
    </SocketProvider>
  </DeviceProvider>
</AppProvider>
```

### Custom Hooks for Context

```typescript
// Type-safe context hooks with error boundaries
export const useDeviceContext = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within DeviceProvider');
  }
  return context;
};

// Selector pattern for performance optimization
export const useDevicePermission = (device: string): PermissionState => {
  const { state } = useDeviceContext();
  return state.permissions[device] || 'prompt';
};
```

## Component Development

### Demo Component Template

```typescript
// src/components/demos/TemplateDemo.tsx
interface TemplateDemoProps {
  showImplementationHints?: boolean;
}

export const TemplateDemo: React.FC<TemplateDemoProps> = ({
  showImplementationHints = false
}) => {
  // Hooks
  const { feature, isSupported, error, startFeature, stopFeature } = useFeature();
  const { state, dispatch } = useDeviceContext();
  
  // Local state
  const [isActive, setIsActive] = useState(false);
  
  // Effects
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopFeature();
    };
  }, [stopFeature]);
  
  // Handlers
  const handleStart = async () => {
    try {
      await startFeature();
      setIsActive(true);
    } catch (err) {
      console.error('Feature start failed:', err);
    }
  };
  
  // Render guards
  if (!isSupported) {
    return <UnsupportedFeature feature="Template Feature" />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={handleStart} />;
  }
  
  return (
    <Container maxWidth="lg">
      <DemoHeader 
        title="Template Demo"
        description="Demonstrates template feature usage"
        isActive={isActive}
        onToggle={isActive ? stopFeature : handleStart}
      />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <FeatureDisplay feature={feature} />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <ControlPanel 
            isActive={isActive}
            onStart={handleStart}
            onStop={stopFeature}
          />
        </Grid>
      </Grid>
      
      {showImplementationHints && (
        <ImplementationHints 
          codeExample={TEMPLATE_CODE_EXAMPLE}
          apiReference="https://developer.mozilla.org/..."
        />
      )}
    </Container>
  );
};
```

### Reusable Component Patterns

```typescript
// Error boundary wrapper for demos
export const DemoErrorBoundary: React.FC<{
  demoName: string;
  children: React.ReactNode;
}> = ({ demoName, children }) => (
  <ErrorBoundary
    fallback={<DemoErrorFallback demoName={demoName} />}
    onError={(error, errorInfo) => {
      console.error(`${demoName} demo error:`, error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);

// Permission request component
export const PermissionGate: React.FC<{
  permission: PermissionName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback }) => {
  const permissionState = usePermission(permission);
  
  if (permissionState === 'denied') {
    return fallback || <PermissionDenied permission={permission} />;
  }
  
  if (permissionState === 'prompt') {
    return <PermissionRequest permission={permission} />;
  }
  
  return <>{children}</>;
};
```

## Testing Strategies

### Unit Testing

```typescript
// Component testing with mocked APIs
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CameraDemo } from '../CameraDemo';
import { mockMediaDevices } from '../../__tests__/mocks/mediaDevices';

// Mock setup
beforeEach(() => {
  mockMediaDevices.setup();
});

afterEach(() => {
  mockMediaDevices.cleanup();
});

test('starts camera when permission granted', async () => {
  mockMediaDevices.mockGetUserMedia.mockResolvedValue(mockStream);
  
  render(<CameraDemo />);
  
  fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
  
  await waitFor(() => {
    expect(screen.getByTestId('camera-preview')).toBeInTheDocument();
  });
});

test('shows error when permission denied', async () => {
  mockMediaDevices.mockGetUserMedia.mockRejectedValue(
    new DOMException('Permission denied', 'NotAllowedError')
  );
  
  render(<CameraDemo />);
  
  fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
// E2E testing with Playwright
import { test, expect } from '@playwright/test';

test.describe('Camera Demo', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant camera permission
    await context.grantPermissions(['camera']);
    await page.goto('/camera');
  });
  
  test('captures and displays photo', async ({ page }) => {
    // Start camera
    await page.click('[data-testid="start-camera"]');
    await expect(page.locator('[data-testid="camera-preview"]')).toBeVisible();
    
    // Capture photo
    await page.click('[data-testid="capture-photo"]');
    
    // Verify photo appears in gallery
    await expect(page.locator('[data-testid="photo-gallery"] img')).toHaveCount(1);
  });
  
  test('handles permission denial gracefully', async ({ page, context }) => {
    // Deny camera permission
    await context.clearPermissions();
    
    await page.click('[data-testid="start-camera"]');
    
    // Should show permission denied message
    await expect(page.locator('[data-testid="permission-denied"]')).toBeVisible();
  });
});
```

### Mock Utilities

```typescript
// src/__tests__/mocks/mediaDevices.ts
export const mockMediaDevices = {
  mockGetUserMedia: jest.fn(),
  mockEnumerateDevices: jest.fn(),
  
  setup() {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: this.mockGetUserMedia,
        enumerateDevices: this.mockEnumerateDevices
      },
      configurable: true
    });
  },
  
  cleanup() {
    this.mockGetUserMedia.mockReset();
    this.mockEnumerateDevices.mockReset();
  },
  
  mockStream(tracks: Partial<MediaStreamTrack>[] = []) {
    const stream = {
      getTracks: () => tracks,
      getVideoTracks: () => tracks.filter(t => t.kind === 'video'),
      getAudioTracks: () => tracks.filter(t => t.kind === 'audio'),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    
    return stream as unknown as MediaStream;
  }
};
```

## Performance Optimization

### Code Splitting

```typescript
// Route-based code splitting
const CameraDemo = lazy(() => import('../pages/CameraDemo'));
const MicrophoneDemo = lazy(() => import('../pages/MicrophoneDemo'));

// Component-based splitting for heavy features
const AdvancedCameraControls = lazy(() => 
  import('../components/demos/AdvancedCameraControls')
);

// Conditional loading based on device capabilities
const MotionSensorsDemo = lazy(() => 
  import('../pages/MotionSensorsDemo').then(module => ({
    default: 'DeviceMotionEvent' in window ? module.default : module.FallbackComponent
  }))
);
```

### Memory Management

```typescript
// Cleanup patterns for device APIs
export const useCleanupEffect = (cleanup: () => void, deps: React.DependencyList) => {
  useEffect(() => {
    return cleanup;
  }, deps);
};

// Stream cleanup hook
export const useMediaStream = () => {
  const streamRef = useRef<MediaStream | null>(null);
  
  const setStream = (stream: MediaStream | null) => {
    // Clean up previous stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = stream;
  };
  
  useCleanupEffect(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);
  
  return { stream: streamRef.current, setStream };
};
```

### Bundle Optimization

```typescript
// Tree shaking for MUI components
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
// Instead of: import { Button, TextField } from '@mui/material';

// Dynamic imports for heavy libraries
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js');
  return Chart;
};

// Conditional polyfills
const loadPolyfills = async () => {
  if (!('IntersectionObserver' in window)) {
    await import('intersection-observer');
  }
  
  if (!('ResizeObserver' in window)) {
    await import('resize-observer-polyfill');
  }
};
```

## Deployment

### GitHub Pages Configuration

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/react-pwa-showcase/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          router: ['react-router-dom']
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to GitHub Pages
      if: github.ref == 'refs/heads/main'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## Best Practices

### 1. Error Handling

- Always provide fallbacks for unsupported features
- Use error boundaries to prevent app crashes
- Implement retry mechanisms for transient failures
- Provide clear, actionable error messages

### 2. Accessibility

- Use semantic HTML elements
- Provide ARIA labels for complex interactions
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios

### 3. Performance

- Implement code splitting for large features
- Use React.memo for expensive components
- Optimize re-renders with useCallback and useMemo
- Clean up resources in useEffect cleanup functions

### 4. Security

- Validate all user inputs
- Use HTTPS in production
- Implement Content Security Policy
- Don't store sensitive data in localStorage

### 5. Testing

- Write tests for critical user flows
- Mock external APIs and device features
- Test error scenarios and edge cases
- Use accessibility testing tools

This developer guide provides the foundation for understanding and extending the React PWA Showcase. Each section includes practical examples and patterns that can be applied to real-world PWA development.