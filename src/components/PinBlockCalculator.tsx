import { zodResolver } from '@hookform/resolvers/zod';
import CryptoJS from 'crypto-js';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { defaultValues, pinBlockSchema } from '../utils/validation';

type PinBlockResult = {
  pan: string;
  pin: string;
  pinLength: number;
  panIntercepted: string;
  panBlock: string;
  pinBlock: string;
  xorResult: string;
  encryptedPinBlock: string;
  pik: string;
};

const PinBlockCalculator = ({ className = '' }) => {
  const [result, setResult] = useState<PinBlockResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(pinBlockSchema),
    defaultValues,
    mode: 'onSubmit',
  });

  // 3DES Encryption
  const encrypt3DES = (dataHex, keyHex) => {
    try {
      // Convert hex to WordArray
      const data = CryptoJS.enc.Hex.parse(dataHex);
      const key = CryptoJS.enc.Hex.parse(keyHex);

      // Encrypt using Triple DES (ECB mode, no padding)
      const encrypted = CryptoJS.TripleDES.encrypt(data, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
      });

      return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
    } catch (err) {
      throw new Error('3DES encryption failed: ' + err.message);
    }
  };

  // Format 0 PIN Block calculation following the exact process
  const calculatePinBlock = useCallback((data) => {
    try {
      setResult(null);
      setShowDetails(false);

      // Clean inputs (Zod validation already passed)
      const cleanPan = data.pan.replace(/\s/g, '');
      const cleanPin = data.pin;
      const cleanPik = data.pik;

      // Step 1: Get PAN intercepted (rightmost 12 digits excluding check digit)
      // PAN: 6244146000000137 -> intercepted: 414600000013
      const panIntercepted = cleanPan.slice(-13, -1); // Last 13 digits, remove check digit

      // Step 2: PAN data block = 0000 + PAN intercepted
      const panBlock = '0000' + panIntercepted;

      // Step 3: PIN data block = 0 + PIN length + PIN + F padding
      const pinLength = cleanPin.length.toString().padStart(2, '0');
      const pinData = pinLength + cleanPin;
      const pinPadding = 'F'.repeat(16 - pinData.length);
      const pinBlock = pinData + pinPadding;

      // Step 4: XOR PIN block with PAN block
      let xorResult = '';
      for (let i = 0; i < 16; i++) {
        const pinNibble = parseInt(pinBlock[i], 16);
        const panNibble = parseInt(panBlock[i], 16);
        xorResult += (pinNibble ^ panNibble).toString(16).toUpperCase().padStart(1, '0');
      }

      // Step 5: 3DES Encryption
      const encryptedPinBlock = encrypt3DES(xorResult, cleanPik);

      setResult({
        pan: cleanPan,
        pin: '•'.repeat(cleanPin.length),
        pinLength: cleanPin.length,
        panIntercepted,
        panBlock,
        pinBlock,
        xorResult,
        encryptedPinBlock,
        pik: cleanPik,
      });
    } catch (err) {
      // Zod handles validation errors before this point
      // This catches only encryption errors
      setResult(null);
    }
  }, []);

  const handleLoadExample = useCallback(() => {
    reset(defaultValues);
    setResult(null);
    setShowDetails(false);
  }, [reset]);

  const handleClear = useCallback(() => {
    reset({ pan: '', pin: '', pik: '' });
    setResult(null);
    setShowDetails(false);
  }, [reset]);

  const formatPanDisplay = (pan: string) => {
    return pan.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatHex = (hex) => {
    return hex.replace(/(.{2})/g, '0x$1 ').trim();
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          PIN Block Calculator
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Calculate ISO 9564 Format 0 PIN Block with 3DES encryption
        </p>
      </div>

      {/* Error Display */}
      {(errors.pan || errors.pin || errors.pik) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errors.pan?.message || errors.pin?.message || errors.pik?.message}
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
              {...register('pan')}
              type="text"
              placeholder="6244 1460 0000 0137"
              maxLength={19}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 ${errors.pan ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-zinc-700'}`}
            />
            {errors.pan && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.pan.message}</p>
            )}
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              PIN
            </label>
            <input
              {...register('pin')}
              type="password"
              placeholder="••••••"
              maxLength={12}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 ${errors.pin ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-zinc-700'}`}
            />
            {errors.pin && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.pin.message}</p>
            )}
          </div>

          {/* PIK Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              PIK (32 hex characters)
            </label>
            <input
              {...register('pik')}
              type="text"
              placeholder="34730298 5D6D80F1 466DBA08 916DB3D6"
              maxLength={35}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs tracking-wider bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 ${errors.pik ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-zinc-700'}`}
            />
            {errors.pik && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.pik.message}</p>
            )}
          </div>
        </div>

        {/* Right Column - Result */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Encrypted PIN Block - Main Result */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                <label className="block text-blue-700 dark:text-blue-300 text-sm font-medium mb-2">
                  Encrypted PIN Block (3DES)
                </label>
                <div className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 break-all tracking-wider">
                  {result.encryptedPinBlock}
                </div>
              </div>

              {/* XOR Result */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                  XOR Result (Clear PIN Block)
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
          <h3 className="text-sm font-bold text-slate-300 dark:text-slate-200 mb-4">Calculation Process:</h3>

          <div className="space-y-4 text-xs">
            {/* Step 1: PAN */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 1: PAN Analysis</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>PAN: <span className="text-white">{formatPanDisplay(result.pan)}</span></div>
                <div>PAN Intercepted (12 digits): <span className="text-green-400">{result.panIntercepted}</span></div>
              </div>
            </div>

            {/* Step 2: PAN Block */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 2: PAN Data Block</p>
              <div className="font-mono text-slate-400">
                <div>PAN Block = 0000 + PAN Intercepted</div>
                <div className="text-green-400 mt-1">{formatHex(result.panBlock)}</div>
              </div>
            </div>

            {/* Step 3: PIN Block */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 3: PIN Data Block</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>PIN Length: <span className="text-yellow-400">{result.pinLength} digits</span></div>
                <div>PIN Block Format: 0 + Length + PIN + F padding</div>
                <div className="text-green-400 mt-1">{formatHex(result.pinBlock)}</div>
              </div>
            </div>

            {/* Step 4: XOR */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 4: XOR Operation</p>
              <div className="font-mono text-slate-400">
                <div className="text-green-400">{formatHex(result.pinBlock)}</div>
                <div className="text-pink-400 font-bold my-1">XOR</div>
                <div className="text-green-400">{formatHex(result.panBlock)}</div>
                <div className="text-slate-500 my-1">══════════════════════════</div>
                <div className="text-green-500 font-bold text-sm">{formatHex(result.xorResult)}</div>
              </div>
            </div>

            {/* Step 5: 3DES */}
            <div>
              <p className="text-cyan-400 font-semibold mb-1">Step 5: 3DES Encryption (ECB, No Padding)</p>
              <div className="font-mono text-slate-400 space-y-1">
                <div>PIK: <span className="text-yellow-400 break-all">{result.pik}</span></div>
                <div>DATA: <span className="text-white">{result.xorResult}</span></div>
                <div className="text-green-500 font-bold mt-1">Result: {result.encryptedPinBlock}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit(calculatePinBlock)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Calculate
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

export default PinBlockCalculator;
