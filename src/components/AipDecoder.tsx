import { useCallback, useMemo, useState } from 'react';

type AipBit = {
  byte: number;
  bit: number;
  label: string;
  category: string;
};

type AipResult = {
  value: string;
  bytes: string[];
  bits: Array<AipBit & { active: boolean }>;
  activeBits: AipBit[];
};

const AIP_BITS: AipBit[] = [
  { byte: 1, bit: 8, label: 'RFU', category: 'Application Capabilities' },
  { byte: 1, bit: 7, label: 'Static Data Authentication (SDA) supported', category: 'Application Capabilities' },
  { byte: 1, bit: 6, label: 'Dynamic Data Authentication (DDA) supported', category: 'Application Capabilities' },
  { byte: 1, bit: 5, label: 'Cardholder verification supported', category: 'Application Capabilities' },
  { byte: 1, bit: 4, label: 'Terminal risk management is to be performed', category: 'Application Capabilities' },
  { byte: 1, bit: 3, label: 'Issuer authentication supported', category: 'Application Capabilities' },
  { byte: 1, bit: 2, label: 'RFU', category: 'Application Capabilities' },
  { byte: 1, bit: 1, label: 'Combined DDA/Application Cryptogram Generation (CDA) supported', category: 'Application Capabilities' },
  { byte: 2, bit: 8, label: 'RFU', category: 'Reserved Bits' },
  { byte: 2, bit: 7, label: 'RFU', category: 'Reserved Bits' },
  { byte: 2, bit: 6, label: 'RFU', category: 'Reserved Bits' },
  { byte: 2, bit: 5, label: 'RFU', category: 'Reserved Bits' },
  { byte: 2, bit: 4, label: 'RFU', category: 'Reserved Bits' },
  { byte: 2, bit: 3, label: 'RFU', category: 'Reserved Bits' },
  { byte: 2, bit: 2, label: 'RFU', category: 'Reserved Bits' },
  { byte: 2, bit: 1, label: 'RFU', category: 'Reserved Bits' },
];

const EXAMPLES = [
  { value: '1800', label: 'CVM and terminal risk management' },
  { value: '3800', label: 'DDA, CVM, and terminal risk management' },
  { value: '5800', label: 'SDA, CVM, and terminal risk management' },
  { value: '5C00', label: 'SDA, CVM, TRM, issuer auth' },
  { value: '82 02 3800', label: 'Tag 82 TLV' },
];

const cleanAipInput = (input: string) => {
  const hex = input.toUpperCase().replace(/[^0-9A-F]/g, '');

  if (hex.startsWith('8202') && hex.length >= 8) {
    return hex.slice(4, 8);
  }

  if (hex.startsWith('82') && hex.length >= 6) {
    return hex.slice(2, 6);
  }

  return hex.slice(0, 4);
};

const decodeAip = (input: string): AipResult | null => {
  const value = cleanAipInput(input);
  if (value.length !== 4) return null;

  const bytes = value.match(/.{2}/g) || [];
  const bits = AIP_BITS.map(bitDef => {
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

const groupedBits = AIP_BITS.reduce<Record<string, AipBit[]>>((groups, bit) => {
  if (!groups[bit.category]) groups[bit.category] = [];
  groups[bit.category].push(bit);
  return groups;
}, {});

interface AipDecoderProps {
  className?: string;
}

const AipDecoder = ({ className = '' }: AipDecoderProps) => {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<AipResult | null>(null);
  const [showAllBits, setShowAllBits] = useState(false);
  const cleanedValue = cleanAipInput(input);
  const isComplete = cleanedValue.length === 4;

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
    setDecoded(decodeAip(input));
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setDecoded(null);
  }, []);

  const handleExample = useCallback((value: string) => {
    setInput(value);
    setDecoded(decodeAip(value));
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Tag 82 - AIP Decoder</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs">Decode the 2-byte Application Interchange Profile capability bit map.</p>
      </div>

      <div className="mb-4">
        <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">AIP value</label>
        <div className="flex flex-col xl:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const next = e.target.value.toUpperCase().replace(/[^0-9A-Fa-f\s]/g, '');
                setInput(next);
                setDecoded(decodeAip(next));
              }}
              placeholder="3800 or 82 02 3800"
              className="w-full pl-3 pr-14 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[11px] font-mono ${
              isComplete ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
            }`}>
              {cleanedValue.length}/4
            </span>
          </div>

          <div className="flex flex-wrap gap-2 xl:shrink-0">
            <button onClick={handleDecode} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium min-w-20">Decode</button>
            <button onClick={handleClear} className="px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm min-w-16">Clear</button>
            <button onClick={() => setShowAllBits(prev => !prev)} className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-sm min-w-20">
              {showAllBits ? 'Active Only' : 'All Bits'}
            </button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">Raw AIP is 2 bytes / 4 hex characters.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {EXAMPLES.map(example => (
          <button key={example.value} onClick={() => handleExample(example.value)} title={example.label} className="px-2 py-1 text-[11px] rounded border bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors font-mono">
            {example.value}
          </button>
        ))}
      </div>

      {input && !isComplete && (
        <div className="mb-4 p-3 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs">
          Enter a complete 2-byte AIP value.
        </div>
      )}

      {decoded && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Decoded AIP</p>
                <p className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300">{decoded.value}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Active Flags</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{decoded.activeBits.length}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {decoded.bytes.map((byte, index) => (
                  <span key={`${byte}-${index}`} title={`Byte ${index + 1}`} className="px-2 py-1 rounded border border-blue-200 dark:border-blue-900/70 bg-white dark:bg-black font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {byte}
                  </span>
                ))}
              </div>
            </div>

            {decoded.activeBits.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {decoded.activeBits.map(bit => (
                  <span key={`${bit.byte}-${bit.bit}`} className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px]">
                    B{bit.byte}.{bit.bit} {bit.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">AIP Bit Results</h3>
              <span className="text-xs text-slate-500 dark:text-zinc-500">Tag 82 format: b2</span>
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
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{category}</span>
                      <span className="text-xs text-slate-500 dark:text-zinc-500">{categoryStats[category] || 0} active</span>
                    </div>
                    {visibleBits.map(bit => {
                      const active = decoded.bits.find(decodedBit => decodedBit.byte === bit.byte && decodedBit.bit === bit.bit)?.active;
                      return (
                        <div key={`${bit.byte}-${bit.bit}`} className={`px-3 py-2 flex items-center gap-2 ${active ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50'}`}>
                          <span className={`w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold border ${
                            active ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-black border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500'
                          }`}>
                            {active ? '1' : '0'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs sm:text-sm ${active ? 'font-semibold text-emerald-800 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'}`}>{bit.label}</p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-500">Byte {bit.byte}, bit {bit.bit}</p>
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

export default AipDecoder;
