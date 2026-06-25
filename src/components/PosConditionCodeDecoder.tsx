import React, { useState, useCallback } from 'react';

// POS Condition Code definitions (ISO 8583 Field 25 - Point of Service Condition Code)
// This field describes the conditions under which the transaction is being processed

const POS_CONDITION_CODES: Record<string, { description: string; detail: string; color: string }> = {
  '00': {
    description: 'Cardholder & Card Present',
    detail: 'Normal face-to-face transaction where both cardholder and card are physically present at the POS',
    color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  },
  '01': {
    description: 'Cardholder not present',
    detail: 'Transaction where cardholder is not physically present (e.g., unattended terminals, some card-not-present scenarios)',
    color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  },
  '06': {
    description: 'Pre-authorized request',
    detail: 'Pre-authorization transaction - funds are reserved but not yet captured. Often used in hotel, car rental, and restaurant scenarios',
    color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  },
  '08': {
    description: 'Mail Order / Telephone Order',
    detail: 'MOTO transaction - cardholder not present, order placed via mail or telephone. No card present at transaction time',
    color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
  },
};

// Additional industry-specific codes (may vary by network)
const ADDITIONAL_CODES: Record<string, { description: string; detail: string; note: string }> = {
  '02': {
    description: 'Card Present, Cardholder Not Present',
    detail: 'Card is present but cardholder is not (e.g., recurring payment with card on file)',
    note: 'Network-specific',
  },
  '03': {
    description: 'Card Not Present, Cardholder Present',
    detail: 'Cardholder is present but card is not physically used',
    note: 'Network-specific',
  },
  '10': {
    description: 'Reserved for National Use',
    detail: 'Country-specific usage defined by national payment networks',
    note: 'National use',
  },
  '20': {
    description: 'E-commerce',
    detail: 'Internet/online transaction where card and cardholder are not present',
    note: 'Industry use',
  },
};

// Decode POS Condition Code
const decodePosConditionCode = (code: string) => {
  const padded = code.padStart(2, '0');

  // Check standard codes first
  const standardCode = POS_CONDITION_CODES[padded];
  if (standardCode) {
    return {
      code: padded,
      description: standardCode.description,
      detail: standardCode.detail,
      color: standardCode.color,
      type: 'standard' as const,
    };
  }

  // Check additional codes
  const additionalCode = ADDITIONAL_CODES[padded];
  if (additionalCode) {
    return {
      code: padded,
      description: additionalCode.description,
      detail: additionalCode.detail,
      note: additionalCode.note,
      color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-800 dark:text-slate-300 dark:border-zinc-700',
      type: 'additional' as const,
    };
  }

  // Unknown code
  return {
    code: padded,
    description: 'Unknown / Reserved',
    detail: 'This POS Condition Code is not defined in the standard specification or may be network-specific',
    color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700',
    type: 'unknown' as const,
  };
};

