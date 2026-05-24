import { useState } from 'react';

// Detailed Service Code definitions
const SERVICE_CODES: Record<number, Record<number, {
  digit: string;
  meaning: string;
  description: string;
  details: string;
  useCase: string;
  implications: string[];
}>> = {
  1: {
    1: {
      digit: '1',
      meaning: 'International interchange',
      description: 'Card can be used internationally',
      details: 'Valid for international transactions. Card participates in international interchange systems.',
      useCase: 'Standard international credit/debit cards',
      implications: [
        'Higher interchange fees for cross-border transactions',
        'Requires BIN range to be registered internationally',
        'Currency conversion may apply',
        'Subject to international compliance rules'
      ]
    },
    2: {
      digit: '2',
      meaning: 'International interchange',
      description: 'Card can be used internationally (alternative)',
      details: 'Alternative international interchange designation, functionally equivalent to digit 1.',
      useCase: 'Some international card programs use this variant',
      implications: [
        'Same international capabilities as code 1',
        'May indicate specific card product tier',
        'Used by certain card associations for differentiation'
      ]
    },
    5: {
      digit: '5',
      meaning: 'National interchange only',
      description: 'Card restricted to domestic use',
      details: 'Card can only be used within the issuing country. Not valid for international transactions.',
      useCase: 'Domestic debit cards, local credit cards, national cards',
      implications: [
        'Lower interchange fees',
        'Cannot be used for foreign transactions',
        'May have different chargeback rights',
        'Popular in countries with strong domestic payment systems'
      ]
    },
    6: {
      digit: '6',
      meaning: 'National interchange only',
      description: 'Card restricted to domestic use (alternative)',
      details: 'Alternative national interchange designation.',
      useCase: 'Variation of domestic-only cards',
      implications: [
        'Same domestic restrictions as code 5',
        'May indicate specific domestic network affiliation'
      ]
    },
    7: {
      digit: '7',
      meaning: 'Private use',
      description: 'Proprietary card use',
      details: 'Card for private label or closed-loop systems. Not part of public interchange networks.',
      useCase: 'Store cards, fleet cards, corporate cards, closed-loop systems',
      implications: [
        'Only accepted by specific merchants',
        'May not have standard card brand logo',
        'Different fee structure',
        'Proprietary processing rules apply'
      ]
    },
    9: {
      digit: '9',
      meaning: 'Test',
      description: 'Test card',
      details: 'Reserved for testing purposes only. Not valid for actual transactions.',
      useCase: 'Development, QA, certification testing',
      implications: [
        'Should be rejected in production',
        'Uses test BIN ranges',
        'No real financial liability',
        'Used for terminal and system testing'
      ]
    }
  },
  2: {
    0: {
      digit: '0',
      meaning: 'Normal authorization',
      description: 'Standard authorization processing',
      details: 'Transaction follows normal authorization flow. No special handling required.',
      useCase: 'Most standard card transactions',
      implications: [
        'Standard authorization times',
        'Normal fraud detection applies',
        'Standard chargeback rights',
        'No additional verification required'
      ]
    },
    2: {
      digit: '2',
      meaning: 'Authorization by issuer',
      description: 'Authorization should be handled by issuer',
      details: 'Transactions require issuer-specific authorization processing. May use standalone authorization.',
      useCase: 'High-risk transactions, special card programs',
      implications: [
        'Longer authorization times',
        'May require additional verification',
        'Different fee structure',
        'Used for corporate/government cards'
      ]
    },
    4: {
      digit: '4',
      meaning: 'Authorization by issuer',
      description: 'Authorization should be handled by issuer (alternative)',
      details: 'Alternative issuer authorization designation.',
      useCase: 'Variation of issuer-authorized cards',
      implications: [
        'Same requirements as code 2',
        'May indicate specific issuer requirements'
      ]
    },
    5: {
      digit: '5',
      meaning: 'Normal authorization (exception)',
      description: 'Normal authorization with specific conditions',
      details: 'Standard authorization but with specific issuer conditions applied.',
      useCase: 'Conditional authorization scenarios',
      implications: [
        'May have velocity limits',
        'Additional security checks possible'
      ]
    }
  },
  3: {
    0: {
      digit: '0',
      meaning: 'No restrictions',
      description: 'All services allowed',
      details: 'Card can be used for all types of transactions without restriction.',
      useCase: 'Full-service credit cards, premium cards',
      implications: [
        'Can be used at any terminal type',
        'Cash advances allowed',
        'Balance transfers allowed',
        'Maximum flexibility'
      ]
    },
    1: {
      digit: '1',
      meaning: 'No PIN required',
      description: 'PIN not required for PIN-entry terminals',
      details: 'Card can be used without PIN entry at PIN-capable terminals. Signature-based authentication.',
      useCase: 'Credit cards, signature debit cards',
      implications: [
        'Signature required at POS',
        'Higher fraud risk for lost/stolen cards',
        'Faster checkout process',
        'Common in US markets'
      ]
    },
    2: {
      digit: '2',
      meaning: 'PIN required',
      description: 'PIN required for PIN-entry terminals',
      details: 'Card must use PIN for authentication at PIN-capable terminals. No fallback to signature.',
      useCase: 'Debit cards, EMV chip cards with PIN preference',
      implications: [
        'Lower fraud risk',
        'Cannot complete transaction without PIN',
        'Common in European and Asian markets',
        'Cardholder must remember PIN'
      ]
    },
    3: {
      digit: '3',
      meaning: 'BOTH options allowed',
      description: 'Card supports both PIN and signature',
      details: 'Terminal can choose either PIN or signature for authentication. Card supports both methods.',
      useCase: 'Hybrid debit/credit cards, global cards',
      implications: [
        'Flexibility in authentication',
        'Terminal decides authentication method',
        'May default to PIN in some regions',
        'Cardholder convenience'
      ]
    },
    4: {
      digit: '4',
      meaning: 'PIN required with cashback',
      description: 'PIN required with cashback allowed',
      details: 'PIN authentication required when cashback is requested at POS.',
      useCase: 'Debit cards with cashback capability',
      implications: [
        'Cashback only with valid PIN',
        'Additional PIN verification step',
        'Common for debit cards'
      ]
    },
    5: {
      digit: '5',
      meaning: 'Consumer cards only',
      description: 'Consumer use only, no corporate use',
      details: 'Restricted to consumer applications. Cannot be used for business/commercial purposes.',
      useCase: 'Personal credit cards, consumer debit cards',
      implications: [
        'Cannot be used for business expenses',
        'Different liability rules',
        'Lower credit limits typically',
        'Consumer protection laws apply'
      ]
    },
    6: {
      digit: '6',
      meaning: 'No PIN, with cashback',
      description: 'PIN not required, cashback allowed',
      details: 'Signature-based authentication with cashback capability.',
      useCase: 'Some signature debit cards',
      implications: [
        'Less common combination',
        'May have higher fraud risk',
        'Cardholder convenience priority'
      ]
    },
    7: {
      digit: '7',
      meaning: 'BOTH with cashback',
      description: 'Both PIN and signature allowed, with cashback',
      details: 'Maximum flexibility - PIN or signature, and cashback allowed.',
      useCase: 'Premium debit cards, flexible payment cards',
      implications: [
        'Full feature debit card',
        'Maximum cardholder convenience',
        'Complex terminal logic'
      ]
    }
  }
};

