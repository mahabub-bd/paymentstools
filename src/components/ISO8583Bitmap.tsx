

// ISO 8583 Field descriptions
const ISO8583_FIELDS: Record<number, string> = {
  2: 'Primary Account Number (PAN)',
  3: 'Processing Code',
  4: 'Transaction Amount',
  5: 'Settlement Amount',
  6: 'Billing Amount',
  7: 'Transmission Date & Time',
  8: 'Billing Amount',
  9: 'Conversion Rate',
  10: 'Conversion Rate',
  11: 'System Trace Audit Number (STAN)',
  12: 'Local Transaction Time',
  13: 'Local Transaction Date',
  14: 'Expiration Date',
  15: 'Settlement Date',
  16: 'Conversion Date',
  17: 'Capture Date',
  18: 'Merchant Type',
  19: 'Acquiring Institution Country Code',
  20: 'PAN Extended Country Code',
  21: 'Forwarding Institution Country Code',
  22: 'Point of Service Entry Mode',
  23: 'Card Sequence Number',
  24: 'Network International Identifier',
  25: 'Point of Service Condition Code',
  26: 'Point of Service PIN Capture Code',
  27: 'Authorization Identification Response Length',
  28: 'Amount Fee',
  29: 'Amount Fee',
  30: 'Amount Fee',
  31: 'Amount Fee',
  32: 'Acquiring Institution ID Code',
  33: 'Forwarding Institution ID Code',
  34: 'Primary Account Number Extended',
  35: 'Track 2 Data',
  36: 'Track 3 Data',
  37: 'Retrieval Reference Number',
  38: 'Authorization Identification Response',
  39: 'Response Code',
  40: 'Service Restriction Code',
  41: 'Card Acceptor Terminal ID',
  42: 'Card Acceptor ID Code',
  43: 'Card Acceptor Name/Location',
  44: 'Additional Response Data',
  45: 'Track 1 Data',
  46: 'Additional Data - ISO',
  47: 'Additional Data - National',
  48: 'Additional Data - Private',
  49: 'Transaction Currency Code',
  50: 'Settlement Currency Code',
  51: 'Cardholder Billing Currency Code',
  52: 'PIN Data',
  53: 'Security Related Control Information',
  54: 'Additional Amounts',
  55: 'ISO Reserved',
  56: 'ISO Reserved',
  57: 'ISO Reserved',
  58: 'ISO Reserved',
  59: 'ISO Reserved',
  60: 'ISO Reserved',
  61: 'ISO Reserved',
  62: 'ISO Reserved',
  63: 'ISO Reserved',
  64: 'ISO Reserved',
  65: 'ISO Reserved',
  66: 'ISO Reserved',
  67: 'ISO Reserved',
  68: 'ISO Reserved',
  69: 'ISO Reserved',
  70: 'ISO Reserved',
  71: 'ISO Reserved',
  72: 'ISO Reserved',
  73: 'ISO Reserved',
  74: 'ISO Reserved',
  75: 'ISO Reserved',
  76: 'ISO Reserved',
  77: 'ISO Reserved',
  78: 'ISO Reserved',
  79: 'ISO Reserved',
  80: 'ISO Reserved',
  81: 'ISO Reserved',
  82: 'ISO Reserved',
  83: 'ISO Reserved',
  84: 'ISO Reserved',
  85: 'ISO Reserved',
  86: 'ISO Reserved',
  87: 'ISO Reserved',
  88: 'ISO Reserved',
  89: 'ISO Reserved',
  90: 'ISO Reserved',
  91: 'ISO Reserved',
  92: 'ISO Reserved',
  93: 'ISO Reserved',
  94: 'ISO Reserved',
  95: 'ISO Reserved',
  96: 'ISO Reserved',
  97: 'ISO Reserved',
  98: 'ISO Reserved',
  99: 'ISO Reserved',
  100: 'Receipt',
  101: 'File Name',
  102: 'Account ID 1',
  103: 'Account ID 2',
  104: 'Transaction Description',
  105: 'Reserved for ISO Use',
  106: 'Reserved for ISO Use',
  107: 'Reserved for ISO Use',
  108: 'Reserved for ISO Use',
  109: 'Reserved for ISO Use',
  110: 'Reserved for ISO Use',
  111: 'Reserved for ISO Use',
  112: 'Reserved for National Use',
  113: 'Reserved for National Use',
  114: 'Reserved for National Use',
  115: 'Reserved for National Use',
  116: 'Reserved for National Use',
  117: 'Reserved for National Use',
  118: 'Reserved for National Use',
  119: 'Reserved for National Use',
  120: 'Reserved for Private Use',
  121: 'Reserved for Private Use',
  122: 'Reserved for Private Use',
  123: 'Reserved for Private Use',
  124: 'Reserved for Private Use',
  125: 'Reserved for Private Use',
  126: 'Reserved for Private Use',
  127: 'Reserved for Private Use',
  128: 'MAC 2'
};

// Parse bitmap hex to field numbers
export function parseBitmap(bitmapHex: string): number[] {
  const bitmap = BigInt('0x' + bitmapHex);
  const fields: number[] = [];
  for (let i = 0; i < 128; i++) {
    if ((bitmap & BigInt(1) << BigInt(i)) !== BigInt(0)) {
      fields.push(i + 1);
    }
  }

  return fields;
}

interface ISO8583BitmapProps {
  bitmapHex: string;
  compact?: boolean;
}

// Create bitmap from field array
export function createBitmap(fields: number[]): string {
  let bitmap = BigInt(0);

  fields.forEach(field => {
    bitmap |= BigInt(1) << BigInt(field - 1);
  });

  return bitmap.toString(16).toUpperCase().padStart(32, '0');
}

export function ISO8583Bitmap({ bitmapHex, compact = false }: ISO8583BitmapProps) {
  const fields = parseBitmap(bitmapHex);

  return (
    <div className={`p-3 bg-gray-50 border border-gray-200 rounded-xl ${compact ? 'text-xs' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-700">ISO 8583 Bitmap</label>
        <span className="text-xs text-gray-500">{fields.length} fields present</span>
      </div>

      <div className="font-mono text-sm text-gray-800 break-all mb-2 bg-white p-2 rounded border">
        {bitmapHex.match(/.{1,2}/g)?.join(' ') || bitmapHex}
      </div>

      <div className={`grid gap-1 ${compact ? 'grid-cols-4' : 'grid-cols-2'} max-h-32 overflow-y-auto`}>
        {fields.map(field => (
          <div
            key={field}
            className="flex items-start gap-2 p-1.5 bg-white rounded border border-gray-200 hover:border-primary-300 transition-colors"
          >
            <span className="font-mono text-xs font-semibold text-primary-600 shrink-0">
              [{field.toString().padStart(3, '0')}]
            </span>
            <span className="text-xs text-gray-700 break-all">
              {ISO8583_FIELDS[field] || 'Reserved'}
            </span>
          </div>
        ))}
      </div>

      {/* Common fields */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Common fields:</p>
        <div className="flex flex-wrap gap-1">
          {fields.includes(2) && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">PAN</span>
          )}
          {fields.includes(3) && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Processing Code</span>
          )}
          {fields.includes(4) && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Amount</span>
          )}
          {fields.includes(22) && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">POS Mode</span>
          )}
          {fields.includes(35) && (
            <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded">Track 2</span>
          )}
          {fields.includes(39) && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Response Code</span>
          )}
          {fields.includes(52) && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">PIN Data</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ISO8583Bitmap;
