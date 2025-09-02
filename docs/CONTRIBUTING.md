# Contributing Guide

Thank you for your interest in contributing to the React PWA Showcase! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- A code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and PWA concepts

### First-Time Contributors

If you're new to open source or this project:

1. Look for issues labeled `good first issue` or `help wanted`
2. Read through the codebase to understand the architecture
3. Start with small changes like documentation improvements
4. Ask questions in issues or discussions if you need help

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/react-pwa-showcase.git
cd react-pwa-showcase

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/react-pwa-showcase.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Verify Setup

- Open http://localhost:5173
- Ensure all demos load without errors
- Run tests: `npm test`
- Run linting: `npm run lint`

### Development Tools

#### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### Environment Configuration

Create `.env.local` for local development:

```env
VITE_SOCKET_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3000/api
VITE_DEBUG=true
```

## Project Structure

Understanding the project structure helps you navigate and contribute effectively:

```
src/
├── components/              # React components
│   ├── common/             # Shared/reusable components
│   │   ├── Button/
│   │   ├── ErrorBoundary/
│   │   └── LoadingSpinner/
│   ├── demos/              # Feature demonstration components
│   │   ├── CameraDemo/
│   │   ├── MicrophoneDemo/
│   │   └── LocationDemo/
│   └── layout/             # Layout components
│       ├── Header/
│       └── Navigation/
├── hooks/                  # Custom React hooks
│   ├── useCamera.ts
│   ├── useLocation.ts
│   └── usePermissions.ts
├── services/               # API and device services
│   ├── cameraService.ts
│   ├── locationService.ts
│   └── socketService.ts
├── context/                # React Context providers
│   ├── AppContext.tsx
│   ├── DeviceContext.tsx
│   └── SocketContext.tsx
├── utils/                  # Utility functions
│   ├── deviceDetection.ts
│   ├── errorHandling.ts
│   └── permissions.ts
├── types/                  # TypeScript type definitions
│   ├── device.ts
│   ├── api.ts
│   └── common.ts
├── theme/                  # MUI theme configuration
│   ├── index.ts
│   └── components.ts
└── pages/                  # Page components
    ├── Home.tsx
    ├── CameraPage.tsx
    └── LocationPage.tsx
```

### Key Architectural Principles

1. **Component Composition**: Build complex UIs from simple, reusable components
2. **Separation of Concerns**: Keep business logic separate from UI components
3. **Progressive Enhancement**: Gracefully handle unsupported features
4. **Type Safety**: Use TypeScript for better developer experience
5. **Performance**: Optimize for mobile devices and slow networks

## Development Workflow

### Branch Strategy

We use a simplified Git flow:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Critical production fixes

### Workflow Steps

1. **Create Feature Branch**:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**:
   - Write code following our standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**:
   ```bash
   npm test
   npm run lint
   npm run type-check
   npm run build
   ```

4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: add new camera filter feature"
   ```

5. **Push and Create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples

```bash
feat(camera): add photo filters functionality
fix(location): resolve GPS accuracy issues
docs(readme): update installation instructions
test(hooks): add tests for useCamera hook
```

## Coding Standards

### TypeScript Guidelines

1. **Use Strict Types**:
   ```typescript
   // Good
   interface CameraOptions {
     width: number;
     height: number;
     facingMode: 'user' | 'environment';
   }
   
   // Avoid
   interface CameraOptions {
     width: any;
     height: any;
     facingMode: string;
   }
   ```

2. **Prefer Interfaces Over Types**:
   ```typescript
   // Good
   interface User {
     id: string;
     name: string;
   }
   
   // Use type for unions/primitives
   type Status = 'loading' | 'success' | 'error';
   ```

3. **Use Proper Return Types**:
   ```typescript
   // Good
   const fetchUser = async (id: string): Promise<User> => {
     // implementation
   };
   
   // Avoid
   const fetchUser = async (id: string) => {
     // implementation
   };
   ```

### React Guidelines

1. **Functional Components**:
   ```typescript
   // Good
   const CameraDemo: React.FC = () => {
     return <div>Camera Demo</div>;
   };
   
   // Also good (preferred for simple components)
   const CameraDemo = () => {
     return <div>Camera Demo</div>;
   };
   ```

2. **Custom Hooks**:
   ```typescript
   // Good
   const useCamera = () => {
     const [stream, setStream] = useState<MediaStream | null>(null);
     const [error, setError] = useState<string | null>(null);
     
     // Hook logic here
     
     return { stream, error, startCamera, stopCamera };
   };
   ```

3. **Props Interface**:
   ```typescript
   interface CameraDemoProps {
     onCapture?: (photo: string) => void;
     maxWidth?: number;
     className?: string;
   }
   
   const CameraDemo: React.FC<CameraDemoProps> = ({
     onCapture,
     maxWidth = 1280,
     className
   }) => {
     // Component implementation
   };
   ```

### Code Style

1. **Use Prettier for Formatting**:
   ```json
   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 80,
     "tabWidth": 2
   }
   ```

2. **ESLint Rules**:
   - No unused variables
   - Prefer const over let
   - Use arrow functions for callbacks
   - Consistent naming conventions

3. **File Naming**:
   - Components: PascalCase (`CameraDemo.tsx`)
   - Hooks: camelCase starting with 'use' (`useCamera.ts`)
   - Utils: camelCase (`deviceDetection.ts`)
   - Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Error Handling

1. **Use Error Boundaries**:
   ```typescript
   <ErrorBoundary fallback={<ErrorFallback />}>
     <CameraDemo />
   </ErrorBoundary>
   ```

2. **Handle Async Errors**:
   ```typescript
   const handleCameraStart = async () => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
       setStream(stream);
     } catch (error) {
       setError(`Camera access failed: ${error.message}`);
     }
   };
   ```

3. **Graceful Degradation**:
   ```typescript
   if (!('mediaDevices' in navigator)) {
     return <UnsupportedFeature feature=\"Camera\" />;
   }
   ```

## Testing Guidelines

### Test Structure

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user workflows

### Writing Tests

1. **Component Tests**:
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react';
   import { CameraDemo } from './CameraDemo';
   
   describe('CameraDemo', () => {
     it('renders camera controls', () => {
       render(<CameraDemo />);
       expect(screen.getByText('Start Camera')).toBeInTheDocument();
     });
     
     it('handles camera start', async () => {
       const mockGetUserMedia = jest.fn();
       Object.defineProperty(navigator, 'mediaDevices', {
         value: { getUserMedia: mockGetUserMedia }
       });
       
       render(<CameraDemo />);
       fireEvent.click(screen.getByText('Start Camera'));
       
       expect(mockGetUserMedia).toHaveBeenCalled();
     });
   });
   ```

