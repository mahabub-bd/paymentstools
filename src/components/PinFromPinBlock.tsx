import React, { useState, useCallback } from 'react';
import CryptoJS from 'crypto-js';

const PinFromPinBlock = ({ className = '' }) => {
  const [pan, setPan] = useState('');
  const [encryptedPinBlock, setEncryptedPinBlock] = useState('');
  const [pik, setPik] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // 3DES Decryption
  const decrypt3DES = (encryptedHex, keyHex) => {
    try {
      const encrypted = CryptoJS.enc.Hex.parse(encryptedHex);
      const key = CryptoJS.enc.Hex.parse(keyHex);

      const decrypted = CryptoJS.TripleDES.decrypt(
        { ciphertext: encrypted } as any,
        key,
        {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.NoPadding
        }
      );

      return decrypted.toString(CryptoJS.enc.Hex).toUpperCase();
    } catch (err) {
      throw new Error('3DES decryption failed: ' + err.message);
    }
  };

  // Extract PIN from decrypted PIN block
  const extractPinFromPinBlock = (xorResult, panValue) => {
    // Get PAN intercepted (rightmost 12 digits excluding check digit)
    const panIntercepted = panValue.slice(-13, -1);
    const panBlock = '0000' + panIntercepted;

    // XOR to get PIN block
    let pinBlock = '';
    for (let i = 0; i < 16; i++) {
      const xorNibble = parseInt(xorResult[i], 16);
      const panNibble = parseInt(panBlock[i], 16);
      pinBlock += (xorNibble ^ panNibble).toString(16).toUpperCase().padStart(1, '0');
    }

    // Extract PIN from PIN block format: 0 + length + PIN + F padding
    const formatIndicator = pinBlock[0];
    if (formatIndicator !== '0') {
      throw new Error('Invalid PIN block format (expected Format 0)');
    }

    const pinLength = parseInt(pinBlock[1], 16);
    if (pinLength < 4 || pinLength > 12) {
      throw new Error('Invalid PIN length in PIN block');
    }

    const pin = pinBlock.substring(2, 2 + pinLength);

    return {
      pin,
      pinBlock,
      panBlock,
      format: 'Format 0 (ANSI X9.8)'
    };
  };

  const calculatePinFromBlock = useCallback(() => {
    try {
      setError('');
      setResult(null);
      setShowDetails(false);

      // Validate and clean inputs
      const cleanPan = pan.replace(/\s/g, '');
      const cleanEncrypted = encryptedPinBlock.replace(/\s/g, '').toUpperCase();
      const cleanPik = pik.replace(/\s/g, '').toUpperCase();

      if (!cleanPan || cleanPan.length < 13) {
        throw new Error('Invalid PAN (minimum 13 digits)');
      }
      if (!/^\d+$/.test(cleanPan)) {
        throw new Error('PAN must contain only digits');
      }
      if (!cleanEncrypted || cleanEncrypted.length !== 16) {
        throw new Error('Encrypted PIN Block must be 16 hex characters');
      }
      if (!/^[0-9A-F]+$/.test(cleanEncrypted)) {
        throw new Error('Encrypted PIN Block must contain only hex characters (0-9, A-F)');
      }
      if (!cleanPik || cleanPik.length !== 32) {
        throw new Error('PIK must be 32 hex characters');
      }
      if (!/^[0-9A-F]+$/.test(cleanPik)) {
        throw new Error('PIK must contain only hex characters (0-9, A-F)');
      }

      // Step 1: Decrypt the encrypted PIN block
      const xorResult = decrypt3DES(cleanEncrypted, cleanPik);

      // Step 2: Extract PIN from decrypted XOR result
      const pinData = extractPinFromPinBlock(xorResult, cleanPan);

      setResult({
        pan: cleanPan,
        encryptedPinBlock: cleanEncrypted,
        pik: cleanPik,
        xorResult,
        pin: pinData.pin,
        pinLength: pinData.pin.length,
        pinBlock: pinData.pinBlock,
        panBlock: pinData.panBlock,
        format: pinData.format
      });
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  }, [pan, encryptedPinBlock, pik]);

  const handleLoadExample = useCallback(() => {
    setPan('6244146000000137');
    setEncryptedPinBlock('118C1B557BD4B367');
    setPik('347302985D6D80F1466DBA08916DB3D6');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const handleClear = useCallback(() => {
    setPan('');
    setEncryptedPinBlock('');
    setPik('');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const formatPan = (value) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatPik = (value) => {
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
          PIN from PIN Block
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Decrypt PIN Block and extract the PIN using 3DES
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
              PAN (Card Number)
            </label>
            <input
              type="text"
              value={pan}
              onChange={(e) => setPan(formatPan(e.target.value))}
              placeholder="6244 1460 0000 0137"
              maxLength={19}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Encrypted PIN Block Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              Encrypted PIN Block (16 hex)
            </label>
            <input
              type="text"
              value={encryptedPinBlock}
              onChange={(e) => setEncryptedPinBlock(e.target.value.replace(/\s/g, '').toUpperCase())}
              placeholder="118C1B557BD4B367"
              maxLength={16}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* PIK Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              PIK (32 hex characters)
            </label>
            <input
              type="text"
              value={pik}
              onChange={(e) => setPik(formatPik(e.target.value))}
              placeholder="34730298 5D6D80F1 466DBA08 916DB3D6"
              maxLength={35}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs tracking-wider bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Right Column - Result */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Extracted PIN - Main Result */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg">
                <label className="block text-green-700 dark:text-green-300 text-sm font-medium mb-2">
                  Extracted PIN
                </label>
                <div className="flex items-baseline gap-2">
                  <div className="font-mono text-3xl font-bold text-green-600 dark:text-green-400 tracking-wider">
                    {result.pin}
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    ({result.pin.length} digits)
                  </span>
                </div>
              </div>

              {/* Decrypted XOR Result */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  Decrypted XOR Result
                </label>
                <div className="font-mono text-lg text-slate-600 dark:text-slate-400 break-all tracking-wider">
                  {result.xorResult}
                </div>
              </div>

              {/* Toggle Details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {showDetails ? '▼ Hide' : '▶ Show'} Decryption Details
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[250px] border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-lg">
              <div className="text-center text-slate-400 dark:text-zinc-500">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Enter values and click Decrypt</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decryption Details */}
      {result && showDetails && (
        <div className="mb-6 p-4 bg-slate-900 dark:bg-black border border-slate-700 dark:border-zinc-800 rounded-lg">
          <h3 className="text-sm font-bold text-slate-300 dark:text-slate-200 mb-4">Decryption Process:</h3>

          <div className="space-y-4 text-xs">
            {/* Step 1: 3DES Decryption */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 1: 3DES Decryption (ECB, No Padding)</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>Encrypted PIN Block: <span className="text-yellow-400">{result.encryptedPinBlock}</span></div>
                <div>PIK: <span className="text-yellow-400 break-all">{result.pik}</span></div>
                <div className="text-green-500 font-bold">Decrypted (XOR Result): {result.xorResult}</div>
              </div>
            </div>

            {/* Step 2: PAN Analysis */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 2: PAN Analysis</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>PAN: <span className="text-white">{formatPan(result.pan)}</span></div>
                <div>PAN Intercepted (12 digits): <span className="text-green-400">{result.pan.slice(-13, -1)}</span></div>
                <div>PAN Block: <span className="text-green-400">{formatHex(result.panBlock)}</span></div>
              </div>
            </div>

            {/* Step 3: Extract PIN Block */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 3: Extract PIN Block (XOR)</p>
              <div className="font-mono text-slate-400">
                <div className="text-green-400">{formatHex(result.xorResult)}</div>
                <div className="text-pink-400 font-bold my-1">XOR</div>
                <div className="text-green-400">{formatHex(result.panBlock)}</div>
                <div className="text-slate-500 my-1">══════════════════════════</div>
                <div className="text-green-500 font-bold">PIN Block: {formatHex(result.pinBlock)}</div>
              </div>
            </div>

            {/* Step 4: Parse PIN Block */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 4: Parse PIN Block ({result.format})</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>Format Indicator: <span className="text-yellow-400">0</span> (Format 0)</div>
                <div>PIN Length: <span className="text-yellow-400">{result.pinLength} digits</span></div>
                <div>PIN: <span className="text-green-500 font-bold">{result.pin}</span> ({result.pinLength} digits)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculatePinFromBlock}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Decrypt PIN
        </button>
        <button
          onClick={handleLoadExample}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Load Example
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default PinFromPinBlock;
