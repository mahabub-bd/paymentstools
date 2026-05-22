import { useState, useCallback } from 'react';

// ISO 8583 Field definitions (based on 1987 and 2003 standards)
const ISO8583_FIELDS: Record<number, { name: string; format: string; length: number; variable: boolean }> = {
  1: { name: 'Bitmap', format: 'B', length: 8, variable: false },
  2: { name: 'Primary Account Number (PAN)', format: 'LLVAR..n', length: 19, variable: true },
  3: { name: 'Processing Code', format: 'n', length: 6, variable: false },
  4: { name: 'Transaction Amount', format: 'n', length: 12, variable: false },
  5: { name: 'Settlement Amount', format: 'n', length: 12, variable: false },
  6: { name: 'Billing Amount', format: 'n', length: 12, variable: false },
  7: { name: 'Transmission Date & Time', format: 'n', length: 10, variable: false },
  8: { name: 'Billing Amount', format: 'n', length: 8, variable: false },
  9: { name: 'Conversion Rate', format: 'n', length: 8, variable: false },
  10: { name: 'Conversion Rate', format: 'n', length: 8, variable: false },
  11: { name: 'System Trace Audit Number (STAN)', format: 'n', length: 6, variable: false },
  12: { name: 'Local Transaction Time', format: 'n', length: 6, variable: false },
  13: { name: 'Local Transaction Date', format: 'n', length: 4, variable: false },
  14: { name: 'Expiration Date', format: 'n', length: 4, variable: false },
  15: { name: 'Settlement Date', format: 'n', length: 4, variable: false },
  16: { name: 'Conversion Date', format: 'n', length: 4, variable: false },
  17: { name: 'Capture Date', format: 'n', length: 4, variable: false },
  18: { name: 'Merchant Type', format: 'n', length: 4, variable: false },
  19: { name: 'Acquiring Institution Country Code', format: 'n', length: 3, variable: false },
  20: { name: 'PAN Extended Country Code', format: 'n', length: 3, variable: false },
  21: { name: 'Forwarding Institution Country Code', format: 'n', length: 3, variable: false },
  22: { name: 'Point of Service Entry Mode', format: 'n', length: 3, variable: false },
  23: { name: 'Card Sequence Number', format: 'n', length: 3, variable: false },
  24: { name: 'Network International Identifier', format: 'n', length: 3, variable: false },
  25: { name: 'Point of Service Condition Code', format: 'n', length: 2, variable: false },
  26: { name: 'Point of Service PIN Capture Code', format: 'n', length: 2, variable: false },
  27: { name: 'Authorization Identification Response Length', format: 'n', length: 1, variable: false },
  28: { name: 'Amount Fee', format: 'n', length: 8, variable: false },
  29: { name: 'Amount Fee', format: 'n', length: 8, variable: false },
  30: { name: 'Amount Fee', format: 'n', length: 8, variable: false },
  31: { name: 'Amount Fee', format: 'n', length: 8, variable: false },
  32: { name: 'Acquiring Institution ID Code', format: 'LLVAR..n', length: 11, variable: true },
  33: { name: 'Forwarding Institution ID Code', format: 'LLVAR..n', length: 11, variable: true },
  34: { name: 'Primary Account Number Extended', format: 'LLVAR..n', length: 28, variable: true },
  35: { name: 'Track 2 Data', format: 'LLVAR..z', length: 37, variable: true },
  36: { name: 'Track 3 Data', format: 'LLLVAR..n', length: 104, variable: true },
  37: { name: 'Retrieval Reference Number', format: 'an', length: 12, variable: false },
  38: { name: 'Authorization Identification Response', format: 'an', length: 6, variable: false },
  39: { name: 'Response Code', format: 'n', length: 2, variable: false },
  40: { name: 'Service Restriction Code', format: 'n', length: 3, variable: false },
  41: { name: 'Card Acceptor Terminal ID', format: 'ans', length: 8, variable: false },
  42: { name: 'Card Acceptor ID Code', format: 'ans', length: 15, variable: false },
  43: { name: 'Card Acceptor Name/Location', format: 'ans', length: 40, variable: false },
  44: { name: 'Additional Response Data', format: 'LLVAR..an', length: 25, variable: true },
  45: { name: 'Track 1 Data', format: 'LLLVAR..an', length: 76, variable: true },
  46: { name: 'Additional Data - ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  47: { name: 'Additional Data - National', format: 'LLLVAR..ans', length: 999, variable: true },
  48: { name: 'Additional Data - Private', format: 'LLLVAR..ans', length: 999, variable: true },
  49: { name: 'Transaction Currency Code', format: 'a or n', length: 3, variable: false },
  50: { name: 'Settlement Currency Code', format: 'a or n', length: 3, variable: false },
  51: { name: 'Cardholder Billing Currency Code', format: 'a or n', length: 3, variable: false },
  52: { name: 'PIN Data', format: 'n', length: 8, variable: false },
  53: { name: 'Security Related Control Information', format: 'n', length: 16, variable: false },
  54: { name: 'Additional Amounts', format: 'LLLVAR..an', length: 120, variable: true },
  55: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  56: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  57: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  58: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  59: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  60: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  61: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  62: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  63: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  64: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  65: { name: 'Reserved ISO (MAC)', format: 'LLLVAR..ans', length: 999, variable: true },
  66: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  67: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  68: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  69: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  70: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  71: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  72: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  73: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  74: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  75: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  76: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  77: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  78: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  79: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  80: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  81: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  82: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  83: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  84: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  85: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  86: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  87: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  88: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  89: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  90: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  91: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  92: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  93: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  94: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  95: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  96: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  97: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  98: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  99: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  100: { name: 'Receiving Institution ID Code', format: 'LLLVAR..ans', length: 999, variable: true },
  101: { name: 'File Name', format: 'LLLVAR..ans', length: 999, variable: true },
  102: { name: 'Account ID 1', format: 'LLLVAR..ans', length: 999, variable: true },
  103: { name: 'Account ID 2', format: 'LLLVAR..ans', length: 999, variable: true },
  104: { name: 'Transaction Description', format: 'LLLVAR..ans', length: 999, variable: true },
  105: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  106: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  107: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  108: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  109: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  110: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  111: { name: 'Reserved ISO', format: 'LLLVAR..ans', length: 999, variable: true },
  112: { name: 'Reserved National', format: 'LLLVAR..ans', length: 999, variable: true },
  113: { name: 'Reserved National', format: 'LLLVAR..ans', length: 999, variable: true },
  114: { name: 'Reserved National', format: 'LLLVAR..ans', length: 999, variable: true },
  115: { name: 'Reserved National', format: 'LLLVAR..ans', length: 999, variable: true },
  116: { name: 'Reserved National', format: 'LLLVAR..ans', length: 999, variable: true },
  117: { name: 'Reserved National', format: 'LLLVAR..ans', length: 999, variable: true },
  118: { name: 'Reserved National', format: 'LLLVAR..ans', length: 999, variable: true },
  119: { name: 'Reserved National', format: 'LLLVAR..ans', length: 999, variable: true },
  120: { name: 'Reserved Private', format: 'LLLVAR..ans', length: 999, variable: true },
  121: { name: 'Reserved Private', format: 'LLLVAR..ans', length: 999, variable: true },
  122: { name: 'Reserved Private', format: 'LLLVAR..ans', length: 999, variable: true },
  123: { name: 'Reserved Private', format: 'LLLVAR..ans', length: 999, variable: true },
  124: { name: 'Reserved Private', format: 'LLLVAR..ans', length: 999, variable: true },
  125: { name: 'Reserved Private', format: 'LLLVAR..ans', length: 999, variable: true },
  126: { name: 'Reserved Private', format: 'LLLVAR..ans', length: 999, variable: true },
  127: { name: 'Reserved Private', format: 'LLLVAR..ans', length: 999, variable: true },
  128: { name: 'MAC 2', format: 'n', length: 16, variable: false },
};

// Parse bitmap to get present fields
const parseBitmap = (bitmapHex: string): number[] => {
  const cleanHex = bitmapHex.replace(/\s/g, '');
  const bitmap = BigInt('0x' + cleanHex);
  const fields: number[] = [];

  for (let i = 0; i < cleanHex.length * 4; i++) {
    if ((bitmap & BigInt(1) << BigInt(i)) !== BigInt(0)) {
      fields.push(i + 1);
    }
  }

  return fields;
};

// Parse ISO 8583 message
const parseIso8583Message = (hexMessage: string) => {
  const cleanHex = hexMessage.replace(/\s/g, '');
  const result: any = {
    mti: null,
    bitmap: '',
    primaryBitmap: '',
    secondaryBitmap: '',
    presentFields: [],
    fields: {} as Record<number, { raw: string; value: string; description: string }>,
    raw: cleanHex,
    error: null
  };

  try {
    if (!cleanHex || cleanHex.length < 8) {
      throw new Error('Message too short');
    }

    let pos = 0;

    // Extract MTI (Message Type Indicator) - 4 digits / 2 bytes
    const mtiHex = cleanHex.substring(pos, pos + 4);
    const mti = parseInt(mtiHex, 16).toString().padStart(4, '0');
    result.mti = mti;
    result.fields[0] = {
      raw: mtiHex,
      value: mti,
      description: getMTIDescription(mti)
    };
    pos += 4;

    // Extract Primary Bitmap - 16 hex chars / 8 bytes
    if (cleanHex.length < pos + 16) {
      throw new Error('Missing bitmap');
    }
    const primaryBitmap = cleanHex.substring(pos, pos + 16);
    result.primaryBitmap = primaryBitmap;
    result.bitmap = primaryBitmap;
    pos += 16;

    // Check if secondary bitmap is present (bit 1 of primary bitmap)
    const hasSecondaryBitmap = (BigInt('0x' + primaryBitmap) & BigInt(1)) !== BigInt(0);

    if (hasSecondaryBitmap) {
      if (cleanHex.length < pos + 16) {
        throw new Error('Missing secondary bitmap');
      }
      const secondaryBitmap = cleanHex.substring(pos, pos + 16);
      result.secondaryBitmap = secondaryBitmap;
      result.bitmap = primaryBitmap + secondaryBitmap;
      pos += 16;
    }

    // Parse present fields from bitmap
    result.presentFields = parseBitmap(result.bitmap);

    // Parse each field
    for (const fieldNum of result.presentFields) {
      if (fieldNum === 0 || fieldNum === 1) continue; // Skip MTI and Bitmap

      const fieldDef = ISO8583_FIELDS[fieldNum];
      if (!fieldDef) {
        result.fields[fieldNum] = {
          raw: '',
          value: '',
          description: 'Reserved'
        };
        continue;
      }

      try {
        const parsed = parseField(cleanHex, pos, fieldNum, fieldDef);
        result.fields[fieldNum] = parsed;
        pos += parsed.raw.length;
      } catch (e) {
        result.fields[fieldNum] = {
          raw: '',
          value: '',
          description: 'Parse error: ' + (e as Error).message
        };
      }
    }

  } catch (e) {
    result.error = (e as Error).message;
  }

  return result;
};

// Parse individual field
const parseField = (message: string, pos: number, fieldNum: number, fieldDef: typeof ISO8583_FIELDS[number]) => {
  if (pos >= message.length) {
    throw new Error('Unexpected end of message');
  }

  let length = 0;
  let dataLength = 0;
  let raw = '';

  if (fieldDef.variable) {
    // Variable length field - extract length indicator
    if (fieldDef.format.startsWith('LLL')) {
      // LLLVAR - 3 digit length
      const lenHex = message.substring(pos, pos + 6);
      length = parseInt(lenHex, 16);
      raw += lenHex;
      dataLength = length * 2; // Hex digits
    } else {
      // LLVAR - 2 digit length
      const lenHex = message.substring(pos, pos + 4);
      length = parseInt(lenHex, 16);
      raw += lenHex;
      dataLength = length * 2;
    }
  } else {
    // Fixed length field
    dataLength = fieldDef.length * 2;
  }

  // Extract data
  if (pos + raw.length + dataLength > message.length) {
    // Truncated field - take what's available
    const available = message.length - pos - raw.length;
    const dataHex = message.substring(pos + raw.length, pos + raw.length + available);
    raw += dataHex;
  } else {
    const dataHex = message.substring(pos + raw.length, pos + raw.length + dataLength);
    raw += dataHex;
  }

  // Convert to readable value
  const value = hexToReadable(raw, fieldDef.format);

  return {
    raw,
    value,
    description: fieldDef.name
  };
};

// Convert hex to readable string based on format
const hexToReadable = (hex: string, format: string): string => {
  if (!hex) return '';

  // Remove length indicators for display
  let dataHex = hex;
  if (format.includes('LLVAR') && hex.length > 4 && !format.startsWith('LLL')) {
    const len = parseInt(hex.substring(0, 4), 16);
    dataHex = hex.substring(4, 4 + len * 2);
  } else if (format.includes('LLLVAR') && hex.length > 6) {
    const len = parseInt(hex.substring(0, 6), 16);
    dataHex = hex.substring(6, 6 + len * 2);
  }

  // Convert based on format
  if (format.includes('n')) {
    // Numeric - return as is
    return dataHex.replace(/\s/g, '');
  } else if (format.includes('ans') || format.includes('an')) {
    // Alphanumeric - try to convert to ASCII
    return hexToAscii(dataHex);
  } else if (format.includes('z')) {
    // Track 2 data
    return hexToAscii(dataHex);
  }

  return dataHex;
};

// Convert hex to ASCII
const hexToAscii = (hex: string): string => {
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    if (code >= 32 && code <= 126) {
      result += String.fromCharCode(code);
    } else {
      result += '.';
    }
  }
  return result;
};

