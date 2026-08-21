import CryptoJS from 'crypto-js';
import { useCallback, useState } from 'react';

interface VisaPVVResult {
  pan: string;
  pin: string;
  pinLength: number;
  pvk: string;
  pvkIndex: string;
  tsp: string;
  encryptedResult: string;
  decimalized: string;
  pvv: string;
}

// EMV Test Keys from IssuerEmvTestKeys component
interface EmvTestKey {
  issuer: string;
  cardName: string;
  authKey: string;
  macKey: string;
  dataKey: string;
}

const EMV_TEST_KEYS: EmvTestKey[] = [
  {
    issuer: 'MasterCard',
    cardName: 'MTIP Test',
    authKey: '9E15204313F7318ACB79B90BD986AD29',
    macKey: '4664942FE615FB02E5D57F292AA2B3B6',
    dataKey: 'CE293B8CC12A977379EF256D76109492'
  },
  {
    issuer: 'VISA',
    cardName: 'ADVT Test',
    authKey: '2315208C9110AD402315208C9110AD40',
    macKey: '2315208C9110AD402315208C9110AD40',
    dataKey: '2315208C9110AD402315208C9110AD40'
  }
];

const VisaPVV = ({ className = '' }: { className?: string }) => {
  const [pan, setPan] = useState('');
  const [pin, setPin] = useState('');
  const [pvk, setPvk] = useState('');
  const [pvkIndex, setPvkIndex] = useState('000001');
  const [selectedTestKey, setSelectedTestKey] = useState('');
  const [result, setResult] = useState<VisaPVVResult | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Visa PVV Calculation
  const calculateVisaPVV = useCallback(() => {
    try {
      setError('');
      setResult(null);
      setShowDetails(false);

      // Validate and clean inputs
      const cleanPan = pan.replace(/\s/g, '');
      const cleanPin = pin.replace(/\s/g, '');
      const cleanPvk = pvk.replace(/\s/g, '').toUpperCase();
      const cleanPvkIndex = pvkIndex.replace(/\s/g, '').toUpperCase();

      if (!cleanPan || cleanPan.length < 13 || cleanPan.length > 19) {
        throw new Error('Invalid PAN (must be 13-19 digits)');
      }
      if (!/^\d+$/.test(cleanPan)) {
        throw new Error('PAN must contain only digits');
      }
      if (!cleanPin || cleanPin.length < 4 || cleanPin.length > 12) {
        throw new Error('PIN must be 4-12 digits');
      }
      if (!cleanPvk || cleanPvk.length !== 32) {
        throw new Error('PVK must be 32 hex characters');
      }
      if (!/^[0-9A-F]+$/.test(cleanPvk)) {
        throw new Error('PVK must contain only hex characters (0-9, A-F)');
      }
      // Accept either 1 hex digit (PVKI) or 6 hex characters (full PVK index)
      if (!cleanPvkIndex || (cleanPvkIndex.length !== 1 && cleanPvkIndex.length !== 6)) {
        throw new Error('PVK Index must be 1 or 6 hex characters');
      }
      if (!/^[0-9A-F]+$/.test(cleanPvkIndex)) {
        throw new Error('PVK Index must contain only hex characters (0-9, A-F)');
      }
      // Normalize to 6 characters internally (pad with leading zeros if needed)
      const normalizedPvkIndex = cleanPvkIndex.length === 1 ? '00000' + cleanPvkIndex : cleanPvkIndex;

      // Step 1: Build Transformed Security Parameter (TSP)
      // Visa PVV Format: PVKI (1 nibble) + PIN length (1 nibble) + PIN (up to 12 nibbles) + 11 rightmost PAN digits
      // Total: 64 bits (16 nibbles)
      const panWithoutCheck = cleanPan.slice(0, -1); // Remove check digit
      let panRight11: string;
      if (panWithoutCheck.length > 16) {
        // For longer PANs, exclude leftmost 2 digits, then take rightmost 11 of remaining
        const panWithoutLeftmost2 = panWithoutCheck.slice(2); // Skip first 2 digits
        panRight11 = panWithoutLeftmost2.slice(-11).padStart(11, '0');
      } else {
        panRight11 = panWithoutCheck.slice(-11).padStart(11, '0'); // Rightmost 11 digits
      }
      const pvki = normalizedPvkIndex.slice(-1); // Last 1 digit of PVK index (1 nibble)

      // Build TSP (64 bits / 16 nibbles) = 11 PAN digits + PVKI + PIN length + PIN
      // Alternative Visa PVV format: PAN (11 nibbles) + PVKI (1 nibble) + PIN length (1 nibble) + PIN (up to 12 nibbles)
      const pinLengthNibble = (cleanPin.length * 2).toString(16).toUpperCase();
      // Combine: PAN (11 nibbles) + PVKI (1 nibble) + PIN length (1 nibble) + PIN (4 nibbles)
      const tspData = panRight11 + pvki + pinLengthNibble + cleanPin;
      const tspHex = tspData.substring(0, 16); // Take first 16 nibbles (64 bits)

      // Step 2: Encrypt TSP with PVK using Triple DES (2-key) in ECB mode
      const tspDataForEncrypt = CryptoJS.enc.Hex.parse(tspHex);
      const pvkKey = CryptoJS.enc.Hex.parse(cleanPvk);

      const encrypted = CryptoJS.TripleDES.encrypt(tspDataForEncrypt, pvkKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
      });

      const encryptedResult = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();

      // Step 3: Decimalize the encrypted result
      // Decimalization table (BP tool method): 0-9 map to 0-9, A-F all map to 0
      const decimalize = (hex: string): string => {
        const table: Record<string, string> = {
          '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
          '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
          'A': '0', 'B': '0', 'C': '0', 'D': '0', 'E': '0', 'F': '0'
        };
        return hex.split('').map(c => table[c] || '0').join('');
      };

      const decimalized = decimalize(encryptedResult);

      // Step 4: Extract first 4 digits as PVV
      const pvvDigits = decimalized.substring(0, 4);

      setResult({
        pan: cleanPan,
        pin: '•'.repeat(cleanPin.length),
        pinLength: cleanPin.length,
        pvk: cleanPvk,
        pvkIndex: normalizedPvkIndex,
        tsp: tspHex,
        encryptedResult,
        decimalized,
        pvv: pvvDigits,
      });
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    }
  }, [pan, pin, pvk, pvkIndex]);

  const handleLoadExample = useCallback(() => {
    setPan('4929740000000003');
    setPin('1234');
    setPvk('0123456789ABCDEF0123456789ABCDEF');
    setPvkIndex('000001');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const handleClear = useCallback(() => {
    setPan('');
    setPin('');
    setPvk('');
    setPvkIndex('000001');
    setSelectedTestKey('');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const handleSelectTestKey = useCallback((value: string) => {
    setSelectedTestKey(value);
    if (value === 'none') {
      setPvk('');
      return;
    }

    const [issuerIndex, keyType] = value.split('-');
    const index = parseInt(issuerIndex);
    const testKey = EMV_TEST_KEYS[index];

    if (testKey) {
      // Use the selected key type (auth, mac, or data)
      if (keyType === 'auth') {
        setPvk(testKey.authKey);
      } else if (keyType === 'mac') {
        setPvk(testKey.macKey);
      } else if (keyType === 'data') {
        setPvk(testKey.dataKey);
      }
    }
  }, []);

  const formatPan = (value) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatPvk = (value) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.replace(/(.{8})/g, '$1 ').trim();
  };

  const formatHex = (hex) => {
    return hex.replace(/(.{2})/g, '0x$1 ').trim();
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Visa PVV Calculator
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Calculate Visa PIN Verification Value (PVV) using PVK
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
          {/* PAN Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              PAN (Card Number) - 13 to 19 digits
            </label>
            <input
              type="text"
              value={pan}
              onChange={(e) => setPan(formatPan(e.target.value))}
              placeholder="4929 7400 0000 0003"
              maxLength={23}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              maxLength={12}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* PVK Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">
                PVK (32 hex characters)
              </label>
              <span className="text-xs text-blue-600 dark:text-blue-400">🔐 Quick Select</span>
            </div>
            <input
              type="text"
              value={pvk}
              onChange={(e) => setPvk(formatPvk(e.target.value))}
              placeholder="01234567 89ABCDEF 01234567 89ABCDEF"
              maxLength={35}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs tracking-wider bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            {/* EMV Test Keys Quick Select */}
            <div className="mt-2">
              <select
                value={selectedTestKey}
                onChange={(e) => handleSelectTestKey(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300"
              >
                <option value="">Select from EMV Test Keys...</option>
                <option value="none">— Clear Selection —</option>
                <optgroup label="MasterCard MTIP Test">
                  <option value="0-auth">Auth Key (9E152043...)</option>
                  <option value="0-mac">MAC Key (4664942F...)</option>
                  <option value="0-data">Data Key (CE293B8C...)</option>
                </optgroup>
                <optgroup label="VISA ADVT Test">
                  <option value="1-auth">Auth Key (2315208C...)</option>
                  <option value="1-mac">MAC Key (2315208C...)</option>
                  <option value="1-data">Data Key (2315208C...)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* PVK Index Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              PVK Index (6 hex characters)
            </label>
            <input
              type="text"
              value={pvkIndex}
              onChange={(e) => setPvkIndex(e.target.value.replace(/\s/g, '').toUpperCase())}
              placeholder="000001"
              maxLength={6}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Right Column - Result */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* PVV Result - Main Result */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg">
                <label className="block text-purple-700 dark:text-purple-300 text-sm font-medium mb-2">
                  PVV (PIN Verification Value)
                </label>
                <div className="font-mono text-3xl font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                  {result.pvv}
                </div>
              </div>

              {/* TSP */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  Transformed Security Parameter (TSP)
                </label>
                <div className="font-mono text-sm text-slate-600 dark:text-slate-400 break-all tracking-wider">
                  {result.tsp}
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
          <h3 className="text-sm font-bold text-slate-300 dark:text-slate-200 mb-4">Visa PVV Calculation Process:</h3>

          <div className="space-y-4 text-xs">
            {/* Step 1: Build TSP */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 1: Build Transformed Security Parameter (TSP)</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>Format: 11 PAN digits + PVKI (1 nibble) + PIN Length (1 nibble) + PIN</div>
                <div>11 rightmost PAN: <span className="text-yellow-400">{result.pan.slice(0, -1).slice(-11)}</span></div>
                <div>PVKI: <span className="text-yellow-400">{result.pvkIndex.substring(4)}</span></div>
                <div>PIN Length: <span className="text-yellow-400">0x{(result.pinLength * 2).toString(16).toUpperCase()}</span></div>
                <div>PIN: <span className="text-yellow-400">{'•'.repeat(result.pinLength)}</span></div>
                <div>TSP: <span className="text-green-400">{formatHex(result.tsp)}</span></div>
              </div>
            </div>

            {/* Step 2: Encrypt */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 2: Encrypt TSP with PVK (Triple DES ECB)</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>TSP: <span className="text-white">{result.tsp}</span></div>
                <div>PVK: <span className="text-white">{result.pvk}</span></div>
                <div className="text-green-500 font-bold">Result: {result.encryptedResult}</div>
              </div>
            </div>

            {/* Step 3: Decimalize */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 3: Decimalize (A-F → 0)</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>Encrypted: <span className="text-white">{result.encryptedResult}</span></div>
                <div className="text-green-400">Decimalized: {result.decimalized}</div>
              </div>
            </div>

            {/* Step 4: Extract PVV */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 4: Extract PVV (First 4 decimal digits)</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>Decimalized: <span className="text-white">{result.decimalized}</span></div>
                <div>PVV: <span className="text-purple-400 font-bold">{result.pvv}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculateVisaPVV}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Calculate PVV
        </button>
        <button
          onClick={handleLoadExample}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Load Example
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default VisaPVV;
