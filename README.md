# Payment Tools

<div align="center">

  ![ISO 8583](https://img.shields.io/badge/ISO%208583-1:2003-blue)
  ![EMV](https://img.shields.io/badge/EMV-EMV%204.3-green)
  ![React](https://img.shields.io/badge/React-18-61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
  ![License](https://img.shields.io/badge/License-MIT-green)

  **A comprehensive suite of payment card utilities for ISO 8583 and EMV development**

  [Features](#features) • [Installation](#installation) • [Usage](#usage) • [Tools](#available-tools) • [Contributing](#contributing)

</div>

## Overview

Payment Tools is an open-source web application designed for payment card industry professionals, developers, and testers. It provides a comprehensive set of utilities for working with ISO 8583 messages, EMV data, PIN blocks, and card generation.

## Features

- **ISO 8583 Tools**
  - Bitmap Editor with visual field selection
  - Message Parser for ISO 8583 messages
  - MTI (Message Type Indicator) selector
  - Support for primary and secondary bitmaps

- **EMV Tools**
  - TLV (Tag-Length-Value) Parser
  - EMV Tag reference guide
  - POS Entry Mode decoder

- **PIN Tools**
  - PIN Block Calculator (Format 0)
  - PIN from PIN Block extractor
  - Visa PVV (PIN Verification Value) calculator

- **Reference Data**
  - Service Codes reference
  - MCC (Merchant Category Codes) list
  - Card brand test numbers

- **Utilities**
  - Card Generator (Visa, Mastercard, Amex, Discover, JCB, UnionPay, TakaPay)
  - Hex, ASCII, Base64 converters

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Clone and Install

```bash
git clone https://github.com/mahabub-bd/paymentstools.git
cd paymentstools
npm install
```

## Usage

### Development Mode

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Available Tools

### ISO 8583 Tools

| Tool | Description |
|------|-------------|
| **Bitmap Editor** | Create and edit ISO 8583 bitmaps with field descriptions |
| **Message Parser** | Parse and display ISO 8583 message fields |
| **POS Entry Mode** | Decode Field 22 - POS Entry Mode codes |

### EMV Tools

| Tool | Description |
|------|-------------|
| **TLV Parser** | Parse EMV TLV data with tag descriptions |
| **EMV Tags** | Complete EMV tag reference guide |

### PIN Tools

| Tool | Description |
|------|-------------|
| **PIN Block** | Calculate PIN blocks with 3DES encryption |
| **PIN from Block** | Extract PIN from encrypted PIN block |
| **Visa PVV** | Calculate Visa PIN Verification Value |

### Reference

| Tool | Description |
|------|-------------|
| **Service Codes** | Card service codes reference |
| **MCC List** | Merchant Category Codes lookup |

### Utilities

| Tool | Description |
|------|-------------|
| **Card Generator** | Generate test card numbers with Track data |
| **Converters** | Hex, ASCII, Base64 encoding/decoding |

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **CryptoJS** - Encryption operations

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1` | Bitmap Editor |
| `2` | Message Parser |
| `3` | POS Entry Mode |
| `4` | TLV Parser |
| `5` | EMV Tags |
| `6` | PIN Block |
| `7` | PIN from Block |
| `8` | Visa PVV |
| `9` | Service Codes |
| `0` | MCC List |
| `Q` | Card Generator |
| `W` | Converters |
| `[` | Toggle sidebar |
| `?` | Show shortcuts |
| `Esc` | Close modal |

## Security Notice

⚠️ **This tool is for educational and development purposes only**

- Never use production PINs, PANs, or keys in development environments
- Always follow PCI-DSS guidelines when handling payment card data
- All calculations are performed client-side
- Do not use real cardholder data for testing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Author

**Mahabub Hossain**

- 📧 Email: [contact@mahabub.bd](mailto:contact@mahabub.bd)
- 💼 LinkedIn: [mahabubhossainbd](https://www.linkedin.com/in/mahabubhossainbd/)
- 🐙 GitHub: [@mahabub-bd](https://github.com/mahabub-bd)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- ISO 8583 standard by ISO
- EMV specifications by EMVCo
- Payment card industry standards

## Support

If you find this tool useful, please consider giving it a ⭐ on GitHub!

---

<div align="center">
  <sub>Built with ❤️ for the payment card industry community</sub>
</div>
