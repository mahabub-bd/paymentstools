import CryptoJS from 'crypto-js';
import { useCallback, useState } from 'react';

interface CryptogramResult {
  type: 'ARQC' | 'AAC' | 'TC' | 'ARPC';
  atc: string;
  unp: string;
  pan: string;
  atcValue: string;
  data: string;
  sessionKey: string;
  cryptogram: string;
  decimalized: string;
}

const EmvCryptogramCalculator = ({ className = '' }: { className?: string }) => {
  const [cryptogramType, setCryptogramType] = useState<'ARQC' | 'AAC' | 'TC' | 'ARPC'>('ARQC');
  const [pan, setPan] = useState('');
  const [atc, setAtc] = useState('');
  const [un, setUn] = useState('');
  const [acquirerId, setAcquirerId] = useState('');
  const [mkac, setMkac] = useState('');
  const [arqc, setArqc] = useState('');
  const [arc, setArc] = useState('');
  const [result, setResult] = useState<CryptogramResult | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Calculate EMV Cryptogram (ARQC/AAC/TC)
  const calculateCryptogram = useCallback(() => {
    try {
      setError('');
      setResult(null);
      setShowDetails(false);

      const cleanPan = pan.replace(/\s/g, '');
      const cleanAtc = atc.replace(/\s/g, '');
      const cleanUn = un.replace(/\s/g, '');
      const cleanAcquirerId = acquirerId.replace(/\s/g, '');
      const cleanMkac = mkac.replace(/\s/g, '').toUpperCase();

      if (!cleanPan || cleanPan.length < 13 || cleanPan.length > 19) {
        throw new Error('Invalid PAN (must be 13-19 digits)');
      }
      if (!/^\d+$/.test(cleanPan)) {
        throw new Error('PAN must contain only digits');
      }
      if (!cleanAtc || cleanAtc.length !== 4) {
        throw new Error('ATC must be 4 digits');
      }
      if (!/^\d+$/.test(cleanAtc)) {
        throw new Error('ATC must contain only digits');
      }
      if (!cleanUn || cleanUn.length !== 8) {
        throw new Error('Unpredictable Number must be 8 digits');
      }
      if (!/^\d+$/.test(cleanUn)) {
        throw new Error('Unpredictable Number must contain only digits');
      }
      if (!cleanAcquirerId || cleanAcquirerId.length !== 11) {
        throw new Error('Acquirer ID must be 11 digits');
      }
      if (!/^\d+$/.test(cleanAcquirerId)) {
        throw new Error('Acquirer ID must contain only digits');
      }
      if (!cleanMkac || cleanMkac.length !== 32) {
        throw new Error('MKAC must be 32 hex characters');
      }
      if (!/^[0-9A-F]+$/.test(cleanMkac)) {
        throw new Error('MKAC must contain only hex characters (0-9, A-F)');
      }

      // Derive Session Key (SK) from MKAC and ATC
      // SK = 3DES(MKAC, ATC || 0000)
      const atcPadded = cleanAtc + '0000';
      const atcData = CryptoJS.enc.Hex.parse(atcPadded);
      const mkacKey = CryptoJS.enc.Hex.parse(cleanMkac);

      const encryptedSK = CryptoJS.TripleDES.encrypt(atcData, mkacKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
      });

      const sessionKey = encryptedSK.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();

      // Build data for cryptogram calculation
      // Format: PAN (last 9 digits) + ATC + UN + Acquirer ID
      const panLast9 = cleanPan.slice(-9).padStart(9, '0');
      const dataInput = panLast9 + cleanAtc + cleanUn + cleanAcquirerId;

      // Pad to 16 nibbles (8 bytes)
      const dataPadded = dataInput.padEnd(16, '0').substring(0, 16);

      // Encrypt with Session Key
      const dataForEncrypt = CryptoJS.enc.Hex.parse(dataPadded);
      const skKey = CryptoJS.enc.Hex.parse(sessionKey);

      const encrypted = CryptoJS.TripleDES.encrypt(dataForEncrypt, skKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
      });

      const encryptedResult = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();

      // Decimalize
      const decimalize = (hex: string): string => {
        const table: Record<string, string> = {
          '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
          '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
          'A': '0', 'B': '1', 'C': '2', 'D': '3', 'E': '4', 'F': '5'
        };
        return hex.split('').map(c => table[c] || '0').join('');
      };

      const decimalized = decimalize(encryptedResult);

      // Cryptogram depends on type
      let cryptogramValue = '';
      if (cryptogramType === 'ARQC') {
        cryptogramValue = decimalized.substring(0, 8);
      } else if (cryptogramType === 'AAC' || cryptogramType === 'TC') {
        cryptogramValue = decimalized.substring(0, 8);
      }

      setResult({
        type: cryptogramType,
        atc: cleanAtc,
        unp: cleanUn,
        pan: cleanPan,
        atcValue: atcPadded,
        data: dataPadded,
        sessionKey,
        cryptogram: cryptogramValue,
        decimalized,
      });
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    }
  }, [pan, atc, un, acquirerId, mkac, cryptogramType]);

  // Calculate ARPC
  const calculateARPC = useCallback(() => {
    try {
      setError('');
      setResult(null);
      setShowDetails(false);

      const cleanPan = pan.replace(/\s/g, '');
      const cleanAtc = atc.replace(/\s/g, '');
      const cleanArc = arc.replace(/\s/g, '').toUpperCase();
      const cleanArqc = arqc.replace(/\s/g, '').toUpperCase();
      const cleanMkac = mkac.replace(/\s/g, '').toUpperCase();

      if (!cleanPan || cleanPan.length < 13 || cleanPan.length > 19) {
        throw new Error('Invalid PAN (must be 13-19 digits)');
      }
      if (!cleanAtc || cleanAtc.length !== 4) {
        throw new Error('ATC must be 4 digits');
      }
      if (!cleanArc || cleanArc.length !== 4) {
        throw new Error('ARC must be 2 digits (4 hex characters)');
      }
      if (!cleanArqc || cleanArqc.length !== 16) {
        throw new Error('ARQC must be 8 bytes (16 hex characters)');
      }
      if (!cleanMkac || cleanMkac.length !== 32) {
        throw new Error('MKAC must be 32 hex characters');
      }

      // Derive Session Key
      const atcPadded = cleanAtc + '0000';
      const atcData = CryptoJS.enc.Hex.parse(atcPadded);
      const mkacKey = CryptoJS.enc.Hex.parse(cleanMkac);

      const encryptedSK = CryptoJS.TripleDES.encrypt(atcData, mkacKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
      });

      const sessionKey = encryptedSK.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();

      // ARPC = 3DES(SK, ARQC || ARC)
      const arpcInput = cleanArqc + cleanArc;
      const arpcData = CryptoJS.enc.Hex.parse(arpcInput);
      const skKey = CryptoJS.enc.Hex.parse(sessionKey);

      const encrypted = CryptoJS.TripleDES.encrypt(arpcData, skKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
      });

      const cryptogram = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();

      setResult({
        type: 'ARPC',
        atc: cleanAtc,
        unp: cleanArc,
        pan: cleanPan,
        atcValue: atcPadded,
        data: arpcInput,
        sessionKey,
        cryptogram,
        decimalized: cryptogram,
      });
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    }
  }, [pan, atc, arc, arqc, mkac]);

  const handleLoadExample = useCallback(() => {
    setPan('4929740000000003');
    setAtc('0001');
    setUn('12345678');
    setAcquirerId('00000012345');
    setMkac('0123456789ABCDEF0123456789ABCDEF');
    setArqc('1234567890ABCDEF');
    setArc('3030');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const handleClear = useCallback(() => {
    setPan('');
    setAtc('');
    setUn('');
    setAcquirerId('');
    setMkac('');
    setArqc('');
    setArc('');
    setResult(null);
    setError('');
    setShowDetails(false);
  }, []);

  const formatPan = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatHex = (hex: string) => {
    return hex.replace(/(.{2})/g, '0x$1 ').trim();
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          EMV Cryptogram Calculator
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Calculate ARQC, AAC, TC, and ARPC for EMV transactions
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

      {/* Cryptogram Type Selection */}
      <div className="mb-6">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
          Cryptogram Type
        </label>
        <div className="flex flex-wrap gap-2">
          {['ARQC', 'AAC', 'TC', 'ARPC'].map((type) => (
            <button
              key={type}
              onClick={() => setCryptogramType(type as 'ARQC' | 'AAC' | 'TC' | 'ARPC')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                cryptogramType === type
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {cryptogramType === 'ARQC' && 'Application Request Cryptogram - Generated by card for authorization requests'}
          {cryptogramType === 'AAC' && 'Application Authentication Cryptogram - Indicates transaction declined'}
          {cryptogramType === 'TC' && 'Transaction Certificate - Offline approved transaction'}
          {cryptogramType === 'ARPC' && 'Authorization Response Cryptogram - Generated by issuer for response'}
        </p>
      </div>

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
              placeholder="4929 7400 0000 0003"
              maxLength={19}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* ATC Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              ATC (Application Transaction Counter) - 4 digits
            </label>
            <input
              type="text"
              value={atc}
              onChange={(e) => setAtc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0001"
              maxLength={4}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* UN Input */}
          {cryptogramType !== 'ARPC' && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                UN (Unpredictable Number) - 8 digits
              </label>
              <input
                type="text"
                value={un}
                onChange={(e) => setUn(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="12345678"
                maxLength={8}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>
          )}

          {/* Acquirer ID Input */}
          {cryptogramType !== 'ARPC' && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Acquirer ID - 11 digits
              </label>
              <input
                type="text"
                value={acquirerId}
                onChange={(e) => setAcquirerId(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="00000012345"
                maxLength={11}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>
          )}

          {/* ARQC Input (for ARPC) */}
          {cryptogramType === 'ARPC' && (
            <>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  ARQC (from card) - 16 hex characters
                </label>
                <input
                  type="text"
                  value={arqc}
                  onChange={(e) => setArqc(e.target.value.replace(/\s/g, '').toUpperCase())}
                  placeholder="1234567890ABCDEF"
                  maxLength={16}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  ARC (Authorization Response Code) - 2 digits (ASCII)
                </label>
                <input
                  type="text"
                  value={arc}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                    // Convert to ASCII hex
                    setArc(val.split('').map(c => c.charCodeAt(0).toString(16).toUpperCase()).join(''));
                  }}
                  placeholder="00"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter numeric ARC (e.g., 00 for approved). Will be converted to ASCII hex.
                </p>
              </div>
            </>
          )}

          {/* MKAC Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              MKAC (Master Key for AC) - 32 hex characters
            </label>
            <input
              type="text"
              value={mkac}
              onChange={(e) => setMkac(e.target.value.replace(/\s/g, '').toUpperCase())}
              placeholder="0123456789ABCDEF0123456789ABCDEF"
              maxLength={32}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs tracking-wider bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Right Column - Result */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Cryptogram Result - Main Result */}
              <div className={`p-4 bg-gradient-to-r ${
                cryptogramType === 'ARPC'
                  ? 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700'
                  : 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700'
              } rounded-lg`}>
                <label className={`block text-sm font-medium mb-2 ${
                  cryptogramType === 'ARPC'
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {result.type} ({cryptogramType === 'ARPC' ? 'Authorization Response Cryptogram' :
                    cryptogramType === 'ARQC' ? 'Application Request Cryptogram' :
                    cryptogramType === 'AAC' ? 'Application Authentication Cryptogram' :
                    'Transaction Certificate'})
                </label>
                <div className={`font-mono text-3xl font-bold tracking-wider ${
                  cryptogramType === 'ARPC'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {result.cryptogram}
                </div>
              </div>

              {/* Session Key */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  Derived Session Key (SK)
                </label>
                <div className="font-mono text-sm text-slate-600 dark:text-slate-400 break-all tracking-wider">
                  {result.sessionKey}
                </div>
              </div>

              {/* Input Data */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  Input Data
                </label>
                <div className="font-mono text-sm text-slate-600 dark:text-slate-400 break-all tracking-wider">
                  {result.data}
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
                <p className="text-sm">Enter values and click Calculate</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calculation Details */}
      {result && showDetails && (
        <div className="mb-6 p-4 bg-slate-900 dark:bg-black border border-slate-700 dark:border-zinc-800 rounded-lg">
          <h3 className="text-sm font-bold text-slate-300 dark:text-slate-200 mb-4">{result.type} Calculation Process:</h3>

          <div className="space-y-4 text-xs">
            {/* Step 1: Derive Session Key */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 1: Derive Session Key from MKAC</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>SK = 3DES(MKAC, ATC || 0000)</div>
                <div>ATC Value: <span className="text-yellow-400">{result.atcValue}</span></div>
                <div>MKAC: <span className="text-white">{mkac.substring(0, 16)}...</span></div>
                <div className="text-green-400">Session Key: {result.sessionKey}</div>
              </div>
            </div>

            {/* Step 2: Build Input Data */}
            {cryptogramType !== 'ARPC' && (
              <div>
                <p className="text-cyan-400 font-semibold mb-1">Step 2: Build Input Data</p>
                <div className="font-mono text-slate-400 space-y-1">
                  <div>Format: PAN (last 9) + ATC + UN + Acquirer ID</div>
                  <div>PAN (9): <span className="text-yellow-400">{result.pan.slice(-9).padStart(9, '0')}</span></div>
                  <div>Input: <span className="text-green-400">{result.data}</span></div>
                </div>
              </div>
            )}

            {/* Step 3: Encrypt */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step {cryptogramType === 'ARPC' ? '2' : '3'}: Encrypt with Session Key</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>Data: <span className="text-white">{result.data}</span></div>
                <div className="text-green-500 font-bold">Result: {result.decimalized}</div>
              </div>
            </div>

            {/* Step 4: Extract Cryptogram */}
            {cryptogramType !== 'ARPC' && (
              <div>
                <p className="text-cyan-400 font-semibold mb-1">Step 4: Extract Cryptogram</p>
                <div className="font-mono text-slate-400 space-y-1">
                  <div>Decimalized: <span className="text-white">{result.decimalized}</span></div>
                  <div>{result.type}: <span className="text-blue-400 font-bold">{result.cryptogram}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={cryptogramType === 'ARPC' ? calculateARPC : calculateCryptogram}
          className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
            cryptogramType === 'ARPC'
              ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          Calculate {cryptogramType}
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
    </div>
  );
};

export default EmvCryptogramCalculator;
