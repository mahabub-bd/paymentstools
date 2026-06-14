# Contributing to Payment Tools

Thank you for your interest in contributing to Payment Tools! We welcome contributions from the community.

## Table of Contents

- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Adding New Tools](#adding-new-tools)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Messages](#commit-messages)

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** describing the bug
- **Description** of what happened
- **Steps to reproduce** the issue
- **Expected behavior**
- **Screenshots** if applicable
- **Environment** details (OS, browser, Node version)

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **Clear title** for the feature
- **Detailed description** of the proposed feature
- **Use cases** for the feature
- **Alternatives** considered

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Ensure your code follows the project's style
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Clone and Install

```bash
# Clone your fork
git clone https://github.com/your-username/paymentstools.git

# Navigate to the directory
cd paymentstools

# Install dependencies (using pnpm is recommended)
pnpm install
```

### Start Development Server

```bash
pnpm run dev
```

The application will open at `http://localhost:5173`

## Available Scripts

```bash
# Development
pnpm run dev          # Start development server

# Production
pnpm run build        # Build for production
pnpm run preview      # Preview production build locally
```

## Project Structure

```
paymenttools/
├── src/
│   ├── components/              # React components
│   │   ├── HomePage.tsx        # Landing page
│   │   ├── Dashboard.tsx       # Main app layout with routing
│   │   ├── AppSidebar.tsx      # Navigation sidebar
│   │   ├── AppHeader.tsx       # Header component
│   │   ├── AppFooter.tsx       # Footer component
│   │   ├── KeyboardShortcutsModal.tsx  # Keyboard shortcuts modal
│   │   │
│   │   ├── ISO 8583 Tools/
│   │   │   ├── IsoBitmapEditor.tsx
│   │   │   ├── Iso8583VersionParser.tsx
│   │   │   ├── MtiReference.tsx
│   │   │   ├── Iso8583MacCalculator.tsx
│   │   │   ├── ThalesHsmCommands.tsx
│   │   │   └── PosEntryModeDecoder.tsx
│   │   │
│   │   ├── EMV Tools/
│   │   │   ├── EmvTlvParser.tsx
│   │   │   ├── EmvTlvBuilder.tsx
│   │   │   ├── EmvTlvComparator.tsx
│   │   │   ├── CavvDecoder.tsx
│   │   │   ├── EmvNfcTags.tsx
│   │   │   ├── EmvRIDReference.tsx
│   │   │   ├── EmvCryptogramCalculator.tsx
│   │   │   ├── TvrDecoder.tsx
│   │   │   ├── CvmResultsDecoder.tsx
│   │   │   ├── AipDecoder.tsx
│   │   │   ├── IadDecoder.tsx
│   │   │   ├── CvrDecoder.tsx
│   │   │   └── TerminalCapabilitiesDecoder.tsx
│   │   │
│   │   ├── PIN Tools/
│   │   │   ├── PinBlockCalculator.tsx
│   │   │   ├── PinFromPinBlock.tsx
│   │   │   ├── VisaPVV.tsx
│   │   │   └── CvvCalculator.tsx
│   │   │
│   │   ├── Reference/
│   │   │   ├── ServiceCodeList.tsx
│   │   │   ├── MccList.tsx
│   │   │   ├── AidList.tsx
│   │   │   ├── PaymentKeysReference.tsx
│   │   │   └── KnowledgeBase.tsx
│   │   │
│   │   └── Utilities/
│   │       ├── CardGenerator.tsx
│   │       ├── TrackGenerator.tsx
│   │       └── ConverterTools.tsx
│   │
│   ├── contexts/               # React contexts
│   │   └── ThemeContext.tsx   # Dark/light mode context
│   │
│   ├── data/                   # Static data and configuration
│   │   ├── menuItems.ts       # Tool menu items and shortcuts
│   │   ├── categories.ts       # Tool categories configuration
│   │   └── index.ts           # Data exports
│   │
│   ├── utils/                  # Utility functions
│   │   ├── iso8583VersionParser.ts  # ISO 8583 parsing utilities
│   │   ├── iso8583VersionParser/    # ISO 8583 parser modules
│   │   ├── pinBlockUtils.ts    # PIN block calculations
│   │   ├── kcvCalculator.ts    # Key Check Value calculator
│   │   └── validation.ts       # Input validation utilities
│   │
│   ├── assets/                 # Images and logos
│   ├── App.tsx                # Root app component
│   ├── App.css                # Global styles
│   └── main.tsx               # Application entry point
│
├── public/                     # Static assets
├── images/                     # Card brand images
├── index.html                  # HTML template
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Adding New Tools

To add a new tool to the application, follow these steps:

### 1. Create the Component

Create a new component file in `src/components/`:

```tsx
// src/components/YourNewTool.tsx
import { useState } from 'react';

interface YourNewToolProps {
  className?: string;
}

const YourNewTool = ({ className = '' }: YourNewToolProps) => {
  const [input, setInput] = useState('');

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
        Your New Tool
      </h1>
      {/* Your tool UI */}
    </div>
  );
};

