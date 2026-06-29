import { useCallback, useEffect, useState } from 'react';
import {
  parseISO8583,
  validateISO8583,
  type ParseResult
} from '../utils/iso8583VersionParser';
import { EmvTlvDisplay } from './EmvTlvDisplay';

const EXAMPLE_MESSAGE = '0000000000081022380000028000109300000628140758001502140757062830304954434C504F5339000630303030303232';

export function Iso8583VersionParser({ className = '' }: { className?: string }) {
  const [input, setInput] = useState('');
  const [hasTPDU, setHasTPDU] = useState(true);
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const handleParse = useCallback(() => {
    if (!input.trim()) {
      setParsedResult(null);
      setValidationResult(null);
      return;
    }

    try {
      const cleanInput = input.replace(/\s/g, '');

      // Parse with TPDU option and MSB-first bitmap
      const result = parseISO8583(cleanInput, { hasTPDU, msbFirstBitmap: true });
      setParsedResult(result);

      // Validate
      const validation = validateISO8583(cleanInput);
      setValidationResult(validation);
    } catch (e) {
      setParsedResult({
        mti: '',
        mtiDescription: '',
        bitmap: '',
        primaryBitmap: '',
        presentFields: [],
        fields: {},
        rawMessage: input,
        rawLength: input.length,
        hasSecondaryBitmap: false,
        hasTPDU: hasTPDU,
        tpdu: undefined,
        warnings: [(e as Error).message]
      });
    }
  }, [input, hasTPDU]);

  const handleLoadExample = useCallback(() => {
    setInput(EXAMPLE_MESSAGE);
    setHasTPDU(true);
    setParsedResult(null);
    setValidationResult(null);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setParsedResult(null);
    setValidationResult(null);
  }, []);

  // Auto-parse when input changes
  useEffect(() => {
    if (input.trim().length > 20) {
      const timer = setTimeout(() => {
        try {
          const cleanInput = input.replace(/\s/g, '');
          console.log('Parsing message, length:', cleanInput.length);
          console.log('First 100 chars:', cleanInput.substring(0, 100));
          const result = parseISO8583(cleanInput, { hasTPDU, msbFirstBitmap: true });
          console.log('Parse result MTI:', result.mti);
          console.log('Parse result bitmap:', result.primaryBitmap);
          console.log('Parse result fields:', Object.keys(result.fields).length, 'fields');
          console.log('Present fields:', result.presentFields);
          setParsedResult(result);
          const validation = validateISO8583(cleanInput);
          setValidationResult(validation);
        } catch (e) {
          // Show error in warnings - don't set partial result to avoid type issues
          console.error('Parse error:', e);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else if (input.trim().length === 0) {
      setParsedResult(null);
      setValidationResult(null);
    }
  }, [input, hasTPDU]);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          ISO 8583 Message Parser
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Parse ISO 8583 payment messages with TPDU header support
        </p>
      </div>

      {/* TPDU Toggle */}
      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasTPDU}
            onChange={(e) => setHasTPDU(e.target.checked)}
            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Message has TPDU (Network Header)
            </span>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              TPDU is a 5-byte (10 hex chars) network header that precedes ISO 8583 messages
            </p>
          </div>
        </label>
      </div>

      {/* Input Section */}
      <div className="mb-4">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
          ISO 8583 Message (Hex)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="600000000002007238048128E08010166210947..."
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

      {/* Validation Result */}
      {validationResult && !validationResult.valid && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Validation Errors:</h3>
          <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
            {validationResult.errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Parse Result */}
      {parsedResult && (
        <div className="space-y-4">
          {/* TPDU and MTI Combined Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TPDU Display */}
            {parsedResult.tpdu && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <label className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">TPDU (Network Header)</label>
                <p className="font-mono text-lg font-bold text-amber-800 dark:text-amber-200 mt-1">
                  {parsedResult.tpdu.match(/.{1,2}/g)?.join(' ') || parsedResult.tpdu}
                </p>
              </div>
            )}

            {/* MTI Display */}
            {parsedResult.mti && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <label className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Message Type Indicator</label>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">{parsedResult.mti}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 text-right">{parsedResult.mtiDescription}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bitmap Display */}
          {parsedResult.primaryBitmap && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bitmap</label>
                <span className="text-xs text-slate-500 dark:text-zinc-500">
                  {parsedResult.presentFields.filter(f => f > 1).length} data fields present
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-1">Primary Bitmap:</p>
                  <p className="font-mono text-sm text-slate-800 dark:text-slate-200">
                    {parsedResult.primaryBitmap.match(/.{1,2}/g)?.join(' ') || parsedResult.primaryBitmap}
                  </p>
                </div>

                {parsedResult.secondaryBitmap && (
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-1">Secondary Bitmap:</p>
                    <p className="font-mono text-sm text-slate-800 dark:text-slate-200">
                      {parsedResult.secondaryBitmap.match(/.{1,2}/g)?.join(' ') || parsedResult.secondaryBitmap}
                    </p>
                  </div>
                )}
              </div>

              {/* Present Fields Tags */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-2">Present Fields:</p>
                <div className="flex flex-wrap gap-1">
                  {parsedResult.presentFields.filter(f => f > 1).map(field => (
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

          {/* Warnings */}
          {parsedResult.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Warnings:</h3>
              <ul className="text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                {parsedResult.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Debug Info */}
          {parsedResult.debugInfo && (
            <details className="group">
              <summary className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 mb-2">
                Debug Information ▼
              </summary>
              <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-mono text-purple-700 dark:text-purple-300">Bitmap Binary:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{parsedResult.debugInfo.bitmapBinary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-purple-700 dark:text-purple-300">Position After Bitmap:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{parsedResult.debugInfo.positionAfterBitmap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-purple-700 dark:text-purple-300">Final Position:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{parsedResult.debugInfo.finalPosition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-purple-700 dark:text-purple-300">Message Length:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{parsedResult.debugInfo.messageLength}</span>
                  </div>
                  {parsedResult.debugInfo.remainingData && (
                    <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                      <span className="font-mono text-purple-700 dark:text-purple-300">Remaining Data:</span>
                      <div className="mt-1 p-2 bg-white dark:bg-black rounded font-mono text-[10px] text-green-600 dark:text-green-400 break-all">
                        {parsedResult.debugInfo.remainingData}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Parsed Fields Table */}
          {(parsedResult.mti || parsedResult.primaryBitmap || Object.keys(parsedResult.fields).length > 0) && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
                Data Fields ({Object.keys(parsedResult.fields).filter(k => k !== '0').length} fields)
              </label>

              {Object.entries(parsedResult.fields).filter(([k]) => k !== '0').length === 0 ? (
                <p className="text-slate-500 dark:text-zinc-500 text-xs">No data fields found. Check the bitmap and message format.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-zinc-700">
                        <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">DE</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">Description</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">Value (hex)</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">Decoded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(parsedResult.fields)
                        .filter(([key]) => key !== '0')
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([fieldNum, field]: [string, any]) => (
                          <tr
                            key={fieldNum}
                            className="border-b border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          >
                            <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400 text-xs font-bold">
                              {parseInt(fieldNum) >= 0 ? fieldNum : 'TPDU'}
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs">
                              {field.name}
                              {field.lengthType !== 'FIXED' && (
                                <span className="text-slate-500 dark:text-zinc-500 ml-1">
                                  ({field.lengthType.toUpperCase()})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-800 dark:text-slate-200 text-xs break-all">
                              {field.rawValue}
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs">
                              {fieldNum === '55' && field.rawValue && field.rawValue.length > 4 ? (
                                <div className="w-full">
                                  <EmvTlvDisplay hexData={field.rawValue.substring(field.lengthType === 'llllvar' ? 4 : 6)} />
                                </div>
                              ) : (
                                <span className="whitespace-pre-wrap break-words">{field.displayValue || '<empty>'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Raw Message */}
          <details className="group">
            <summary className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
              Raw Hex Message ▼
            </summary>
            <div className="mt-2 p-3 bg-slate-900 dark:bg-black rounded border border-slate-700 dark:border-zinc-800">
              <p className="font-mono text-xs text-green-400 break-all">
                {parsedResult.rawMessage}
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default Iso8583VersionParser;
