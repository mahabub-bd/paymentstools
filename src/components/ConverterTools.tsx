import React, { useState, useCallback } from 'react';

// Hex to ASCII conversion
const hexToAscii = (hex: string): { text: string; bytes: string; display: string } => {
  const cleanHex = hex.replace(/\s/g, '');
  let text = '';
  let bytes = [];
  let display = [];

  // Handle odd length by padding with leading zero
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;

  for (let i = 0; i < paddedHex.length; i += 2) {
    const hexByte = paddedHex.substr(i, 2);
    const code = parseInt(hexByte, 16);
    const char = String.fromCharCode(code);

    // Build display string with hex and char representation
    const displayChar = (code >= 32 && code <= 126) ? char : '.';
    display.push(`${hexByte}(${displayChar})`);

    bytes.push(hexByte);
    text += char;
  }

  return {
    text,
    bytes: bytes.join(' '),
    display: display.join(' ')
  };
};

// ASCII to Hex conversion
const asciiToHex = (ascii: string): string => {
  let result = '';
  for (let i = 0; i < ascii.length; i++) {
    const hex = ascii.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
    result += hex + ' ';
  }
  return result.trim();
};

// ASCII to Hex with byte details
const asciiToHexDetailed = (ascii: string): { hex: string; details: string } => {
  let hex = [];
  let details = [];

  for (let i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    const h = code.toString(16).toUpperCase().padStart(2, '0');
    hex.push(h);
    details.push(`'${ascii[i]}'(0x${h})`);
  }

  return {
    hex: hex.join(' '),
    details: details.join(' ')
  };
};

