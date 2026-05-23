import { useState } from 'react';
import {
  parseEMVTLV,
  EMVTagCategory,
  type TLVData,
  type EMVParseResult
} from '../utils/iso8583VersionParser/emv-tlv';

interface EmvTlvDisplayProps {
  hexData: string;
  className?: string;
}

// Category colors for visual organization
const CATEGORY_COLORS: Record<EMVTagCategory, { bg: string; text: string; border: string }> = {
  [EMVTagCategory.APPLICATION]: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  [EMVTagCategory.CARD_DATA]: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  [EMVTagCategory.TERMINAL]: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  [EMVTagCategory.TRANSACTION]: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  [EMVTagCategory.SECURITY]: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  [EMVTagCategory.AMOUNT]: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  [EMVTagCategory.CURRENCY]: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  [EMVTagCategory.CVM]: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
  [EMVTagCategory.CRYPTogram]: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  [EMVTagCategory.RISK_MANAGEMENT]: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  [EMVTagCategory.ISSUER_SCRIPT]: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  [EMVTagCategory.PIN]: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  [EMVTagCategory.TRACK_DATA]: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  [EMVTagCategory.PROPRIETARY]: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800' },
  [EMVTagCategory.ERROR_INDICATION]: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', border: 'border-red-300 dark:border-red-700' },
  [EMVTagCategory.RESERVED]: { bg: 'bg-slate-50 dark:bg-slate-900/20', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800' },
  [EMVTagCategory.UNKNOWN]: { bg: 'bg-zinc-50 dark:bg-zinc-900/20', text: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-200 dark:border-zinc-800' },
};

const KEY_TAGS = ['5F34', '4F', '9F09', '9C', '9A', '9F02', '9F03', '5F2A'];

const getDisplayValue = (tlv: TLVData): string => (
  tlv.valueType === 'ASCII' ? tlv.displayValue : tlv.rawValue.toUpperCase()
);

export function EmvTlvDisplay({ hexData, className = '' }: EmvTlvDisplayProps) {
  const [searchQuery, setSearchQuery] = useState('');

  let parseResult: EMVParseResult | null = null;
  try {
    parseResult = parseEMVTLV(hexData);
  } catch {
    return (
      <div className={`p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded ${className}`}>
        <p className="text-red-700 dark:text-red-400 text-xs">Failed to parse EMV TLV data</p>
      </div>
    );
  }

  if (!parseResult || parseResult.tags.length === 0) {
    return (
      <div className={`p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded ${className}`}>
        <p className="text-slate-500 dark:text-zinc-500 text-xs">No EMV TLV data found</p>
      </div>
    );
  }

  const activeCategories = Object.entries(parseResult.summary.byCategory).filter(([_, count]) => count > 0);
  const keyTagRows = KEY_TAGS.map(tag => parseResult.tags.find(tlv => tlv.tag === tag)).filter(Boolean) as TLVData[];
  const query = searchQuery.trim().toUpperCase();
  const visibleTags = query
    ? parseResult.tags.filter(tlv => (
        tlv.tag.includes(query) ||
        tlv.tagName.toUpperCase().includes(query) ||
        tlv.category.toUpperCase().includes(query) ||
        getDisplayValue(tlv).toUpperCase().includes(query)
      ))
    : parseResult.tags;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">DE55 EMV TLV</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                {parseResult.summary.totalTags} tags, {parseResult.totalBytes} bytes, {activeCategories.length} categories
              </p>
            </div>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Filter tag, name, value"
              className="w-full md:w-56 px-2 py-1.5 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-black text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {keyTagRows.length > 0 && (
          <div className="p-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
              {keyTagRows.map(tlv => {
                const colors = CATEGORY_COLORS[tlv.category];
                return (
                  <div key={`key-${tlv.tag}`} className={`rounded border ${colors.border} ${colors.bg} px-2 py-1.5`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-mono text-xs font-bold ${colors.text}`}>{tlv.tag}</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500">{tlv.length}B</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 truncate" title={tlv.tagName}>{tlv.tagName}</p>
                    <p className="font-mono text-xs text-slate-800 dark:text-slate-100 break-all mt-1">{getDisplayValue(tlv)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-3 py-2 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap gap-1.5">
          {activeCategories.map(([cat, count]) => {
            const colors = CATEGORY_COLORS[cat as EMVTagCategory];
            return (
              <span key={cat} className={`px-2 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border} text-[10px] font-medium`}>
                {cat} {count}
              </span>
            );
          })}
        </div>

        <div className="max-h-[360px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-100 dark:bg-zinc-900 z-10">
              <tr className="border-b border-slate-200 dark:border-zinc-800">
                <th className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-300 w-20">Tag</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Value</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600 dark:text-slate-300 w-16">Len</th>
              </tr>
            </thead>
            <tbody>
              {visibleTags.map((tlv, idx) => {
                const colors = CATEGORY_COLORS[tlv.category];
                return (
                  <tr key={`${tlv.tag}-${idx}`} className="border-b border-slate-100 dark:border-zinc-800 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-900">
                    <td className="py-2 px-3 align-top">
                      <code className="font-mono text-blue-700 dark:text-blue-300 font-bold">{tlv.tag}</code>
                    </td>
                    <td className="py-2 px-3 align-top min-w-44">
                      <p className="text-slate-700 dark:text-slate-200">{tlv.tagName}</p>
                      <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} text-[10px]`}>
                        {tlv.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-top">
                      <code className="font-mono text-[11px] text-slate-800 dark:text-slate-100 break-all">
                        {getDisplayValue(tlv)}
                      </code>
                    </td>
                    <td className="py-2 px-3 align-top text-right text-slate-500 dark:text-zinc-500">{tlv.length}B</td>
                  </tr>
                );
              })}
              {visibleTags.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 px-3 text-center text-xs text-slate-500 dark:text-zinc-500">
                    No tags match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <details className="group">
        <summary className="text-[10px] text-slate-500 dark:text-zinc-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 px-1">
          Raw HEX ▼
        </summary>
        <div className="mt-1 p-1.5 bg-slate-900 dark:bg-black rounded font-mono text-[9px] text-green-400 break-all max-h-20 overflow-auto">
          {hexData}
        </div>
      </details>
    </div>
  );
}

export default EmvTlvDisplay;
