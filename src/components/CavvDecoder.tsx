import { useCallback, useMemo, useState } from 'react';

interface CavvField {
  name: string;
  value: string;
  description: string;
  bits?: number;
  startIndex?: number;
  endIndex?: number;
}

interface CavvDecodeResult {
  rawValue: string;
  isValid: boolean;
  algorithm: string;
  length: number;
  fields: CavvField[];
  summary: string;
  rawData: string;
}

const CavvDecoder = ({ className = '' }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<CavvDecodeResult | null>(null);
  const [error, setError] = useState('');

  // CAVV Algorithm definitions
  const ALGORITHM_DEFINITIONS: Record<string, string> = {
    '00': 'Reserved',
    '01': 'DVV (Dynamic Data Authentication) - EMV-CAP',
    '02': 'ACS generated CAVV (3D Secure v1.0)',
    '03': 'Merchant plug-in (MPI) generated CAVV (3D Secure v1.0)',
    '04': 'EMV Contactless CAVV (Contactless EMV)',
    '10': 'Visa dCVV (Dynamic Card Verification)',
    '11': 'UDF (User Defined Field)',
    '12': 'ACS generated CAVV (3D Secure v2.0/v2.1)',
    '13': 'ACS generated CAVV (3D Secure v2.2)',
    '14': 'ACS generated CAVV (3D Secure v2.3)',
  };

  // Decode CAVV from hex
  const decodeCavv = useCallback((hex: string): CavvDecodeResult => {
    const cleanHex = hex.replace(/\s/g, '').toUpperCase();

    if (!cleanHex || !/^[0-9A-F]*$/.test(cleanHex)) {
      return {
        rawValue: cleanHex,
        isValid: false,
        algorithm: 'Invalid',
        length: 0,
        fields: [],
        summary: 'Invalid hexadecimal input',
        rawData: cleanHex,
      };
    }

    if (cleanHex.length < 40 || cleanHex.length > 80) {
      return {
        rawValue: cleanHex,
        isValid: false,
        algorithm: 'Invalid',
        length: cleanHex.length / 2,
        fields: [],
        summary: `Invalid CAVV length (${cleanHex.length / 2} bytes). Expected 20-40 bytes.`,
        rawData: cleanHex,
      };
    }

    // Parse first byte for algorithm and length indicator
    const firstByte = cleanHex.substring(0, 2);
    const firstByteBits = parseInt(firstByte, 16).toString(2).padStart(8, '0');

    // Extract algorithm (bits 0-1) and length info (bits 2-7)
    const algoBits = firstByteBits.substring(6, 8);
    const lengthBits = firstByteBits.substring(0, 6);
    const algoCode = parseInt(algoBits, 2).toString(16).padStart(2, '0');
    const lengthIndicator = parseInt(lengthBits, 2);

    const algorithm = ALGORITHM_DEFINITIONS[algoCode] || `Unknown (0x${algoCode})`;

    // Parse CAVV data structure
    const fields: CavvField[] = [];
    let pos = 0;

    // Field 1: Algorithm and Length (1 byte)
    fields.push({
      name: 'Control Byte',
      value: firstByte,
      description: `Algorithm: ${algoCode} (${algorithm}), Length indicator: ${lengthIndicator}`,
      bits: 8,
      startIndex: 0,
      endIndex: 2,
    });
    pos += 2;

    // Field : CAVV Data / Authentication Data (variable, typically 8-20 bytes)
    const cavvDataLength = Math.min((lengthIndicator * 2) || 16, cleanHex.length - pos);
    if (cavvDataLength > 0) {
      const cavvData = cleanHex.substring(pos, pos + cavvDataLength);
      fields.push({
        name: 'CAVV Data / Authentication Data',
        value: cavvData,
        description: `Cryptographic value (${cavvDataLength / 2} bytes)`,
        startIndex: pos,
        endIndex: pos + cavvDataLength,
      });
      pos += cavvDataLength;
    }

    // Field 3: Cardholder Authentication Verification Value (8 bytes typical)
    if (pos + 16 <= cleanHex.length) {
      const cavvValue = cleanHex.substring(pos, pos + 16);
      fields.push({
        name: 'CAVV Value',
        value: cavvValue,
        description: 'Primary CAVV cryptographic value (8 bytes)',
        startIndex: pos,
        endIndex: pos + 16,
      });
      pos += 16;
    }

    // Field 4: Additional Data (remaining bytes)
    if (pos < cleanHex.length) {
      const additionalData = cleanHex.substring(pos);
      fields.push({
        name: 'Additional Data',
        value: additionalData,
        description: `Additional authentication data (${additionalData.length / 2} bytes)`,
        startIndex: pos,
        endIndex: cleanHex.length,
      });
    }

    // Determine summary
    let summary = '';
    if (algoCode === '00') {
      summary = 'Reserved CAVV value - not for production use';
    } else if (algoCode === '12' || algoCode === '13' || algoCode === '14') {
      summary = `3D Secure v2 CAVV (${algoCode === '12' ? 'v2.0/v2.1' : algoCode === '13' ? 'v2.2' : 'v2.3'}) - ACS generated`;
    } else if (algoCode === '02' || algoCode === '03') {
      summary = `3D Secure v1.0 CAVV (${algoCode === '02' ? 'ACS' : 'MPI'} generated)`;
    } else if (algoCode === '04') {
      summary = 'EMV Contactless CAVV for contactless transactions';
    } else if (algoCode === '10') {
      summary = 'Visa dCVV (Dynamic Card Verification Value)';
    } else {
      summary = `CAVV with algorithm: ${algorithm}`;
    }

    return {
      rawValue: cleanHex,
      isValid: true,
      algorithm,
      length: cleanHex.length / 2,
      fields,
      summary,
      rawData: cleanHex,
    };
  }, []);

  const handleDecode = useCallback(() => {
    try {
      setError('');
      if (!input.trim()) {
        setResult(null);
        return;
      }
      const decoded = decodeCavv(input);
      if (!decoded.isValid) {
        setError(decoded.summary);
        setResult(null);
      } else {
        setResult(decoded);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode CAVV');
      setResult(null);
    }
  }, [input, decodeCavv]);

  const handleExample = useCallback(() => {
    // Example CAVV values for different algorithms
    const examples = [
      'AAABBBCCCDDDDEEEEFFFFGGGGHHHHIIJJ', // Generic example
      '0212345678ABCDEF0123456789ABCDEF', // 3DS v1.0 ACS generated
      '12A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5', // 3DS v2.0 ACS generated
    ];
    setInput(examples[Math.floor(Math.random() * examples.length)]);
    setError('');
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    setError('');
  }, []);

  // Format hex for display (with spaces)
  const formatHexDisplay = useCallback((hex: string) => {
    return hex.match(/.{1,2}/g)?.join(' ') || hex;
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 md:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-1.5">
          CAVV Decoder
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Decode Cardholder Authentication Verification Value (CAVV) used in 3D Secure and EMV transactions
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
          CAVV Value (Hex)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter CAVV hex value (e.g., 0212345678ABCDEF...)"
          className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          rows={3}
        />
        {error && (
          <div className="mt-2 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={handleDecode}
          className="px-3 sm:px-4 py-2.5 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors active:scale-[0.98]"
        >
          Decode CAVV
        </button>
        <button
          onClick={handleExample}
          className="px-3 sm:px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs sm:text-sm transition-colors"
        >
          Load Example
        </button>
        <button
          onClick={handleClear}
          className="px-3 sm:px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs sm:text-sm transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Summary</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Algorithm</span>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{result.algorithm}</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Length</span>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{result.length} bytes ({result.length * 2} hex chars)</div>
                </div>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <p className="text-xs text-blue-800 dark:text-blue-200">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Raw Value */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Raw CAVV Value</h3>
            <pre className="font-mono text-[10px] sm:text-xs text-slate-800 dark:text-slate-200 break-all bg-white dark:bg-zinc-800 p-2 rounded border border-slate-200 dark:border-zinc-700">
              {formatHexDisplay(result.rawValue)}
            </pre>
          </div>

          {/* Decoded Fields */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Decoded Fields</h3>
            <div className="space-y-2">
              {result.fields.map((field, index) => (
                <div
                  key={index}
                  className="p-2 sm:p-3 bg-white dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{field.name}</h4>
                    {field.bits && (
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500">{field.bits} bits</span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 mb-1 break-all">
                    {formatHexDisplay(field.value)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">{field.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Algorithm Reference */}
          <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Algorithm Reference</h3>
            <div className="space-y-1 text-[10px] sm:text-xs text-amber-700 dark:text-amber-300">
              <div><span className="font-mono">00</span> - Reserved</div>
              <div><span className="font-mono">01</span> - DVV (EMV-CAP)</div>
              <div><span className="font-mono">02</span> - 3DS v1.0 ACS generated</div>
              <div><span className="font-mono">03</span> - 3DS v1.0 MPI generated</div>
              <div><span className="font-mono">04</span> - EMV Contactless</div>
              <div><span className="font-mono">10</span> - Visa dCVV</div>
              <div><span className="font-mono">12-14</span> - 3DS v2.0/v2.1/v2.2/v2.3</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CavvDecoder;
