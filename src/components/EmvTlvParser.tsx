import { useCallback, useMemo, useState } from 'react';
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

// Common EMV tag definitions
const EMV_TAGS = {
  '4F': 'Application Identifier (AID)',
  '50': 'Application Label',
  '57': 'Track 2 Equivalent Data',
  '5A': 'Application Primary Account Number (PAN)',
  '5F20': 'Cardholder Name',
  '5F24': 'Application Expiration Date',
  '5F25': 'Application Effective Date',
  '5F28': 'Issuer Country Code',
  '5F2A': 'Transaction Currency Code',
  '5F2D': 'Language Preference',
  '5F30': 'Service Code',
  '5F34': 'Application Primary Account Number (PAN) Sequence Number',
  '5F36': 'Transaction Currency Exponent',
  '82': 'Application Interchange Profile',
  '84': 'Dedicated File (DF) Name',
  '86': 'Issuer Script Command',
  '87': 'Application Priority Indicator',
  '88': 'Short File Identifier (SFI)',
  '8A': 'Authorisation Response Code',
  '8C': 'Card Risk Management Data Object List 1 (CDOL1)',
  '8D': 'Card Risk Management Data Object List 2 (CDOL2)',
  '8E': 'Cardholder Verification Method (CVM) List',
  '8F': 'Certification Authority Public Key Index',
  '90': 'Issuer Public Key Certificate',
  '91': 'Issuer Authentication Data',
  '92': 'Issuer Public Key Remainder',
  '93': 'Signed Static Application Data',
  '94': 'Application File Locator (AFL)',
  '95': 'Terminal Verification Results',
  '9A': 'Transaction Date',
  '9B': 'Transaction Status Information',
  '9C': 'Transaction Type',
  '9F02': 'Amount, Authorized (Numeric)',
  '9F03': 'Amount, Other (Numeric)',
  '9F04': 'Amount, Other (Binary)',
  '9F06': 'Application Version Number',
  '9F07': 'Application Usage Control',
  '9F08': 'Application Version Number',
  '9F09': 'Application Version Number',
  '9F0A': 'Issuer Action Code - Default',
  '9F0B': 'Cardholder Verification Method (CVM) Results',
  '9F0C': 'Application Cryptogram',
  '9F0D': 'Issuer Action Code - Denial',
  '9F0E': 'Issuer Action Code - Online',
  '9F0F': 'Application Currency Code',
  '9F10': 'Issuer Application Data',
  '9F11': 'Issuer Code Table Index',
  '9F12': 'Application Preferred Name',
  '9F13': 'Last Online ATC Register',
  '9F14': 'Lower Consecutive Offline Limit',
  '9F15': 'Merchant Category Code',
  '9F16': 'Merchant Name',
  '9F17': 'Merchant Identifier',
  '9F18': 'Merchant Type',
  '9F19': 'Terminal Country Code',
  '9F1A': 'Terminal Type',
  '9F1B': 'Terminal Floor Limit',
  '9F1C': 'Terminal Identification',
  '9F1D': 'Terminal Capabilities',
  '9F1E': 'Interface Device (IFD) Serial Number',
  '9F1F': 'Track 1 Discretionary Data',
  '9F20': 'Track 2 Discretionary Data',
  '9F21': 'Transaction Time',
  '9F22': 'Terminal Floor Limit',
  '9F23': 'Card Authentication Related Data',
  '9F24': 'Payment Account Reference (PAR)',
  '9F25': 'Application Cryptogram',
  '9F26': 'Application Cryptogram (AC)',
  '9F27': 'Cryptogram Information Data (CID)',
  '9F2A': 'Kernel ID',
  '9F2B': 'Kernel Version',
  '9F2C': 'Kernel Version Number',
  '9F2D': 'Kernel Configuration',
  '9F2E': 'Kernel Configuration Identifier',
  '9F2F': 'Kernel Configuration File',
  '9F30': 'Kernel Specific Issuer Data',
  '9F31': 'Kernel Update Indicator',
  '9F32': 'Kernel Version Number',
  '9F33': 'Terminal Capabilities',
  '9F34': 'Merchant Name and Location',
  '9F35': 'Terminal Type',
  '9F36': 'Application Transaction Counter (ATC)',
  '9F37': 'Unpredictable Number',
  '9F38': 'Point-of-Service (POS) Entry Mode',
  '9F39': 'Point-of-Service (POS) Condition Codes',
  '9F3A': 'Amount, Reference Currency',
  '9F3B': 'Amount, Reference Currency Exponent',
  '9F3C': 'Transaction Reference Currency Code',
  '9F3D': 'Transaction Reference Currency Exponent',
  '9F3E': 'Terminal Transaction Qualifiers',
  '9F3F': 'Terminal Transaction Qualifiers',
  '9F40': 'Additional Terminal Capabilities',
  '9F41': 'Transaction Sequence Counter',
  '9F42': 'Application Currency Code',
  '9F43': 'Application Reference Currency',
  '9F44': 'Application Currency Exponent',
  '9F45': 'Application Reference Currency Exponent',
  '9F46': 'Integrated Circuit Card (ICC) Public Key Certificate',
  '9F47': 'Integrated Circuit Card (ICC) Public Key Exponent',
  '9F48': 'Integrated Circuit Card (ICC) Public Key Remainder',
  '9F49': 'Dynamic Data Authentication Data Object List (DDOL)',
  '9F4A': 'Static Data Authentication Tag List',
  '9F4B': 'Signed Dynamic Application Data',
  '9F4C': 'ICC Public Key Certificate',
  '9F4D': 'Log Entry',
  '9F4E': 'Merchant Name and Location',
  '9F4F': 'Log Format',
};

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

  const escapeExcelCell = useCallback((value: string | number) => (
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  ), []);

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

    const formatRow = (item: ParsedTlvRow, prefix = ''): string => {
      const indent = '  '.repeat(item.indent);
      const valueHex = item.isConstruct ? 'CONSTRUCT' : item.valueHex;
      const valueAscii = item.isConstruct ? 'N/A' : (item.valueAscii || 'N/A');
      const tagName = item.isConstruct
        ? `${item.tagName} [${item.children?.length || 0} nested]`
        : item.tagName;

      return `
        <tr>
          <td style="mso-number-format:'\\@';">${escapeExcelCell(prefix + indent + item.tag)}</td>
          <td>${escapeExcelCell(item.indent > 0 ? '↳ ' : '' + tagName)}</td>
          <td>${escapeExcelCell(item.length)}</td>
          <td style="mso-number-format:'\\@';">${escapeExcelCell(valueHex)}</td>
          <td style="mso-number-format:'\\@';">${escapeExcelCell(valueAscii)}</td>
        </tr>
      `;
    };

    const rows = tlvData.map((item) => formatRow(item)).join('');

    const workbookHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>EMV TLV Output</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines /></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table>
            <tr><th colspan="5" style="font-size:16px;text-align:left;">EMV TLV Parser Output</th></tr>
            <tr><td><strong>Generated At</strong></td><td colspan="4">${escapeExcelCell(generatedAt)}</td></tr>
            <tr><td><strong>Input Hex</strong></td><td colspan="4" style="mso-number-format:'\\@';">${escapeExcelCell(cleanInput)}</td></tr>
            <tr><td><strong>Total Tags</strong></td><td>${escapeExcelCell(stats.totalTags)}</td><td><strong>Total Bytes</strong></td><td>${escapeExcelCell(stats.totalBytes)}</td><td></td></tr>
            <tr><td><strong>Unique Tags</strong></td><td>${escapeExcelCell(stats.uniqueTags)}</td><td colspan="3"></td></tr>
            <tr></tr>
            <tr>
              <th style="background:#dbeafe;">Tag</th>
              <th style="background:#dbeafe;">Name</th>
              <th style="background:#dbeafe;">Length</th>
              <th style="background:#dbeafe;">Value (Hex)</th>
              <th style="background:#dbeafe;">Value (ASCII)</th>
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
    link.download = `emv-tlv-parser-output-${timestamp}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [escapeExcelCell, input, stats.totalBytes, stats.totalTags, stats.uniqueTags, tlvData]);

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
