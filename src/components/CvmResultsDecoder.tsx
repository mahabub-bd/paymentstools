import { useCallback, useState } from 'react';

type CvmResult = {
  value: string;
  bytes: string[];
  cvmCode: number;
  cvmMethod: string;
  continueOnFail: boolean;
  conditionCode: string;
  condition: string;
  resultCode: string;
  result: string;
};

const CVM_METHODS: Record<number, string> = {
  0x00: 'Fail CVM processing',
  0x01: 'Plaintext PIN verification performed by ICC',
  0x02: 'Enciphered PIN verified online',
  0x03: 'Plaintext PIN verification by ICC and signature',
  0x04: 'Enciphered PIN verification performed by ICC',
  0x05: 'Enciphered PIN verification by ICC and signature',
  0x1e: 'Signature',
  0x1f: 'No CVM performed',
  0x3f: 'CVM not available',
};

const CVM_CONDITIONS: Record<string, string> = {
  '00': 'Always',
  '01': 'If unattended cash',
  '02': 'If not unattended cash and not manual cash and not purchase with cashback',
  '03': 'If terminal supports the CVM',
  '04': 'If manual cash',
  '05': 'If purchase with cashback',
  '06': 'If transaction is in application currency and under X value',
  '07': 'If transaction is in application currency and over X value',
  '08': 'If transaction is in application currency and under Y value',
  '09': 'If transaction is in application currency and over Y value',
};

const CVM_RESULTS: Record<string, string> = {
  '00': 'Unknown',
  '01': 'Failed',
  '02': 'Successful',
};

const EXAMPLES = [
  { value: '1E0302', label: 'Signature successful' },
  { value: '020302', label: 'Online PIN successful' },
  { value: '1F0002', label: 'No CVM successful' },
  { value: '3F0000', label: 'CVM not available' },
  { value: '9F34 03 1E0302', label: 'Tag 9F34 TLV' },
];

const cleanCvmInput = (input: string) => {
  const hex = input.toUpperCase().replace(/[^0-9A-F]/g, '');

  if (hex.startsWith('9F3403') && hex.length >= 12) {
    return hex.slice(6, 12);
  }

  if (hex.startsWith('9F34') && hex.length >= 10) {
    return hex.slice(4, 10);
  }

  return hex.slice(0, 6);
};

const decodeCvm = (input: string): CvmResult | null => {
  const value = cleanCvmInput(input);
  if (value.length !== 6) return null;

  const bytes = value.match(/.{2}/g) || [];
  const firstByte = parseInt(bytes[0], 16);
  const cvmCode = firstByte & 0x3f;
  const conditionCode = bytes[1];
  const resultCode = bytes[2];

  return {
    value,
    bytes,
    cvmCode,
    cvmMethod: CVM_METHODS[cvmCode] || 'RFU or payment-system specific CVM',
    continueOnFail: (firstByte & 0x40) !== 0,
    conditionCode,
    condition: CVM_CONDITIONS[conditionCode] || 'RFU or payment-system specific condition',
    resultCode,
    result: CVM_RESULTS[resultCode] || 'RFU or unknown result',
  };
};

interface CvmResultsDecoderProps {
  className?: string;
}

const CvmResultsDecoder = ({ className = '' }: CvmResultsDecoderProps) => {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<CvmResult | null>(null);
  const cleanedValue = cleanCvmInput(input);
  const isComplete = cleanedValue.length === 6;

  const handleDecode = useCallback(() => {
    setDecoded(decodeCvm(input));
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setDecoded(null);
  }, []);

  const handleExample = useCallback((value: string) => {
    setInput(value);
    setDecoded(decodeCvm(value));
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Tag 9F34 - CVM Results Decoder</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs">Decode the 3-byte Cardholder Verification Method result returned by the terminal.</p>
      </div>

      <div className="mb-4">
        <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">CVM Results value</label>
        <div className="flex flex-col xl:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const next = e.target.value.toUpperCase().replace(/[^0-9A-Fa-f\s]/g, '');
                setInput(next);
                setDecoded(decodeCvm(next));
              }}
              placeholder="1E0302 or 9F34 03 1E0302"
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
          </div>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">Raw 9F34 is 3 bytes / 6 hex characters.</p>
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
          Enter a complete 3-byte CVM Results value.
        </div>
      )}

      {decoded && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Decoded 9F34</p>
                <p className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300">{decoded.value}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {decoded.bytes.map((byte, index) => (
                  <span key={`${byte}-${index}`} title={`Byte ${index + 1}`} className="px-2 py-1 rounded border border-blue-200 dark:border-blue-900/70 bg-white dark:bg-black font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {byte}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">CVM Performed</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">{decoded.cvmMethod}</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">Code {decoded.cvmCode.toString(16).toUpperCase().padStart(2, '0')} • {decoded.continueOnFail ? 'Try next CVM if failed' : 'Do not try next CVM if failed'}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Condition</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">{decoded.condition}</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">Condition code {decoded.conditionCode}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Result</p>
              <p className={`mt-1 text-sm font-semibold ${decoded.resultCode === '02' ? 'text-emerald-700 dark:text-emerald-300' : decoded.resultCode === '01' ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-white'}`}>{decoded.result}</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">Result code {decoded.resultCode}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CvmResultsDecoder;
