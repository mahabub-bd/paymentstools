import React, { useCallback, useMemo, useState } from 'react';

// ISO 8583-1:1987 & ISO 8583-1:2003 Field descriptions
const ISO8583_FIELDS: Record<number, { name: string; format: string; description: string }> = {
  1: { name: 'Bitmap', format: 'B', description: 'Secondary Bitmap Indicator' },
  2: { name: 'PAN', format: 'LLVAR..19', description: 'Primary Account Number' },
  3: { name: 'Processing Code', format: 'n6', description: 'Transaction Processing Code' },
  4: { name: 'Amount', format: 'n12', description: 'Transaction Amount' },
  5: { name: 'Settlement Amount', format: 'n12', description: 'Settlement Amount' },
  6: { name: 'Billing Amount', format: 'n12', description: 'Cardholder Billing Amount' },
  7: { name: 'Date & Time', format: 'n10', description: 'Transmission Date & Time (MMDDhhmmss)' },
  8: { name: 'Billing Amount', format: 'n8', description: 'Cardholder Billing Fee Amount' },
  9: { name: 'Conversion Rate', format: 'n8', description: 'Settlement Conversion Rate' },
  10: { name: 'Conversion Rate', format: 'n8', description: 'Cardholder Billing Conversion Rate' },
  11: { name: 'STAN', format: 'n6', description: 'System Trace Audit Number' },
  12: { name: 'Local Time', format: 'n6', description: 'Local Transaction Time (hhmmss)' },
  13: { name: 'Local Date', format: 'n4', description: 'Local Transaction Date (MMDD)' },
  14: { name: 'Expiration Date', format: 'n4', description: 'Card Expiration Date (YYMM)' },
  15: { name: 'Settlement Date', format: 'n4', description: 'Settlement Date (MMDD)' },
  16: { name: 'Conversion Date', format: 'n4', description: 'Conversion Date (MMDD)' },
  17: { name: 'Capture Date', format: 'n4', description: 'Capture Date (MMDD)' },
  18: { name: 'Merchant Type', format: 'n4', description: 'Merchant Category Code (MCC)' },
  19: { name: 'Acquiring Country', format: 'n3', description: 'Acquiring Institution Country Code' },
  20: { name: 'PAN Country', format: 'n3', description: 'PAN Extended Country Code' },
  21: { name: 'Forwarding Country', format: 'n3', description: 'Forwarding Institution Country Code' },
  22: { name: 'POS Entry Mode', format: 'n3', description: 'Point of Service Entry Mode' },
  23: { name: 'Card Sequence', format: 'n3', description: 'Card Sequence Number' },
  24: { name: 'Network ID', format: 'n3', description: 'Network International Identifier (NII)' },
  25: { name: 'POS Condition', format: 'n2', description: 'Point of Service Condition Code' },
  26: { name: 'PIN Capture', format: 'n2', description: 'Point of Service PIN Capture Code' },
  27: { name: 'Auth ID Length', format: 'n1', description: 'Authorization Identification Response Length' },
  28: { name: 'Fee Amount', format: 'n8', description: 'Amount Transaction Fee' },
  29: { name: 'Fee Amount', format: 'n8', description: 'Amount Settlement Fee' },
  30: { name: 'Fee Amount', format: 'n8', description: 'Amount Processing Fee' },
  31: { name: 'Fee Amount', format: 'n8', description: 'Amount Billing Fee' },
  32: { name: 'Acquiring ID', format: 'LLVAR..11', description: 'Acquiring Institution ID Code' },
  33: { name: 'Forwarding ID', format: 'LLVAR..11', description: 'Forwarding Institution ID Code' },
  34: { name: 'PAN Extended', format: 'LLVAR..28', description: 'Primary Account Number Extended' },
  35: { name: 'Track 2', format: 'LLVAR..37', description: 'Track 2 Data' },
  36: { name: 'Track 3', format: 'LLLVAR..104', description: 'Track 3 Data' },
  37: { name: 'RRN', format: 'an12', description: 'Retrieval Reference Number' },
  38: { name: 'Auth ID', format: 'an6', description: 'Authorization Identification Response' },
  39: { name: 'Response Code', format: 'n2', description: 'Response Code' },
  40: { name: 'Service Code', format: 'n3', description: 'Service Restriction Code' },
  41: { name: 'Terminal ID', format: 'ans8', description: 'Card Acceptor Terminal ID' },
  42: { name: 'Acceptor ID', format: 'ans15', description: 'Card Acceptor ID Code' },
  43: { name: 'Acceptor Name', format: 'ans40', description: 'Card Acceptor Name/Location' },
  44: { name: 'Additional Response', format: 'LLVAR..25', description: 'Additional Response Data' },
  45: { name: 'Track 1', format: 'LLLVAR..76', description: 'Track 1 Data' },
  46: { name: 'Additional Data ISO', format: 'LLLVAR..999', description: 'Additional Data - ISO' },
  47: { name: 'Additional Data Nat', format: 'LLLVAR..999', description: 'Additional Data - National' },
  48: { name: 'Additional Data Pvt', format: 'LLLVAR..999', description: 'Additional Data - Private' },
  49: { name: 'Currency Code', format: 'a3/n3', description: 'Transaction Currency Code' },
  50: { name: 'Currency Code', format: 'a3/n3', description: 'Settlement Currency Code' },
  51: { name: 'Currency Code', format: 'a3/n3', description: 'Cardholder Billing Currency Code' },
  52: { name: 'PIN Data', format: 'n8', description: 'Personal Identification Number Data' },
  53: { name: 'Security Control', format: 'n16', description: 'Security Related Control Information' },
  54: { name: 'Additional Amounts', format: 'LLLVAR..120', description: 'Additional Amounts' },
  55: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved (EMV data)' },
  56: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  57: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  58: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  59: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  60: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  61: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  62: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  63: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  64: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  65: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved (MAC)' },
  66: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  67: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  68: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  69: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  70: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  71: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  72: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  73: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  74: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  75: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  76: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  77: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  78: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  79: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  80: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  81: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  82: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  83: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  84: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  85: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  86: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  87: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  88: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  89: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  90: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  91: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  92: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  93: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  94: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  95: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  96: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  97: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  98: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  99: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'ISO Reserved' },
  100: { name: 'Receipt', format: 'LLLVAR..999', description: 'Receiving Institution ID Code' },
  101: { name: 'File Name', format: 'LLLVAR..999', description: 'File Name' },
  102: { name: 'Account ID 1', format: 'LLLVAR..999', description: 'Account ID 1' },
  103: { name: 'Account ID 2', format: 'LLLVAR..999', description: 'Account ID 2' },
  104: { name: 'Transaction Desc', format: 'LLLVAR..999', description: 'Transaction Description' },
  105: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'Reserved for ISO Use' },
  106: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'Reserved for ISO Use' },
  107: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'Reserved for ISO Use' },
  108: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'Reserved for ISO Use' },
  109: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'Reserved for ISO Use' },
  110: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'Reserved for ISO Use' },
  111: { name: 'Reserved ISO', format: 'LLLVAR..999', description: 'Reserved for ISO Use' },
  112: { name: 'Reserved National', format: 'LLLVAR..999', description: 'Reserved for National Use' },
  113: { name: 'Reserved National', format: 'LLLVAR..999', description: 'Reserved for National Use' },
  114: { name: 'Reserved National', format: 'LLLVAR..999', description: 'Reserved for National Use' },
  115: { name: 'Reserved National', format: 'LLLVAR..999', description: 'Reserved for National Use' },
  116: { name: 'Reserved National', format: 'LLLVAR..999', description: 'Reserved for National Use' },
  117: { name: 'Reserved National', format: 'LLLVAR..999', description: 'Reserved for National Use' },
  118: { name: 'Reserved National', format: 'LLLVAR..999', description: 'Reserved for National Use' },
  119: { name: 'Reserved National', format: 'LLLVAR..999', description: 'Reserved for National Use' },
  120: { name: 'Reserved Private', format: 'LLLVAR..999', description: 'Reserved for Private Use' },
  121: { name: 'Reserved Private', format: 'LLLVAR..999', description: 'Reserved for Private Use' },
  122: { name: 'Reserved Private', format: 'LLLVAR..999', description: 'Reserved for Private Use' },
  123: { name: 'Reserved Private', format: 'LLLVAR..999', description: 'Reserved for Private Use' },
  124: { name: 'Reserved Private', format: 'LLLVAR..999', description: 'Reserved for Private Use' },
  125: { name: 'Reserved Private', format: 'LLLVAR..999', description: 'Reserved for Private Use' },
  126: { name: 'Reserved Private', format: 'LLLVAR..999', description: 'Reserved for Private Use' },
  127: { name: 'Reserved Private', format: 'LLLVAR..999', description: 'Reserved for Private Use' },
  128: { name: 'MAC', format: 'n16', description: 'Message Authentication Code (MAC 2)' },
};

