import { useCallback, useMemo, useState } from 'react';

type IadResult = {
  value: string;
  bytes: string[];
  declaredLength: number | null;
  dki: string | null;
  cvn: string | null;
  likelyCvr: string[];
  discretionary: string[];
};

type CvrBitDefinition = {
  bytePosition: number;
  bit: number;
  label: string;
  description: string;
};

// CVR bit definitions based on EMV specification
const CVR_BIT_DEFINITIONS: CvrBitDefinition[] = [
  // Byte 3 (first CVR byte)
  { bytePosition: 3, bit: 8, label: 'b8', description: 'Last online transaction not completed' },
  { bytePosition: 3, bit: 7, label: 'b7', description: 'PIN Try Limit exceeded' },
  { bytePosition: 3, bit: 6, label: 'b6', description: 'Exceeded velocity checking counters' },
  { bytePosition: 3, bit: 5, label: 'b5', description: 'New card' },
  { bytePosition: 3, bit: 4, label: 'b4', description: 'Issuer Authentication failure on last online transaction' },
  { bytePosition: 3, bit: 3, label: 'b3', description: 'Issuer Authentication not performed after online authorization' },
  { bytePosition: 3, bit: 2, label: 'b2', description: 'Application blocked by card because PIN Try Limit exceeded' },
  { bytePosition: 3, bit: 1, label: 'b1', description: 'Offline static data authentication failed on last transaction' },
  // Byte 4 (second CVR byte)
  { bytePosition: 4, bit: 8, label: 'b8', description: 'Reserved for future use (RFU)' },
  { bytePosition: 4, bit: 7, label: 'b7', description: 'Reserved for future use (RFU)' },
  { bytePosition: 4, bit: 6, label: 'b6', description: 'Reserved for future use (RFU)' },
  { bytePosition: 4, bit: 5, label: 'b5', description: 'Reserved for future use (RFU)' },
  { bytePosition: 4, bit: 4, label: 'b4', description: 'Reserved for future use (RFU)' },
  { bytePosition: 4, bit: 3, label: 'b3', description: 'Reserved for future use (RFU)' },
  { bytePosition: 4, bit: 2, label: 'b2', description: 'Reserved for future use (RFU)' },
  { bytePosition: 4, bit: 1, label: 'b1', description: 'Reserved for future use (RFU)' },
  // Byte 5 (third CVR byte)
  { bytePosition: 5, bit: 8, label: 'b8', description: 'Reserved for future use (RFU)' },
  { bytePosition: 5, bit: 7, label: 'b7', description: 'Reserved for future use (RFU)' },
  { bytePosition: 5, bit: 6, label: 'b6', description: 'Reserved for future use (RFU)' },
  { bytePosition: 5, bit: 5, label: 'b5', description: 'Reserved for future use (RFU)' },
  { bytePosition: 5, bit: 4, label: 'b4', description: 'Reserved for future use (RFU)' },
  { bytePosition: 5, bit: 3, label: 'b3', description: 'Reserved for future use (RFU)' },
  { bytePosition: 5, bit: 2, label: 'b2', description: 'Reserved for future use (RFU)' },
  { bytePosition: 5, bit: 1, label: 'b1', description: 'Reserved for future use (RFU)' },
  // Byte 6 (fourth CVR byte)
  { bytePosition: 6, bit: 8, label: 'b8', description: 'Reserved for future use (RFU)' },
  { bytePosition: 6, bit: 7, label: 'b7', description: 'Reserved for future use (RFU)' },
  { bytePosition: 6, bit: 6, label: 'b6', description: 'Reserved for future use (RFU)' },
  { bytePosition: 6, bit: 5, label: 'b5', description: 'Reserved for future use (RFU)' },
  { bytePosition: 6, bit: 4, label: 'b4', description: 'Reserved for future use (RFU)' },
  { bytePosition: 6, bit: 3, label: 'b3', description: 'Reserved for future use (RFU)' },
  { bytePosition: 6, bit: 2, label: 'b2', description: 'Reserved for future use (RFU)' },
  { bytePosition: 6, bit: 1, label: 'b1', description: 'Reserved for future use (RFU)' },
];

