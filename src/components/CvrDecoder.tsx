import { useCallback, useMemo, useState } from 'react';

type CvrBit = {
  byte: number;
  bit: number;
  label: string;
  category: string;
};

type DecodeResult = {
  value: string;
  bytes: string[];
  bits: Array<CvrBit & { active: boolean }>;
  activeBits: CvrBit[];
};

const CVR_BITS: CvrBit[] = [
  // Byte 1 (first CVR byte, byte 3 of IAD)
  { byte: 1, bit: 8, label: 'Last online transaction not completed', category: 'Transaction Status' },
  { byte: 1, bit: 7, label: 'PIN Try Limit exceeded', category: 'PIN Status' },
  { byte: 1, bit: 6, label: 'Exceeded velocity checking counters', category: 'Risk Management' },
  { byte: 1, bit: 5, label: 'New card', category: 'Card Status' },
  { byte: 1, bit: 4, label: 'Issuer Authentication failure on last online transaction', category: 'Authentication' },
  { byte: 1, bit: 3, label: 'Issuer Authentication not performed after online authorization', category: 'Authentication' },
  { byte: 1, bit: 2, label: 'Application blocked by card because PIN Try Limit exceeded', category: 'PIN Status' },
  { byte: 1, bit: 1, label: 'Offline static data authentication failed on last transaction', category: 'Authentication' },
  // Byte 2 (second CVR byte, byte 4 of IAD)
  { byte: 2, bit: 8, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 2, bit: 7, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 2, bit: 6, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 2, bit: 5, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 2, bit: 4, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 2, bit: 3, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 2, bit: 2, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 2, bit: 1, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  // Byte 3 (third CVR byte, byte 5 of IAD)
  { byte: 3, bit: 8, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 3, bit: 7, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 3, bit: 6, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 3, bit: 5, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 3, bit: 4, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 3, bit: 3, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 3, bit: 2, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 3, bit: 1, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  // Byte 4 (fourth CVR byte, byte 6 of IAD)
  { byte: 4, bit: 8, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 4, bit: 7, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 4, bit: 6, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 4, bit: 5, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 4, bit: 4, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 4, bit: 3, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 4, bit: 2, label: 'Reserved for future use (RFU)', category: 'Reserved' },
  { byte: 4, bit: 1, label: 'Reserved for future use (RFU)', category: 'Reserved' },
];

const EXAMPLES = [
  { value: '80000000', label: 'Last online transaction not completed' },
  { value: '40000000', label: 'PIN Try Limit exceeded' },
  { value: '20000000', label: 'Exceeded velocity checking counters' },
  { value: '10000000', label: 'New card' },
  { value: '08000000', label: 'Issuer Authentication failure' },
  { value: '01000000', label: 'SDA failed on last transaction' },
  { value: '88000000', label: 'Multiple issues (last online + PIN try limit)' },
  { value: '00000000', label: 'No issues (all clear)' },
];

const cleanCvrInput = (input: string) => {
  const hex = input.toUpperCase().replace(/[^0-9A-F]/g, '');
  return hex.slice(0, 8);
};

const decodeCvr = (input: string): DecodeResult | null => {
  const value = cleanCvrInput(input);
  if (value.length === 0 || value.length % 2 !== 0) return null;

  const bytes = value.match(/.{2}/g) || [];
  const bits = CVR_BITS.map(bitDef => {
    if (bitDef.byte > bytes.length) {
      return { ...bitDef, active: false };
    }
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

const groupedBits = CVR_BITS.reduce<Record<string, CvrBit[]>>((groups, bit) => {
  if (!groups[bit.category]) groups[bit.category] = [];
  groups[bit.category].push(bit);
  return groups;
}, {});

interface CvrDecoderProps {
  className?: string;
}

const CvrDecoder = ({ className = '' }: CvrDecoderProps) => {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<DecodeResult | null>(null);
  const [showAllBits, setShowAllBits] = useState(false);
  const cleanedValue = cleanCvrInput(input);
  const byteCount = Math.ceil(cleanedValue.length / 2);
  const isComplete = cleanedValue.length > 0 && cleanedValue.length <= 8 && cleanedValue.length % 2 === 0;

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
    setDecoded(decodeCvr(input));
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setDecoded(null);
  }, []);

  const handleExample = useCallback((value: string) => {
    setInput(value);
    setDecoded(decodeCvr(value));
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
          CVR Decoder
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          Decode Card Verification Results from IAD (bytes 3-6 of Tag 9F10) or standalone CVR values
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">
          CVR value
        </label>
        <div className="flex flex-col xl:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const next = e.target.value.toUpperCase().replace(/[^0-9A-Fa-f\s]/g, '');
                setInput(next);
                setDecoded(decodeCvr(next));
              }}
              placeholder="80000000 or up to 4 bytes"
              className="w-full pl-3 pr-16 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[11px] font-mono ${
              isComplete
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
            }`}>
              {byteCount}/4
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
        <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">CVR is 1-4 bytes (2-8 hex characters). Bytes 3-6 from Tag 9F10 IAD.</p>
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
          Enter an even-length CVR value (1-4 bytes, 2-8 hex characters).
        </div>
      )}

      {decoded && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Decoded CVR</p>
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
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">No CVR flags are set - card status is clear.</p>
            )}
          </div>

          {showAllBits && decoded.bytes.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
                Byte Breakdown
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">CVR Bit Results</h3>
              <span className="text-xs text-slate-500 dark:text-zinc-500">Up to 4 bytes</span>
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

          <p className="text-[11px] text-slate-500 dark:text-zinc-500">
            CVR contents are payment-system specific. The bit definitions shown are based on common EMV specifications. Bytes 2-4 are typically RFU.
          </p>
        </div>
      )}
    </div>
  );
};

export default CvrDecoder;
