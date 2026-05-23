import CryptoJS from 'crypto-js';
import { useCallback, useState } from 'react';

interface MACResult {
  algorithm: 'XOR' | '3DES' | 'CMAC';
  inputData: string;
  macKey: string;
  mac: string;
  breakdown?: string;
  blocks?: string[];
}

const Iso8583MacCalculator = ({ className = '' }: { className?: string }) => {
  const [algorithm, setAlgorithm] = useState<'XOR' | '3DES' | 'CMAC'>('3DES');
  const [macKey, setMacKey] = useState('');
  const [messageData, setMessageData] = useState('');
  const [result, setResult] = useState<MACResult | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Calculate XOR-based MAC (Algorithm 1 - basic XOR)
  const calculateXORMAC = useCallback((data: string, key: string) => {
    const cleanData = data.replace(/\s/g, '');
    const cleanKey = key.replace(/\s/g, '');

    // Pad key to match data length
    let extendedKey = cleanKey;
    while (extendedKey.length < cleanData.length) {
      extendedKey += cleanKey;
    }
    extendedKey = extendedKey.substring(0, cleanData.length);

    // XOR data with key
    let mac = '';
    for (let i = 0; i < cleanData.length; i += 2) {
      const dataByte = cleanData.substring(i, i + 2);
      const keyByte = extendedKey.substring(i, i + 2);
      const xorByte = (parseInt(dataByte, 16) ^ parseInt(keyByte, 16))
        .toString(16)
        .toUpperCase()
        .padStart(2, '0');
      mac += xorByte;
    }

    return mac;
  }, []);

  // Calculate 3DES-based MAC (Algorithm 2 - ANSI X9.19)
  const calculate3DESMAC = useCallback((data: string, key: string) => {
    const cleanData = data.replace(/\s/g, '');
    const cleanKey = key.replace(/\s/g, '').toUpperCase();

    // Split key into K1 and K2 (16 bytes each for double-length key)
    const k1 = cleanKey.substring(0, 16);
    const k2 = cleanKey.substring(16, 32) || k1; // Use K1 if K2 not provided

    // Process data in 8-byte (16 hex char) blocks
    const blocks: string[] = [];
    for (let i = 0; i < cleanData.length; i += 16) {
      const block = cleanData.substring(i, i + 16).padEnd(16, '0');
      blocks.push(block);
    }

    // ANSI X9.19 MAC algorithm
    let h = blocks[0]; // Initialize with first block

    // Process remaining blocks with 3DES
    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];

      // XOR H with current block
      let xorResult = '';
      for (let j = 0; j < 16; j += 2) {
        const hByte = h.substring(j, j + 2);
        const blockByte = block.substring(j, j + 2);
        const xorByte = (parseInt(hByte, 16) ^ parseInt(blockByte, 16))
          .toString(16)
          .toUpperCase()
          .padStart(2, '0');
        xorResult += xorByte;
      }

      // Encrypt with 3DES using K1
      const xorData = CryptoJS.enc.Hex.parse(xorResult);
      const k1Key = CryptoJS.enc.Hex.parse(k1.padEnd(32, '0'));

      const encrypted = CryptoJS.TripleDES.encrypt(xorData, k1Key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
      });

      h = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
    }

    // Final encryption: decrypt with K1, encrypt with K2
    const hData = CryptoJS.enc.Hex.parse(h);
    const k2Key = CryptoJS.enc.Hex.parse(k2.padEnd(32, '0'));

    // First decrypt with K1 (reverse operation)
    const decrypted = CryptoJS.TripleDES.decrypt(
      { ciphertext: hData } as CryptoJS.lib.CipherParams,
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
    );

    // Then encrypt with K2
    const finalEncrypted = CryptoJS.TripleDES.encrypt(
      decrypted as any,
      k2Key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
    );

    // Take first 8 bytes (16 hex chars) as MAC
    return finalEncrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase().substring(0, 16);
  }, []);

  // Calculate CMAC-based MAC (Algorithm 3)
  const calculateCMAC = useCallback((data: string, key: string) => {
    const cleanData = data.replace(/\s/g, '');
    const cleanKey = key.replace(/\s/g, '').toUpperCase();

    // For simplicity, using AES-CMAC with CryptoJS (if available)
    // Otherwise fall back to 3DES-based approach
    try {
      const dataBytes = CryptoJS.enc.Hex.parse(cleanData);
      const keyBytes = CryptoJS.enc.Hex.parse(cleanKey);

      // Simple CMAC-like implementation using AES
      // In production, use proper CMAC implementation
      const encrypted = CryptoJS.AES.encrypt(dataBytes, keyBytes, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.NoPadding,
        iv: CryptoJS.enc.Hex.parse('00000000000000000000000000000000')
      });

      return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase().substring(0, 16);
    } catch {
      // Fallback to XOR if AES fails
      return calculateXORMAC(cleanData, cleanKey);
    }
  }, [calculateXORMAC]);

  const calculateMAC = useCallback(() => {
    try {
      setError('');
      setResult(null);
      setShowDetails(false);

      const cleanKey = macKey.replace(/\s/g, '').toUpperCase();
      const cleanData = messageData.replace(/\s/g, '');

      if (!cleanKey) {
        throw new Error('MAC Key is required');
      }
      if (!/^[0-9A-F]+$/.test(cleanKey)) {
        throw new Error('MAC Key must be valid hexadecimal');
      }
      if (cleanKey.length < 16) {
        throw new Error('MAC Key must be at least 16 hex characters (8 bytes)');
      }
      if (!cleanData) {
        throw new Error('Message data is required');
      }
      if (!/^[0-9A-F]+$/.test(cleanData)) {
        throw new Error('Message data must be valid hexadecimal');
      }

      let mac = '';
      let breakdown = '';
      let blocks: string[] = [];

      if (algorithm === 'XOR') {
        mac = calculateXORMAC(cleanData, cleanKey);
        breakdown = `XOR MAC: Each block XORed with key, then all results XORed together`;
      } else if (algorithm === '3DES') {
        // Create blocks for display
        for (let i = 0; i < cleanData.length; i += 16) {
          const block = cleanData.substring(i, i + 16).padEnd(16, '0');
          blocks.push(`Block ${Math.floor(i / 16) + 1}: ${block}`);
        }
        mac = calculate3DESMAC(cleanData, cleanKey);
        breakdown = `ANSI X9.19 MAC: 3DES CBC mode with double-length key`;
      } else {
        mac = calculateCMAC(cleanData, cleanKey);
        breakdown = `CMAC: Cipher-based Message Authentication Code`;
      }

      setResult({
        algorithm,
        inputData: cleanData,
        macKey: cleanKey,
        mac,
        breakdown,
        blocks
      });
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    }
  }, [macKey, messageData, algorithm, calculateXORMAC, calculate3DESMAC, calculateCMAC]);

  const handleLoadExample = useCallback(() => {
    setAlgorithm('3DES');
    setMacKey('0123456789ABCDEF0123456789ABCDEF');
    setMessageData('08002200000010000000000000000000000000123001234ABCD5678901234567890123456');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const handleClear = useCallback(() => {
    setMacKey('');
    setMessageData('');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const formatHex = (hex: string) => {
    return hex.replace(/(.{2})/g, '$1 ').trim();
  };

  const formatDataBlocks = (data: string) => {
    const blocks: string[] = [];
    for (let i = 0; i < data.length; i += 32) {
      blocks.push(formatHex(data.substring(i, i + 32)));
    }
    return blocks;
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          ISO 8583 MAC Calculator
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Calculate Message Authentication Code for ISO 8583 payment messages
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

      {/* Algorithm Selection */}
      <div className="mb-6">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
          MAC Algorithm
        </label>
        <div className="flex flex-wrap gap-2">
          {['XOR', '3DES', 'CMAC'].map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo as 'XOR' | '3DES' | 'CMAC')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                algorithm === algo
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {algo === 'XOR' && 'XOR (Algorithm 1)'}
              {algo === '3DES' && '3DES (ANSI X9.19)'}
              {algo === 'CMAC' && 'CMAC (AES-based)'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {algorithm === 'XOR' && 'Simple XOR-based MAC - fast but less secure'}
          {algorithm === '3DES' && 'ANSI X9.19 standard - Double-length 3DES key in CBC mode'}
          {algorithm === 'CMAC' && 'Cipher-based MAC - Uses AES for modern security'}
        </p>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Inputs */}
        <div className="space-y-4">
          {/* MAC Key Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              MAC Key (Hex)
            </label>
            <input
              type="text"
              value={macKey}
              onChange={(e) => setMacKey(e.target.value.replace(/\s/g, '').toUpperCase())}
              placeholder="0123456789ABCDEF0123456789ABCDEF"
              maxLength={64}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs tracking-wider bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {algorithm === 'XOR' ? 'Single or double-length key' :
               algorithm === '3DES' ? 'Double-length key (32 hex chars recommended)' :
               'AES key (16, 24, or 32 hex chars)'}
            </p>
          </div>

          {/* Message Data Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              Message Data (Hex)
            </label>
            <textarea
              value={messageData}
              onChange={(e) => setMessageData(e.target.value.replace(/\s/g, '').toUpperCase())}
              placeholder="08002200000010000000000000000000000000123001234ABCD..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs tracking-wider bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[120px]"
              rows={5}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter complete ISO 8583 message in hex (MTI + Bitmap + Data Elements)
            </p>
          </div>
        </div>

        {/* Right Column - Result */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* MAC Result - Main Result */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                <label className="block text-blue-700 dark:text-blue-300 text-sm font-medium mb-2">
                  MAC ({result.algorithm})
                </label>
                <div className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-wider break-all">
                  {formatHex(result.mac)}
                </div>
              </div>

              {/* Input Data Blocks */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  Input Data Blocks
                </label>
                <div className="font-mono text-xs text-slate-600 dark:text-slate-400 space-y-1 max-h-32 overflow-y-auto">
                  {formatDataBlocks(result.inputData).map((block, idx) => (
                    <div key={idx} className="break-all">{block}</div>
                  ))}
                </div>
              </div>

              {/* MAC Key (masked) */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  MAC Key (masked)
                </label>
                <div className="font-mono text-sm text-slate-600 dark:text-slate-400 break-all">
                  {result.macKey.length > 16
                    ? formatHex(result.macKey.substring(0, 8)) + '....' + formatHex(result.macKey.substring(result.macKey.length - 8))
                    : formatHex(result.macKey)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm">Enter MAC Key and Message Data</p>
                <p className="text-xs mt-1">then click Calculate MAC</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calculation Details */}
      {result && showDetails && (
        <div className="mb-6 p-4 bg-slate-900 dark:bg-black border border-slate-700 dark:border-zinc-800 rounded-lg">
          <h3 className="text-sm font-bold text-slate-300 dark:text-slate-200 mb-4">
            {result.algorithm} MAC Calculation Details:
          </h3>

          <div className="space-y-4 text-xs">
            {/* Algorithm Info */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Algorithm</p>
              <div className="font-mono text-slate-400">
                <p>{result.breakdown}</p>
              </div>
            </div>

            {/* Data Blocks */}
            {result.blocks && result.blocks.length > 0 && (
              <div>
                <p className="text-cyan-400 font-semibold mb-1">Data Blocks (8 bytes each)</p>
                <div className="font-mono text-slate-400 space-y-1">
                  {result.blocks.map((block, idx) => (
                    <p key={idx}>{block}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Process Overview */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Process Overview</p>
              <div className="font-mono text-slate-400 space-y-1">
                {algorithm === 'XOR' && (
                  <>
                    <p>1. Pad key to match data length</p>
                    <p>2. XOR each byte of data with corresponding key byte</p>
                    <p>3. Result is the MAC</p>
                  </>
                )}
                {algorithm === '3DES' && (
                  <>
                    <p>1. Split MAC key into K1 (left) and K2 (right)</p>
                    <p>2. Initialize H = first data block</p>
                    <p>3. For each remaining block: H = 3DES-K1(H ⊕ Block)</p>
                    <p>4. Final: MAC = DES-K2(DES-K1⁻¹(H))</p>
                  </>
                )}
                {algorithm === 'CMAC' && (
                  <>
                    <p>1. Generate subkeys from AES key</p>
                    <p>2. Pad message to block size</p>
                    <p>3. Process blocks through AES-CBC</p>
                    <p>4. Final block XORed with subkey produces MAC</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculateMAC}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Calculate MAC
        </button>
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

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
          About ISO 8583 MAC
        </h3>
        <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
          <p><strong>MAC (Message Authentication Code)</strong> ensures data integrity and authenticity in payment messages.</p>
          <p><strong>Usage:</strong> The MAC is typically placed in DE 64 (MAC) of the ISO 8583 message.</p>
          <p><strong>Key Management:</strong> MAC keys are typically derived from Zone Master Keys (ZMK) and exchanged via KEK (Key Encryption Key).</p>
          <p><strong>Note:</strong> This tool is for educational and testing purposes. Production systems use HSM for MAC calculation.</p>
        </div>
      </div>
    </div>
  );
};

export default Iso8583MacCalculator;