const EXAMPLES = [
  { value: '06010A03A00000', label: 'Common short IAD' },
  { value: '1F0302A0000000000000000000000000000000000000000000000000000000', label: 'Long issuer data' },
  { value: '9F10 07 06010A03A00000', label: 'Tag 9F10 TLV' },
  { value: '9F10 81 07 06010A03A00000', label: 'Long-form length TLV' },
];

const parseIadInput = (input: string) => {
  const hex = input.toUpperCase().replace(/[^0-9A-F]/g, '');

  if (!hex.startsWith('9F10')) {
    return {
      value: hex.slice(0, 64),
      declaredLength: null,
    };
  }

  const body = hex.slice(4);
  if (body.length < 2) {
    return { value: '', declaredLength: null };
  }

  const firstLengthByte = parseInt(body.slice(0, 2), 16);
  let length = firstLengthByte;
  let valueOffset = 2;

  if (firstLengthByte === 0x81 && body.length >= 4) {
    length = parseInt(body.slice(2, 4), 16);
    valueOffset = 4;
  } else if (firstLengthByte === 0x82 && body.length >= 6) {
    length = parseInt(body.slice(2, 6), 16);
    valueOffset = 6;
  }

  return {
    value: body.slice(valueOffset, valueOffset + length * 2),
    declaredLength: length,
  };
};

const decodeIad = (input: string): IadResult | null => {
  const parsed = parseIadInput(input);
  const value = parsed.value;

  if (value.length === 0 || value.length % 2 !== 0 || value.length > 64) return null;

  const bytes = value.match(/.{2}/g) || [];

  return {
    value,
    bytes,
    declaredLength: parsed.declaredLength,
    dki: bytes[0] || null,
    cvn: bytes[1] || null,
    likelyCvr: bytes.slice(2, Math.min(bytes.length, 6)),
    discretionary: bytes.slice(Math.min(bytes.length, 6)),
  };
};

const byteToBits = (byte: string) =>
  parseInt(byte, 16).toString(2).padStart(8, '0').split('');

interface IadDecoderProps {
  className?: string;
}

type TabType = 'general' | 'cvr';

