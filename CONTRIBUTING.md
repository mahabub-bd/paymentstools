# Contributing to Payment Tools

Thank you for your interest in contributing to Payment Tools! We welcome contributions from the community.

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

### Code Style

- Use TypeScript for new files
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused

### Commit Messages

Use clear commit messages:

- `feat: Add MTI selector to bitmap editor`
- `fix: Correct PAN validation logic`
- `docs: Update README with new features`
- `refactor: Simplify state management`

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/paymentstools.git

# Navigate to the directory
cd paymentstools

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── HomePage.tsx           # Main layout with sidebar
│   ├── IsoBitmapEditor.tsx    # ISO 8583 bitmap editor
│   ├── Iso8583Parser.tsx      # ISO 8583 message parser
│   ├── EmvTlvParser.tsx       # EMV TLV parser
│   ├── PinBlockCalculator.tsx # PIN block calculator
│   └── ...
├── assets/                    # Images and logos
└── main.tsx                   # Application entry point
```

## Questions?

Feel free to open an issue for any questions about contributing!