// MTI (Message Type Indicator) definitions
const MTI_VERSIONS = ['0', '1', '2', '8'] as const;
const MTI_CLASSES = ['1', '2'] as const;
const MTI_FUNCTIONS = ['00', '01', '02', '03', '10', '11', '12', '13', '20', '21', '22', '23', '30', '31', '32', '33', '40', '41', '42', '43'] as const;

const MTI_DESCRIPTIONS: Record<string, string> = {
  '0100': 'Authorization Request',
  '0101': 'Authorization Request (Repeat)',
  '0102': 'Authorization Request (Partial)',
  '0110': 'Authorization Response',
  '0111': 'Authorization Response (Repeat)',
  '0112': 'Authorization Response (Partial)',
  '0120': 'Advice Request',
  '0121': 'Advice Request (Repeat)',
  '0122': 'Advice Request (Partial)',
  '0130': 'Advice Response',
  '0131': 'Advice Response (Repeat)',
  '0132': 'Advice Response (Partial)',
  '0200': 'Financial Transaction Request',
  '0201': 'Financial Transaction Request (Repeat)',
  '0202': 'Financial Transaction Request (Partial)',
  '0210': 'Financial Transaction Response',
  '0211': 'Financial Transaction Response (Repeat)',
  '0212': 'Financial Transaction Response (Partial)',
  '0220': 'Financial Advice Request',
  '0221': 'Financial Advice Request (Repeat)',
  '0222': 'Financial Advice Request (Partial)',
  '0230': 'Financial Advice Response',
  '0231': 'Financial Advice Response (Repeat)',
  '0232': 'Financial Advice Response (Partial)',
  '0400': 'File Update Request',
  '0401': 'File Update Request (Repeat)',
  '0402': 'File Update Request (Partial)',
  '0410': 'File Update Response',
  '0411': 'File Update Response (Repeat)',
  '0412': 'File Update Response (Partial)',
  '0420': 'File Update Advice Request',
  '0421': 'File Update Advice Request (Repeat)',
  '0422': 'File Update Advice Request (Partial)',
  '0430': 'File Update Advice Response',
  '0431': 'File Update Advice Response (Repeat)',
  '0432': 'File Update Advice Response (Partial)',
  '0800': 'Network Management Request',
  '0801': 'Network Management Request (Repeat)',
  '0802': 'Network Management Request (Partial)',
  '0810': 'Network Management Response',
  '0811': 'Network Management Response (Repeat)',
  '0812': 'Network Management Response (Partial)',
  '1100': 'Echo Request',
  '1110': 'Echo Response',
  '1800': 'Key Management Request',
  '1810': 'Key Management Response',
};