const IadDecoder = ({ className = '' }: IadDecoderProps) => {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<IadResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [selectedCvrByte, setSelectedCvrByte] = useState(1);
  const parsed = parseIadInput(input);
  const byteCount = parsed.value.length / 2;
  const isComplete = parsed.value.length > 0 && parsed.value.length % 2 === 0 && parsed.value.length <= 64;

  const cvrBytes = useMemo(() => {
    if (!decoded || decoded.likelyCvr.length === 0) return [];
    return decoded.likelyCvr.map((byte, index) => ({
      index: index + 1,
      value: byte,
      bits: byteToBits(byte),
    }));
  }, [decoded]);

  const selectedCvrData = useMemo(() => {
    if (!decoded || cvrBytes.length === 0 || selectedCvrByte > cvrBytes.length) return null;
    return cvrBytes[selectedCvrByte - 1];
  }, [decoded, cvrBytes, selectedCvrByte]);

  const cvrBitDefinitions = useMemo(() => {
    if (!selectedCvrData) return [];
    return CVR_BIT_DEFINITIONS.filter(def => def.bytePosition === selectedCvrByte + 1); // +2 for DKI+CVN offset
  }, [selectedCvrByte, selectedCvrData]);

  const handleDecode = useCallback(() => {
    setDecoded(decodeIad(input));
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setDecoded(null);
  }, []);

  const handleExample = useCallback((value: string) => {
    setInput(value);
    setDecoded(decodeIad(value));
  }, []);

  const getBitValue = (bitIndex: number): boolean => {
    if (!selectedCvrData) return false;
    const bitPosition = 8 - bitIndex; // b8 is index 0, b1 is index 7
    return selectedCvrData.bits[bitIndex] === '1';
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Tag 9F10 - IAD Decoder</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          Decode Issuer Application Data length, leading bytes, CVR, and issuer discretionary data.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">IAD value</label>
        <div className="flex flex-col xl:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const next = e.target.value.toUpperCase().replace(/[^0-9A-Fa-f\s]/g, '');
                setInput(next);
                setDecoded(decodeIad(next));
              }}
              placeholder="06010A03A00000 or 9F10 07 06010A03A00000"
              className="w-full pl-3 pr-16 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[11px] font-mono ${
              isComplete ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
            }`}>
              {byteCount || 0}/32
            </span>
          </div>

          <div className="flex flex-wrap gap-2 xl:shrink-0">
            <button onClick={handleDecode} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium min-w-20">Decode</button>
            <button onClick={handleClear} className="px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm min-w-16">Clear</button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">Raw 9F10 is variable length, up to 32 bytes. Pasted TLV length is parsed automatically.</p>
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
          Enter an even-length IAD value up to 32 bytes, or paste a complete 9F10 TLV.
        </div>
      )}

      {decoded && (
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('cvr')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'cvr'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
              disabled={cvrBytes.length === 0}
            >
              CVR
            </button>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Decoded IAD</p>
                    <p className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300 break-all">{decoded.value}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Length</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                      {decoded.bytes.length} byte{decoded.bytes.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {decoded.bytes.map((byte, index) => (
                    <span key={`${byte}-${index}`} title={`Byte ${index + 1}`} className="px-2 py-1 rounded border border-blue-200 dark:border-blue-900/70 bg-white dark:bg-black font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                      {byte}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Declared Length</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">{decoded.declaredLength ?? 'Raw input'}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">DKI / Byte 1</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-800 dark:text-white">{decoded.dki || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">CVN / Byte 2</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-800 dark:text-white">{decoded.cvn || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">CVR Bytes</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-800 dark:text-white">{decoded.likelyCvr.join('') || 'N/A'}</p>
                </div>
              </div>

              {decoded.discretionary.length > 0 && (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Issuer Discretionary Data</p>
                  <p className="mt-1 font-mono text-sm text-slate-800 dark:text-white break-all">{decoded.discretionary.join('')}</p>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                IAD contents are issuer and payment-system specific. The DKI/CVN/CVR split is a common practical view, not a universal EMV structure.
              </p>
            </div>
          )}

          {activeTab === 'cvr' && cvrBytes.length > 0 && (
            <div className="space-y-4">
              {/* Byte Selector */}
              <div className="flex flex-wrap gap-2">
                {cvrBytes.map((cvrByte) => (
                  <button
                    key={cvrByte.index}
                    onClick={() => setSelectedCvrByte(cvrByte.index)}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      selectedCvrByte === cvrByte.index
                        ? 'border-2 border-black dark:border-white bg-white dark:bg-black'
                        : 'border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Byte {cvrByte.index}
                  </button>
                ))}
              </div>

              {/* CVR Table */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">b8</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">b7</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">b6</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">b5</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">b4</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">b3</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">b2</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">b1</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cvrBitDefinitions.map((def) => {
                      const isActive = getBitValue(def.bit);
                      return (
                        <tr
                          key={`${def.bytePosition}-${def.bit}`}
                          className={`border-b border-slate-100 dark:border-zinc-900 ${
                            isActive ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                          }`}
                        >
                          {[8, 7, 6, 5, 4, 3, 2, 1].map((bitPos) => (
                            <td key={bitPos} className="px-3 py-2 text-center">
                              {bitPos === def.bit ? (
                                <span className={`inline-flex w-6 h-6 items-center justify-center text-xs font-mono font-bold rounded ${
                                  isActive
                                    ? 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                                }`}>
                                  {isActive ? '1' : '0'}
                                </span>
                              ) : null}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-xs text-slate-700 dark:text-zinc-300">
                            {def.description}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                CVR contents are payment-system specific. The bit definitions shown are based on common EMV specifications.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IadDecoder;
