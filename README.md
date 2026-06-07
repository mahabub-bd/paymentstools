# Payment Tools

<div align="center">

  ![ISO 8583](https://img.shields.io/badge/ISO%208583-1:2003-blue)
  ![EMV](https://img.shields.io/badge/EMV-EMV%204.3-green)
  ![React](https://img.shields.io/badge/React-19-61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)
  ![License](https://img.shields.io/badge/License-MIT-green)

  **A comprehensive suite of payment card utilities for ISO 8583 and EMV development**

  [Features](#features) • [Installation](#installation) • [Usage](#usage) • [Tools](#available-tools) • [Contributing](#contributing)

</div>

## Overview

Payment Tools is an open-source web application designed for payment card industry professionals, developers, and testers. It provides a comprehensive set of utilities for working with ISO 8583 messages, EMV data, PIN blocks, cryptograms, and card generation.

## Features

### ISO 8583 Tools
- Bitmap Editor with visual field selection
- Message Parser for ISO 8583 messages
- MTI (Message Type Indicator) reference
- MAC Calculator for ISO 8583 messages
- Thales HSM Commands reference
- POS Entry Mode decoder (Field 22)

### EMV Tools
- TLV (Tag-Length-Value) Parser
- Complete EMV & NFC tag reference
- RID (Registered Application Provider) reference
- Cryptogram Calculator (ARQC/ARPC)
- TVR Decoder (Tag 95)
- CVM Results Decoder (Tag 9F34)
- AIP Decoder (Tag 82)
- IAD Decoder (Tag 9F10)
- CVR Decoder
- Terminal Capabilities Decoder (Tag 9F33)

### PIN Tools
- PIN Block Calculator (Format 0)
- PIN from PIN Block extractor
- Visa PVV (PIN Verification Value) calculator
- CVV/CVC Calculator

### Reference Data
- Service Codes reference
- MCC (Merchant Category Codes) list
- AID (Application Identifier) list
- Payment Keys reference (TMK, TPK, TAK, ZMK, ZPK, ZAK, LMK)
- Knowledge Base with articles & guides

### Utilities
- Card Generator (Visa, Mastercard, Amex, Discover, JCB, UnionPay, TakaPay)
- Hex, ASCII, Base64 converters

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn or pnpm

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

### ISO 8583 Tools (6 tools)

| Tool | Shortcut | Description |
|------|----------|-------------|
| **Bitmap Editor** | `1` | Create and edit ISO 8583 bitmaps with field descriptions |
| **Message Parser** | `2` | Parse and display ISO 8583 message fields |
| **MTI Reference** | `3` | Message Type Identifier codes reference |
| **MAC Calculator** | `M` | Calculate ISO 8583 MAC hashes |
| **Thales HSM** | `4` | Thales HSM Commands Reference |
| **POS Entry Mode** | `5` | Decode Field 22 - POS Entry Mode codes |

### EMV Tools (10 tools)

| Tool | Shortcut | Description |
|------|----------|-------------|
| **TLV Parser** | `6` | Parse EMV TLV data with tag descriptions |
| **EMV & NFC Tags** | `7` | Complete EMV & NFC tag reference guide |
| **RID Reference** | `R` | Registered Application Provider IDs |
| **Cryptogram Calc** | `A` | Calculate ARQC/ARPC for EMV transactions |
| **TVR** | `V` | Terminal Verification Results (Tag 95) decoder |
| **CVM Results** | `Y` | Cardholder Verification Method (Tag 9F34) decoder |
| **AIP** | `U` | Application Interchange Profile (Tag 82) decoder |
| **IAD** | `D` | Issuer Application Data (Tag 9F10) decoder |
| **CVR** | `X` | Card Verification Results decoder |
| **Terminal Capabilities** | `Q` | Terminal Capabilities (Tag 9F33) decoder |

### PIN Tools (4 tools)

| Tool | Shortcut | Description |
|------|----------|-------------|
| **PIN Block** | `8` | Calculate PIN blocks with 3DES encryption |
| **PIN from Block** | `9` | Extract PIN from encrypted PIN block |
| **Visa PVV** | `0` | Calculate Visa PIN Verification Value |
| **CVV Calculator** | `C` | Calculate CVV/CVC values |

### Reference (5 tools)

| Tool | Shortcut | Description |
|------|----------|-------------|
| **Service Codes** | `W` | Card service codes reference |
| **MCC List** | `E` | Merchant Category Codes lookup |
| **AID List** | `I` | EMV Application Identifiers |
| **Payment Keys** | `K` | TMK, TPK, TAK, ZMK, ZPK, ZAK, LMK reference |
| **Knowledge Base** | `L` | Payment system articles & guides |

### Utilities (2 tools)

| Tool | Shortcut | Description |
|------|----------|-------------|
| **Card Generator** | `G` | Generate test card numbers with Track data |
| **Converters** | `T` | Hex, ASCII, Base64 encoding/decoding |

## Tech Stack

- **React 19** - UI framework
- **TypeScript 6** - Type safety
- **Vite 8** - Build tool
- **Tailwind CSS 4** - Styling
- **CryptoJS** - Encryption operations
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Zod** - Schema validation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1` | Bitmap Editor |
| `2` | Message Parser |
| `3` | MTI Reference |
| `4` | Thales HSM |
| `5` | POS Entry Mode |
| `6` | TLV Parser |
| `7` | EMV & NFC Tags |
| `8` | PIN Block |
| `9` | PIN from Block |
| `0` | Visa PVV |
| `A` | Cryptogram Calculator |
| `C` | CVV Calculator |
| `D` | IAD Decoder |
| `E` | MCC List |
| `G` | Card Generator |
| `I` | AID List |
| `K` | Payment Keys |
| `L` | Knowledge Base |
| `M` | MAC Calculator |
| `Q` | Terminal Capabilities |
| `R` | RID Reference |
| `T` | Converters |
| `U` | AIP Decoder |
| `V` | TVR Decoder |
| `W` | Service Codes |
| `X` | CVR Decoder |
| `Y` | CVM Results |
| `[` | Toggle sidebar |
| `?` | Show keyboard shortcuts |
| `Esc` | Close modal |

## Security Notice

⚠️ **This tool is for educational and development purposes only**

- Never use production PINs, PANs, or keys in development environments
- Always follow PCI-DSS guidelines when handling payment card data
- All calculations are performed client-side
- Do not use real cardholder data for testing
- This tool does not store any sensitive information

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