// Common Service Code Combinations with details
const COMMON_SERVICE_CODES = [
  {
    code: '101',
    name: 'Standard International Credit',
    description: 'International, Normal auth, No PIN',
    details: 'Most common service code for international credit cards.',
    usage: 'Standard Visa/Mastercard credit cards worldwide',
    features: ['International use', 'Signature-based', 'No PIN required', 'All services'],
    examples: ['Visa Traditional Credit', 'Mastercard Standard Credit', 'Most international credit cards'],
    regions: 'Global'
  },
  {
    code: '120',
    name: 'International Debit (Signature)',
    description: 'International, By issuer, No restrictions',
    details: 'International debit card with signature verification.',
    usage: 'Visa Debit, Mastercard Debit (signature-based)',
    features: ['International use', 'Issuer authorization', 'Signature-based', 'All services'],
    examples: ['Visa Debit', 'Mastercard Debit', 'International debit cards'],
    regions: 'Global'
  },
  {
    code: '122',
    name: 'International Debit (PIN)',
    description: 'International, By issuer, PIN required',
    details: 'International debit card requiring PIN authentication.',
    usage: 'PIN-based debit cards for international use',
    features: ['International use', 'Issuer authorization', 'PIN required', 'All services'],
    examples: ['Visa Debit with PIN', 'Mastercard Electronic', 'International PIN debit'],
    regions: 'Global (Europe, Asia)'
  },
  {
    code: '201',
    name: 'International Credit (Alt)',
    description: 'International, By issuer, No PIN',
    details: 'Alternative international credit card format.',
    usage: 'Some Mastercard products, corporate cards',
    features: ['International use', 'Issuer authorization', 'Signature-based', 'All services'],
    examples: ['Mastercard World', 'Corporate cards', 'Premium cards'],
    regions: 'Global'
  },
  {
    code: '200',
    name: 'Full Service Credit',
    description: 'International, By issuer, All services',
    details: 'Full-featured international credit card.',
    usage: 'Premium credit cards with all features enabled',
    features: ['International use', 'Issuer authorization', 'All services', 'Cash advances'],
    examples: ['Premium credit cards', 'Charge cards', 'Corporate cards'],
    regions: 'Global'
  },
  {
    code: '501',
    name: 'Domestic Credit',
    description: 'National only, Normal auth, No PIN',
    details: 'Domestic credit card restricted to home country.',
    usage: 'National credit cards, domestic products',
    features: ['Domestic only', 'Normal authorization', 'Signature-based', 'Lower fees'],
    examples: ['Domestic credit cards', 'Local bank cards'],
    regions: 'Country-specific'
  },
  {
    code: '599',
    name: 'Domestic Debit (Flexible)',
    description: 'National, By issuer, BOTH options',
    details: 'Domestic debit card with PIN or signature choice.',
    usage: 'Domestic debit cards with flexible authentication',
    features: ['Domestic only', 'PIN or signature', 'All services', 'Cashback allowed'],
    examples: ['National debit cards', 'Local EFTPOS cards'],
    regions: 'Country-specific'
  },
  {
    code: '101',
    name: 'takaPay Standard',
    description: 'International, Normal auth, No PIN',
    details: 'Standard takaPay card for international use.',
    usage: 'takaPay credit cards (Bangladesh)',
    features: ['International use', 'Signature-based', 'No PIN required', 'All services'],
    examples: ['takaPay Credit', 'takaPay Classic'],
    regions: 'Bangladesh, International'
  },
  {
    code: '501',
    name: 'takaPay Domestic',
    description: 'National only, Normal auth, No PIN',
    details: 'takaPay card for domestic use only.',
    usage: 'Domestic takaPay cards in Bangladesh',
    features: ['Domestic only', 'Lower fees', 'Signature-based', 'All services'],
    examples: ['takaPay Domestic', 'takaPay Local'],
    regions: 'Bangladesh only'
  },
  {
    code: '000',
    name: 'Invalid',
    description: 'Invalid code',
    details: 'Not a valid service code.',
    usage: 'Should be rejected',
    features: ['Invalid', 'Should not occur', 'Production error'],
    examples: ['Test data errors', 'Invalid configurations'],
    regions: 'N/A'
  }
];

