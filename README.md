# SKU Label Maker

A PWA-enabled React app that generates product label PDFs with a live preview. Each label is rendered as a single page PDF in 5cm x 2cm format using `pdf-lib`. Built with Vite, TypeScript, Tailwind v4, and pnpm.

## Features

- **Live form-driven label generation** with debounced PDF updates (300ms)
- **Browser-side PDF export** with Comfortaa font embedding
- **Brand/category/location mapping** from configurable JSON
- **PWA support** for local install on mobile devices
- **GitHub Pages deployment** ready with automatic CI/CD
- **Tailwind v4** for modern, optimized styling
- **pnpm** for fast, efficient dependency management
- **Comprehensive testing** with Vitest and coverage reporting
- **Production-ready** scripts for bundle analysis, audits, and serving

## Getting Started

### Prerequisites

- Node.js 20+ (enforced via `.npmrc`)
- pnpm 9.0.0+

### Installation

```bash
# Install dependencies (pnpm must be used)
pnpm install

# Start development server
pnpm run dev
```

## Scripts

### Development

- `pnpm run dev` - Start development server
- `pnpm run preview` - Preview production build
- `pnpm run start` - Alias for preview
- `pnpm run serve` - Serve dist on port 3000

### Building

- `pnpm run build` - Create optimized production build
- `pnpm run clean` - Remove artifacts and node_modules
- `pnpm run clean:dist` - Remove only dist folder

### Code Quality

- `pnpm run lint` - Run ESLint (0 warnings allowed)
- `pnpm run lint:fix` - Auto-fix linting issues
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting
- `pnpm run typecheck` - TypeScript type checking

### Testing

- `pnpm run test` - Run tests once
- `pnpm run test:watch` - Watch mode
- `pnpm run test:ui` - Interactive UI
- `pnpm run test:coverage` - Coverage report

### Production & CI/CD

- `pnpm run ci` - Full pipeline: install → typecheck → lint → test → build
- `pnpm run ci:test` - Quick test: typecheck → lint → test
- `pnpm run audit` - Security audit with fixes
- `pnpm run audit:prod` - Audit production deps only
- `pnpm run analyze` - Bundle visualization
- `pnpm run deploy` - Deploy to GitHub Pages

## Deployment

Automatic deployment to `https://jewel998.github.io/sku/` on successful builds to main branch via GitHub Actions.

## PWA

Install the app on mobile using the browser install prompt. Includes Web App Manifest and service worker for offline support.

## Tech Stack

- React 18 + TypeScript
- Vite bundler
- Tailwind CSS v4
- pdf-lib for PDF generation
- Vitest for testing
- ESLint + Prettier for code quality
- Husky + commitlint for git quality
- pnpm for dependency management