2. **Hook Tests**:
   ```typescript
   import { renderHook, act } from '@testing-library/react';
   import { useCamera } from './useCamera';
   
   describe('useCamera', () => {
     it('initializes with correct state', () => {
       const { result } = renderHook(() => useCamera());
       
       expect(result.current.stream).toBeNull();
       expect(result.current.isActive).toBe(false);
     });
   });
   ```

### Test Coverage

Maintain high test coverage:
- Aim for 80%+ overall coverage
- 100% coverage for utility functions
- Test error scenarios and edge cases

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Documentation

### Code Documentation

1. **JSDoc Comments**:
   ```typescript
   /**
    * Captures a photo from the camera stream
    * @param stream - The media stream from the camera
    * @param quality - JPEG quality (0-1)
    * @returns Base64 encoded image data
    */
   const capturePhoto = (stream: MediaStream, quality = 0.8): string => {
     // Implementation
   };
   ```

2. **README Updates**:
   - Update feature lists when adding new demos
   - Add usage examples for new APIs
   - Update installation instructions if needed

3. **Type Documentation**:
   ```typescript
   /**
    * Configuration options for camera initialization
    */
   interface CameraConfig {
     /** Preferred video width */
     width?: number;
     /** Preferred video height */
     height?: number;
     /** Camera facing mode */
     facingMode?: 'user' | 'environment';
   }
   ```

### Documentation Standards

- Use clear, concise language
- Include code examples
- Explain the \"why\" not just the \"what\"
- Keep documentation up-to-date with code changes

## Pull Request Process

### Before Submitting

1. **Self Review**:
   - Review your own code changes
   - Ensure all tests pass
   - Check that linting passes
   - Verify documentation is updated

2. **Test Thoroughly**:
   - Test on different browsers
   - Test on mobile devices
   - Test with different permissions

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots
(If applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: Maintainers review code quality and design
3. **Testing**: Reviewers test functionality manually
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash and merge to maintain clean history

### Review Criteria

- Code quality and readability
- Test coverage and quality
- Performance implications
- Security considerations
- Documentation completeness
- Backward compatibility

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update Version**: Update package.json version
2. **Update Changelog**: Document all changes
3. **Create Release**: Tag and create GitHub release
4. **Deploy**: Automatic deployment via GitHub Actions

### Changelog Format

```markdown
## [1.2.0] - 2023-12-01

### Added
- New motion sensor calibration feature
- Support for additional camera resolutions

### Changed
- Improved error handling in location service
- Updated Material-UI to v5.15.0

### Fixed
- Fixed camera permission dialog on iOS Safari
- Resolved memory leak in audio recording

### Deprecated
- Old camera API (will be removed in v2.0.0)
```

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Code Reviews**: Feedback on pull requests

### Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material-UI Documentation](https://mui.com/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web APIs Documentation](https://developer.mozilla.org/en-US/docs/Web/API)

### Mentorship

New contributors can request mentorship:
- Comment on issues asking for guidance
- Join discussions to learn from experienced contributors
- Pair programming sessions can be arranged for complex features

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special mentions in documentation

Thank you for contributing to the React PWA Showcase! Your efforts help make this project better for everyone.