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

  const AUTHENTICATION_RESULT_CODES: Record<string, string> = {
    '00': 'Authentication Successful',
    '01': 'Authentication Failed',
    '02': 'Authentication Could Not Be Performed',
    '03': 'Authentication Attempted',
    '04': 'Authentication Not Available',
    '05': 'Authentication Rejected',
    '06': 'Authentication Error',
    '07': 'Authentication Bypassed',
  };

  const AUTHENTICATION_METHODS: Record<string, string> = {
    '01': 'Static password',
    '02': 'Dynamic password',
    '03': 'Challenge flow using OTP',
    '04': 'Challenge flow using KBA',
    '05': 'Challenge flow using OOB',
    '06': 'Challenge flow using biometric',
    '07': 'Challenge flow using app login',
    '08': 'Challenge flow using OOB with App login method',
  };

  const CAVV_KEY_INDICATORS: Record<string, string> = {
    '00': 'Issuer CAVV Key Set and/or attempts Key Set 0',
    '01': 'Issuer CAVV Key Set and/or attempts Key Set 1',
    '02': 'Issuer CAVV Key Set and/or attempts Key Set 2',
    '03': 'Issuer CAVV Key Set and/or attempts Key Set 3',
  };

  const CAVV_VERSIONS: Record<string, string> = {
    '0': 'CAVV without Supplemental Data',
    '1': 'CAVV with Authentication Tracking Number',
    '2': 'CAVV with ACS Transaction ID',
    '7': 'CAVV with Supplemental Data',
  };

  const THREE_DS_PROTOCOL_VERSIONS: Record<string, string> = {
    '1': '3-D Secure 1.x',
    '2': 'EMV 3DS 2.0.x',
    '4': 'EMV 3DS 2.1.x',
    '5': 'EMV 3DS 2.2.x',
    '6': 'EMV 3DS 2.3.x',
  };

  const CURRENCY_CODES: Record<string, string> = {
    '840': 'US Dollar',
    '978': 'Euro',
    '826': 'Pound Sterling',
    '392': 'Japanese Yen',
    '050': 'Taka',
  };

  const formatDayOfYear = (dayValue: string) => {
    const dayNumber = Number(dayValue);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 366) {
      return dayValue;
    }

    const date = new Date(Date.UTC(2025, 0, dayNumber));
    return `${dayValue} (${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })})`;
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

    if (cleanHex.length !== 40) {
      return {
        rawValue: cleanHex,
        isValid: false,
        algorithm: 'Invalid',
        length: cleanHex.length / 2,
        fields: [],
        summary: `Invalid CAVV length (${cleanHex.length / 2} bytes). Expected 20 bytes (40 hex characters).`,
        rawData: cleanHex,
      };
    }

    const fields: CavvField[] = [];
    const addField = (name: string, start: number, length: number, description: string, bits?: number) => {
      fields.push({
        name,
        value: cleanHex.substring(start, start + length),
        description,
        bits,
        startIndex: start,
        endIndex: start + length,
      });
    };

    const authResultCode = cleanHex.substring(0, 2);
    const authenticationMethod = cleanHex.substring(2, 4);
    const keyIndicator = cleanHex.substring(4, 6);
    const supplementaryData = cleanHex.substring(14, 30);
    const versionAndAction = cleanHex.substring(30, 32);
    const informationalData = cleanHex.substring(32, 40);

    const authAmountMinor = parseInt(supplementaryData.substring(0, 10), 16);
    const authAmount = Number.isNaN(authAmountMinor) ? 'Unknown' : (authAmountMinor / 100).toFixed(2);
    const currencyCode = supplementaryData.substring(10, 13);
    const dayOfYear = supplementaryData.substring(13, 16);
    const cavvVersion = versionAndAction.substring(0, 1);
    const authenticationAction = versionAndAction.substring(1, 2);
    const ipAddress = informationalData.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)).join('.');

    addField(
      '3-D Secure Authentication Results Codes',
      0,
      2,
      AUTHENTICATION_RESULT_CODES[authResultCode] || `Unknown authentication result code (${authResultCode})`,
      8
    );
    addField(
      'Authentication Method',
      2,
      2,
      AUTHENTICATION_METHODS[authenticationMethod] || `Unknown authentication method (${authenticationMethod})`,
      8
    );
    addField(
      'CAVV Key Indicator',
      4,
      2,
      CAVV_KEY_INDICATORS[keyIndicator] || `Issuer CAVV Key Set and/or attempts Key Set ${keyIndicator}`,
      8
    );
    addField('CAVV Value', 6, 4, 'Cardholder Authentication Verification Value', 16);
    addField('Seed Value', 10, 4, 'Seed value used for CAVV validation', 16);
    addField(
      'Supplementary Data',
      14,
      16,
      `Authentication Amount: ${authAmount}; Currency Code: ${currencyCode}${CURRENCY_CODES[currencyCode] ? ` (${CURRENCY_CODES[currencyCode]})` : ''}; Date (DDD value): ${formatDayOfYear(dayOfYear)}`,
      64
    );
    addField(
      'CAVV Version and Authentication Action',
      30,
      2,
      `CAVV Version: ${cavvVersion} - ${CAVV_VERSIONS[cavvVersion] || 'Unknown'}; 3DS Protocol Version: ${THREE_DS_PROTOCOL_VERSIONS[authenticationAction] || `Unknown (${authenticationAction})`}`,
      8
    );
    addField(
      'Informational Data',
      32,
      8,
      `Merchant Identifier OR IP address: ${ipAddress || informationalData}`,
      32
    );

    const algorithm = CAVV_VERSIONS[cavvVersion] || `Unknown CAVV version (${cavvVersion})`;
    const summary = `${AUTHENTICATION_RESULT_CODES[authResultCode] || 'Authentication result decoded'}; ${THREE_DS_PROTOCOL_VERSIONS[authenticationAction] || '3DS protocol version decoded'}`;

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
    const examples = [
      '000802012345670000001109978258747F000001',
      '00080289ABCDEF0000001109978258747F000001',
      '0305011234567800000003E8978258740A000001',
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
            <h3 className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">CAVV Field Reference</h3>
            <div className="space-y-1 text-[10px] sm:text-xs text-amber-700 dark:text-amber-300">
              <div><span className="font-mono">1 byte</span> - 3-D Secure authentication result code</div>
              <div><span className="font-mono">1 byte</span> - Authentication method</div>
              <div><span className="font-mono">1 byte</span> - CAVV key indicator</div>
              <div><span className="font-mono">2 bytes</span> - CAVV value</div>
              <div><span className="font-mono">2 bytes</span> - Seed value</div>
              <div><span className="font-mono">8 bytes</span> - Supplementary amount, currency, and date data</div>
              <div><span className="font-mono">1 byte</span> - CAVV version and authentication action</div>
              <div><span className="font-mono">4 bytes</span> - Merchant identifier or IP address</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CavvDecoder;
