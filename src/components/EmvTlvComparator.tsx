import { useCallback, useMemo, useState } from 'react';
import { parseEMVTLV, getEMVTagDefinition, TLVData, hexToAscii } from '../utils/iso8583VersionParser/emv-tlv';

interface ComparisonResult {
  tag: string;
  tagName: string;
  status: 'same' | 'added' | 'removed' | 'modified';
  message1Value: string;
  message2Value: string;
  message1Length: number;
  message2Length: number;
  category: string;
}

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

const EmvTlvComparator = ({ className = '' }) => {
  const [message1, setMessage1] = useState('');
  const [message2, setMessage2] = useState('');
  const [title1, setTitle1] = useState('Message 1');
  const [title2, setTitle2] = useState('Message 2');
  const [error, setError] = useState('');
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [parsed1, setParsed1] = useState<ParsedTlvRow[]>([]);
  const [parsed2, setParsed2] = useState<ParsedTlvRow[]>([]);

  // Helper to check if raw hex bytes are all printable ASCII
  const isAllPrintableHex = useCallback((hex: string): boolean => {
    for (let i = 0; i < hex.length; i += 2) {
      const byteValue = parseInt(hex.substring(i, i + 2), 16);
      if (byteValue < 0x20 || byteValue > 0x7E) {
        return false;
      }
    }
    return true;
  }, []);

  // Format TLV to row structure
  const formatTlvToRow = useCallback((tlv: any, indent = 0, parentTag?: string): ParsedTlvRow => {
    const tagDef = getEMVTagDefinition(tlv.tag);
    let valueAscii = '';

    if (tagDef?.format === 'NUMERIC' || tagDef?.format === 'DATE') {
      valueAscii = tlv.rawValue;
    } else if (tagDef?.format === 'ASCII') {
      const ascii = hexToAscii(tlv.rawValue);
      valueAscii = /^[ -~]+$/.test(ascii) ? ascii : '';
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
      parentId: parentTag,
    };
  }, [isAllPrintableHex]);

  // Parse TLV data
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
      if (row.children) {
        rows.push(...row.children);
      }
    });

    return rows;
  }, [formatTlvToRow]);

  // Compare two parsed TLV messages
  const compareMessages = useCallback(() => {
    try {
      setError('');

      if (!message1.trim() || !message2.trim()) {
        setComparisonResults([]);
        setParsed1([]);
        setParsed2([]);
        return;
      }

      const parsed1Data = parseTlv(message1);
      const parsed2Data = parseTlv(message2);

      setParsed1(parsed1Data);
      setParsed2(parsed2Data);

      // Create maps for easier comparison
      const map1 = new Map(parsed1Data.filter(item => !item.parentId).map(item => [item.tag, item]));
      const map2 = new Map(parsed2Data.filter(item => !item.parentId).map(item => [item.tag, item]));

      const results: ComparisonResult[] = [];
      const allTags = new Set([...map1.keys(), ...map2.keys()]);

      allTags.forEach(tag => {
        const item1 = map1.get(tag);
        const item2 = map2.get(tag);
        const tagDef = getEMVTagDefinition(tag);

        let status: 'same' | 'added' | 'removed' | 'modified';
        if (!item1) {
          status = 'added';
        } else if (!item2) {
          status = 'removed';
        } else if (item1.valueHex !== item2.valueHex) {
          status = 'modified';
        } else {
          status = 'same';
        }

        results.push({
          tag,
          tagName: tagDef?.name || 'Unknown Tag',
          status,
          message1Value: item1?.valueHex || '',
          message2Value: item2?.valueHex || '',
          message1Length: item1?.length || 0,
          message2Length: item2?.length || 0,
          category: tagDef?.category || 'Unknown',
        });
      });

      // Sort: added/modified/removed first, then by tag
      results.sort((a, b) => {
        const statusOrder = { modified: 0, added: 1, removed: 2, same: 3 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        return a.tag.localeCompare(b.tag);
      });

      setComparisonResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare TLV data');
      setComparisonResults([]);
      setParsed1([]);
      setParsed2([]);
    }
  }, [message1, message2, parseTlv]);

  // Calculate statistics
  const stats = useMemo(() => ({
    same: comparisonResults.filter(r => r.status === 'same').length,
    added: comparisonResults.filter(r => r.status === 'added').length,
    removed: comparisonResults.filter(r => r.status === 'removed').length,
    modified: comparisonResults.filter(r => r.status === 'modified').length,
  }), [comparisonResults]);

  const escapeExcelCell = useCallback((value: string | number) => (
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  ), []);

  // Download comparison results as Excel
  const handleDownloadExcel = useCallback(() => {
    if (comparisonResults.length === 0) return;

    const generatedAt = new Date().toLocaleString();
    const cleanMsg1 = message1.replace(/\s/g, '').toUpperCase();
    const cleanMsg2 = message2.replace(/\s/g, '').toUpperCase();
    const displayTitle1 = title1.trim() || 'Message 1';
    const displayTitle2 = title2.trim() || 'Message 2';

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'added': return '#d1fae5';
        case 'removed': return '#fee2e2';
        case 'modified': return '#fef3c7';
        default: return '#f3f4f6';
      }
    };

    const rows = comparisonResults.map((result) => {
      const statusIcon = {
        added: '✓',
        removed: '✗',
        modified: '~',
        same: '='
      }[result.status];

      return `
        <tr>
          <td style="background:${getStatusColor(result.status)};mso-number-format:'\\@';">${escapeExcelCell(result.tag)}</td>
          <td style="background:${getStatusColor(result.status)};">${escapeExcelCell(result.tagName)}</td>
          <td style="background:${getStatusColor(result.status)};">${escapeExcelCell(result.category)}</td>
          <td style="background:${getStatusColor(result.status)};text-align:center;">${statusIcon} ${result.status.toUpperCase()}</td>
          <td style="background:${getStatusColor(result.status)};mso-number-format:'\\@';">${escapeExcelCell(result.message1Value || 'N/A')}</td>
          <td style="background:${getStatusColor(result.status)};">${escapeExcelCell(result.message1Length || 0)}</td>
          <td style="background:${getStatusColor(result.status)};mso-number-format:'\\@';">${escapeExcelCell(result.message2Value || 'N/A')}</td>
          <td style="background:${getStatusColor(result.status)};">${escapeExcelCell(result.message2Length || 0)}</td>
        </tr>
      `;
    }).join('');

    const workbookHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>EMV TLV Comparison</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines /></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table>
            <tr><th colspan="8" style="font-size:16px;text-align:left;">EMV TLV Comparison Report</th></tr>
            <tr><td><strong>Generated At</strong></td><td colspan="7">${escapeExcelCell(generatedAt)}</td></tr>
            <tr><td><strong>${escapeExcelCell(displayTitle1)}</strong></td><td colspan="7" style="mso-number-format:'\\@';">${escapeExcelCell(cleanMsg1)}</td></tr>
            <tr><td><strong>${escapeExcelCell(displayTitle2)}</strong></td><td colspan="7" style="mso-number-format:'\\@';">${escapeExcelCell(cleanMsg2)}</td></tr>
            <tr><td><strong>Total Tags</strong></td><td>${escapeExcelCell(comparisonResults.length)}</td><td><strong>Same</strong></td><td>${escapeExcelCell(stats.same)}</td><td><strong>Added</strong></td><td>${escapeExcelCell(stats.added)}</td><td><strong>Removed</strong></td><td>${escapeExcelCell(stats.removed)}</td><td><strong>Modified</strong></td><td>${escapeExcelCell(stats.modified)}</td></tr>
            <tr></tr>
            <tr>
              <th style="background:#dbeafe;">Tag</th>
              <th style="background:#dbeafe;">Name</th>
              <th style="background:#dbeafe;">Category</th>
              <th style="background:#dbeafe;">Status</th>
              <th style="background:#dbeafe;">${escapeExcelCell(displayTitle1)} Value (Hex)</th>
              <th style="background:#dbeafe;">${escapeExcelCell(displayTitle1)} Length</th>
              <th style="background:#dbeafe;">${escapeExcelCell(displayTitle2)} Value (Hex)</th>
              <th style="background:#dbeafe;">${escapeExcelCell(displayTitle2)} Length</th>
            </tr>
            ${rows}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([workbookHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `emv-tlv-comparison-${timestamp}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [comparisonResults, escapeExcelCell, message1, message2, stats, title1, title2]);

  // Load example messages
  const handleExample = useCallback(() => {
    const msg1 = '5F340100950500000000009B0200009F360201DE9F2608BD06C566B23DB5D39F2701809F1A020050';
    const msg2 = '5F340100950500000000009B0200009F360201DF9F2608BD06C566B23DB5D39F2701809F1A0200519F0206000000002000';
    setMessage1(msg1);
    setMessage2(msg2);
    setError('');
  }, []);

  // Clear all
  const handleClear = useCallback(() => {
    setMessage1('');
    setMessage2('');
    setTitle1('Message 1');
    setTitle2('Message 2');
    setComparisonResults([]);
    setParsed1([]);
    setParsed2([]);
    setError('');
  }, []);

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'added':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'removed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'modified':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-slate-300';
    }
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 md:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-1.5">
          EMV TLV Comparator
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Compare two EMV TLV messages and identify differences
        </p>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Message 1 */}
        <div className="space-y-2">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title1}
              onChange={(e) => setTitle1(e.target.value)}
              placeholder="e.g., MDB Visa Card"
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
              Message 1 (Hex)
            </label>
            <textarea
              value={message1}
              onChange={(e) => setMessage1(e.target.value)}
              placeholder="Enter first TLV message..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              rows={4}
            />
          </div>
        </div>

        {/* Message 2 */}
        <div className="space-y-2">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title2}
              onChange={(e) => setTitle2(e.target.value)}
              placeholder="e.g., NBL Master Card"
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
              Message 2 (Hex)
            </label>
            <textarea
              value={message2}
              onChange={(e) => setMessage2(e.target.value)}
              placeholder="Enter second TLV message..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              rows={4}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={compareMessages}
          className="px-3 sm:px-4 py-2.5 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors active:scale-[0.98]"
        >
          Compare Messages
        </button>
        <button
          onClick={handleExample}
          className="px-3 sm:px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs sm:text-sm transition-colors"
        >
          Load Example
        </button>
        <button
          onClick={handleClear}
          className="px-3 sm:px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs sm:text-sm transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleDownloadExcel}
          disabled={comparisonResults.length === 0}
          className="px-3 sm:px-4 py-2.5 bg-emerald-600 text-white text-xs sm:text-sm rounded-md hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors ml-auto"
        >
          Download Excel
        </button>
      </div>

      {/* Statistics */}
      {comparisonResults.length > 0 && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
          <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Comparison Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[10px]">Same</div>
              <div className="font-medium text-slate-900 dark:text-slate-100">{stats.same}</div>
            </div>
            <div>
              <div className="text-emerald-600 dark:text-emerald-400 text-[10px]">Added</div>
              <div className="font-medium text-emerald-700 dark:text-emerald-300">{stats.added}</div>
            </div>
            <div>
              <div className="text-red-600 dark:text-red-400 text-[10px]">Removed</div>
              <div className="font-medium text-red-700 dark:text-red-300">{stats.removed}</div>
            </div>
            <div>
              <div className="text-amber-600 dark:text-amber-400 text-[10px]">Modified</div>
              <div className="font-medium text-amber-700 dark:text-amber-300">{stats.modified}</div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Results Table */}
      {comparisonResults.length > 0 && (
        <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tag</th>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title1.trim() || 'Msg1'}</th>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title2.trim() || 'Msg2'}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-black divide-y divide-slate-200 dark:divide-zinc-800">
                {comparisonResults.map((result, index) => {
                  const rowBg = result.status === 'added'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                    : result.status === 'removed'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : result.status === 'modified'
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : index % 2 === 0
                    ? 'bg-white dark:bg-black'
                    : 'bg-slate-50 dark:bg-zinc-900';

                  return (
                    <tr key={index} className={rowBg}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <code className="text-[10px] sm:text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                          {result.tag}
                        </code>
                      </td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-slate-900 dark:text-slate-100 truncate max-w-[150px]" title={result.tagName}>
                        {result.tagName}
                      </td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        {result.category}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${getStatusBadgeClass(result.status)}`}>
                          {result.status === 'same' && '='}
                          {result.status === 'added' && '+'}
                          {result.status === 'removed' && '−'}
                          {result.status === 'modified' && '~'}
                          {' '}{result.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[120px]" title={result.message1Value || 'N/A'}>
                        {result.message1Value ? (
                          <>
                            <span className="hidden">{result.message1Value}</span>
                            <span className="sm:hidden">{result.message1Value.substring(0, 10)}...</span>
                            <span className="hidden sm:inline">{result.message1Value.substring(0, 20)}{result.message1Value.length > 20 ? '...' : ''}</span>
                          </>
                        ) : <span className="text-slate-400 dark:text-zinc-500 italic">N/A</span>}
                      </td>
                      <td className="px-3 py-2 text-[10px] sm:text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[120px]" title={result.message2Value || 'N/A'}>
                        {result.message2Value ? (
                          <>
                            <span className="hidden">{result.message2Value}</span>
                            <span className="sm:hidden">{result.message2Value.substring(0, 10)}...</span>
                            <span className="hidden sm:inline">{result.message2Value.substring(0, 20)}{result.message2Value.length > 20 ? '...' : ''}</span>
                          </>
                        ) : <span className="text-slate-400 dark:text-zinc-500 italic">N/A</span>}
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

export default EmvTlvComparator;
