import CryptoJS from 'crypto-js';
import { useCallback, useState } from 'react';

interface CVVResult {
  pan: string;
  expiry: string;
  serviceCode: string;
  cvk: string;
  cvvType: 'CVV' | 'CVV2' | 'CVC' | 'iCAVV';
  inputData: string;
  encryptedResult: string;
  decimalized: string;
  cvv: string;
}

const CvvCalculator = ({ className = '' }: { className?: string }) => {
  const [pan, setPan] = useState('');
  const [expiry, setExpiry] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [cvk, setCvk] = useState('');
  const [cvvType, setCvvType] = useState<'CVV' | 'CVV2' | 'CVC' | 'iCAVV'>('CVV');
  const [result, setResult] = useState<CVVResult | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // CVV Calculation
  const calculateCVV = useCallback(() => {
    try {
      setError('');
      setResult(null);
      setShowDetails(false);

      // Validate and clean inputs
      const cleanPan = pan.replace(/\s/g, '');
      const cleanExpiry = expiry.replace(/\s/g, '');
      const cleanServiceCode = serviceCode.replace(/\s/g, '');
      const cleanCvk = cvk.replace(/\s/g, '').toUpperCase();

      if (!cleanPan || cleanPan.length < 13 || cleanPan.length > 19) {
        throw new Error('Invalid PAN (must be 13-19 digits)');
      }
      if (!/^\d+$/.test(cleanPan)) {
        throw new Error('PAN must contain only digits');
      }
      if (!cleanExpiry || cleanExpiry.length !== 4) {
        throw new Error('Expiry must be 4 digits (YYMM)');
      }
      if (!/^\d+$/.test(cleanExpiry)) {
        throw new Error('Expiry must contain only digits');
      }
      if (!cleanServiceCode || cleanServiceCode.length !== 3) {
        throw new Error('Service Code must be 3 digits');
      }
      if (!cleanCvk || (cleanCvk.length !== 32 && cleanCvk.length !== 16)) {
        throw new Error('CVK must be 16 or 32 hex characters');
      }
      if (!/^[0-9A-F]+$/.test(cleanCvk)) {
        throw new Error('CVK must contain only hex characters (0-9, A-F)');
      }

      // Step 1: Build input data for CVV calculation
      // Format: PAN (excluding check digit) + Expiry + Service Code
      const panWithoutCheck = cleanPan.slice(0, -1); // Remove check digit
      // Pad to maximum length and take rightmost N characters
      const maxInputLength = cvvType === 'iCAVV' ? 24 : 32;
      let inputData = panWithoutCheck + cleanExpiry + cleanServiceCode;

      // Pad with zeros to reach the required length
      while (inputData.length < maxInputLength) {
        inputData += '0';
      }

      // Take the rightmost characters (32 for CVV/CVV2/CVC, 24 for iCAVV)
      const inputDataBlock = inputData.slice(-maxInputLength);

      // Convert to hex (each digit becomes a nibble)
      const inputDataHex = inputDataBlock.split('').map(d => parseInt(d, 16).toString(16).toUpperCase()).join('');

      // Step 2: Encrypt with CVK using Triple DES (2-key) in ECB mode
      const inputDataForEncrypt = CryptoJS.enc.Hex.parse(inputDataHex);
      const cvkKey = CryptoJS.enc.Hex.parse(cleanCvk.padEnd(32, '0'));

      const encrypted = CryptoJS.TripleDES.encrypt(inputDataForEncrypt, cvkKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
      });

      const encryptedResult = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();

      // Step 3: Decimalize the encrypted result
      // Decimalization table: 0-9 map to 0-9, A-F map to 0-5
      const decimalize = (hex: string): string => {
        const table: Record<string, string> = {
          '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
          '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
          'A': '0', 'B': '1', 'C': '2', 'D': '3', 'E': '4', 'F': '5'
        };
        return hex.split('').map(c => table[c] || '0').join('');
      };

      const decimalized = decimalize(encryptedResult);

      // Step 4: Extract CVV digits (3 for most, 4 for some types)
      const cvvLength = cvvType === 'CVC' ? 4 : 3;
      const cvvDigits = decimalized.substring(0, cvvLength);

      setResult({
        pan: cleanPan,
        expiry: cleanExpiry,
        serviceCode: cleanServiceCode,
        cvk: cleanCvk,
        cvvType,
        inputData: inputDataBlock,
        encryptedResult,
        decimalized,
        cvv: cvvDigits,
      });
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    }
  }, [pan, expiry, serviceCode, cvk, cvvType]);

  const handleLoadExample = useCallback(() => {
    setPan('4929740000000003');
    setExpiry('2512');
    setServiceCode('101');
    setCvk('0123456789ABCDEF0123456789ABCDEF');
    setCvvType('CVV');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const handleClear = useCallback(() => {
    setPan('');
    setExpiry('');
    setServiceCode('');
    setCvk('');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const formatPan = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return cleaned.substring(0, 2) + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const formatCvk = (value: string) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.replace(/(.{8})/g, '$1 ').trim();
  };

  const formatHex = (hex: string) => {
    return hex.replace(/(.{2})/g, '0x$1 ').trim();
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          CVV/CVC Calculator
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Calculate Card Verification Value (CVV/CVC) using CVK
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Inputs */}
        <div className="space-y-4">
          {/* CVV Type Selection */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              CVV Type
            </label>
            <select
              value={cvvType}
              onChange={(e) => setCvvType(e.target.value as 'CVV' | 'CVV2' | 'CVC' | 'iCAVV')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100"
            >
              <option value="CVV">CVV (Track 1)</option>
              <option value="CVV2">CVV2 (Track 2)</option>
              <option value="CVC">CVC (4 digits)</option>
              <option value="iCAVV">iCAVV (EMV)</option>
            </select>
          </div>

          {/* PAN Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              PAN (Card Number)
            </label>
            <input
              type="text"
              value={pan}
              onChange={(e) => setPan(formatPan(e.target.value))}
              placeholder="4929 7400 0000 0003"
              maxLength={19}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Expiry Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              Expiry Date (YYMM)
            </label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="2512"
              maxLength={4}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Service Code Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              Service Code (3 digits)
            </label>
            <input
              type="text"
              value={serviceCode}
              onChange={(e) => setServiceCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="101"
              maxLength={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* CVK Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              CVK (16 or 32 hex characters)
            </label>
            <input
              type="text"
              value={cvk}
              onChange={(e) => setCvk(formatCvk(e.target.value))}
              placeholder="01234567 89ABCDEF 01234567 89ABCDEF"
              maxLength={35}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs tracking-wider bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Right Column - Result */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* CVV Result - Main Result */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-lg">
                <label className="block text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-2">
                  {result.cvvType} (Card Verification Value)
                </label>
                <div className="font-mono text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                  {result.cvv}
                </div>
              </div>

              {/* Input Data */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  Input Data (PAN + Expiry + Service Code)
                </label>
                <div className="font-mono text-sm text-slate-600 dark:text-slate-400 break-all tracking-wider">
                  {result.inputData}
                </div>
              </div>

              {/* Encrypted Result */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  Encrypted Result (Hex)
                </label>
                <div className="font-mono text-sm text-slate-600 dark:text-slate-400 break-all tracking-wider">
                  {result.encryptedResult}
                </div>
              </div>

              {/* Toggle Details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {showDetails ? '▼ Hide' : '▶ Show'} Calculation Details
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[250px] border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-lg">
              <div className="text-center text-slate-400 dark:text-zinc-500">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-sm">Enter values and click Calculate</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calculation Details */}
      {result && showDetails && (
        <div className="mb-6 p-4 bg-slate-900 dark:bg-black border border-slate-700 dark:border-zinc-800 rounded-lg">
          <h3 className="text-sm font-bold text-slate-300 dark:text-slate-200 mb-4">{result.cvvType} Calculation Process:</h3>

          <div className="space-y-4 text-xs">
            {/* Step 1: Build Input Data */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 1: Build Input Data Block</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>Format: PAN (without check digit) + Expiry (YYMM) + Service Code</div>
                <div>PAN: <span className="text-yellow-400">{result.pan.slice(0, -1)}...</span></div>
                <div>Expiry: <span className="text-yellow-400">{result.expiry}</span></div>
                <div>Service Code: <span className="text-yellow-400">{result.serviceCode}</span></div>
                <div>Input Block: <span className="text-green-400">{result.inputData}</span></div>
              </div>
            </div>

            {/* Step 2: Encrypt */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 2: Encrypt with CVK (Triple DES ECB)</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>CVK: <span className="text-white">{result.cvk.substring(0, 16)}...</span></div>
                <div className="text-green-500 font-bold">Result: {result.encryptedResult}</div>
              </div>
            </div>

            {/* Step 3: Decimalize */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 3: Decimalize (A-F → 0-5)</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>Encrypted: <span className="text-white">{result.encryptedResult}</span></div>
                <div className="text-green-400">Decimalized: {result.decimalized}</div>
              </div>
            </div>

            {/* Step 4: Extract CVV */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 4: Extract {result.cvvType} (First {result.cvv.length} decimal digits)</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>Decimalized: <span className="text-white">{result.decimalized}</span></div>
                <div>{result.cvvType}: <span className="text-emerald-400 font-bold">{result.cvv}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculateCVV}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
        >
          Calculate CVV
        </button>
        <button
          onClick={handleLoadExample}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
        >
          Load Example
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default CvvCalculator;
