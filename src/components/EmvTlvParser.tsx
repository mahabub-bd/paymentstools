import { useCallback, useMemo, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { hexToAscii, parseEMVTLV, getEMVTagDefinition } from '../utils/iso8583VersionParser/emv-tlv';

interface ParsedTlvRow {
  tag: string;
  tagName: string;
  length: number;
  value: string;
  valueHex: string;
  valueAscii: string;
  startIndex: number;
  endIndex: number;
  isConstruct: boolean;
  children?: ParsedTlvRow[];
  indent: number;
  parentId?: string;
}

const EmvTlvParser = ({ className = '' }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [tlvData, setTlvData] = useState<ParsedTlvRow[]>([]);

  // Helper to check if raw hex bytes are all printable ASCII (0x20-0x7E)
  const isAllPrintableHex = useCallback((hex: string): boolean => {
    for (let i = 0; i < hex.length; i += 2) {
      const byteValue = parseInt(hex.substring(i, i + 2), 16);
      if (byteValue < 0x20 || byteValue > 0x7E) {
        return false;
      }
    }
    return true;
  }, []);

  // Helper to format a single TLV into a row
  const formatTlvToRow = useCallback((tlv: any, indent = 0, parentId?: string): ParsedTlvRow => {
    const tagDef = getEMVTagDefinition(tlv.tag);
    let valueAscii = '';

    // Format value based on tag definition format
    if (tagDef?.format === 'NUMERIC' || tagDef?.format === 'DATE') {
      valueAscii = tlv.rawValue;
    } else if (tagDef?.format === 'ASCII') {
      const ascii = hexToAscii(tlv.rawValue);
      valueAscii = /[ -~]/.test(ascii) ? ascii : '';
    } else if (tagDef?.format === 'HEX' || tagDef?.format === 'BINARY') {
      if (tlv.rawValue.length <= 4) {
        valueAscii = '';
      } else if (isAllPrintableHex(tlv.rawValue) && tlv.rawValue.length >= 4) {
        valueAscii = hexToAscii(tlv.rawValue);
      }
    } else {
      const ascii = hexToAscii(tlv.rawValue);
      const printableCount = (ascii.match(/[ -~]/g) || []).length;
      valueAscii = printableCount >= ascii.length / 2 ? ascii : '';
    }

    // Process children recursively
    const children: ParsedTlvRow[] = [];
    if (tlv.children && tlv.children.length > 0) {
      tlv.children.forEach((child: any) => {
        children.push(formatTlvToRow(child, indent + 1, tlv.tag));
      });
    }

    return {
      tag: tlv.tag,
      tagName: tlv.tagName,
      length: tlv.length,
      value: valueAscii || '',
      valueHex: tlv.rawValue,
      valueAscii,
      startIndex: 0,
      endIndex: 0,
      isConstruct: tlv.isConstruct || false,
      children: children.length > 0 ? children : undefined,
      indent,
      parentId,
    };
  }, [isAllPrintableHex]);

  // Parse TLV data from hex string
  const parseTlv = useCallback((hexString: string): ParsedTlvRow[] => {
    const cleanHex = hexString.replace(/\s/g, '').toUpperCase();
    if (cleanHex.length % 2 !== 0) {
      throw new Error('Hex string must have even length');
    }

    const result = parseEMVTLV(cleanHex);
    const rows: ParsedTlvRow[] = [];

    result.tags.forEach((tlv) => {
      const row = formatTlvToRow(tlv, 0);
      rows.push(row);
      // Add children directly to the flat list for table display
      if (row.children) {
        rows.push(...row.children);
      }
    });

    return rows;
  }, [formatTlvToRow]);

  // Calculate statistics
  const stats = useMemo(() => ({
    totalTags: tlvData.length,
    totalBytes: tlvData.reduce((sum, item) => sum + item.length, 0),
    uniqueTags: new Set(tlvData.map(item => item.tag)).size,
  }), [tlvData]);

  const handleDownloadExcel = useCallback(() => {
    if (tlvData.length === 0) return;

    const cleanInput = input.replace(/\s/g, '').toUpperCase();
    const generatedAt = new Date().toLocaleString();

    // Format a single row
    const formatRow = (item: ParsedTlvRow): string[] => {
      const indent = '  '.repeat(item.indent);
      const valueHex = item.isConstruct ? 'CONSTRUCT' : item.valueHex;
      const valueAscii = item.isConstruct ? 'N/A' : (item.valueAscii || 'N/A');

      let tagName = item.tagName;
      if (item.isConstruct) {
        tagName = `${item.tagName} [${item.children?.length || 0} nested]`;
      }
      if (item.indent > 0) {
        tagName = '↳ ' + tagName;
      }

      return [
        indent + item.tag,
        tagName,
        String(item.length),
        valueHex,
        valueAscii,
      ];
    };

    // Create header and data rows
    const headerData = [
      ['EMV TLV Parser Output'],
      ['Generated At', generatedAt],
      ['Input Hex', cleanInput],
      ['Total Tags', stats.totalTags, 'Total Bytes', stats.totalBytes],
      ['Unique Tags', stats.uniqueTags],
      [], // Empty row
      ['Tag', 'Name', 'Length', 'Value (Hex)', 'Value (ASCII)'],
    ];

    const dataRows = tlvData.map((item) => formatRow(item));
    const allRows = [...headerData, ...dataRows];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Tag
      { wch: 35 }, // Name
      { wch: 10 }, // Length
      { wch: 40 }, // Value (Hex)
      { wch: 35 }, // Value (ASCII)
    ];

    // Define cell styles
    const borderStyle = {
      style: 'thin',
      color: { auto: 1 }
    };

    const cellStyle = {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle
    };

    // Apply borders and styles to all cells
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        // Header row (row 6, 0-indexed = 5)
        if (R === 5) {
          ws[cellAddress].s = {
            border: cellStyle,
            fill: { fgColor: { rgb: 'dbeafe' } },
            font: { bold: true },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        } else {
          // Input Hex cell (row 2, columns B-E) - enable wrap text
          const isInputHexCell = (R === 2 && C >= 1 && C <= 4);
          ws[cellAddress].s = {
            border: cellStyle,
            alignment: {
              vertical: 'center',
              horizontal: 'left',
              wrapText: isInputHexCell
            }
          };
        }
      }
    }

    // Merge cells for title row and input hex
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title row A1:E1
      { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } }, // Input Hex B3:E3
    ];
    ws['!merges'] = merges;

    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'left' }
      };
    }

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EMV TLV Output');

    // Generate and download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    XLSX.writeFile(wb, `emv-tlv-parser-output-${timestamp}.xlsx`);
  }, [input, stats.totalBytes, stats.totalTags, stats.uniqueTags, tlvData]);

  const handleParse = useCallback(() => {
    try {
      setError('');
      if (!input.trim()) {
        setTlvData([]);
        return;
      }
      const parsed = parseTlv(input);
      setTlvData(parsed);
    } catch (err) {
      setError(err.message || 'Failed to parse TLV data');
      setTlvData([]);
    }
  }, [input, parseTlv]);

  const handleExample = useCallback(() => {
    const example = '5F340100950500000000009B0200009F360201DE9F2608BD06C566B23DB5D39F2701809F1A0200509F3303E0F8C89F3501229F03060000000000009F100706011203A020009F3704D8E52DD79C01009A032510209F02060000000020005F2A020050820200209F1E0830303030303930358407A00000000310104F07A00000000310109F090200009F410400002184500b5669736120437265646974';
    setInput(example);
    setError('');
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setTlvData([]);
    setError('');
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 md:p-6 ${className}`}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
        }
      `}</style>
      {/* Header */}
      <div className="mb-4 sm:mb-6 no-print">
        <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white mb-1.5">EMV TLV Parser</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Parse EMV Tag-Length-Value (TLV) data from hex format
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-4 sm:mb-6 no-print">
        <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
          TLV Data (Hex)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter hex TLV data (e.g., 9F02065F3401...)"
          className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs sm:text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          rows={4}
        />
        {error && (
          <div className="mt-2 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 no-print">
        <button
          onClick={handleParse}
          className="col-span-1 px-3 sm:px-4 py-2.5 bg-blue-600 text-white text-xs sm:text-xs md:text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors active:scale-[0.98]"
        >
          Parse TLV
        </button>
        <button
          onClick={handleExample}
          className="col-span-1 px-3 sm:px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-xs sm:text-xs md:text-sm active:scale-[0.98]"
        >
          Load Example
        </button>
        <button
          onClick={handleClear}
          className="col-span-1 px-3 sm:px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-xs sm:text-xs md:text-sm active:scale-[0.98]"
        >
          Clear
        </button>
        <button
          onClick={handleDownloadExcel}
          disabled={tlvData.length === 0}
          className="col-span-1 px-3 sm:px-4 py-2.5 bg-emerald-600 text-white text-xs sm:text-xs md:text-sm rounded-md hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors active:scale-[0.98]"
          title={tlvData.length === 0 ? 'Parse TLV data before downloading' : 'Download parsed TLV output as Excel'}
        >
          <span className="hidden sm:inline">Download Excel</span>
          <span className="sm:hidden">Excel</span>
        </button>
        <button
          onClick={() => window.print()}
          disabled={tlvData.length === 0}
          className="col-span-1 px-3 sm:px-4 py-2.5 bg-red-600 text-white text-xs sm:text-xs md:text-sm rounded-md hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors active:scale-[0.98]"
          title={tlvData.length === 0 ? 'Parse TLV data before printing' : 'Print or save as PDF'}
        >
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>

      {/* Statistics */}
      {tlvData.length > 0 && (
        <div className="printable-area mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
          <h3 className="text-xs sm:text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 sm:mb-2">Statistics</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-6 text-xs sm:text-xs md:text-sm">
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">Total Tags</div>
              <div className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-sm">{stats.totalTags}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">Total Bytes</div>
              <div className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-sm">{stats.totalBytes}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">Unique Tags</div>
              <div className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-sm">{stats.uniqueTags}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {tlvData.length > 0 && (
        <div className="printable-area border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <table className="w-full min-w-[300px] sm:min-w-[500px] md:min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tag</th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Length</th>
                  <th className="hidden md:table-cell px-2 sm:px-3 md:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value (Hex)</th>
                  <th className="hidden lg:table-cell px-2 sm:px-3 md:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value (ASCII)</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-black divide-y divide-slate-200 dark:divide-zinc-800">
                {tlvData.map((item, index) => {
                  const isConstruct = item.isConstruct;
                  const isChild = item.indent > 0;
                  const rowClass = isConstruct
                    ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold'
                    : isChild
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : index % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-slate-50 dark:bg-zinc-900';

                  return (
                    <tr key={index} className={rowClass}>
                      <td className="px-2 sm:px-3 md:px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {isChild && (
                            <span className="text-slate-400 dark:text-zinc-500 text-xs">└</span>
                          )}
                          <code className={`text-[10px] sm:text-xs md:text-sm font-mono ${
                            isConstruct
                              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              : isChild
                              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          } px-1.5 sm:px-2 py-0.5 sm:py-1 rounded`}>
                            {item.tag}
                          </code>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 text-[10px] sm:text-xs md:text-sm text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[180px] md:max-w-none" title={item.tagName}>
                        {isChild && <span className="text-slate-400 dark:text-zinc-500 mr-1">↳</span>}
                        {item.tagName}
                        {isConstruct && (
                          <span className="ml-1 text-[10px] text-slate-500 dark:text-zinc-500">
                            [{item.children?.length || 0} nested]
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400">{item.length}</td>
                      <td className="hidden md:table-cell px-2 sm:px-3 md:px-4 py-2 text-[10px] sm:text-xs md:text-sm font-mono text-slate-600 dark:text-slate-400 truncate max-w-[120px] sm:max-w-none" title={item.valueHex}>
                        {isConstruct ? <span className="text-slate-400 dark:text-zinc-500 italic">CONSTRUCT</span> : item.valueHex}
                      </td>
                      <td className="hidden lg:table-cell px-2 sm:px-3 md:px-4 py-2 text-[10px] sm:text-xs md:text-sm font-mono text-slate-600 dark:text-slate-400 truncate max-w-[100px] sm:max-w-[120px]">
                        {isConstruct ? <span className="text-slate-400 dark:text-zinc-500 italic">N/A</span> : (
                          item.valueAscii || <span className="text-slate-400 dark:text-zinc-500 italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmvTlvParser;
