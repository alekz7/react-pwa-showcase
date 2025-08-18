# React PWA Showcase

A comprehensive Progressive Web Application built with React 18+ and TypeScript that demonstrates various device capabilities and modern web APIs. This application serves as both a functional demo and a learning resource for developers interested in PWA development.

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

## License

MIT License - see LICENSE file for details
