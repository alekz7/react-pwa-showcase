# React PWA Showcase

A comprehensive Progressive Web Application built with React 18+ and TypeScript that demonstrates various device capabilities and modern web APIs. This application serves as both a functional demo and a learning resource for developers interested in PWA development.

🚀 **[Live Demo](https://your-username.github.io/react-pwa-showcase/)** | 📖 **[Developer Guide](docs/DEVELOPER_GUIDE.md)** | 🎯 **[API Examples](docs/CODE_EXAMPLES.md)** | 🏗️ **[Architecture](docs/ARCHITECTURE.md)**

## Features

- 📱 **Camera Access**: Photo capture and video recording
- 🎤 **Microphone**: Audio recording and real-time analysis
- 📁 **File System**: File selection, preview, and download
- 🏃 **Motion Sensors**: Accelerometer and gyroscope data
- 📍 **Location Services**: GPS tracking and mapping
- 🔄 **Real-time Communication**: WebSocket-based features
- 💾 **PWA Features**: Offline support, installation, push notifications

## Technology Stack

- **React 18+** with TypeScript
- **Vite** for fast development and optimized builds
- **Material-UI (MUI)** for comprehensive UI components
- **React Router** for client-side navigation
- **Workbox** for PWA functionality
- **Socket.IO** for real-time features

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react-pwa-showcase
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Shared components
│   └── demos/          # Feature demo components
├── services/           # API and device services
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── theme/              # MUI theme configuration
└── pages/              # Page components
```

## Browser Compatibility

This application uses modern web APIs that may not be available in all browsers:

- **Camera/Microphone**: Chrome 53+, Firefox 36+, Safari 11+
- **File System Access**: Chrome 86+, Edge 86+ (limited support)
- **Motion Sensors**: Chrome 31+, Firefox 6+, Safari 4.2+
- **Location Services**: All modern browsers
- **PWA Features**: Chrome 40+, Firefox 44+, Safari 11.1+

## Deployment

The application is configured for deployment to GitHub Pages:

1. Build the project:
```bash
npm run build
```

2. Deploy to GitHub Pages using GitHub Actions (configured in `.github/workflows/`)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Developer Guide

### Architecture Overview

This application follows a modular architecture with clear separation of concerns:

- **Components**: Reusable UI components built with Material-UI
- **Services**: Device API abstractions and business logic
- **Hooks**: Custom React hooks for state management and device access
- **Context**: Global state management using React Context API
- **Utils**: Utility functions and constants

### Key Design Patterns

#### 1. Progressive Enhancement
Each demo gracefully degrades when APIs are not supported:

```typescript
// Example: Feature detection pattern
const isSupported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

if (!isSupported) {
  return <UnsupportedFeature feature="Camera" />;
}
```

#### 2. Permission Management
Centralized permission handling with user-friendly flows:

```typescript
// Example: Permission request pattern
const requestPermission = async (type: PermissionType) => {
  try {
    const result = await navigator.permissions.query({ name: type });
    if (result.state === 'prompt') {
      // Show permission explanation dialog
      await showPermissionDialog(type);
    }
    return result.state;
  } catch (error) {
    // Handle permission errors gracefully
    return 'denied';
  }
};
```

#### 3. Error Boundaries
Comprehensive error handling at multiple levels:

```typescript
// Component-level error boundary
<DemoErrorBoundary demoName="Camera">
  <CameraDemo />
</DemoErrorBoundary>
```

### State Management

The application uses React Context API with useReducer for complex state:

```typescript
// Example: Device context usage
const { state, dispatch } = useDeviceContext();

// Update permission status
dispatch({
  type: 'SET_PERMISSION',
  payload: { type: 'camera', status: 'granted' }
});
```

## API Examples

### Camera API Implementation

```typescript
// Basic camera access
const getCameraStream = async (): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user' 
      }
    });
    return stream;
  } catch (error) {
    throw new Error(`Camera access failed: ${error.message}`);
  }
};

// Photo capture
const capturePhoto = (videoElement: HTMLVideoElement): string => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  context.drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
};
```

### Microphone API Implementation

```typescript
// Audio recording with Web Audio API
const startAudioRecording = async (): Promise<{
  mediaRecorder: MediaRecorder;
  audioContext: AudioContext;
}> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  
  // Create analyzer for real-time visualization
  const analyzer = audioContext.createAnalyser();
  source.connect(analyzer);
  
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  
  mediaRecorder.ondataavailable = (event) => {
    chunks.push(event.data);
  };
  
  return { mediaRecorder, audioContext };
};
```

### Location API Implementation

```typescript
// Enhanced geolocation with options
const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// Distance calculation between two points
const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

### Motion Sensors Implementation

