import { useCallback, useMemo, useState } from 'react';
import { EMV_TAG_DEFINITIONS, EMVTagCategory, isHex } from '../utils/iso8583VersionParser/emv-tlv';

interface TlvItem {
  id: string;
  tag: string;
  tagName: string;
  value: string;
  format: 'ASCII' | 'HEX' | 'NUMERIC' | 'DATE' | 'BINARY';
  category: EMVTagCategory;
}

// ASCII to Hex conversion
const asciiToHexConvert = (str: string): string => {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return result.toUpperCase();
};

// Convert length to EMV format (BER-TLV length encoding)
const encodeLength = (length: number): string => {
  if (length < 128) {
    return length.toString(16).padStart(2, '0').toUpperCase();
  } else {
    const hexLength = length.toString(16).toUpperCase();
    const numBytes = (hexLength.length + 1) / 2;
    return (0x80 + numBytes).toString(16).padStart(2, '0').toUpperCase() + hexLength;
  }
};

// Build TLV from tag and value
const buildTlv = (tag: string, value: string): string => {
  const cleanValue = value.replace(/\s/g, '');
  const length = cleanValue.length / 2;
  return tag + encodeLength(length) + cleanValue;
};

const EmvTlvBuilder = ({ className = '' }) => {
  const [tlvItems, setTlvItems] = useState<TlvItem[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [outputFormat, setOutputFormat] = useState<'hex' | 'spaced'>('spaced');

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    const search = tagSearch.toUpperCase();
    return Object.entries(EMV_TAG_DEFINITIONS)
      .filter(([tag, def]) => {
        const matchTag = tag.includes(search);
        const matchName = def.name.toUpperCase().includes(search);
        const matchCategory = def.category.toUpperCase().includes(search);
        return matchTag || matchName || matchCategory;
      })
      .sort(([, a], [, b]) => a.tag.localeCompare(b.tag));
  }, [tagSearch]);

  // Get tag definition
  const getTagDef = useCallback((tag: string) => {
    return EMV_TAG_DEFINITIONS[tag.toUpperCase()];
  }, []);

  // Add tag to list
  const handleAddTag = useCallback(() => {
    if (!selectedTag || !valueInput.trim()) return;

    const tagDef = getTagDef(selectedTag);
    if (!tagDef) return;

    let processedValue = valueInput.replace(/\s/g, '').toUpperCase();

    // Validate based on format
    if (tagDef.format === 'HEX' || tagDef.format === 'BINARY') {
      if (!isHex(processedValue)) {
        alert('Invalid hex value');
        return;
      }
    } else if (tagDef.format === 'NUMERIC' || tagDef.format === 'DATE') {
      if (!/^\d+$/.test(processedValue)) {
        alert('Invalid numeric value');
        return;
      }
      // Convert to hex (BCD encoding for numeric)
      processedValue = processedValue.split('').map(c => parseInt(c, 16).toString(16).padStart(2, '0')).join('');
    } else if (tagDef.format === 'ASCII') {
      processedValue = asciiToHexConvert(valueInput);
    }

    const newItem: TlvItem = {
      id: Date.now().toString(),
      tag: selectedTag.toUpperCase(),
      tagName: tagDef.name,
      value: processedValue,
      format: tagDef.format || 'HEX',
      category: tagDef.category
    };

    setTlvItems(prev => [...prev, newItem]);
    setSelectedTag('');
    setValueInput('');
    setTagSearch('');
  }, [selectedTag, valueInput, getTagDef]);

  // Remove tag from list
  const handleRemoveTag = useCallback((id: string) => {
    setTlvItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Move item up
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setTlvItems(prev => {
      const items = [...prev];
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      return items;
    });
  }, []);

  // Move item down
  const handleMoveDown = useCallback((index: number) => {
    if (index === tlvItems.length - 1) return;
    setTlvItems(prev => {
      const items = [...prev];
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
      return items;
    });
  }, [tlvItems.length]);

  // Build final TLV
  const builtTlv = useMemo(() => {
    return tlvItems.map(item => buildTlv(item.tag, item.value)).join('');
  }, [tlvItems]);

  // Build formatted TLV (with spaces)
  const formattedTlv = useMemo(() => {
    if (outputFormat === 'spaced') {
      return builtTlv.match(/.{1,2}/g)?.join(' ') || '';
    }
    return builtTlv;
  }, [builtTlv, outputFormat]);

  // Statistics
  const stats = useMemo(() => ({
    totalTags: tlvItems.length,
    totalBytes: builtTlv.length / 2,
    byCategory: tlvItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }), [tlvItems, builtTlv.length]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(formattedTlv);
  }, [formattedTlv]);

  // Clear all
  const handleClear = useCallback(() => {
    setTlvItems([]);
    setSelectedTag('');
    setValueInput('');
    setTagSearch('');
  }, []);

  // Load example
  const handleExample = useCallback(() => {
    const exampleItems: TlvItem[] = [
      { id: '1', tag: '9F02', tagName: 'Amount, Authorized (Numeric)', value: '000000000200', format: 'NUMERIC', category: EMVTagCategory.AMOUNT },
      { id: '2', tag: '9F03', tagName: 'Amount, Other (Numeric)', value: '000000000000', format: 'NUMERIC', category: EMVTagCategory.AMOUNT },
      { id: '3', tag: '9F36', tagName: 'Application Transaction Counter (ATC)', value: '01DE', format: 'HEX', category: EMVTagCategory.SECURITY },
      { id: '4', tag: '9F26', tagName: 'Application Cryptogram (AC)', value: 'BD06C566B23DB5D3', format: 'HEX', category: EMVTagCategory.CRYPTogram },
      { id: '5', tag: '9F27', tagName: 'Cryptogram Information Data (CID)', value: '80', format: 'HEX', category: EMVTagCategory.CRYPTogram }
    ];
    setTlvItems(exampleItems);
  }, []);

  // Get input placeholder based on selected tag format
  const getInputPlaceholder = useCallback(() => {
    if (!selectedTag) {
      return 'Select a tag first...';
    }
    const tagDef = getTagDef(selectedTag);
    if (!tagDef) return 'Enter value...';

    switch (tagDef.format) {
      case 'ASCII':
        return 'Enter ASCII text...';
      case 'HEX':
      case 'BINARY':
        return 'Enter hex value (e.g., A1B2C3)...';
      case 'NUMERIC':
        return 'Enter numeric value...';
      case 'DATE':
        return 'Enter date (YYMMDD)...';
      default:
        return 'Enter value...';
    }
  }, [selectedTag, getTagDef]);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 md:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-1.5">
          EMV TLV Builder
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Build EMV Tag-Length-Value (TLV) data structures
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column - Tag Selection */}
        <div className="space-y-4">
          {/* Tag Search & Selection */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
              Search & Select Tag
            </label>
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Search by tag, name, or category..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />

            {/* Tag List Dropdown */}
            {tagSearch && filteredTags.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800">
                {filteredTags.slice(0, 20).map(([tag, def]) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag);
                      setTagSearch('');
                      setValueInput('');
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${selectedTag === tag ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">{tag}</span>
                      <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 capitalize">{def.category}</span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 truncate">{def.name}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Tag Display */}
            {selectedTag && !tagSearch && (
              <div className="mt-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">{selectedTag}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{getTagDef(selectedTag)?.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">
                      Format: <span className="font-medium">{getTagDef(selectedTag)?.format || 'HEX'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTag('');
                      setValueInput('');
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Value Input */}
          {selectedTag && (
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
                Value
              </label>
              <input
                type="text"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                placeholder={getInputPlaceholder()}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
              <button
                onClick={handleAddTag}
                disabled={!valueInput.trim()}
                className="mt-2 w-full px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
              >
                Add TLV
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExample}
              className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs sm:text-sm transition-colors"
            >
              Load Example
            </button>
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs sm:text-sm transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Right Column - TLV Items & Output */}
        <div className="space-y-4">
          {/* TLV Items List */}
          {tlvItems.length > 0 && (
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  TLV Items ({tlvItems.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tlvItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-2 sm:p-3 bg-white dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{item.tag}</span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-500 capitalize">{item.category}</span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 truncate" title={item.tagName}>
                          {item.tagName}
                        </div>
                        <div className="font-mono text-[10px] sm:text-xs text-slate-500 dark:text-zinc-500 truncate mt-1" title={item.value}>
                          {item.value}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === tlvItems.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveTag(item.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          {tlvItems.length > 0 && (
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Statistics</h3>
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">Total Tags</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{stats.totalTags}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">Total Bytes</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{stats.totalBytes}</div>
                </div>
              </div>
            </div>
          )}

          {/* Output */}
          {builtTlv && (
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Built TLV Data
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as 'hex' | 'spaced')}
                    className="px-2 py-1 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="spaced">Spaced</option>
                    <option value="hex">Raw Hex</option>
                  </select>
                  <button
                    onClick={handleCopy}
                    className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-white dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700">
                <pre className="font-mono text-[10px] sm:text-xs text-slate-800 dark:text-slate-200 break-all whitespace-pre-wrap">
                  {formattedTlv}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmvTlvBuilder;
