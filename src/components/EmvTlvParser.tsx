import { useCallback, useMemo, useState } from 'react';

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
  const [tlvData, setTlvData] = useState([]);

  // Parse TLV data from hex string
  const parseTlv = useCallback((hexString) => {
    const cleanHex = hexString.replace(/\s/g, '').toUpperCase();
    if (cleanHex.length % 2 !== 0) {
      throw new Error('Hex string must have even length');
    }

    const items = [];
    let pos = 0;

    while (pos < cleanHex.length) {
      const startIndex = pos;

      // Parse tag
      let tag = '';
      let tagByte = cleanHex.slice(pos, pos + 2);
      pos += 2;

      tag += tagByte;

      // Check if this is a multi-byte tag (bit 8 of first byte is set)
      if ((parseInt(tagByte, 16) & 0x1F) === 0x1F) {
        // More bytes follow
        let moreBytes = true;
        while (moreBytes && pos < cleanHex.length) {
          const nextByte = cleanHex.slice(pos, pos + 2);
          tag += nextByte;
          pos += 2;
          moreBytes = (parseInt(nextByte, 16) & 0x80) !== 0;
        }
      }

      // Parse length
      let length = 0;
      let lengthBytes = 0;
      const firstLengthByte = parseInt(cleanHex.slice(pos, pos + 2), 16);
      pos += 2;
      lengthBytes++;

      if (firstLengthByte & 0x80) {
        // Long form length
        const numLengthBytes = firstLengthByte & 0x7F;
        for (let i = 0; i < numLengthBytes; i++) {
          length = (length << 8) + parseInt(cleanHex.slice(pos, pos + 2), 16);
          pos += 2;
          lengthBytes++;
        }
      } else {
        // Short form length
        length = firstLengthByte;
      }

      // Parse value
      const valueHex = cleanHex.slice(pos, pos + length * 2);
      pos += length * 2;

      // Try to convert to ASCII
      let valueAscii;
      try {
        valueAscii = valueHex.match(/.{2}/g)
          ?.map(b => String.fromCharCode(parseInt(b, 16)))
          .join('');
        // Check if it's printable ASCII
        if (valueAscii && !/^[\x20-\x7E]*$/.test(valueAscii)) {
          valueAscii = undefined;
        }
      } catch {
        valueAscii = undefined;
      }

      const item = {
        tag,
        tagName: EMV_TAGS[tag] || `Unknown Tag (${tag})`,
        length,
        value: valueAscii || '',
        valueHex,
        valueAscii,
        startIndex,
        endIndex: pos,
      };

      items.push(item);
    }

    return items;
  }, []);

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
    const example = '9F02069F03029F3602' +
                    '5F2A029F060A' +
                    '9F1A029F3303' +
                    '9F34029F3501' +
                    '9F37049F2608' +
                    '9F10089F0102';
    setInput(example);
    setError('');
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setTlvData([]);
    setError('');
  }, []);

  // Calculate statistics
  const stats = useMemo(() => ({
    totalTags: tlvData.length,
    totalBytes: tlvData.reduce((sum, item) => sum + item.length, 0),
    uniqueTags: new Set(tlvData.map(item => item.tag)).size,
  }), [tlvData]);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">EMV TLV Parser</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Parse EMV Tag-Length-Value (TLV) data from hex format
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
          TLV Data (Hex)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter hex TLV data (e.g., 9F02065F3401...)"
          className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          rows={4}
        />
        {error && (
          <div className="mt-2 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleParse}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Parse TLV
        </button>
        <button
          onClick={handleExample}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Load Example
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Statistics */}
      {tlvData.length > 0 && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Statistics</h3>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Total Tags:</span>
              <span className="ml-1 font-medium text-slate-900 dark:text-slate-100">{stats.totalTags}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Total Bytes:</span>
              <span className="ml-1 font-medium text-slate-900 dark:text-slate-100">{stats.totalBytes}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Unique Tags:</span>
              <span className="ml-1 font-medium text-slate-900 dark:text-slate-100">{stats.uniqueTags}</span>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {tlvData.length > 0 && (
        <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tag</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Length</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value (Hex)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value (ASCII)</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-black divide-y divide-slate-200 dark:divide-zinc-800">
              {tlvData.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-slate-50 dark:bg-zinc-900'}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <code className="text-sm font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      {item.tag}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-900 dark:text-slate-100">{item.tagName}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{item.length}</td>
                  <td className="px-4 py-2 text-sm font-mono text-slate-600 dark:text-slate-400">{item.valueHex}</td>
                  <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                    {item.valueAscii || <span className="text-slate-400 dark:text-zinc-500 italic">N/A</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Output */}
      {tlvData.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
            View as JSON
          </summary>
          <pre className="mt-2 p-4 bg-zinc-900 text-slate-100 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(tlvData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default EmvTlvParser;
