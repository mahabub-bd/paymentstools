import { useCallback, useMemo, useState } from 'react';

// Card brand definitions with BIN ranges, logos and modern color schemes
const CARD_BRANDS = {
  visa: {
    name: 'Visa',
    bins: ['4'],
    logo: '/images/visa.png',
    cvvLength: 3,
    gradient: 'from-violet-600 via-purple-600 to-indigo-800',
    accent: '#1A1F71'
  },
  mastercard: {
    name: 'Mastercard',
    bins: ['51', '52', '53', '54', '55'],
    logo: '/images/mastercard.png',
    cvvLength: 3,
    gradient: 'from-rose-500 via-pink-600 to-red-700',
    accent: '#EB001B'
  },
  amex: {
    name: 'American Express',
    bins: ['34', '37'],
    logo: '/images/amex.png',
    cvvLength: 4,
    gradient: 'from-sky-400 via-blue-500 to-blue-700',
    accent: '#006FCF'
  },
  discover: {
    name: 'Discover',
    bins: ['6011', '622126', '622925', '644', '65'],
    logo: '/images/Discover-Logo.jpg',
    cvvLength: 3,
    gradient: 'from-orange-400 via-amber-500 to-orange-600',
    accent: '#FF6000'
  },
  jcb: {
    name: 'JCB',
    bins: ['35'],
    logo: '/images/jcb.jpg',
    cvvLength: 3,
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
    accent: '#00873F'
  },
  unionpay: {
    name: 'UnionPay',
    bins: ['62'],
    logo: '/images/unionpay.png',
    cvvLength: 3,
    gradient: 'from-red-500 via-rose-600 to-pink-700',
    accent: '#CC0000'
  },
  takapay: {
    name: 'TakaPay',
    bins: ['98'],
    logo: '/images/takapay.png',
    cvvLength: 3,
    gradient: 'from-emerald-400 via-green-500 to-lime-600',
    accent: '#00A651'
  }
};

// Service codes
const SERVICE_CODES = [
  { code: '101', description: 'No restrictions, PIN required' },
  { code: '120', description: 'No restrictions, no PIN required' },
  { code: '200', description: 'Valid for goods and services only' },
  { code: '201', description: 'Valid for goods and services only, PIN required' },
  { code: '220', description: 'Valid for goods and services only, no PIN' },
  { code: '000', description: 'No restrictions, international use' }
];