const PosConditionCodeDecoder = ({ className = '' }) => {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<ReturnType<typeof decodePosConditionCode> | null>(null);
  const [referenceSearch, setReferenceSearch] = useState('');

  const handleDecode = useCallback(() => {
    if (!input.trim()) {
      setDecoded(null);
      return;
    }
    setDecoded(decodePosConditionCode(input));
  }, [input]);

  const handleLoadExample = useCallback((code: string) => {
    setInput(code);
    setDecoded(decodePosConditionCode(code));
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setDecoded(null);
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 md:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">
          POS Condition Code Decoder
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Decode ISO 8583 Field 25 - Point of Service Condition Code (DE 25)
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl">ℹ️</span>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
              About POS Condition Code
            </p>
            <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-400">
              The POS Condition Code indicates the circumstances under which a transaction is processed.
              It is filled according to current transaction conditions or can be inherited from the
              original message for secondary operations.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
          POS Condition Code (2 digits)
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
          placeholder="e.g., 00, 01, 06, 08"
          className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          maxLength={2}
        />
        <p className="mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500">
          Enter 2-digit numeric condition code
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={handleDecode}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
        >
          Decode
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
        >
          Clear
        </button>
      </div>

      {/* Quick Load Standard Codes */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          Standard ISO 8583 Codes:
        </label>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {Object.entries(POS_CONDITION_CODES).map(([code, { description }]) => (
            <button
              key={code}
              onClick={() => handleLoadExample(code)}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-md border transition-colors ${
                input === code
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="hidden xs:inline">{code}: {description}</span>
              <span className="xs:hidden">{code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Decoded Result */}
      {decoded && (
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {/* Main Result Card */}
          <div className={`p-3 sm:p-4 rounded-lg border ${decoded.color}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide opacity-70">
                Decoded Value
              </label>
              <span className="font-mono text-lg sm:text-xl font-bold">{decoded.code}</span>
            </div>
            <p className="text-base sm:text-lg font-bold mt-1">{decoded.description}</p>
          </div>

          {/* Detail Card */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
              Detailed Description
            </label>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">{decoded.detail}</p>
            {decoded.note && (
              <div className="mt-2 inline-block px-2 py-1 bg-slate-200 dark:bg-zinc-800 rounded text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                Note: {decoded.note}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reference Table */}
      <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        {/* Header with Search */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-900/50 px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span className="text-base sm:text-lg">📖</span>
              Reference Table
            </h3>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500">
              {Object.keys(POS_CONDITION_CODES).length + Object.keys(ADDITIONAL_CODES).length} codes
            </span>
          </div>
          <input
            type="text"
            value={referenceSearch}
            onChange={(e) => setReferenceSearch(e.target.value)}
            placeholder="Search codes or descriptions..."
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        {/* Table Content */}
        <div className="max-h-64 sm:max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-900">
          {/* Standard Codes Section */}
          <div className="bg-white dark:bg-black">
            <div className="px-3 py-2 bg-slate-100 dark:bg-zinc-900 sticky top-0">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Standard ISO 8583 Codes
              </h4>
            </div>
            {Object.entries(POS_CONDITION_CODES)
              .filter(([code, data]) =>
                !referenceSearch ||
                code.includes(referenceSearch) ||
                data.description.toLowerCase().includes(referenceSearch.toLowerCase()) ||
                data.detail.toLowerCase().includes(referenceSearch.toLowerCase())
              )
              .map(([code, { description, detail }]) => (
                <div
                  key={code}
                  className={`px-3 py-2 sm:px-4 sm:py-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors ${code === input ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                      <span className={`px-2 py-1 rounded font-mono text-xs sm:text-sm font-bold shrink-0 ${
                        code === '00'
                          ? 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                          : code === '01'
                          ? 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                          : code === '06'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
                          : 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700'
                      }`}>
                        {code}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                          {description}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 line-clamp-2">
                          {detail}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLoadExample(code)}
                      className="px-2 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors shrink-0"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Additional Codes Section */}
          <div className="bg-white dark:bg-black">
            <div className="px-3 py-2 bg-slate-100 dark:bg-zinc-900 sticky top-0">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Additional / Network-Specific Codes
              </h4>
            </div>
            {Object.entries(ADDITIONAL_CODES)
              .filter(([code, data]) =>
                !referenceSearch ||
                code.includes(referenceSearch) ||
                data.description.toLowerCase().includes(referenceSearch.toLowerCase()) ||
                data.detail.toLowerCase().includes(referenceSearch.toLowerCase())
              )
              .map(([code, { description, detail, note }]) => (
                <div
                  key={code}
                  className={`px-3 py-2 sm:px-4 sm:py-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors ${code === input ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300 dark:bg-zinc-800 dark:text-slate-300 dark:border-zinc-700 font-mono text-xs sm:text-sm font-bold shrink-0">
                        {code}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                          {description}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 line-clamp-2">
                          {detail}
                        </p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-200 dark:bg-zinc-800 rounded text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400">
                          {note}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLoadExample(code)}
                      className="px-2 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors shrink-0"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosConditionCodeDecoder;