```typescript
// Device motion event handling
const startMotionTracking = (callback: (data: MotionData) => void) => {
  const handleMotion = (event: DeviceMotionEvent) => {
    const acceleration = event.acceleration;
    const rotationRate = event.rotationRate;
    
    if (acceleration && rotationRate) {
      callback({
        acceleration: {
          x: acceleration.x || 0,
          y: acceleration.y || 0,
          z: acceleration.z || 0
        },
        rotation: {
          alpha: rotationRate.alpha || 0,
          beta: rotationRate.beta || 0,
          gamma: rotationRate.gamma || 0
        },
        timestamp: Date.now()
      });
    }
  };
  
  window.addEventListener('devicemotion', handleMotion);
  
  return () => {
    window.removeEventListener('devicemotion', handleMotion);
  };
};

// Shake detection algorithm
const detectShake = (acceleration: { x: number; y: number; z: number }) => {
  const magnitude = Math.sqrt(
    acceleration.x ** 2 + 
    acceleration.y ** 2 + 
    acceleration.z ** 2
  );
  
  return magnitude > 15; // Threshold for shake detection
};
```

### PWA Implementation

```typescript
// Service worker registration
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
      throw error;
    }
  }
  throw new Error('Service workers not supported');
};

// PWA installation prompt
const handlePWAInstall = () => {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  
  const showInstallPrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      deferredPrompt = null;
    }
  };
  
  return { showInstallPrompt };
};
```

### Real-time Communication (Socket.IO)

```typescript
// Socket.IO client setup
import io, { Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  
  connect(serverUrl: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling']
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve(this.socket!);
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection failed:', error);
        reject(error);
      });
    });
  }
  
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
  
  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }
}
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy loading demo components
const CameraDemo = lazy(() => import('./pages/CameraDemo'));
const MicrophoneDemo = lazy(() => import('./pages/MicrophoneDemo'));

// Route-based splitting
<Route 
  path="/camera" 
  element={
    <Suspense fallback={<LoadingFallback />}>
      <CameraDemo />
    </Suspense>
  } 
/>
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Performance monitoring
npm run lighthouse
```

### Caching Strategies

```typescript
// Service worker caching
const CACHE_NAME = 'pwa-showcase-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

## Testing

### Unit Testing

```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraDemo } from './CameraDemo';

test('requests camera permission on mount', async () => {
  const mockGetUserMedia = jest.fn();
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: mockGetUserMedia }
  });
  
  render(<CameraDemo />);
  
  expect(mockGetUserMedia).toHaveBeenCalledWith({
    video: expect.any(Object)
  });
});
```

### Integration Testing

```typescript
// E2E testing with Playwright
import { test, expect } from '@playwright/test';

test('camera demo captures photo', async ({ page }) => {
  await page.goto('/camera');
  
  // Grant camera permission
  await page.context().grantPermissions(['camera']);
  
  // Click capture button
  await page.click('[data-testid="capture-button"]');
  
  // Verify photo appears
  await expect(page.locator('[data-testid="captured-photo"]')).toBeVisible();
});
```

## Troubleshooting

### Common Issues

#### HTTPS Required
Many device APIs require HTTPS in production:
```bash
# Development with HTTPS
npm run dev -- --https
```

#### Permission Denied
Handle permission rejections gracefully:
```typescript
const handlePermissionDenied = (feature: string) => {
  showNotification({
    type: 'warning',
    message: `${feature} access denied. Please enable in browser settings.`
  });
};
```

#### Browser Compatibility
Check feature support before usage:
```typescript
const checkSupport = () => {
  const features = {
    camera: 'mediaDevices' in navigator,
    location: 'geolocation' in navigator,
    motion: 'DeviceMotionEvent' in window
  };
  
  return features;
};
```

## Contributing

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Make your changes
5. Run tests: `npm test`
6. Submit a pull request

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write tests for new features
- Add JSDoc comments for public APIs

### Adding New Demos

1. Create component in `src/components/demos/`
2. Add route in `src/App.tsx`
3. Update navigation in `src/components/Header.tsx`
4. Add tests in `src/components/demos/__tests__/`
5. Update documentation

## Documentation

### 📚 Complete Documentation

- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Comprehensive development guide
- **[Code Examples](docs/CODE_EXAMPLES.md)** - Practical implementation examples
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Architecture Overview](docs/ARCHITECTURE.md)** - Technical architecture details
- **[Testing Guide](docs/TESTING_GUIDE.md)** - Testing strategies and examples
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Deployment instructions for various platforms
- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute to the project

### 🚀 Quick Links

- [Getting Started](#getting-started) - Set up the project locally
- [Project Structure](#project-structure) - Understand the codebase organization
- [Browser Compatibility](#browser-compatibility) - Check supported browsers
- [Performance Optimization](#performance-optimization) - Learn about optimizations

## License

MIT License - see LICENSE file for details
