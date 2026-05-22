import React, { useState, useCallback } from 'react';

// POS Entry Mode code definitions
// Format: [Card Entry Mode (2 digits)][PIN Capability (1 digit)]

const CARD_ENTRY_MODES: Record<string, string> = {
  '00': 'Unknown',
  '01': 'Manual key entry',
  '02': 'Magnetic stripe read',
  '03': 'Bar code / QR code',
  '04': 'OCR (optical character reading)',
  '05': 'Chip card read (ICC contact)',
  '06': 'ICC (reserved)',
  '07': 'Contactless (chip-based)',
  '08': 'Contactless (magstripe-based)',
  '09': 'Reserved',
  '10': 'Reserved',
  '81': 'E-commerce / Card-not-present',
  '90': 'QR / Token-based (varies by network)',
  '91': 'Reserved',
  '99': 'Reserved',
};

const PIN_CAPABILITY: Record<string, string> = {
  '0': 'Unknown',
  '1': 'PIN entry capable',
  '2': 'PIN entry not capable',
  '8': 'PIN not required (e.g., contactless under limit)',
  '9': 'Reserved',
};

// Specific 3-digit codes with descriptions (common combinations)
const POS_ENTRY_CODES: Record<string, string> = {
  '010': 'Manual key entry',
  '011': 'Manual key entry, PIN capable',
  '012': 'Manual key entry, PIN not capable',
  '020': 'Magnetic stripe read',
  '021': 'Magnetic stripe read, PIN capable',
  '022': 'Magnetic stripe read, PIN not capable',
  '050': 'Chip card read',
  '051': 'Chip card read, PIN capable',
  '052': 'Chip card read, PIN not capable',
  '070': 'Contactless (chip-based)',
  '071': 'Contactless (chip-based), PIN capable',
  '072': 'Contactless (chip-based), PIN not capable',
  '078': 'Contactless (chip-based), PIN not required',
  '080': 'Contactless (magstripe-based)',
  '081': 'Contactless (magstripe-based), PIN capable',
  '082': 'Contactless (magstripe-based), PIN not capable',
  '088': 'Contactless (magstripe-based), PIN not required',
  '810': 'E-commerce / Card-not-present',
  '811': 'E-commerce with PIN',
  '812': 'E-commerce without PIN',
  '900': 'QR / Token-based payment',
  '901': 'QR / Token-based payment, PIN capable',
  '902': 'QR / Token-based payment, PIN not capable',
  '908': 'QR / Token-based payment, PIN not required',
  // Fallback scenarios
  '801': 'Fallback from chip to magstripe',
  '802': 'Fallback from chip to magstripe, PIN capable',
};

// Common preset codes
const COMMON_CODES: Record<string, { code: string; description: string }> = {
  manual: { code: '011', description: 'Manual entry, PIN capable' },
  magstripe: { code: '021', description: 'Magnetic stripe, PIN capable' },
  magstripe_no_pin: { code: '022', description: 'Magnetic stripe, no PIN' },
  emv_chip: { code: '051', description: 'Chip card, PIN capable' },
  emv_chip_no_pin: { code: '052', description: 'Chip card, no PIN' },
  contactless: { code: '071', description: 'Contactless chip, PIN capable' },
  contactless_no_pin: { code: '072', description: 'Contactless chip, no PIN' },
  contactless_exempt: { code: '078', description: 'Contactless, PIN exempt' },
  contactless_msd: { code: '081', description: 'Contactless MSD, PIN capable' },
  fallback: { code: '801', description: 'Fallback to magstripe' },
  ecommerce: { code: '810', description: 'E-commerce' },
  qr_token: { code: '900', description: 'QR / Token payment' },
};

// Decode POS Entry Mode
const decodePosEntryMode = (code: string) => {
  const padded = code.padStart(3, '0');

  const cardEntryMode = CARD_ENTRY_MODES[padded.slice(0, 2)] || 'Unknown';
  const pinCap = PIN_CAPABILITY[padded[2]] || 'Unknown';

  // Check for exact match first
  const exactMatch = POS_ENTRY_CODES[padded];

  return {
    cardEntryMode,
    pinCap,
    exactMatch,
    fullDescription: exactMatch || `${cardEntryMode}, ${pinCap}`,
  };
};