export default YourNewTool;
```

### 2. Register the Tool

Add your tool to the menu items in `src/data/menuItems.ts`:

```typescript
export const menuItems: MenuItem[] = [
  // ... existing tools
  {
    id: 'yournewtool',                    // Unique ID for routing
    label: 'Your New Tool',                // Display name
    icon: '🔧',                            // Emoji icon
    category: 'iso8583',                   // Category: iso8583, emv, pin, reference, utilities
    description: 'Description of your tool',
    shortcut: 'n'                          // Single character shortcut
  },
];
```

### 3. Add the Route

Import your component in `src/components/Dashboard.tsx` and add the route:

```tsx
const YourNewTool = lazy(() => import('./YourNewTool'));

// In the Routes component:
<Route path="/yournewtool" element={<YourNewTool />} />
```

### 4. Add Category (if needed)

If you're adding a new category, update `src/data/categories.ts`:

```typescript
export const TOOL_CATEGORIES = {
  // ... existing categories
  newcategory: {
    id: 'newcategory',
    label: 'New Category',
    icon: '📁',
    color: 'purple',  // blue, green, purple, amber, or slate
  }
} as const;
```

### 5. Update Documentation

Don't forget to update:
- [README.md](README.md) - Add your tool to the Available Tools section
- Keyboard shortcuts table
- Feature list (if applicable)

## Code Style Guidelines

### General

- Use **TypeScript** for all new files
- Follow existing code formatting and indentation
- Use **functional components** with hooks
- Keep components small and focused (ideally under 300 lines)

### Naming Conventions

- **Components**: PascalCase (e.g., `PinBlockCalculator.tsx`)
- **Functions**: camelCase (e.g., `calculateLuhn()`)
- **Constants**: UPPER_SNAKE_CASE for constants, camelCase for others
- **Interfaces/Types**: PascalCase (e.g., `MenuItem`, `ParseResult`)

### TypeScript Best Practices

- Define interfaces for props and complex objects
- Avoid `any` - use proper types or `unknown` when necessary
- Use readonly for immutable properties
- Export types that will be used by other modules

### Styling

- Use **Tailwind CSS** classes for styling
- Follow the existing color scheme (slate-xxx, blue-xxx, etc.)
- Support both light and dark modes (`dark:` prefix)
- Make components responsive (sm:, md:, lg: breakpoints)

### Performance

- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Implement proper input validation and error handling
- Use lazy loading for routes (already configured)

## Commit Messages

Use clear, descriptive commit messages following conventional commits format:

```
type(scope): description

# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting, etc.)
refactor: Code refactoring
perf:     Performance improvements
test:     Adding or updating tests
chore:    Maintenance tasks
```

Examples:
- `feat: add CAVV decoder for 3D Secure`
- `fix: correct TLV parser for nested tags`
- `docs: update README with new tools`
- `refactor: simplify state management in TLV builder`
- `style: format code with prettier`

## Testing

Currently, the project does not have automated tests. However, when contributing:

- Manually test your changes in different browsers
- Test on different screen sizes (mobile, tablet, desktop)
- Verify dark/light mode functionality
- Test keyboard shortcuts for new tools

## Questions?

Feel free to open an issue for any questions about contributing!

## License

By contributing to this project, you agree that your contributions will be licensed under the same [MIT License](LICENSE) as the project.