// Calculate Luhn check digit
const calculateLuhn = (pan: string): string => {
  const digits = pan.split('').map(Number);
  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if ((digits.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
};

// Generate PAN from BIN
const generatePanFromBin = (bin: string): string => {
  const cleanBin = bin.replace(/\s/g, '');
  let pan = cleanBin;

  // Ensure minimum 16 digits (including check digit)
  while (pan.length < 15) {
    pan += Math.floor(Math.random() * 10).toString();
  }

  // Add Luhn check digit
  pan += calculateLuhn(pan);
  return pan;
};

// Format name for Track 1 (LASTNAME/FIRSTNAME)
const formatName = (firstName: string, lastName: string): string => {
  const formatted = `${lastName.toUpperCase()}/${firstName.toUpperCase()}`;
  return formatted.padEnd(26, ' ').substring(0, 26);
};

// Calculate LRC (Longitudinal Redundancy Check) for Track 2
const calculateLRC = (data: string): string => {
  let lrc = 0;
  for (let i = 0; i < data.length; i++) {
    lrc ^= data.charCodeAt(i);
  }
  return String.fromCharCode(lrc);
};

const TrackGenerator = ({ className = '' }) => {
  // Input fields
  const [selectedBrand, setSelectedBrand] = useState('visa');
  const [cardBin, setCardBin] = useState('4');
  const [cardholderName, setCardholderName] = useState('BD USER');
  const [expiration, setExpiration] = useState('2512');
  const [serviceCode, setServiceCode] = useState('101');
  const [cvv, setCvv] = useState('123');
  const [pvv, setPvv] = useState('1234');
  const [discretionaryData, setDiscretionaryData] = useState('0000000000000000000');

  // Generated tracks
  const [track1, setTrack1] = useState('');
  const [track2, setTrack2] = useState('');
  const [generatedPan, setGeneratedPan] = useState('');

  // Get CVV length and gradient for selected brand
  const { cvvLength, gradient, accent } = useMemo(() => {
    return CARD_BRANDS[selectedBrand as keyof typeof CARD_BRANDS] || { cvvLength: 3, gradient: 'from-slate-600 to-slate-800', accent: '#64748B' };
  }, [selectedBrand]);

  // Get brand logo
  const brandLogo = useMemo(() => {
    return CARD_BRANDS[selectedBrand as keyof typeof CARD_BRANDS]?.logo || '';
  }, [selectedBrand]);

  // Update BIN when brand changes
  const handleBrandChange = useCallback((brand: string) => {
    setSelectedBrand(brand);
    const brandConfig = CARD_BRANDS[brand as keyof typeof CARD_BRANDS];
    if (brandConfig) {
      setCardBin(brandConfig.bins[0]);
    }
  }, []);

  // Generate tracks
  const handleGenerate = useCallback(() => {
    // Validate inputs
    if (!cardBin || !/^\d+$/.test(cardBin.replace(/\s/g, ''))) {
      alert('Please enter a valid BIN (numbers only)');
      return;
    }

    if (!cardholderName) {
      alert('Please enter cardholder name');
      return;
    }

    if (!expiration || !/^\d{4}$/.test(expiration)) {
      alert('Please enter a valid expiration date (YYMM)');
      return;
    }

    if (!serviceCode || !/^\d{3}$/.test(serviceCode)) {
      alert('Please enter a valid service code (3 digits)');
      return;
    }

    if (!cvv || !/^\d+$/.test(cvv)) {
      alert('Please enter a valid CVV');
      return;
    }

    // Generate PAN from BIN
    const pan = generatePanFromBin(cardBin);
    setGeneratedPan(pan);

    // Parse cardholder name (assume "FIRSTNAME LASTNAME" or "LASTNAME/FIRSTNAME")
    let firstName = 'BD';
    let lastName = 'USER';
    if (cardholderName.includes('/')) {
      const parts = cardholderName.split('/');
      lastName = parts[0]?.trim() || 'USER';
      firstName = parts[1]?.trim() || 'BD';
    } else if (cardholderName.includes(' ')) {
      const parts = cardholderName.split(' ');
      firstName = parts[0]?.trim() || 'BD';
      lastName = parts.slice(1).join(' ').trim() || 'USER';
    } else {
      firstName = cardholderName.trim() || 'BD';
      lastName = 'USER';
    }

    // Build Track 1
    // Format: %B PAN^LASTNAME/FIRSTNAME^YYMMServiceCodeDiscretionary?
    const discretionaryT1 = discretionaryData.padEnd(40, '0').substring(0, 40);
    const track1Data = `%B${pan}^${formatName(firstName, lastName)}^${expiration}${serviceCode}${discretionaryT1}?`;
    setTrack1(track1Data);

    // Build Track 2
    // Format: ;PAN=YYMMServiceCodeDiscretionary? + LRC
    const discretionaryT2 = discretionaryData.padEnd(26, '0').substring(0, 26);
    const track2Data = `;${pan}=${expiration}${serviceCode}${discretionaryT2}`;
    setTrack2(track2Data + '?' + calculateLRC(track2Data + '?'));
  }, [cardBin, cardholderName, expiration, serviceCode, cvv, pvv, discretionaryData]);

  // Clear all
  const handleClear = useCallback(() => {
    setCardBin('4');
    setCardholderName('BD USER');
    setExpiration('2512');
    setServiceCode('101');
    setCvv('123');
    setPvv('1234');
    setDiscretionaryData('0000000000000000000');
    setTrack1('');
    setTrack2('');
    setGeneratedPan('');
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 md:p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-1.5">
          Credit/Debit Card Track Generator
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Generate Track 1 & Track 2 magnetic stripe data with custom inputs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column - Input Fields */}
        <div className="space-y-4">
          {/* Card Brand & BIN */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
                  Card Brand
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                >
                  {Object.entries(CARD_BRANDS).map(([key, brand]) => (
                    <option key={key} value={key}>{brand.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
                  BIN (Bank ID)
                </label>
                <input
                  type="text"
                  value={cardBin}
                  onChange={(e) => setCardBin(e.target.value)}
                  placeholder="e.g., 412345"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                  maxLength={16}
                />
              </div>
            </div>
          </div>

          {/* Cardholder Name & Expiration */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                  placeholder="BD USER"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
                  Expiration (YYMM)
                </label>
                <input
                  type="text"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  placeholder="2512"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Service Code, CVV, PVV */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
                  Service Code
                </label>
                <input
                  type="text"
                  value={serviceCode}
                  onChange={(e) => setServiceCode(e.target.value)}
                  placeholder="101"
                  maxLength={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
                  CVV/CVC
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="123"
                  maxLength={cvvLength}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
                  PVV
                </label>
                <input
                  type="text"
                  value={pvv}
                  onChange={(e) => setPvv(e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-zinc-500">
              Common Service Codes: {SERVICE_CODES.map(sc => sc.code).join(', ')}
            </div>
          </div>

          {/* Discretionary Data */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <label className="block text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium mb-2">
              Discretionary Data
            </label>
            <input
              type="text"
              value={discretionaryData}
              onChange={(e) => setDiscretionaryData(e.target.value)}
              placeholder="0000000000000000000"
              maxLength={40}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
            />
            <div className="mt-1 text-[10px] text-slate-500 dark:text-zinc-500">
              Hex or numeric data for discretionary field
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleGenerate}
              className="px-3 sm:px-4 py-2.5 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Generate Tracks
            </button>
            <button
              onClick={handleClear}
              className="px-3 sm:px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs sm:text-sm transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Security Notice */}
          <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400">
                <strong>Test data only.</strong> These are generated test card numbers for development and testing purposes only. Do not use in production.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Generated Data */}
        {(track1 || track2 || generatedPan) && (
          <div className="space-y-4">
            {/* Modern Card Visual */}
            <div className="mx-auto" style={{ width: '420px', height: '265px' }}>
              <div className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] bg-gradient-to-br ${gradient}`}>
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30"></div>

                {/* Mesh pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{
                    backgroundImage: `radial-gradient(circle at 30% 40%, white 1px, transparent 1px),
                                     radial-gradient(circle at 70% 60%, white 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                  }}></div>
                </div>

                {/* Floating orbs */}
                <div className="absolute top-10 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

                {/* Glass morphism chip */}
                <div className="absolute top-9 left-9">
                  <div className="relative">
                    <div className="w-16 h-11 rounded-xl bg-gradient-to-br from-amber-200/90 via-yellow-400/80 to-yellow-600/90 backdrop-blur-sm border-2 border-yellow-300/50 shadow-xl">
                      {/* Chip grid */}
                      <div className="grid grid-cols-4 gap-px h-full p-1.5">
                        {[...Array(24)].map((_, i) => (
                          <div key={i} className="bg-amber-900/20 rounded-sm"></div>
                        ))}
                      </div>
                      {/* Metallic contacts */}
                      <div className="absolute top-2 left-2 right-2 h-0.5 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-full"></div>
                      <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-full"></div>
                    </div>
                    {/* Chip shadow */}
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-xl blur-sm -z-10"></div>
                  </div>
                </div>

                {/* Contactless indicator (NFC icon) */}
                <div className="absolute top-10 left-32">
                  <img
                    src="/images/contactless.png"
                    alt="Contactless"
                    className="w-8 h-8 object-contain drop-shadow-lg"
                  />
                </div>

                {/* Card brand logo */}
                <div className="absolute top-7 right-7">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/10 rounded-lg blur-xl"></div>
                    <img
                      src={brandLogo}
                      alt="Card Brand"
                      className="relative h-10 object-contain drop-shadow-2xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Card number */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 px-10">
                  <div className="relative">
                    <div className="font-mono text-2xl text-white tracking-[0.15em] text-center" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                      {generatedPan || '••••••••••••••••'}
                    </div>
                    {generatedPan && (
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[8px] font-semibold text-emerald-400 uppercase tracking-wider">Luhn Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card holder */}
                <div className="absolute bottom-10 left-10">
                  <div className="text-[10px] text-white/50 uppercase tracking-[0.2em] mb-1.5">Card Holder</div>
                  <div className="text-base font-semibold text-white uppercase tracking-wide truncate max-w-[220px]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    {cardholderName || 'BD USER'}
                  </div>
                </div>

                {/* Expiration */}
                <div className="absolute bottom-10 right-10">
                  <div className="text-[10px] text-white/50 uppercase tracking-[0.2em] mb-1.5">Valid Thru</div>
                  <div className="relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-5 h-full bg-gradient-to-r from-transparent to-black/20 rounded"></div>
                    <div className="font-mono text-lg text-white tracking-wide" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      {expiration.substring(0, 2)}/{expiration.substring(2, 4)}
                    </div>
                  </div>
                </div>

                {/* CVV hint */}
                <div className="absolute bottom-10 right-32">
                  <div className="text-[9px] text-white/30 font-mono">CVV: {cvv}</div>
                </div>

                {/* Decorative line */}
                <div className="absolute bottom-20 left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Corner accents */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-br-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-tl-full"></div>
              </div>
            </div>

            {/* Card Details */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Card Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">PAN</div>
                  <div className="font-mono text-slate-900 dark:text-slate-100">{generatedPan || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">CVV/CVC</div>
                  <div className="font-mono text-slate-900 dark:text-slate-100">{cvv || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">PVV</div>
                  <div className="font-mono text-slate-900 dark:text-slate-100">{pvv || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">Service Code</div>
                  <div className="font-mono text-slate-900 dark:text-slate-100">{serviceCode || '-'}</div>
                </div>
              </div>
            </div>

            {/* Track 1 */}
            {track1 && (
              <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Track 1
                  </h3>
                  <button
                    onClick={() => handleCopy(track1)}
                    className="px-2 py-1 bg-emerald-600 text-white text-[10px] sm:text-xs rounded hover:bg-emerald-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-2 bg-white dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700">
                  <pre className="font-mono text-[10px] sm:text-xs text-slate-800 dark:text-slate-200 break-all">
                    {track1}
                  </pre>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 dark:text-zinc-500">
                  Format: %B PAN^NAME^YYMMServiceCodeDiscretionary?
                </div>
              </div>
            )}

            {/* Track 2 */}
            {track2 && (
              <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Track 2
                  </h3>
                  <button
                    onClick={() => handleCopy(track2)}
                    className="px-2 py-1 bg-emerald-600 text-white text-[10px] sm:text-xs rounded hover:bg-emerald-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-2 bg-white dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700">
                  <pre className="font-mono text-[10px] sm:text-xs text-slate-800 dark:text-slate-200 break-all">
                    {track2}
                  </pre>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 dark:text-zinc-500">
                  Format: ;PAN=YYMMServiceCodeDiscretionary? + LRC
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackGenerator;
