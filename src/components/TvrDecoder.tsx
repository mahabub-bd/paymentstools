import React, { useCallback, useMemo, useState } from 'react';

type TvrBit = {
  byte: number;
  bit: number;
  label: string;
  category: string;
};

type DecodeResult = {
  value: string;
  bytes: string[];
  bits: Array<TvrBit & { active: boolean }>;
  activeBits: TvrBit[];
};

const TVR_BITS: TvrBit[] = [
  { byte: 1, bit: 8, label: 'Offline data authentication was not performed', category: 'Offline Data Authentication' },
  { byte: 1, bit: 7, label: 'SDA failed', category: 'Offline Data Authentication' },
  { byte: 1, bit: 6, label: 'ICC data missing', category: 'Offline Data Authentication' },
  { byte: 1, bit: 5, label: 'Card appears on terminal exception file', category: 'Offline Data Authentication' },
  { byte: 1, bit: 4, label: 'DDA failed', category: 'Offline Data Authentication' },
  { byte: 1, bit: 3, label: 'CDA failed', category: 'Offline Data Authentication' },
  { byte: 1, bit: 2, label: 'RFU', category: 'Offline Data Authentication' },
  { byte: 1, bit: 1, label: 'RFU', category: 'Offline Data Authentication' },
  { byte: 2, bit: 8, label: 'ICC and terminal have different application versions', category: 'Application Processing' },
  { byte: 2, bit: 7, label: 'Expired application', category: 'Application Processing' },
  { byte: 2, bit: 6, label: 'Application not yet effective', category: 'Application Processing' },
  { byte: 2, bit: 5, label: 'Requested service not allowed for card product', category: 'Application Processing' },
  { byte: 2, bit: 4, label: 'New card', category: 'Application Processing' },
  { byte: 2, bit: 3, label: 'RFU', category: 'Application Processing' },
  { byte: 2, bit: 2, label: 'RFU', category: 'Application Processing' },
  { byte: 2, bit: 1, label: 'RFU', category: 'Application Processing' },
  { byte: 3, bit: 8, label: 'Cardholder verification was not successful', category: 'Cardholder Verification' },
  { byte: 3, bit: 7, label: 'Unrecognized CVM', category: 'Cardholder Verification' },
  { byte: 3, bit: 6, label: 'PIN try limit exceeded', category: 'Cardholder Verification' },
  { byte: 3, bit: 5, label: 'PIN entry required and PIN pad not present or not working', category: 'Cardholder Verification' },
  { byte: 3, bit: 4, label: 'PIN entry required, PIN pad present, but PIN was not entered', category: 'Cardholder Verification' },
  { byte: 3, bit: 3, label: 'Online PIN entered', category: 'Cardholder Verification' },
  { byte: 3, bit: 2, label: 'RFU', category: 'Cardholder Verification' },
  { byte: 3, bit: 1, label: 'RFU', category: 'Cardholder Verification' },
  { byte: 4, bit: 8, label: 'Transaction exceeds floor limit', category: 'Terminal Risk Management' },
  { byte: 4, bit: 7, label: 'Lower consecutive offline limit exceeded', category: 'Terminal Risk Management' },
  { byte: 4, bit: 6, label: 'Upper consecutive offline limit exceeded', category: 'Terminal Risk Management' },
  { byte: 4, bit: 5, label: 'Transaction selected randomly for online processing', category: 'Terminal Risk Management' },
  { byte: 4, bit: 4, label: 'Merchant forced transaction online', category: 'Terminal Risk Management' },
  { byte: 4, bit: 3, label: 'RFU', category: 'Terminal Risk Management' },
  { byte: 4, bit: 2, label: 'RFU', category: 'Terminal Risk Management' },
  { byte: 4, bit: 1, label: 'RFU', category: 'Terminal Risk Management' },
  { byte: 5, bit: 8, label: 'Default TDOL used', category: 'Issuer Authentication and Scripts' },
  { byte: 5, bit: 7, label: 'Issuer authentication failed', category: 'Issuer Authentication and Scripts' },
  { byte: 5, bit: 6, label: 'Script processing failed before final GENERATE AC', category: 'Issuer Authentication and Scripts' },
  { byte: 5, bit: 5, label: 'Script processing failed after final GENERATE AC', category: 'Issuer Authentication and Scripts' },
  { byte: 5, bit: 4, label: 'RFU', category: 'Issuer Authentication and Scripts' },
  { byte: 5, bit: 3, label: 'RFU', category: 'Issuer Authentication and Scripts' },
  { byte: 5, bit: 2, label: 'RFU', category: 'Issuer Authentication and Scripts' },
  { byte: 5, bit: 1, label: 'RFU', category: 'Issuer Authentication and Scripts' },
];

const EXAMPLES = [
  { value: '8000000000', label: 'Offline authentication not performed' },
  { value: '0080000000', label: 'Different app versions' },
  { value: '0000800000', label: 'CVM unsuccessful' },
  { value: '0000008000', label: 'Exceeds floor limit' },
  { value: '0000000080', label: 'Default TDOL used' },
  { value: '95 05 8000048000', label: 'Tag 95 TLV value' },
];

const cleanTvrInput = (input: string) => {
  const hex = input.toUpperCase().replace(/[^0-9A-F]/g, '');

  if (hex.startsWith('9505') && hex.length >= 14) {
    return hex.slice(4, 14);
  }

  if (hex.startsWith('95') && hex.length >= 12) {
    return hex.slice(2, 12);
  }

  return hex.slice(0, 10);
};