// EBCDIC to ASCII conversion
const ebcdicToAscii = (hex: string): { ascii: string; table: string } => {
  // Simplified EBCDIC to ASCII mapping table
  const ebcdicTable: Record<number, string> = {
    0x00: 'NUL', 0x01: 'SOH', 0x02: 'STX', 0x03: 'ETX', 0x04: 'PF', 0x05: 'HT', 0x06: 'LC', 0x07: 'DEL',
    0x08: '', 0x09: '', 0x0A: 'RLF', 0x0B: '', 0x0C: '', 0x0D: '', 0x0E: 'SO', 0x0F: 'SI',
    0x10: 'DLE', 0x11: 'DC1', 0x12: 'DC2', 0x13: 'DC3', 0x14: 'RES', 0x15: 'NL', 0x16: 'BS', 0x17: 'IL',
    0x18: 'CAN', 0x19: 'EM', 0x1A: 'CC', 0x1B: 'CU1', 0x1C: 'IFS', 0x1D: 'IFS', 0x1E: 'IFS', 0x1F: 'IFS',
    0x20: 'DS', 0x21: 'SOS', 0x22: 'FS', 0x23: '', 0x24: 'BYP', 0x25: 'LF', 0x26: 'ETB', 0x27: 'ESC',
    0x28: '', 0x29: '', 0x2A: 'SM', 0x2B: 'CU2', 0x2C: '', 0x2D: 'ENQ', 0x2E: 'ACK', 0x2F: 'BEL',
    0x30: '', 0x31: '', 0x32: 'SYN', 0x33: '', 0x34: 'PN', 0x35: 'RS', 0x36: 'UC', 0x37: 'EOT',
    0x38: '', 0x39: '', 0x3A: '', 0x3B: 'CU3', 0x3C: 'DC4', 0x3D: 'NAK', 0x3E: '', 0x3F: 'SUB',
    0x40: 'SP', 0x41: '', 0x42: '', 0x43: '', 0x44: '', 0x45: '', 0x46: '', 0x47: '',
    0x48: '', 0x49: '', 0x4A: 'ç', 0x4B: '.', 0x4C: '<', 0x4D: '(', 0x4E: '+', 0x4F: '|',
    0x50: '&', 0x51: '', 0x52: '', 0x53: '', 0x54: '', 0x55: '', 0x56: '', 0x57: '',
    0x58: '', 0x59: '', 0x5A: '!', 0x5B: '$', 0x5C: '*', 0x5D: ')', 0x5E: ';', 0x5F: '¬',
    0x60: '-', 0x61: '/', 0x62: '', 0x63: '', 0x64: '', 0x65: '', 0x66: '', 0x67: '',
    0x68: '', 0x69: '', 0x6A: '|', 0x6B: ',', 0x6C: '%', 0x6D: '_', 0x6E: '>', 0x6F: '?',
    0x70: '', 0x71: '', 0x72: '', 0x73: '', 0x74: '', 0x75: '', 0x76: '', 0x77: '',
    0x78: '', 0x79: '`', 0x7A: ':', 0x7B: '#', 0x7C: '@', 0x7D: "'", 0x7E: '=', 0x7F: '"',
    0x80: '', 0x81: 'a', 0x82: 'b', 0x83: 'c', 0x84: 'd', 0x85: 'e', 0x86: 'f', 0x87: 'g',
    0x88: 'h', 0x89: 'i', 0x8A: '', 0x8B: '', 0x8C: '', 0x8D: '', 0x8E: '', 0x8F: '',
    0x90: '', 0x91: 'j', 0x92: 'k', 0x93: 'l', 0x94: 'm', 0x95: 'n', 0x96: 'o', 0x97: 'p',
    0x98: 'q', 0x99: 'r', 0x9A: '', 0x9B: '', 0x9C: '', 0x9D: '', 0x9E: '', 0x9F: '',
    0xA0: '', 0xA1: '~', 0xA2: 's', 0xA3: 't', 0xA4: 'u', 0xA5: 'v', 0xA6: 'w', 0xA7: 'x',
    0xA8: 'y', 0xA9: 'z', 0xAA: '', 0xAB: '', 0xAC: '', 0xAD: '', 0xAE: '', 0xAF: '',
    0xB0: '', 0xB1: '^', 0xB2: '', 0xB3: '', 0xB4: '', 0xB5: '', 0xB6: '', 0xB7: '',
    0xB8: '', 0xB9: '', 0xBA: '', 0xBB: '', 0xBC: '', 0xBD: '', 0xBE: '', 0xBF: '',
    0xC0: '{', 0xC1: 'A', 0xC2: 'B', 0xC3: 'C', 0xC4: 'D', 0xC5: 'E', 0xC6: 'F', 0xC7: 'G',
    0xC8: 'H', 0xC9: 'I', 0xCA: '', 0xCB: '', 0xCC: '', 0xCD: '', 0xCE: '', 0xCF: '',
    0xD0: '}', 0xD1: 'J', 0xD2: 'K', 0xD3: 'L', 0xD4: 'M', 0xD5: 'N', 0xD6: 'O', 0xD7: 'P',
    0xD8: 'Q', 0xD9: 'R', 0xDA: '', 0xDB: '', 0xDC: '', 0xDD: '', 0xDE: '', 0xDF: '',
    0xE0: '\\', 0xE1: '', 0xE2: 'S', 0xE3: 'T', 0xE4: 'U', 0xE5: 'V', 0xE6: 'W', 0xE7: 'X',
    0xE8: 'Y', 0xE9: 'Z', 0xEA: '', 0xEB: '', 0xEC: '', 0xED: '', 0xEE: '', 0xEF: '',
    0xF0: '0', 0xF1: '1', 0xF2: '2', 0xF3: '3', 0xF4: '4', 0xF5: '5', 0xF6: '6', 0xF7: '7',
    0xF8: '8', 0xF9: '9', 0xFA: '', 0xFB: '', 0xFC: '', 0xFD: '', 0xFE: '', 0xFF: '',
  };

  const cleanHex = hex.replace(/\s/g, '');
  let ascii = '';
  let table = [];

  for (let i = 0; i < cleanHex.length; i += 2) {
    const hexByte = cleanHex.substr(i, 2);
    const code = parseInt(hexByte, 16);
    const char = ebcdicTable[code] || `[${code.toString(16).toUpperCase()}]`;
    ascii += (char.length === 1 && code >= 0x80) ? char : (char.match(/^[a-zA-Z0-9 ]$/) ? char : '.');
    table.push(`${hexByte}→${char}`);
  }

  return {
    ascii,
    table: table.join(' ')
  };
};