const IsoBitmapEditor = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'first' | 'second'>('first');
  const [showFieldNames, setShowFieldNames] = useState(true);
  const [mti, setMti] = useState('0100');
  const [firstBitmap, setFirstBitmap] = useState(
    '0000000000000000000000000000000000000000000000000000000000000000'
  );
  const [secondBitmap, setSecondBitmap] = useState(
    '0000000000000000000000000000000000000000000000000000000000000000'
  );

  const currentBitmap = activeTab === 'first' ? firstBitmap : secondBitmap;
  const setCurrentBitmap = activeTab === 'first' ? setFirstBitmap : setSecondBitmap;

  // Get selected fields
  const selectedFields = useMemo(() => {
    const offset = activeTab === 'second' ? 64 : 0;
    const fields: number[] = [];
    for (let i = 0; i < 64; i++) {
      if (currentBitmap[i] === '1') {
        fields.push(i + 1 + offset);
      }
    }
    return fields;
  }, [currentBitmap, activeTab]);

  // Get hex representation
  const hexRepresentation = useMemo(() => {
    const padded = currentBitmap.padEnd(64, '0');
    const hex = BigInt('0b' + padded).toString(16).toUpperCase().padStart(16, '0');
    return hex.match(/.{1,2}/g)?.join(' ') || hex;
  }, [currentBitmap]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^01]/g, '').slice(0, 64);
    setCurrentBitmap(value.padEnd(64, '0'));
  }, [setCurrentBitmap]);

  const handleHexInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 16);
    const binary = BigInt('0x' + hex.padEnd(16, '0')).toString(2).padStart(64, '0');
    setCurrentBitmap(binary);
  }, [setCurrentBitmap]);

  const handleBitToggle = useCallback((index: number) => {
    setCurrentBitmap(prev => {
      const bits = prev.split('');
      bits[index] = bits[index] === '1' ? '0' : '1';
      return bits.join('');
    });
  }, [setCurrentBitmap]);

  const handleClear = useCallback(() => {
    setCurrentBitmap('0'.repeat(64));
  }, [setCurrentBitmap]);

  const handleSelectCommon = useCallback(() => {
    // Select common fields: 2, 3, 4, 11, 22, 25, 32, 37, 39, 41, 42, 49
    const commonFields = activeTab === 'first' ? [2, 3, 4, 11, 22, 25, 32, 37, 39, 41, 42, 49] : [];
    const newBits = '0'.repeat(64).split('');
    commonFields.forEach(field => {
      if (field <= 64) {
        newBits[field - 1] = '1';
      }
    });
    setCurrentBitmap(newBits.join(''));
  }, [setCurrentBitmap, activeTab]);

  const getBitValue = (index: number) => currentBitmap[index] === '1';

  // Grid layout: 16 rows × 4 columns
  const renderBitmapGrid = () => {
    const rows = [];
    const offset = activeTab === 'second' ? 64 : 0;

    for (let row = 0; row < 16; row++) {
      const bitsInRow = [];
      for (let col = 0; col < 6; col++) {
        const bitIndex = row + (col * 16);
        const fieldNumber = bitIndex + 1 + offset;
        const fieldInfo = ISO8583_FIELDS[fieldNumber] || { name: 'Reserved', format: '-', description: 'Reserved field' };

        bitsInRow.push(
          <label
            key={bitIndex}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${getBitValue(bitIndex)
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
          >
            <input
              type="checkbox"
              checked={getBitValue(bitIndex)}
              onChange={() => handleBitToggle(bitIndex)}
              className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 dark:bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
            />
            <div className="flex flex-col ">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  [{String(fieldNumber).padStart(3, '0')}]
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {fieldInfo.name}
                </span>
              </div>
              {showFieldNames && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500">{fieldInfo.format}</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-600 truncate ">
                    {fieldInfo.description}
                  </span>
                </div>
              )}
            </div>
          </label>
        );
      }
      rows.push(
        <div key={row} className="grid grid-cols-6 gap-2">
          {bitsInRow}
        </div>
      );
    }
    return rows;
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          ISO 8583 Bitmap Editor
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Edit the 64-bit ISO 8583 message bitmap with field descriptions
        </p>
      </div>

      {/* MTI Selector */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">Message Type Indicator (MTI)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {/* Version */}
          <div>
            <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Version</label>
            <select
              value={mti[0]}
              onChange={(e) => setMti(e.target.value + mti.slice(1))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100"
            >
              {MTI_VERSIONS.map(v => (
                <option key={v} value={v}>{v} - {v === '0' ? 'ISO 8583-1:1987' : v === '1' ? 'ISO 8583-1:1993' : v === '2' ? 'ISO 8583-1:2003' : 'ISO 8583-1:2003+'}</option>
              ))}
            </select>
          </div>
          {/* Class */}
          <div>
            <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Class</label>
            <select
              value={mti[1]}
              onChange={(e) => setMti(mti[0] + e.target.value + mti.slice(2))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100"
            >
              {MTI_CLASSES.map(c => (
                <option key={c} value={c}>{c} - {c === '1' ? 'Authorization' : 'Financial'}</option>
              ))}
            </select>
          </div>
          {/* Function */}
          <div>
            <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Function</label>
            <select
              value={mti.slice(2, 4)}
              onChange={(e) => setMti(mti.slice(0, 2) + e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100"
            >
              <option value="00">00 - Request</option>
              <option value="01">01 - Request (Repeat)</option>
              <option value="02">02 - Request (Partial)</option>
              <option value="10">10 - Response</option>
              <option value="11">11 - Response (Repeat)</option>
              <option value="12">12 - Response (Partial)</option>
              <option value="20">20 - Advice Request</option>
              <option value="21">21 - Advice Request (Repeat)</option>
              <option value="22">22 - Advice Request (Partial)</option>
              <option value="30">30 - Advice Response</option>
              <option value="31">31 - Advice Response (Repeat)</option>
              <option value="32">32 - Advice Response (Partial)</option>
              <option value="40">40 - Notification Request</option>
              <option value="41">41 - Notification Request (Repeat)</option>
              <option value="42">42 - Notification Request (Partial)</option>
              <option value="43">43 - Notification Response</option>
            </select>
          </div>
          {/* MTI Display */}
          <div>
            <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">MTI Value</label>
            <input
              type="text"
              value={mti}
              onChange={(e) => setMti(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 font-mono text-center"
              maxLength={4}
            />
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {MTI_DESCRIPTIONS[mti] || 'Custom MTI'}: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{mti}</span>
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-6 mb-6 border-b border-slate-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('first')}
          className={`pb-2 px-1 text-base font-medium transition-colors ${activeTab === 'first'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
          Primary Bitmap (Fields 1-64)
        </button>
        <button
          onClick={() => setActiveTab('second')}
          className={`pb-2 px-1 text-base font-medium transition-colors ${activeTab === 'second'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
          Secondary Bitmap (Fields 65-128)
        </button>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        <div>
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
            Hexadecimal Bitmap
          </label>
          <input
            type="text"
            value={hexRepresentation}
            onChange={handleHexInput}
            placeholder="Enter 16-digit hex string"
            className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            maxLength={35}
          />
        </div>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
            Binary Bitmap
          </label>
          <input
            type="text"
            value={currentBitmap}
            onChange={handleInputChange}
            placeholder="Enter 64-bit binary string"
            className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            maxLength={64}
          />
        </div>
      </div>

      {/* View Options */}
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showFieldNames}
            onChange={(e) => setShowFieldNames(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 dark:bg-zinc-800 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Show field descriptions</span>
        </label>
      </div>

      {/* Bitmap Grid */}
      <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col gap-2">
          {renderBitmapGrid()}
        </div>
      </div>

      {/* Selected Fields Summary */}
      {selectedFields.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">
            Selected Fields ({selectedFields.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 2xl:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {selectedFields.map(field => {
              const fieldInfo = ISO8583_FIELDS[field] || { name: 'Reserved', format: '-', description: '' };
              return (
                <div
                  key={field}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded border border-blue-100 dark:border-blue-900"
                >
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                    [{String(field).padStart(3, '0')}]
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {fieldInfo.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-500">
                      {fieldInfo.format}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Set bits: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{currentBitmap.split('1').length - 1}</span> / 64
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectCommon}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Select Common Fields
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default IsoBitmapEditor;