const decodeTvr = (input: string): DecodeResult | null => {
  const value = cleanTvrInput(input);
  if (value.length !== 10) return null;

  const bytes = value.match(/.{2}/g) || [];
  const bits = TVR_BITS.map(bitDef => {
    const byteValue = parseInt(bytes[bitDef.byte - 1], 16);
    const mask = 1 << (bitDef.bit - 1);

    return {
      ...bitDef,
      active: (byteValue & mask) !== 0,
    };
  });

  return {
    value,
    bytes,
    bits,
    activeBits: bits.filter(bit => bit.active),
  };
};

const groupedBits = TVR_BITS.reduce<Record<string, TvrBit[]>>((groups, bit) => {
  if (!groups[bit.category]) groups[bit.category] = [];
  groups[bit.category].push(bit);
  return groups;
}, {});

interface TvrDecoderProps {
  className?: string;
}

const TvrDecoder = ({ className = '' }: TvrDecoderProps) => {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<DecodeResult | null>(null);
  const [showAllBits, setShowAllBits] = useState(false);
  const cleanedValue = cleanTvrInput(input);
  const isComplete = cleanedValue.length === 10;

  const categoryStats = useMemo(() => {
    if (!decoded) return {};

    return Object.entries(groupedBits).reduce<Record<string, number>>((stats, [category, bits]) => {
      stats[category] = bits.filter(bit => decoded.bits.some(decodedBit =>
        decodedBit.byte === bit.byte && decodedBit.bit === bit.bit && decodedBit.active
      )).length;
      return stats;
    }, {});
  }, [decoded]);

  const handleDecode = useCallback(() => {
    setDecoded(decodeTvr(input));
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setDecoded(null);
  }, []);

  const handleExample = useCallback((value: string) => {
    setInput(value);
    setDecoded(decodeTvr(value));
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
          Tag 95 - TVR Decoder
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          Decode EMV Terminal Verification Results, a 5-byte bit field from tag 95
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">
          TVR value
        </label>
        <div className="flex flex-col xl:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const next = e.target.value.toUpperCase().replace(/[^0-9A-Fa-f\s]/g, '');
                setInput(next);
                setDecoded(decodeTvr(next));
              }}
              placeholder="8000000000 or 95 05 8000000000"
              className="w-full pl-3 pr-16 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[11px] font-mono ${
              isComplete
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
            }`}>
              {cleanedValue.length}/10
            </span>
          </div>

          <div className="flex flex-wrap gap-2 xl:shrink-0">
          <button
            onClick={handleDecode}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium min-w-20"
          >
            Decode
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm min-w-16"
          >
            Clear
          </button>
          <button
            onClick={() => setShowAllBits(prev => !prev)}
            className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-sm min-w-20"
          >
            {showAllBits ? 'Active Only' : 'All Bits'}
          </button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">Raw TVR is 5 bytes / 10 hex characters.</p>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map(example => (
            <button
              key={example.value}
              onClick={() => handleExample(example.value)}
              title={example.label}
              className="px-2 py-1 text-[11px] rounded border bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors font-mono"
            >
              {example.value}
            </button>
          ))}
        </div>
      </div>

      {input && !isComplete && (
        <div className="mb-4 p-3 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs">
          Enter a complete 5-byte TVR value. Raw TVR values are 10 hex characters.
        </div>
      )}

      {decoded && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Decoded TVR</p>
                <p className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300">{decoded.value}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Active Flags</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{decoded.activeBits.length}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {decoded.bytes.map((byte, index) => (
                  <span
                    key={`${byte}-${index}`}
                    title={`Byte ${index + 1}`}
                    className="px-2 py-1 rounded border border-blue-200 dark:border-blue-900/70 bg-white dark:bg-black font-mono text-sm font-bold text-blue-600 dark:text-blue-400"
                  >
                    {byte}
                  </span>
                ))}
              </div>
            </div>

            {decoded.activeBits.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {decoded.activeBits.map(bit => (
                  <span
                    key={`${bit.byte}-${bit.bit}`}
                    className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px]"
                  >
                    B{bit.byte}.{bit.bit} {bit.label}
                  </span>
                ))}
              </div>
            )}

            {decoded.activeBits.length === 0 && (
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">No TVR flags are set.</p>
            )}
          </div>

          {showAllBits && (
            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
                Byte Breakdown
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {decoded.bytes.map((byte, index) => (
                <div key={`${byte}-${index}`} className="text-center">
                  <div className="bg-white dark:bg-black border border-blue-500 rounded p-2">
                    <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">{byte}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">Byte {index + 1}</p>
                </div>
              ))}
              </div>
            </div>
          )}

          <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">TVR Bit Results</h3>
              <span className="text-xs text-slate-500 dark:text-zinc-500">Tag 95 format: b5</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-zinc-900">
              {Object.entries(groupedBits).map(([category, bits]) => {
                const visibleBits = showAllBits ? bits : bits.filter(bit =>
                  decoded.bits.some(decodedBit => decodedBit.byte === bit.byte && decodedBit.bit === bit.bit && decodedBit.active)
                );

                if (!showAllBits && visibleBits.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-900/70 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        {category}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-500">
                        {categoryStats[category] || 0} active
                      </span>
                    </div>
                    {visibleBits.map(bit => {
                      const active = decoded.bits.find(decodedBit => decodedBit.byte === bit.byte && decodedBit.bit === bit.bit)?.active;
                      return (
                        <div
                          key={`${bit.byte}-${bit.bit}`}
                          className={`px-3 py-2 flex items-center gap-2 ${active ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50'}`}
                        >
                          <span className={`w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold border ${
                            active
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                              : 'bg-white dark:bg-black border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500'
                          }`}>
                            {active ? '1' : '0'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs sm:text-sm ${active ? 'font-semibold text-emerald-800 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'}`}>
                              {bit.label}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                              Byte {bit.byte}, bit {bit.bit}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TvrDecoder;