// ASCII to EBCDIC conversion
const asciiToEbcdic = (ascii: string): { ebcdic: string; details: string } => {
  // ASCII to EBCDIC mapping (common characters)
  const asciiToEbcdicMap: Record<string, number> = {
    ' ': 0x40, '!': 0x5A, '"': 0x7F, '#': 0x7B, '$': 0x5B, '%': 0x6C, '&': 0x50, "'": 0x7D,
    '(': 0x4D, ')': 0x5D, '*': 0x5C, '+': 0x4E, ',': 0x6B, '-': 0x60, '.': 0x4B, '/': 0x61,
    '0': 0xF0, '1': 0xF1, '2': 0xF2, '3': 0xF3, '4': 0xF4, '5': 0xF5, '6': 0xF6, '7': 0xF7,
    '8': 0xF8, '9': 0xF9, ':': 0x7A, ';': 0x5E, '<': 0x4C, '=': 0x7E, '>': 0x6E, '?': 0x6F,
    '@': 0x7C, 'A': 0xC1, 'B': 0xC2, 'C': 0xC3, 'D': 0xC4, 'E': 0xC5, 'F': 0xC6, 'G': 0xC7,
    'H': 0xC8, 'I': 0xC9, 'J': 0xD1, 'K': 0xD2, 'L': 0xD3, 'M': 0xD4, 'N': 0xD5, 'O': 0xD6,
    'P': 0xD7, 'Q': 0xD8, 'R': 0xD9, 'S': 0xE2, 'T': 0xE3, 'U': 0xE4, 'V': 0xE5, 'W': 0xE6,
    'X': 0xE7, 'Y': 0xE8, 'Z': 0xE9, '[': 0xAD, '\\': 0xE0, ']': 0xBD, '^': 0xA1, '_': 0x6D,
    '`': 0x79, 'a': 0x81, 'b': 0x82, 'c': 0x83, 'd': 0x84, 'e': 0x85, 'f': 0x86, 'g': 0x87,
    'h': 0x88, 'i': 0x89, 'j': 0x91, 'k': 0x92, 'l': 0x93, 'm': 0x94, 'n': 0x95, 'o': 0x96,
    'p': 0x97, 'q': 0x98, 'r': 0x99, 's': 0xA2, 't': 0xA3, 'u': 0xA4, 'v': 0xA5, 'w': 0xA6,
    'x': 0xA7, 'y': 0xA8, 'z': 0xA9, '{': 0xC0, '|': 0x4F, '}': 0xD0, '~': 0xA1,
  };

  let ebcdic = [];
  let details = [];

  for (let i = 0; i < ascii.length; i++) {
    const char = ascii[i];
    const ebcdicCode = asciiToEbcdicMap[char] ?? 0x3F; // Default to '?' if not found
    const hex = ebcdicCode.toString(16).toUpperCase().padStart(2, '0');
    ebcdic.push(hex);
    details.push(`'${char}'→${hex}`);
  }

  return {
    ebcdic: ebcdic.join(' '),
    details: details.join(' ')
  };
};

// Hex to Decimal conversion
const hexToDecimal = (hex: string): string => {
  const cleanHex = hex.replace(/\s/g, '');
  return BigInt('0x' + cleanHex).toString(10);
};

// Decimal to Hex conversion
const decimalToHex = (decimal: string): string => {
  const cleanDec = decimal.replace(/\s/g, '');
  const hex = BigInt(cleanDec).toString(16).toUpperCase();
  return hex.match(/.{1,2}/g)?.join(' ') || hex;
};

// Hex to Binary conversion
const hexToBinary = (hex: string): string => {
  const cleanHex = hex.replace(/\s/g, '');
  let result = '';
  for (let i = 0; i < cleanHex.length; i++) {
    const binary = parseInt(cleanHex[i], 16).toString(2).padStart(4, '0');
    result += binary + ' ';
  }
  return result.trim();
};

// Binary to Hex conversion
const binaryToHex = (binary: string): string => {
  const cleanBin = binary.replace(/\s/g, '');
  let result = '';
  for (let i = 0; i < cleanBin.length; i += 4) {
    const nibble = cleanBin.substr(i, 4);
    const hex = parseInt(nibble, 2).toString(16).toUpperCase();
    result += hex + ' ';
  }
  return result.trim();
};

// Base64 to Hex conversion
const base64ToHex = (base64: string): string => {
  try {
    const decoded = atob(base64);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += decoded.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0') + ' ';
    }
    return result.trim();
  } catch {
    return 'Invalid Base64';
  }
};

// Hex to Base64 conversion
const hexToBase64 = (hex: string): string => {
  const cleanHex = hex.replace(/\s/g, '');
  if (cleanHex.length % 2 !== 0) return 'Invalid hex length';
  let result = '';
  for (let i = 0; i < cleanHex.length; i += 2) {
    result += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
  }
  return btoa(result);
};

