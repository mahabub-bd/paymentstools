import { useCallback, useMemo, useState } from 'react';

type CapabilityBit = {
  byte: number;
  bit: number;
  label: string;
  category: string;
};

type TerminalCapabilitiesResult = {
  value: string;
  bytes: string[];
  bits: Array<CapabilityBit & { active: boolean }>;
  activeBits: CapabilityBit[];
};

const CAPABILITY_BITS: CapabilityBit[] = [
  { byte: 1, bit: 8, label: 'Manual key entry supported', category: 'Card Data Input' },
  { byte: 1, bit: 7, label: 'Magnetic stripe supported', category: 'Card Data Input' },
  { byte: 1, bit: 6, label: 'ICC with contacts supported', category: 'Card Data Input' },
  { byte: 1, bit: 5, label: 'RFU', category: 'Card Data Input' },
  { byte: 1, bit: 4, label: 'RFU', category: 'Card Data Input' },
  { byte: 1, bit: 3, label: 'RFU', category: 'Card Data Input' },
  { byte: 1, bit: 2, label: 'RFU', category: 'Card Data Input' },
  { byte: 1, bit: 1, label: 'RFU', category: 'Card Data Input' },
  { byte: 2, bit: 8, label: 'Plaintext PIN for ICC verification supported', category: 'CVM' },
  { byte: 2, bit: 7, label: 'Enciphered PIN for online verification supported', category: 'CVM' },
  { byte: 2, bit: 6, label: 'Signature supported', category: 'CVM' },
  { byte: 2, bit: 5, label: 'Enciphered PIN for offline verification supported', category: 'CVM' },
  { byte: 2, bit: 4, label: 'No CVM required supported', category: 'CVM' },
  { byte: 2, bit: 3, label: 'RFU', category: 'CVM' },
  { byte: 2, bit: 2, label: 'RFU', category: 'CVM' },
  { byte: 2, bit: 1, label: 'RFU', category: 'CVM' },
  { byte: 3, bit: 8, label: 'Static Data Authentication (SDA) supported', category: 'Security' },
  { byte: 3, bit: 7, label: 'Dynamic Data Authentication (DDA) supported', category: 'Security' },
  { byte: 3, bit: 6, label: 'Card capture supported', category: 'Security' },
  { byte: 3, bit: 5, label: 'RFU', category: 'Security' },
  { byte: 3, bit: 4, label: 'Combined DDA/Application Cryptogram Generation (CDA) supported', category: 'Security' },
  { byte: 3, bit: 3, label: 'RFU', category: 'Security' },
  { byte: 3, bit: 2, label: 'RFU', category: 'Security' },
  { byte: 3, bit: 1, label: 'RFU', category: 'Security' },
];

const EXAMPLES = [
  { value: 'E0F8C8', label: 'Common full-featured terminal' },
  { value: 'E0B0C8', label: 'ICC, magstripe, manual, online PIN/signature' },
  { value: '60F0C8', label: 'Magstripe and ICC with common CVMs' },
  { value: '9F33 03 E0F8C8', label: 'Tag 9F33 TLV' },
];

const cleanTerminalCapabilitiesInput = (input: string) => {
  const hex = input.toUpperCase().replace(/[^0-9A-F]/g, '');

  if (hex.startsWith('9F3303') && hex.length >= 12) {
    return hex.slice(6, 12);
  }

  if (hex.startsWith('9F33') && hex.length >= 10) {
    return hex.slice(4, 10);
  }

  return hex.slice(0, 6);
};

const decodeTerminalCapabilities = (input: string): TerminalCapabilitiesResult | null => {
  const value = cleanTerminalCapabilitiesInput(input);
  if (value.length !== 6) return null;

  const bytes = value.match(/.{2}/g) || [];
  const bits = CAPABILITY_BITS.map(bitDef => {
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

const groupedBits = CAPABILITY_BITS.reduce<Record<string, CapabilityBit[]>>((groups, bit) => {
  if (!groups[bit.category]) groups[bit.category] = [];
  groups[bit.category].push(bit);
  return groups;
}, {});

interface TerminalCapabilitiesDecoderProps {
  className?: string;
}

const TerminalCapabilitiesDecoder = ({ className = '' }: TerminalCapabilitiesDecoderProps) => {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<TerminalCapabilitiesResult | null>(null);
  const [showAllBits, setShowAllBits] = useState(false);
  const cleanedValue = cleanTerminalCapabilitiesInput(input);
  const isComplete = cleanedValue.length === 6;

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
    setDecoded(decodeTerminalCapabilities(input));
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setDecoded(null);
  }, []);

  const handleExample = useCallback((value: string) => {
    setInput(value);
    setDecoded(decodeTerminalCapabilities(value));
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Tag 9F33 - Terminal Capabilities Decoder</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs">Decode terminal card input, CVM, and security capability bits.</p>
      </div>

      <div className="mb-4">
        <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">Terminal Capabilities value</label>
        <div className="flex flex-col xl:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const next = e.target.value.toUpperCase().replace(/[^0-9A-Fa-f\s]/g, '');
                setInput(next);
                setDecoded(decodeTerminalCapabilities(next));
              }}
              placeholder="E0F8C8 or 9F33 03 E0F8C8"
              className="w-full pl-3 pr-14 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[11px] font-mono ${
              isComplete ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
            }`}>
              {cleanedValue.length}/6
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
        <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">Raw 9F33 is 3 bytes / 6 hex characters.</p>
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
          Enter a complete 3-byte Terminal Capabilities value.
        </div>
      )}

      {decoded && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Decoded 9F33</p>
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
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Terminal Capability Bits</h3>
              <span className="text-xs text-slate-500 dark:text-zinc-500">Tag 9F33 format: b3</span>
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

export default TerminalCapabilitiesDecoder;