const PosEntryModeDecoder = ({ className = '' }) => {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<ReturnType<typeof decodePosEntryMode> | null>(null);

  const handleDecode = useCallback(() => {
    if (!input.trim()) {
      setDecoded(null);
      return;
    }
    setDecoded(decodePosEntryMode(input));
  }, [input]);

  const handleLoadExample = useCallback((preset: string) => {
    const example = COMMON_CODES[preset];
    if (example) {
      setInput(example.code);
      setDecoded(decodePosEntryMode(example.code));
    }
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setDecoded(null);
  }, []);

  const getEntryModeColor = (code: string) => {
    const padded = code.padStart(3, '0');
    const entryCode = padded.slice(0, 2);
    const colors: Record<string, string> = {
      '01': 'bg-slate-100 text-slate-700 border-slate-300', // Manual
      '02': 'bg-blue-100 text-blue-700 border-blue-300', // Magstripe
      '05': 'bg-green-100 text-green-700 border-green-300', // Chip
      '07': 'bg-emerald-100 text-emerald-700 border-emerald-300', // Contactless chip
      '08': 'bg-teal-100 text-teal-700 border-teal-300', // Contactless MSD
      '80': 'bg-amber-100 text-amber-700 border-amber-300', // Fallback
      '81': 'bg-purple-100 text-purple-700 border-purple-300', // E-commerce
      '90': 'bg-indigo-100 text-indigo-700 border-indigo-300', // QR/Token
    };
    return colors[entryCode] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          POS Entry Mode Decoder
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Decode ISO 8583 Field 22 - Point of Service Entry Mode (DE 22)
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
          POS Entry Mode Code (3 digits)
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          placeholder="e.g., 011, 021, 051, 071, 810"
          className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          maxLength={3}
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
          Format: Card Entry Mode (2) + PIN Capability (1)
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
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

      {/* Quick Load Presets */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          Quick Load Common Codes:
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COMMON_CODES).map(([key, { code, description }]) => (
            <button
              key={key}
              onClick={() => handleLoadExample(key)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                input === code
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              {code}: {description}
            </button>
          ))}
        </div>
      </div>

      {/* Decoded Result */}
      {decoded && (
        <div className="space-y-4">
          {/* Full Description */}
          <div className={`p-4 rounded-lg border ${getEntryModeColor(input)}`}>
            <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Decoded Value
            </label>
            <p className="text-lg font-bold mt-1">{decoded.fullDescription}</p>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Entry Mode */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Positions 1-2: Card Entry Mode
                </label>
                <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                  {input.padStart(3, '0').slice(0, 2)}
                </span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200">{decoded.cardEntryMode}</p>
            </div>

            {/* PIN Capability */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Position 3: PIN Capability
                </label>
                <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                  {input.padStart(3, '0')[2]}
                </span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200">{decoded.pinCap}</p>
            </div>
          </div>

          {/* Visual Breakdown */}
          <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 block">
              Visual Breakdown
            </label>
            <div className="flex gap-2">
              <div className="flex-[2] text-center">
                <div className="bg-white dark:bg-black border-2 border-blue-500 rounded-lg p-3">
                  <span className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {input.padStart(3, '0').slice(0, 2)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1 truncate">Card Entry Mode</p>
              </div>
              <div className="flex-1 text-center">
                <div className="bg-white dark:bg-black border-2 border-blue-500 rounded-lg p-3">
                  <span className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {input.padStart(3, '0')[2]}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1 truncate">PIN</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reference Table */}
      <details className="mt-6 group" open>
        <summary className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 mb-3 flex items-center gap-2">
          <span>Reference Tables</span>
          <span className="text-xs text-slate-400">(click to expand/collapse)</span>
        </summary>

        <div className="space-y-4 mt-4">
          {/* Card Entry Mode Table */}
          <div className="overflow-x-auto">
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Card Entry Mode Codes (Positions 1-2)
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800">
                  <th className="text-left py-2 px-2 text-slate-600 dark:text-slate-400">Code</th>
                  <th className="text-left py-2 px-2 text-slate-600 dark:text-slate-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(CARD_ENTRY_MODES).map(([code, desc]) => (
                  <tr key={code} className="border-b border-slate-100 dark:border-zinc-900">
                    <td className="py-1.5 px-2 font-mono font-bold text-blue-600 dark:text-blue-400">{code}</td>
                    <td className="py-1.5 px-2 text-slate-700 dark:text-slate-300">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PIN Capability Table */}
          <div className="overflow-x-auto">
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              PIN Entry Capability (Position 3)
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800">
                  <th className="text-left py-2 px-2 text-slate-600 dark:text-slate-400">Code</th>
                  <th className="text-left py-2 px-2 text-slate-600 dark:text-slate-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PIN_CAPABILITY).map(([code, desc]) => (
                  <tr key={code} className="border-b border-slate-100 dark:border-zinc-900">
                    <td className="py-1.5 px-2 font-mono font-bold text-blue-600 dark:text-blue-400">{code}</td>
                    <td className="py-1.5 px-2 text-slate-700 dark:text-slate-300">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Common 3-Digit Codes Table */}
          <div className="overflow-x-auto">
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Common DE 22 Values
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800">
                  <th className="text-left py-2 px-2 text-slate-600 dark:text-slate-400">Code</th>
                  <th className="text-left py-2 px-2 text-slate-600 dark:text-slate-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(POS_ENTRY_CODES)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([code, desc]) => (
                    <tr key={code} className="border-b border-slate-100 dark:border-zinc-900">
                      <td className="py-1.5 px-2 font-mono font-bold text-blue-600 dark:text-blue-400">{code}</td>
                      <td className="py-1.5 px-2 text-slate-700 dark:text-slate-300">{desc}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
};

export default PosEntryModeDecoder;