// Get MTI description
const getMTIDescription = (mti: string): string => {
  const firstDigit = parseInt(mti[0]);
  const secondDigit = parseInt(mti[1]);
  const classMap = ['Authorization', 'Financial', 'File Actions', 'Chargeback', 'Reconciliation', 'Administrative', 'Network Management'];
  const functionMap = ['Request', 'Response', 'Advice', 'Advice Response'];

  return `${classMap[firstDigit - 1] || 'Unknown'} - ${functionMap[secondDigit - 1] || 'Unknown'}`;
};

const Iso8583Parser = ({ className = '' }) => {
  const [input, setInput] = useState('');
  const [inputFormat, setInputFormat] = useState<'hex' | 'ascii'>('hex');
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleParse = useCallback(() => {
    if (!input.trim()) {
      setParsedResult(null);
      return;
    }

    try {
      let hexInput = input.replace(/\s/g, '');
      if (inputFormat === 'ascii') {
        // Convert ASCII to hex
        hexInput = asciiToHex(input);
      }

      const result = parseIso8583Message(hexInput);
      setParsedResult(result);
    } catch (e) {
      setParsedResult({
        error: (e as Error).message,
        raw: input
      });
    }
  }, [input, inputFormat]);

  const asciiToHex = (ascii: string): string => {
    let result = '';
    for (let i = 0; i < ascii.length; i++) {
      result += ascii.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
    }
    return result;
  };

  const handleLoadExample = useCallback(() => {
    setInput('02003220000000000000000000000000000000000123456789012345673001010A5DF3F8E698765432109876543211234567890123456');
    setInputFormat('hex');
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setParsedResult(null);
    setShowRaw(false);
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          ISO 8583 Message Parser
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Parse ISO 8583 payment messages with field descriptions
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">
            ISO 8583 Message
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="radio"
                checked={inputFormat === 'hex'}
                onChange={() => setInputFormat('hex')}
                className="w-3 h-3"
              />
              Hex
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="radio"
                checked={inputFormat === 'ascii'}
                onChange={() => setInputFormat('ascii')}
                className="w-3 h-3"
              />
              ASCII
            </label>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={inputFormat === 'hex' ? '0200322000000000000000000000...' : 'Enter ASCII message'}
          className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[100px]"
          rows={5}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleParse}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
        >
          Parse Message
        </button>
        <button
          onClick={handleLoadExample}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
        >
          Load Example
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
        >
          Clear
        </button>
      </div>

      {/* Parse Result */}
      {parsedResult && (
        <div className="space-y-4">
          {/* Error Display */}
          {parsedResult.error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{parsedResult.error}</p>
            </div>
          )}

          {/* MTI Display */}
          {parsedResult.mti && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wide">Message Type Indicator</label>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">{parsedResult.mti}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 dark:text-blue-400">{parsedResult.fields[0]?.description || ''}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bitmap Display */}
          {parsedResult.primaryBitmap && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bitmap</label>
                <span className="text-xs text-slate-500 dark:text-zinc-500">
                  {parsedResult.presentFields.length - 1} fields present
                </span>
              </div>

              {/* Primary Bitmap */}
              <div className="mb-2">
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-1">Primary:</p>
                <p className="font-mono text-sm text-slate-800 dark:text-slate-200">
                  {parsedResult.primaryBitmap.match(/.{1,2}/g)?.join(' ') || parsedResult.primaryBitmap}
                </p>
              </div>

              {/* Secondary Bitmap */}
              {parsedResult.secondaryBitmap && (
                <div className="mb-2">
                  <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-1">Secondary:</p>
                  <p className="font-mono text-sm text-slate-800 dark:text-slate-200">
                    {parsedResult.secondaryBitmap.match(/.{1,2}/g)?.join(' ') || parsedResult.secondaryBitmap}
                  </p>
                </div>
              )}

              {/* Present Fields */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-2">Present Fields:</p>
                <div className="flex flex-wrap gap-1">
                  {parsedResult.presentFields.filter(f => f !== 1).map(field => (
                    <span
                      key={field}
                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded font-mono"
                    >
                      [{String(field).padStart(3, '0')}]
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fields Display */}
          {parsedResult.fields && Object.keys(parsedResult.fields).length > 1 && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data Fields</label>
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showRaw ? 'Hide Raw' : 'Show Raw'}
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.entries(parsedResult.fields)
                  .filter(([key]) => key !== '0')
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([fieldNum, field]: [string, any]) => {
                    const num = parseInt(fieldNum);
                    return (
                      <div
                        key={fieldNum}
                        className="p-2 bg-white dark:bg-black rounded border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                [{String(num).padStart(3, '0')}]
                              </span>
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {field.description || ISO8583_FIELDS[num]?.name || 'Reserved'}
                              </span>
                            </div>
                            {showRaw && field.raw && (
                              <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono mb-1">
                                Raw: {field.raw}
                              </p>
                            )}
                            <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all">
                              {field.value || '<empty>'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Raw Message Toggle */}
          {parsedResult.raw && (
            <details className="group">
              <summary className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 mb-2">
                Raw Hex Message ▼
              </summary>
              <div className="p-3 bg-slate-900 dark:bg-black rounded border border-slate-700 dark:border-zinc-800">
                <p className="font-mono text-xs text-green-400 break-all">
                  {parsedResult.raw}
                </p>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default Iso8583Parser;