// Regional variations
const REGIONAL_VARIATIONS = [
  {
    region: 'United States',
    codes: ['101', '120', '201'],
    notes: 'Primarily signature-based. PIN debit is separate network (Interlink, STAR, etc.)',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  },
  {
    region: 'Europe',
    codes: ['101', '122', '201'],
    notes: 'Chip and PIN mandatory since EMV migration. Signature rarely used.',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  },
  {
    region: 'Asia Pacific',
    codes: ['101', '122', '501'],
    notes: 'Mix of PIN and signature. Growing PIN preference.',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
  },
  {
    region: 'Bangladesh',
    codes: ['101', '501', '599'],
    notes: 'takaPay supports both international and domestic codes. Q-Cash network.',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  },
  {
    region: 'India',
    codes: ['101', '122', '501'],
    notes: 'RuPay network uses domestic codes. Visa/MC use international.',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
  }
];

const ServiceCodeList = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'structure' | 'combinations' | 'regional'>('structure');
  const [searchCode, setSearchCode] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<{ position: number; digit: string } | null>(null);

  // Search for a specific service code
  const searchResult = searchCode.length === 3 ? (() => {
    const pos1 = SERVICE_CODES[1]?.[parseInt(searchCode[0])];
    const pos2 = SERVICE_CODES[2]?.[parseInt(searchCode[1])];
    const pos3 = SERVICE_CODES[3]?.[parseInt(searchCode[2])];
    return { pos1, pos2, pos3 };
  })() : null;

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Card Service Code Details
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Complete reference for payment card service codes with detailed explanations
        </p>
      </div>

      {/* Quick Search */}
      <div className="mb-6">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
          Quick Search (3-digit code)
        </label>
        <input
          type="text"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          placeholder="e.g., 101, 122, 501"
          className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100"
          maxLength={3}
        />

        {/* Search Result */}
        {searchResult && (
          <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">
              Service Code {searchCode}:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded border">
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-1">Position 1 (Interchange)</p>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">{searchResult.pos1?.meaning || 'Unknown'}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500">{searchResult.pos1?.description || ''}</p>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded border">
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-1">Position 2 (Authorization)</p>
                <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">{searchResult.pos2?.meaning || 'Unknown'}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500">{searchResult.pos2?.description || ''}</p>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded border">
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-1">Position 3 (Services)</p>
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">{searchResult.pos3?.meaning || 'Unknown'}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500">{searchResult.pos3?.description || ''}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'structure'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Code Structure
        </button>
        <button
          onClick={() => setActiveTab('combinations')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'combinations'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Common Codes
        </button>
        <button
          onClick={() => setActiveTab('regional')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'regional'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Regional Variations
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'structure' && (
          <div className="space-y-8">
            {/* Position 1 - Interchange */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-mono text-sm">1</span>
                Position 1 - Interchange Control
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">Determines where the card can be used geographically</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(SERVICE_CODES[1]).map(item => (
                  <div
                    key={item.digit}
                    onClick={() => setSelectedDetail({ position: 1, digit: item.digit })}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedDetail?.position === 1 && selectedDetail?.digit === item.digit
                        ? 'ring-2 ring-blue-500 border-blue-500'
                        : 'hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">{item.digit}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.meaning}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-3">{item.details}</p>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500">
                      <p className="font-medium mb-1">Use Case: {item.useCase}</p>
                    </div>
                    {selectedDetail?.position === 1 && selectedDetail?.digit === item.digit && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-700">
                        <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">Implications:</p>
                        <ul className="text-[10px] text-slate-500 dark:text-zinc-500 space-y-0.5">
                          {item.implications.map((imp, i) => (
                            <li key={i}>• {imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Position 2 - Authorization */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center font-mono text-sm">2</span>
                Position 2 - Authorization Processing
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">How transactions should be authorized</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(SERVICE_CODES[2]).map(item => (
                  <div
                    key={item.digit}
                    onClick={() => setSelectedDetail({ position: 2, digit: item.digit })}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedDetail?.position === 2 && selectedDetail?.digit === item.digit
                        ? 'ring-2 ring-green-500 border-green-500'
                        : 'hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-2xl font-bold text-green-600 dark:text-green-400">{item.digit}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.meaning}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-3">{item.details}</p>
                    {selectedDetail?.position === 2 && selectedDetail?.digit === item.digit && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-700">
                        <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">Use Case:</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-2">{item.useCase}</p>
                        <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">Implications:</p>
                        <ul className="text-[10px] text-slate-500 dark:text-zinc-500 space-y-0.5">
                          {item.implications.map((imp, i) => (
                            <li key={i}>• {imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Position 3 - Services */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center font-mono text-sm">3</span>
                Position 3 - Services Allowed
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">PIN requirements, cashback, and cardholder verification</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(SERVICE_CODES[3]).map(item => (
                  <div
                    key={item.digit}
                    onClick={() => setSelectedDetail({ position: 3, digit: item.digit })}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedDetail?.position === 3 && selectedDetail?.digit === item.digit
                        ? 'ring-2 ring-purple-500 border-purple-500'
                        : 'hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-2xl font-bold text-purple-600 dark:text-purple-400">{item.digit}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.meaning}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-3">{item.details}</p>
                    {selectedDetail?.position === 3 && selectedDetail?.digit === item.digit && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-700">
                        <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">Use Case:</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-2">{item.useCase}</p>
                        <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">Implications:</p>
                        <ul className="text-[10px] text-slate-500 dark:text-zinc-500 space-y-0.5">
                          {item.implications.map((imp, i) => (
                            <li key={i}>• {imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'combinations' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">
              Detailed breakdown of common service code combinations
            </p>
            {COMMON_SERVICE_CODES.map(item => (
              <div key={item.code} className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">{item.code}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{item.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                    {item.regions}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{item.details}</p>

                <div className="mb-3">
                  <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.features.map((feature, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">Common Usage:</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.usage}</p>
                </div>

                <div>
                  <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">Examples:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.examples.map((example, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 rounded">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'regional' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4">
              How service codes vary by region and local payment practices
            </p>
            {REGIONAL_VARIATIONS.map((region, index) => (
              <div key={index} className={`p-4 rounded-lg border ${region.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{region.region}</h4>
                  <div className="flex gap-1">
                    {region.codes.map(code => (
                      <span key={code} className="font-mono text-xs px-2 py-1 bg-white dark:bg-black rounded border">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">{region.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Reference</h3>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div>
            <strong className="text-slate-700 dark:text-slate-300">Format:</strong> 3 digits (D1-D2-D3) in Track 2 magnetic stripe data
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
            <div>
              <strong className="text-slate-700 dark:text-slate-300">Position 1 (Interchange):</strong>
              <p className="text-slate-500 dark:text-zinc-500">1/2=International, 5/6=National, 9=Test</p>
            </div>
            <div>
              <strong className="text-slate-700 dark:text-slate-300">Position 2 (Authorization):</strong>
              <p className="text-slate-500 dark:text-zinc-500">0=Normal, 2/4=By issuer</p>
            </div>
            <div>
              <strong className="text-slate-700 dark:text-slate-300">Position 3 (Services):</strong>
              <p className="text-slate-500 dark:text-zinc-500">0=All, 1=No PIN, 2=PIN req, 3=Both</p>
            </div>
          </div>
          <p className="pt-2 border-t border-slate-200 dark:border-zinc-700">
            <strong className="text-slate-700 dark:text-slate-300">Location:</strong> Found in Track 2 magnetic stripe data and EMV chip card records
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceCodeList;