// Calculate Luhn check digit and validate
const calculateLuhn = (pan: string): { checkDigit: string; isValid: boolean; pan: string } => {
  const cleanPan = pan.replace(/\s/g, '');
  let sum = 0;
  let isEven = false;

  // Calculate from right to left
  for (let i = cleanPan.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanPan[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  const checkDigit = (10 - (sum % 10)) % 10 === 0 ? '0' : String(10 - (sum % 10));
  const isValid = (sum % 10) === 0;

  return {
    checkDigit,
    isValid,
    pan: cleanPan
  };
};

// Format PAN with spaces
const formatPan = (pan: string): string => {
  const cleaned = pan.replace(/\s/g, '').replace(/\D/g, '');
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

const converters = [
  { id: 'hex-ascii', name: 'Hex ↔ ASCII', icon: '🔤' },
  { id: 'ebcdic', name: 'EBCDIC ↔ ASCII', icon: '💾' },
  { id: 'hex-dec', name: 'Hex ↔ Decimal', icon: '🔢' },
  { id: 'hex-bin', name: 'Hex ↔ Binary', icon: '💻' },
  { id: 'hex-base64', name: 'Hex ↔ Base64', icon: '📦' },
  { id: 'luhn', name: 'Luhn Calculator', icon: '✅' },
];

interface ConverterResultProps {
  label: string;
  value: string;
  onCopy?: () => void;
  isMain?: boolean;
}

const ConverterResult: React.FC<ConverterResultProps> = ({ label, value, onCopy, isMain = false }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [value, onCopy]);

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isMain
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-700'
        : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
    }`}>
      <div className="flex-1">
        <label className={`text-xs mb-1 ${isMain ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>{label}</label>
        <div className={`font-mono break-all ${isMain ? 'text-lg font-bold text-blue-600 dark:text-blue-400' : 'text-sm text-slate-800 dark:text-slate-100'}`}>{value || '-'}</div>
      </div>
      <button
        onClick={handleCopy}
        className="ml-3 p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};

const ConverterTools = ({ className = '' }: { className?: string }) => {
  const [activeConverter, setActiveConverter] = useState('hex-ascii');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Convert based on active converter
  const convert = useCallback(() => {
    if (!input) {
      setResult(null);
      return;
    }

    try {
      switch (activeConverter) {
        case 'hex-ascii':
          // Detect if input is hex or ASCII
          const cleanInput = input.replace(/\s/g, '');
          if (/^[0-9A-Fa-f]+$/.test(cleanInput) && cleanInput.length > 1) {
            setResult(hexToAscii(input));
          } else {
            setResult(asciiToHexDetailed(input));
          }
          break;
        case 'ebcdic':
          const ebcdicClean = input.replace(/\s/g, '');
          if (/^[0-9A-Fa-f]+$/.test(ebcdicClean)) {
            setResult(ebcdicToAscii(input));
          } else {
            setResult(asciiToEbcdic(input));
          }
          break;
        case 'hex-dec':
          if (/^[0-9A-Fa-f\s]+$/.test(input)) {
            setResult({ value: hexToDecimal(input), direction: 'hex→dec' });
          } else {
            setResult({ value: decimalToHex(input), direction: 'dec→hex' });
          }
          break;
        case 'hex-bin':
          if (/^[01\s]+$/.test(input.replace(/\s/g, ''))) {
            setResult({ value: binaryToHex(input), direction: 'bin→hex' });
          } else {
            setResult({ value: hexToBinary(input), direction: 'hex→bin' });
          }
          break;
        case 'hex-base64':
          if (/^[0-9A-Fa-f\s]+$/.test(input.replace(/\s/g, ''))) {
            setResult({ value: hexToBase64(input), direction: 'hex→base64' });
          } else {
            setResult({ value: base64ToHex(input), direction: 'base64→hex' });
          }
          break;
        case 'luhn':
          setResult(calculateLuhn(input));
          break;
      }
    } catch (err) {
      setResult({ error: (err as Error).message });
    }
  }, [activeConverter, input]);

  // Auto-convert on input change
  React.useEffect(() => {
    convert();
  }, [input, activeConverter, convert]);

  const handleLoadExample = useCallback(() => {
    setShowDetails(false);
    switch (activeConverter) {
      case 'hex-ascii':
        setInput('3132333435363738393031323334');
        break;
      case 'ebcdic':
        setInput('C1C2C3C4C5C6'); // ABCDEF in EBCDIC
        break;
      case 'hex-dec':
        setInput('FFFFFFFF');
        break;
      case 'hex-bin':
        setInput('1100110011000010');
        break;
      case 'hex-base64':
        setInput('SGVsbG8gV29ybGQ=');
        break;
      case 'luhn':
        setInput('4532015112830366');
        break;
    }
  }, [activeConverter]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    setShowDetails(false);
  }, []);

  const renderConverter = () => {
    if (result?.error) {
      return <div className="text-red-600 dark:text-red-400">Error: {result.error}</div>;
    }

    switch (activeConverter) {
      case 'hex-ascii':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Enter Hex or ASCII Text
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter hex (e.g., 313233) or ASCII text (e.g., ABC)"
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[100px]"
                rows={4}
              />
            </div>
            {result && (
              <>
                <ConverterResult label="Result" value={result.text || result.hex} isMain />
                {result.bytes && (
                  <ConverterResult label="Hex Bytes" value={result.bytes} />
                )}
                {result.display && (
                  <ConverterResult label="Detailed (hex + char)" value={result.display} />
                )}
                {result.details && (
                  <ConverterResult label="Character Details" value={result.details} />
                )}
              </>
            )}
          </div>
        );

      case 'ebcdic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Enter EBCDIC (Hex) or ASCII Text
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter EBCDIC hex (e.g., C1C2C3) or ASCII text (e.g., ABC)"
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[100px]"
                rows={4}
              />
            </div>
            {result && (
              <>
                <ConverterResult label="Result" value={result.ascii || result.ebcdic} isMain />
                {result.table && (
                  <ConverterResult label="Conversion Table" value={result.table} />
                )}
                {result.details && (
                  <ConverterResult label="Character Details" value={result.details} />
                )}
              </>
            )}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>EBCDIC</strong> is commonly used in mainframe payment systems. This converter handles alphanumeric characters and common symbols.
              </p>
            </div>
          </div>
        );

      case 'hex-dec':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Enter Hex or Decimal Number
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter hex (e.g., FF) or decimal (e.g., 255)"
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>
            {result && (
              <>
                <ConverterResult label={`Conversion: ${result.direction}`} value={result.value} isMain />
              </>
            )}
          </div>
        );

      case 'hex-bin':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Enter Hex or Binary
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter hex (e.g., F0) or binary (e.g., 11110000)"
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[100px]"
                rows={4}
              />
            </div>
            {result && (
              <>
                <ConverterResult label={`Conversion: ${result.direction}`} value={result.value} isMain />
              </>
            )}
          </div>
        );

      case 'hex-base64':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Enter Hex or Base64
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter hex (e.g., 48656C6C6F) or Base64 (e.g., SGVsbG8=)"
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[100px]"
                rows={4}
              />
            </div>
            {result && (
              <>
                <ConverterResult label={`Conversion: ${result.direction}`} value={result.value} isMain />
              </>
            )}
          </div>
        );

      case 'luhn':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Enter PAN (Card Number)
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(formatPan(e.target.value))}
                placeholder="4532 0151 1283 0366"
                maxLength={19}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>
            {result && (
              <>
                <ConverterResult label="Check Digit" value={result.checkDigit} />
                {result.pan && result.pan.length >= 13 && (
                  <ConverterResult label="PAN (Cleaned)" value={formatPan(result.pan)} />
                )}
                <div className={`p-4 rounded-lg border ${
                  result.isValid
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <p className={`text-sm font-medium flex items-center gap-2 ${
                    result.isValid
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {result.isValid ? (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Valid PAN - Luhn Check Passed
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Invalid PAN - Luhn Check Failed
                      </>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Payment System Converters
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Hex, ASCII, EBCDIC, Binary, Decimal, Base64 converters for payment systems
        </p>
      </div>

      {/* Converter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {converters.map((conv) => (
          <button
            key={conv.id}
            onClick={() => {
              setActiveConverter(conv.id);
              setInput('');
              setResult(null);
              setShowDetails(false);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeConverter === conv.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span>{conv.icon}</span>
            <span>{conv.name}</span>
          </button>
        ))}
      </div>

      {/* Active Converter */}
      <div className="mb-6">
        {renderConverter()}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleLoadExample}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Load Example
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Quick Reference */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">Hex ↔ ASCII</p>
            <p className="text-slate-500 dark:text-slate-500">Convert between hexadecimal and ASCII text (e.g., "313233" ↔ "123")</p>
          </div>
          <div>
            <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">EBCDIC ↔ ASCII</p>
            <p className="text-slate-500 dark:text-slate-500">Mainframe encoding used in legacy payment systems</p>
          </div>
          <div>
            <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">Hex ↔ Decimal</p>
            <p className="text-slate-500 dark:text-slate-500">Convert between hex and decimal (e.g., "FF" ↔ "255")</p>
          </div>
          <div>
            <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">Hex ↔ Binary</p>
            <p className="text-slate-500 dark:text-slate-500">Convert between hex and binary (e.g., "F0" ↔ "11110000")</p>
          </div>
          <div>
            <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">Hex ↔ Base64</p>
            <p className="text-slate-500 dark:text-slate-500">Convert between hex and Base64 encoding</p>
          </div>
          <div>
            <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">Luhn Calculator</p>
            <p className="text-slate-500 dark:text-slate-500">Calculate check digit and validate PAN numbers using Modulo 10</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConverterTools;
