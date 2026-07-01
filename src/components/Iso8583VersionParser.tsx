import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import {
  parseISO8583,
  validateISO8583,
  type ParseResult,
  type ParsedField,
  ISO8583_FIELD_DEFINITIONS,
  LengthType
} from '../utils/iso8583VersionParser';
import { EmvTlvDisplay } from './EmvTlvDisplay';

const EXAMPLE_MESSAGE = '0068000000000008002220000000C1000296000007010958270000184954434C504F5339303030303030303030504F533030320034FF010EDF200130DF210130DF240354504BFF020EDF200130DF210130DF240354414B00173031345356312E315F3230323531323035';

export function Iso8583VersionParser({ className = '' }: { className?: string }) {
  const [input, setInput] = useState('');
  const [hasLengthPrefix, setHasLengthPrefix] = useState(true);
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

      // Parse with optional length prefix, TPDU option, and MSB-first bitmap
      const result = parseISO8583(cleanInput, { hasLengthPrefix, hasTPDU, msbFirstBitmap: true });
      setParsedResult(result);

      // Validate
      const validation = validateISO8583(cleanInput, { hasLengthPrefix, hasTPDU });
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
        lengthPrefix: undefined,
        warnings: [(e as Error).message]
      });
    }
  }, [input, hasLengthPrefix, hasTPDU]);

  const handleLoadExample = useCallback(() => {
    setInput(EXAMPLE_MESSAGE);
    setHasLengthPrefix(true);
    setHasTPDU(true);
    setParsedResult(null);
    setValidationResult(null);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setParsedResult(null);
    setValidationResult(null);
  }, []);

  const handleDownloadExcel = useCallback(() => {
    if (!parsedResult) return;

    const generatedAt = new Date().toLocaleString();
    const cleanInput = parsedResult.rawMessage || input.replace(/\s/g, '').toUpperCase();
    const fieldRows = Object.entries(parsedResult.fields)
      .filter(([fieldNum]) => fieldNum !== '0')
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([fieldNum, field]) => {
        const typedField = field as ParsedField;
        const numericField = parseInt(fieldNum);
        return [
          numericField === -2 ? 'Length' : numericField >= 0 ? fieldNum : 'TPDU',
          typedField.name,
          typedField.lengthType.toUpperCase(),
          typedField.rawValue,
          typedField.displayValue || '<empty>'
        ];
      });

    const headerRows = [
      ['ISO 8583 Message Parser Output'],
      ['Generated At', generatedAt],
      ['Input Hex', cleanInput],
      ['Length Prefix', parsedResult.lengthPrefix || '-', 'TPDU', parsedResult.tpdu || '-'],
      ['MTI', parsedResult.mti || '-'],
      ['Primary Bitmap', parsedResult.primaryBitmap || '-', 'Secondary Bitmap', parsedResult.secondaryBitmap || '-'],
      ['Present Fields', parsedResult.presentFields.filter(field => field > 1).join(', ') || '-'],
      [],
      ['DE', 'Description', 'Length Type', 'Value (Hex)', 'Decoded']
    ];

    const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...fieldRows]);

    ws['!cols'] = [
      { wch: 12 },
      { wch: 36 },
      { wch: 14 },
      { wch: 46 },
      { wch: 36 }
    ];
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } },
      { s: { r: 4, c: 1 }, e: { r: 4, c: 2 } },
      { s: { r: 4, c: 4 }, e: { r: 4, c: 4 } }
    ];

    const borderStyle = { style: 'thin', color: { auto: 1 } };
    const cellBorder = {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle
    };
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          border: cellBorder,
          alignment: {
            vertical: 'center',
            horizontal: 'left',
            wrapText: C >= 1
          }
        };

        if (R === 7) {
          ws[cellAddress].s = {
            ...ws[cellAddress].s,
            fill: { fgColor: { rgb: 'dbeafe' } },
            font: { bold: true },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }
      }
    }

    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'left' }
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ISO 8583 Output');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    XLSX.writeFile(wb, `iso8583-parser-output-${timestamp}.xlsx`);
  }, [input, parsedResult]);

  // Auto-parse when input changes
  useEffect(() => {
    if (input.trim().length > 20) {
      const timer = setTimeout(() => {
        try {
          const cleanInput = input.replace(/\s/g, '');
          console.log('Parsing message, length:', cleanInput.length);
          console.log('First 100 chars:', cleanInput.substring(0, 100));
          const result = parseISO8583(cleanInput, { hasLengthPrefix, hasTPDU, msbFirstBitmap: true });
          console.log('Parse result MTI:', result.mti);
          console.log('Parse result bitmap:', result.primaryBitmap);
          console.log('Parse result fields:', Object.keys(result.fields).length, 'fields');
          console.log('Present fields:', result.presentFields);
          setParsedResult(result);
          const validation = validateISO8583(cleanInput, { hasLengthPrefix, hasTPDU });
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
  }, [input, hasLengthPrefix, hasTPDU]);

  const canDownload = parsedResult !== null && Object.entries(parsedResult.fields).filter(([fieldNum]) => fieldNum !== '0').length > 0;

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
        }
      `}</style>
      {/* Header */}
      <div className="mb-6 no-print">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          ISO 8583 Message Parser
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Parse ISO 8583 payment messages with TPDU header support
        </p>
      </div>

      {/* Header Toggles */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 no-print">
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <input
            type="checkbox"
            checked={hasLengthPrefix}
            onChange={(e) => setHasLengthPrefix(e.target.checked)}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Message has Length Prefix
            </span>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
              Length is a 2-byte header before TPDU, for example 0068
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
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
              TPDU is a 5-byte header after length prefix, for example 0000000000
            </p>
          </div>
        </label>
      </div>

      {/* Input Section */}
      <div className="mb-4 no-print">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
          ISO 8583 Message (Hex)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0068000000000008002220000000C1000..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[100px]"
          rows={5}
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 no-print">
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
        <button
          onClick={handleDownloadExcel}
          disabled={!canDownload}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors text-sm font-medium"
          title={!canDownload ? 'Parse ISO 8583 data before downloading' : 'Download parsed ISO 8583 output as Excel'}
        >
          <span className="hidden sm:inline">Download Excel</span>
          <span className="sm:hidden">Excel</span>
        </button>
        <button
          onClick={() => window.print()}
          disabled={!canDownload}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm font-medium"
          title={!canDownload ? 'Parse ISO 8583 data before printing' : 'Print or save as PDF'}
        >
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
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
        <div className="printable-area space-y-4">
          {/* Header Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {parsedResult.lengthPrefix && (
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg min-w-0">
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Length</div>
                <div className="mt-1 flex items-baseline gap-2 min-w-0">
                  <span className="font-mono text-base font-bold text-purple-800 dark:text-purple-200 break-all">
                    {parsedResult.lengthPrefix.match(/.{1,2}/g)?.join(' ') || parsedResult.lengthPrefix}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400 shrink-0">({parseInt(parsedResult.lengthPrefix, 16)} bytes)</span>
                </div>
              </div>
            )}

            {parsedResult.tpdu && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg min-w-0">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">TPDU</div>
                <div className="mt-1 flex items-baseline gap-2 min-w-0">
                  <span className="font-mono text-base font-bold text-amber-800 dark:text-amber-200 break-all">
                    {parsedResult.tpdu.match(/.{1,2}/g)?.join(' ') || parsedResult.tpdu}
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">Network Header</span>
                </div>
              </div>
            )}

            {parsedResult.mti && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg min-w-0">
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">MTI</div>
                <div className="mt-1 flex items-baseline gap-2 min-w-0">
                  <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400 shrink-0">{parsedResult.mti}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 truncate">{parsedResult.mtiDescription}</span>
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
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '220px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '180px' }} />
                      </colgroup>
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
                          .map(([fieldNum, field]: [string, any]) => {
                            const decodedValue = field.displayValue || '<empty>';
                            const shouldWrapDecoded = decodedValue.length > 72 || decodedValue.includes('\n');

                            return (
                              <tr
                                key={fieldNum}
                                className="border-b border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                              >
                                <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400 text-xs font-bold">
                                  {parseInt(fieldNum) === -2 ? 'Length' : parseInt(fieldNum) >= 0 ? fieldNum : 'TPDU'}
                                </td>
                                <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs">
                                  <div className="font-medium truncate">{field.name}</div>
                                  <div className="text-slate-500 dark:text-zinc-500 text-[10px] mt-0.5">
                                    {(() => {
                                      const fieldDef = ISO8583_FIELD_DEFINITIONS[parseInt(fieldNum)];
                                      if (!fieldDef) return `${field.type}...`;
                                      return fieldDef.lengthType === LengthType.FIXED
                                        ? `${fieldDef.type}${fieldDef.maxLength}`
                                        : `${fieldDef.type}...${fieldDef.lengthType.toUpperCase()}`;
                                    })()}
                                  </div>
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
                                    <span className={shouldWrapDecoded ? 'block whitespace-pre-wrap break-words leading-relaxed' : 'block whitespace-nowrap overflow-hidden text-ellipsis'}>
                                      {decodedValue}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-3">
                    {Object.entries(parsedResult.fields)
                      .filter(([key]) => key !== '0')
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([fieldNum, field]: [string, any]) => {
                        const decodedValue = field.displayValue || '<empty>';
                        const fieldDef = ISO8583_FIELD_DEFINITIONS[parseInt(fieldNum)];
                        const typeLengthStr = fieldDef
                          ? fieldDef.lengthType === LengthType.FIXED
                            ? `${fieldDef.type}${fieldDef.maxLength}`
                            : `${fieldDef.type}...${fieldDef.lengthType.toUpperCase()}`
                          : `${field.type}...`;

                        return (
                          <div
                            key={fieldNum}
                            className="bg-white dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 p-3"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded font-mono font-bold">
                                  {parseInt(fieldNum) === -2 ? 'Length' : parseInt(fieldNum) >= 0 ? fieldNum : 'TPDU'}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">{typeLengthStr}</span>
                              </div>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{field.name}</h4>

                            <div className="space-y-2">
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">Hex Value</span>
                                <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all bg-slate-50 dark:bg-zinc-900 p-1.5 rounded mt-0.5">
                                  {field.rawValue}
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">Decoded</span>
                                <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                                  {fieldNum === '55' && field.rawValue && field.rawValue.length > 4 ? (
                                    <EmvTlvDisplay hexData={field.rawValue.substring(field.lengthType === 'llllvar' ? 4 : 6)} />
                                  ) : (
                                    <span className="block whitespace-pre-wrap break-words leading-relaxed">
                                      {decodedValue}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
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
