import { useState, useCallback } from 'react';

// Card type definitions with BIN ranges
const CARD_TYPES = {
  visa: {
    name: 'Visa',
    prefixes: ['4'],
    lengths: [16, 17, 18, 19],
    cvvLength: 3,
    logo: '/images/visa.png',
    fallbackIcon: '💳',
    color: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
  },
  mastercard: {
    name: 'Mastercard',
    prefixes: ['51', '52', '53', '54', '55', '2221', '2222', '2223', '2224', '2225', '2226', '2227', '2228', '2229', '223', '224', '225', '226', '227', '228', '229', '23', '24', '25', '26', '271', '2720'],
    lengths: [16, 17, 18, 19],
    cvvLength: 3,
    logo: '/images/mastercard.png',
    fallbackIcon: '🔴',
    color: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
  },
  amex: {
    name: 'Amex',
    prefixes: ['34', '37'],
    lengths: [16, 17, 18, 19],
    cvvLength: 3,
    logo: '/images/amex.png',
    fallbackIcon: '🔵',
    color: 'text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
  },
  discover: {
    name: 'Discover',
    prefixes: ['6011', '622', '64', '65'],
    lengths: [16, 17, 18, 19],
    cvvLength: 3,
    logo: null,
    fallbackIcon: '🟠',
    color: 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'
  },
  jcb: {
    name: 'JCB',
    prefixes: ['35'],
    lengths: [16, 17, 18, 19],
    cvvLength: 3,
    logo: '/images/jcb.jpg',
    fallbackIcon: '🟣',
    color: 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
  },
  unionpay: {
    name: 'UnionPay',
    prefixes: ['62'],
    lengths: [16, 17, 18, 19],
    cvvLength: 3,
    logo: '/images/unionpay.png',
    fallbackIcon: '💳',
    color: 'text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800'
  },
  takapay: {
    name: 'TakaPay',
    prefixes: ['50'],
    lengths: [16, 17, 18, 19],
    cvvLength: 3,
    logo: '/images/takapay.png',
    fallbackIcon: '🇧🇩',
    color: 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
  }
};

// Calculate Luhn check digit
const calculateLuhnCheckDigit = (partialPan: string): number => {
  let sum = 0;
  let isEven = partialPan.length % 2 === 0;

  for (let i = 0; i < partialPan.length; i++) {
    let digit = parseInt(partialPan[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return (10 - (sum % 10)) % 10;
};

// Detect card type from PAN
const detectCardType = (pan: string): keyof typeof CARD_TYPES | null => {
  const clean = pan.replace(/\s/g, '');

  for (const [key, type] of Object.entries(CARD_TYPES)) {
    for (const prefix of type.prefixes) {
      if (clean.startsWith(prefix)) {
        return key as keyof typeof CARD_TYPES;
      }
    }
  }

  return null;
};

// Generate random CVV/CVC
const generateCVV = (length: number): string => {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};

// Generate cardholder name
const generateCardholderName = (): string => {
  const firstNames = ['JOHN', 'JANE', 'MICHAEL', 'SARAH', 'DAVID', 'EMILY', 'ROBERT', 'LISA'];
  const lastNames = ['SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER', 'DAVIS'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

// Generate service code
const generateServiceCode = (): string => {
  // Service code format: XYY where X = interchange, Y = authorization, Y = services
  const interchange = ['1', '2', '5'][Math.floor(Math.random() * 3)]; // 1=International, 2=International, 5=National
  const auth = ['0', '2', '4'][Math.floor(Math.random() * 3)]; // 0=Normal, 2=By issuer, 4=By issuer
  const services = ['0', '1', '2'][Math.floor(Math.random() * 3)]; // 0=No PIN, 1=PIN, 2=Both
  return interchange + auth + services;
};

// Generate Track 1 data (IATA format)
// Format: Start Sentinel + Format Code + PAN + Name + Expiry + Service Code + Discretionary + LRC + End Sentinel
const generateTrack1 = (pan: string, expiry: string, name: string): string => {
  const formatCode = 'B'; // B = format for magnetic stripe
  const serviceCode = generateServiceCode();
  const year2 = expiry.slice(-2);
  const month = expiry.slice(0, 2);
  const expiryYYMM = year2 + month;

  // Discretionary data (padding to make track data valid length)
  const discretionary = generateCVV(3);

  // Build track data without sentinels and LRC for now
  const trackData = `${formatCode}${pan}^${name}/${expiryYYMM}${serviceCode}${discretionary}`;

  // Calculate LRC (Longitudinal Redundancy Check)
  let lrc = 0;
  const dataWithSentinel = `%${trackData}`;
  for (let i = 0; i < dataWithSentinel.length; i++) {
    lrc ^= dataWithSentinel.charCodeAt(i);
  }
  const lrcChar = String.fromCharCode(lrc);

  return `%${trackData}${lrcChar}?`;
};

// Generate Track 2 data (ABA format)
// Format: Start Sentinel + PAN + Expiry + Service Code + Discretionary + LRC + End Sentinel
const generateTrack2 = (pan: string, expiry: string): string => {
  const serviceCode = generateServiceCode();
  const year2 = expiry.slice(-2);
  const month = expiry.slice(0, 2);
  const expiryYYMM = year2 + month;

  // Discretionary data
  const discretionary = generateCVV(3);

  // Build track data
  const trackData = `${pan}=${expiryYYMM}${serviceCode}${discretionary}`;

  // Calculate LRC
  let lrc = 0;
  const dataWithSentinel = `;${trackData}`;
  for (let i = 0; i < dataWithSentinel.length; i++) {
    lrc ^= dataWithSentinel.charCodeAt(i);
  }
  const lrcChar = String.fromCharCode(lrc);

  return `;${trackData}${lrcChar}?`;
};

// Generate Track 3 data (Thales/IBM format)
// Format: Start Sentinel + various encrypted fields + End Sentinel
const generateTrack3 = (pan: string): string => {
  // Track 3 is more complex and often encrypted. This is a simplified version.
  const serviceCode = generateServiceCode();
  const discretionary = generateCVV(10);

  // Simplified track 3 structure
  const trackData = `00${pan}=${serviceCode}${discretionary}`;

  // Calculate LRC
  let lrc = 0;
  const dataWithSentinel = `;${trackData}`;
  for (let i = 0; i < dataWithSentinel.length; i++) {
    lrc ^= dataWithSentinel.charCodeAt(i);
  }
  const lrcChar = String.fromCharCode(lrc);

  return `;${trackData}${lrcChar}?`;
};

// Generate expiry date
const generateExpiryDate = (monthsAhead: number = 12): { month: string; year: string; display: string } => {
  const date = new Date();
  date.setMonth(date.getMonth() + Math.floor(Math.random() * monthsAhead) + 1);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  return {
    month,
    year,
    display: `${month}/${year}`
  };
};

// Format PAN with spaces
const formatPan = (pan: string): string => {
  const cleaned = pan.replace(/\s/g, '');
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

// Generate complete card
const generateCard = (cardType: keyof typeof CARD_TYPES, length?: number): GeneratedCard => {
  const type = CARD_TYPES[cardType];
  const prefix = type.prefixes[Math.floor(Math.random() * type.prefixes.length)];
  const cardLength = length || type.lengths[Math.floor(Math.random() * type.lengths.length)];

  let partialPan = prefix;
  while (partialPan.length < cardLength - 1) {
    partialPan += Math.floor(Math.random() * 10);
  }

  const checkDigit = calculateLuhnCheckDigit(partialPan);
  const pan = partialPan + checkDigit;

  const expiry = generateExpiryDate();
  const cvv = generateCVV(type.cvvLength);
  const cardholderName = generateCardholderName();

  return {
    pan: formatPan(pan),
    panRaw: pan,
    expiry: expiry.display,
    expiryYYMM: expiry.year + expiry.month,
    cvv,
    cardholderName,
    track1: generateTrack1(pan, expiry.display, cardholderName),
    track2: generateTrack2(pan, expiry.display),
    track3: generateTrack3(pan),
    type: cardType,
    typeName: type.name
  };
};

interface GeneratedCard {
  pan: string;
  panRaw: string;
  expiry: string;
  expiryYYMM: string;
  cvv: string;
  cardholderName: string;
  track1: string;
  track2: string;
  track3: string;
  type: keyof typeof CARD_TYPES;
  typeName: string;
}

const CardGenerator = ({ className = '' }) => {
  const [selectedType, setSelectedType] = useState<keyof typeof CARD_TYPES>('visa');
  const [customBin, setCustomBin] = useState('');
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [quantity, setQuantity] = useState(10);

  const handleGenerate = useCallback(() => {
    const cards: GeneratedCard[] = [];

    for (let i = 0; i < quantity; i++) {
      if (customBin && /^[0-9]+$/.test(customBin.replace(/\s/g, ''))) {
        const bin = customBin.replace(/\s/g, '');
        const detectedType = detectCardType(bin) || 'visa';
        const typeInfo = CARD_TYPES[detectedType];
        const length = typeInfo.lengths[Math.floor(Math.random() * typeInfo.lengths.length)];

        let partialPan = bin;
        while (partialPan.length < length - 1) {
          partialPan += Math.floor(Math.random() * 10);
        }

        const checkDigit = calculateLuhnCheckDigit(partialPan);
        const pan = partialPan + checkDigit;
        const expiry = generateExpiryDate();
        const cvv = generateCVV(typeInfo.cvvLength);
        const cardholderName = generateCardholderName();

        cards.push({
          pan: formatPan(pan),
          panRaw: pan,
          expiry: expiry.display,
          expiryYYMM: expiry.year + expiry.month,
          cvv,
          cardholderName,
          track1: generateTrack1(pan, expiry.display, cardholderName),
          track2: generateTrack2(pan, expiry.display),
          track3: generateTrack3(pan),
          type: detectedType,
          typeName: typeInfo.name
        });
      } else {
        cards.push(generateCard(selectedType));
      }
    }

    setGeneratedCards(cards);
  }, [selectedType, customBin, quantity]);

  const handleCopyCard = useCallback((card: GeneratedCard) => {
    const text = `PAN: ${card.panRaw}
EXP: ${card.expiry}
CVV: ${card.cvv}
HOLDER: ${card.cardholderName}

TRACK 1: ${card.track1}
TRACK 2: ${card.track2}
TRACK 3: ${card.track3}`;
    navigator.clipboard.writeText(text);
  }, []);

  const handleCopyAll = useCallback(() => {
    const text = generatedCards.map(card =>
      `${card.panRaw},${card.expiry},${card.cvv},${card.cardholderName},"${card.track1}","${card.track2}","${card.track3}",${card.typeName}`
    ).join('\n');
    navigator.clipboard.writeText(text);
  }, [generatedCards]);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
          Card Generator
        </h1>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        {/* Card Type Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">
            Card Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as keyof typeof CARD_TYPES);
              setCustomBin('');
            }}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100"
          >
            {Object.entries(CARD_TYPES).map(([key, type]) => (
              <option key={key} value={key}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className="w-20">
          <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">
            Qty
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Custom BIN */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">
            Custom BIN (optional)
          </label>
          <input
            type="text"
            value={customBin}
            onChange={(e) => setCustomBin(formatPan(e.target.value))}
            placeholder="e.g., 4111 0000"
            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
        >
          Generate
        </button>
      </div>

      {/* BIN Detection */}
      {customBin.replace(/\s/g, '').length >= 4 && (
        <div className="mb-4 p-2 rounded border text-xs">
          <span className="text-slate-600 dark:text-slate-400">Detected: </span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {detectCardType(customBin) ? CARD_TYPES[detectCardType(customBin)!].name : 'Unknown'}
          </span>
        </div>
      )}

      {/* Copy All Button */}
      {generatedCards.length > 0 && (
        <div className="mb-3 flex gap-3">
          <button
            onClick={handleCopyAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Copy All (CSV with Tracks) →
          </button>
        </div>
      )}

      {/* Generated Cards - Compact Grid */}
      {generatedCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pb-2">
          {generatedCards.map((card, index) => {
            const typeInfo = CARD_TYPES[card.type];
            const cardBgColors = {
              visa: 'bg-gradient-to-br from-blue-600 to-blue-800',
              mastercard: 'bg-gradient-to-br from-red-500 to-orange-600',
              amex: 'bg-gradient-to-br from-sky-500 to-blue-600',
              discover: 'bg-gradient-to-br from-orange-500 to-amber-600',
              jcb: 'bg-gradient-to-br from-purple-500 to-indigo-600',
              unionpay: 'bg-gradient-to-br from-teal-500 to-emerald-600',
              takapay: 'bg-gradient-to-br from-green-600 to-red-600'
            };
            const bgColor = cardBgColors[card.type] || 'bg-gradient-to-br from-slate-600 to-slate-800';

            return (
              <div
                key={index}
                className="group relative cursor-pointer"
                onClick={() => handleCopyCard(card)}
                title="Click to copy"
              >
                {/* Credit Card Design */}
                <div className={`relative aspect-[1.586/1] w-full rounded-xl ${bgColor} p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] overflow-hidden`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-36 h-36 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
                  </div>

                  <div className="relative h-full flex flex-col justify-between">
                    {/* Card Header */}
                    <div className="flex justify-between items-start">
                      {/* Card Logo */}
                      {typeInfo.logo ? (
                        <img src={typeInfo.logo} alt={typeInfo.name} className="h-7 w-auto object-contain drop-shadow-lg" />
                      ) : (
                        <span className="text-xl drop-shadow-lg">{typeInfo.fallbackIcon}</span>
                      )}

                      {/* Contactless Icon */}
                      <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                      </svg>
                    </div>

                    {/* Chip */}
                    <div className="absolute top-12 right-3">
                      <div className="w-8 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded flex items-center justify-center shadow-inner border border-yellow-600/30">
                        <div className="w-6 h-5 border border-yellow-600/40 rounded grid grid-cols-2 gap-0.5 p-0.5">
                          <div className="bg-yellow-600/20 rounded-[1px]"></div>
                          <div className="bg-yellow-600/20 rounded-[1px]"></div>
                          <div className="bg-yellow-600/20 rounded-[1px]"></div>
                          <div className="bg-yellow-600/20 rounded-[1px]"></div>
                        </div>
                      </div>
                    </div>

                    {/* Card Number */}
                    <div className="mt-auto pt-1">
                      <p className="font-mono text-sm sm:text-base font-bold text-white tracking-wider drop-shadow-md break-all leading-tight">
                        {card.pan}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="flex justify-between items-end mt-2 gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-[6px] sm:text-[8px] text-white/70 uppercase tracking-wider">Card Holder</p>
                        <p className="text-[10px] sm:text-xs font-medium text-white uppercase tracking-wide truncate">{card.cardholderName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[6px] sm:text-[8px] text-white/70 uppercase tracking-wider">Expires</p>
                        <p className="text-[10px] sm:text-xs font-medium text-white tracking-wide">{card.expiry}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[6px] sm:text-[8px] text-white/70 uppercase tracking-wider">CVV</p>
                        <p className="text-[10px] sm:text-xs font-medium text-white tracking-wide">{card.cvv}</p>
                      </div>
                    </div>
                  </div>

                  {/* Copy Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <div className="flex items-center gap-2 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">Click to Copy All Data</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Track Data Display */}
      {generatedCards.length > 0 && (
        <div className="mt-4">
          <details className="group" open>
            <summary className="flex items-center justify-between cursor-pointer mb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                Track Data ▼
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const trackData = generatedCards.map(card =>
                    `Track 1: ${card.track1}\nTrack 2: ${card.track2}\nTrack 3: ${card.track3}\n`
                  ).join('\n');
                  navigator.clipboard.writeText(trackData);
                }}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Copy All Track Data
              </button>
            </summary>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {generatedCards.map((card, index) => (
                <div key={index} className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Card {index + 1}: {card.pan}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-500">{card.typeName}</span>
                  </div>

                  <div className="space-y-2">
                    {/* Track 1 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Track 1 (IATA)</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(card.track1)}
                          className="text-[9px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-black p-1.5 rounded border border-slate-200 dark:border-zinc-800">
                        {card.track1}
                      </p>
                    </div>

                    {/* Track 2 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">Track 2 (ABA)</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(card.track2)}
                          className="text-[9px] text-slate-500 hover:text-green-600 dark:hover:text-green-400"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-black p-1.5 rounded border border-slate-200 dark:border-zinc-800">
                        {card.track2}
                      </p>
                    </div>

                    {/* Track 3 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Track 3 (Thales)</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(card.track3)}
                          className="text-[9px] text-slate-500 hover:text-purple-600 dark:hover:text-purple-400"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-black p-1.5 rounded border border-slate-200 dark:border-zinc-800">
                        {card.track3}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Test Card Numbers - Compact */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <details className="group">
          <summary className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
            Test Card Numbers ▼
          </summary>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
            <div>
              <span className="text-blue-600">Visa:</span> 4111 1111 1111 1111
            </div>
            <div>
              <span className="text-red-600">Mastercard:</span> 5555 5555 5555 4444
            </div>
            <div>
              <span className="text-sky-600">Amex:</span> 3782 822463 10005
            </div>
            <div>
              <span className="text-orange-600">Discover:</span> 6011 0000 0000 0004
            </div>
            <div>
              <span className="text-purple-600">JCB:</span> 3530 1113 3330 0000
            </div>
            <div>
              <span className="text-teal-600">UnionPay:</span> 6200 0000 0000 0002
            </div>
            <div>
              <span className="text-green-600">TakaPay:</span> 5000 0000 0000 0001
            </div>
          </div>
        </details>
      </div>

      {/* Track Data Reference */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <details className="group">
          <summary className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
            Track Data Format Reference ▼
          </summary>
          <div className="mt-2 space-y-2 text-[10px]">
            <div>
              <span className="font-semibold text-blue-600">Track 1 (IATA):</span>
              <code className="ml-1 text-slate-600 dark:text-zinc-400">%B1234567890123456^DOE/JOHN^2512201XXXXXXXXXX?</code>
            </div>
            <div>
              <span className="font-semibold text-green-600">Track 2 (ABA):</span>
              <code className="ml-1 text-slate-600 dark:text-zinc-400">;1234567890123456=2512201XXXXX?</code>
            </div>
            <div>
              <span className="font-semibold text-purple-600">Track 3 (Thales):</span>
              <code className="ml-1 text-slate-600 dark:text-zinc-500">;[encrypted_pin_data]?</code>
            </div>
            <div className="pt-1 border-t border-slate-200 dark:border-zinc-700 text-[9px] text-slate-500 dark:text-zinc-600">
              SC = Service Code | DD = Discretionary Data | LRC = Longitudinal Redundancy Check
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default CardGenerator;
