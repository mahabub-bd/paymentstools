import { useState, useCallback, useMemo } from 'react';

interface RIDEntry {
  rid: string;
  organization: string;
  description: string;
  applications: RIDApplication[];
  website?: string;
}

interface RIDApplication {
  aid: string;
  name: string;
  description?: string;
}

const ridData: RIDEntry[] = [
  {
    rid: 'A0000000',
    organization: 'Visa International',
    description: 'Visa payment applications',
    website: 'visa.com',
    applications: [
      { aid: 'A000000001', name: 'Visa', description: 'Visa Classic debit/credit' },
      { aid: 'A000000003', name: 'Visa', description: 'Visa Classic' },
      { aid: 'A0000000031010', name: 'Visa Credit', description: 'Visa Credit' },
      { aid: 'A000000003101001', name: 'Visa Credit', description: 'Visa Credit (Generic)' },
      { aid: 'A0000000031020', name: 'Visa Debit', description: 'Visa Debit' },
      { aid: 'A000000003102001', name: 'Visa Debit', description: 'Visa Debit (Extended)' },
      { aid: 'A0000000032010', name: 'Visa Electron', description: 'Visa Electron debit' },
      { aid: 'A0000000032020', name: 'Visa Interlink', description: 'Visa Interlink ATM' },
      { aid: 'A0000000033010', name: 'Visa Plus', description: 'Visa Plus ATM' },
      { aid: 'A0000000038010', name: 'V Pay', description: 'V Pay debit (Europe)' },
      { aid: 'A0000000039010', name: 'Visa Specific', description: 'Visa Specific/Proprietary' },
      { aid: 'A000000004', name: 'Visa', description: 'Visa (Alternative)' },
      { aid: 'A000000005', name: 'Visa', description: 'Visa (Alternative)' },
    ]
  },
  {
    rid: 'A000000003',
    organization: 'Mastercard International',
    description: 'Mastercard payment applications',
    website: 'mastercard.com',
    applications: [
      { aid: 'A0000000041010', name: 'Mastercard Credit', description: 'Mastercard Credit' },
      { aid: 'A000000004101001', name: 'Mastercard Credit', description: 'Mastercard Credit (Extended)' },
      { aid: 'A0000000041020', name: 'Mastercard Debit', description: 'Mastercard Debit' },
      { aid: 'A0000000041030', name: 'Mastercard Electronic', description: 'Maestro Electronic' },
      { aid: 'A0000000042010', name: 'Maestro', description: 'Maestro debit' },
      { aid: 'A0000000043010', name: 'Cirrus', description: 'Cirrus ATM' },
      { aid: 'A0000000043060', name: 'Mastercard', description: 'Mastercard Specific' },
      { aid: 'A0000000046000', name: 'Maestro', description: 'Maestro (UK)' },
      { aid: 'A0000000048000', name: 'Mastercard', description: 'Mastercard SecureCode' },
      { aid: 'A0000000049999', name: 'Mastercard', description: 'Mastercard Proprietary' },
    ]
  },
  {
    rid: 'A000000025',
    organization: 'American Express',
    description: 'Amex payment applications',
    website: 'amex.com',
    applications: [
      { aid: 'A00000002501', name: 'Amex', description: 'American Express Standard' },
      { aid: 'A0000000250100', name: 'Amex', description: 'American Express Standard (Extended)' },
      { aid: 'A000000025010401', name: 'Amex', description: 'American Express OptBlue' },
      { aid: 'A000000025010801', name: 'Amex', description: 'American Express Serve' },
    ]
  },
  {
    rid: 'A000000009',
    organization: 'Discover Financial Services',
    description: 'Discover, Pulse, and affiliated networks',
    website: 'discover.com',
    applications: [
      { aid: 'A0000000091010', name: 'Discover', description: 'Discover Card' },
      { aid: 'A0000000091020', name: 'Discover', description: 'Discover Debit' },
      { aid: 'A0000000092010', name: 'Pulse', description: 'Pulse ATM/Debit' },
      { aid: 'A0000000093010', name: 'Discover', description: 'Discover Affiliated' },
    ]
  },
  {
    rid: 'A000000042',
    organization: 'JCB International',
    description: 'JCB payment applications',
    website: 'jcbglobal.com',
    applications: [
      { aid: 'A0000000421010', name: 'JCB', description: 'JCB Credit' },
      { aid: 'A0000000421020', name: 'JCB', description: 'JCB Debit' },
      { aid: 'A0000000422010', name: 'JCB', description: 'JCB Specific' },
    ]
  },
  {
    rid: 'A000000065',
    organization: 'China UnionPay',
    description: 'UnionPay payment applications',
    website: 'unionpay.com',
    applications: [
      { aid: 'A0000000651010', name: 'UnionPay', description: 'UnionPay Credit' },
      { aid: 'A000000065101001', name: 'UnionPay', description: 'UnionPay Credit (Extended)' },
      { aid: 'A0000000651020', name: 'UnionPay', description: 'UnionPay Debit' },
      { aid: 'A0000000653010', name: 'UnionPay', description: 'UnionPay QuickPass' },
    ]
  },
  {
    rid: 'A000000024',
    organization: 'Rupay (NPCI)',
    description: 'Rupay payment applications (India)',
    website: 'rupay.co.in',
    applications: [
      { aid: 'A00000002401', name: 'RuPay', description: 'RuPay Credit/Debit' },
      { aid: 'A0000000240101', name: 'RuPay Credit', description: 'RuPay Credit' },
      { aid: 'A0000000240102', name: 'RuPay Debit', description: 'RuPay Debit' },
      { aid: 'A0000000240103', name: 'RuPay Prepaid', description: 'RuPay Prepaid' },
      { aid: 'A0000000240110', name: 'RuPay Kisan', description: 'RuPay Kisan Card' },
    ]
  },
  {
    rid: 'A000000029',
    organization: 'Mir Payment System',
    description: 'Mir payment applications (Russia)',
    website: 'mirpay.ru',
    applications: [
      { aid: 'A0000000291010', name: 'Mir', description: 'Mir Debit' },
      { aid: 'A000000029101001', name: 'Mir', description: 'Mir Debit (Extended)' },
      { aid: 'A0000000291020', name: 'Mir', description: 'Mir Credit' },
      { aid: 'A000000029102001', name: 'Mir', description: 'Mir Credit (Extended)' },
    ]
  },
  {
    rid: 'A000000032',
    organization: 'Girocard',
    description: 'Girocard payment applications (Germany)',
    applications: [
      { aid: 'A0000000321010', name: 'Girocard', description: 'Girocard Debit' },
      { aid: 'A0000000321020', name: 'Girocard', description: 'Girocard Electronic Cash' },
    ]
  },
  {
    rid: 'A000000054',
    organization: 'Banrisul',
    description: 'Banrisul payment applications (Brazil)',
    applications: [
      { aid: 'A0000000541010', name: 'Banrisul', description: 'Banrisul Credit/Debit' },
    ]
  },
  {
    rid: 'A000000069',
    organization: 'EFTPOS',
    description: 'EFTPOS payment applications (Australia)',
    applications: [
      { aid: 'A0000000691010', name: 'EFTPOS', description: 'EFTPOS Debit' },
    ]
  },
  {
    rid: 'A000000077',
    organization: 'Interac',
    description: 'Interac payment applications (Canada)',
    website: 'interac.ca',
    applications: [
      { aid: 'A0000000771010', name: 'Interac', description: 'Interac Debit' },
    ]
  },
  {
    rid: 'A000000081',
    organization: 'VPay (Virtual)',
    description: 'VPay virtual payment applications',
    applications: [
      { aid: 'A0000000811010', name: 'VPay', description: 'VPay Virtual' },
    ]
  },
  {
    rid: 'A000000131',
    organization: 'Bethink',
    description: 'Bethink payment applications',
    applications: [
      { aid: 'A0000001311010', name: 'Bethink', description: 'Bethink Debit' },
    ]
  },
  {
    rid: 'A000000154',
    organization: 'Bancomat',
    description: 'Bancomat payment applications (Italy)',
    applications: [
      { aid: 'A0000001541010', name: 'Bancomat', description: 'Bancomat/PagoBANCOMAT' },
      { aid: 'A0000001544910', name: 'PagoBANCOMAT', description: 'PagoBANCOMAT' },
    ]
  },
  {
    rid: 'A000000172',
    organization: 'ZKP',
    description: 'ZKP payment applications (Slovenia)',
    applications: [
      { aid: 'A0000001721010', name: 'ZKP', description: 'ZKP Debit' },
    ]
  },
  {
    rid: 'A000000201',
    organization: 'Verve',
    description: 'Verve payment applications (Nigeria)',
    website: 'verveinternational.com',
    applications: [
      { aid: 'A0000002011010', name: 'Verve', description: 'Verve Debit' },
      { aid: 'A0000002011020', name: 'Verve', description: 'Verve Credit' },
      { aid: 'A0000002013010', name: 'Verve', description: 'Verve Prepaid' },
    ]
  },
  {
    rid: 'A000000208',
    organization: 'Kukuru',
    description: 'Kukuru payment applications (Turkey)',
    applications: [
      { aid: 'A0000002081010', name: 'Kukuru', description: 'Kukuru Debit' },
    ]
  },
  {
    rid: 'A000000228',
    organization: 'Bethink',
    description: 'Bethink (alternative)',
    applications: [
      { aid: 'A0000002281010', name: 'Bethink', description: 'Bethink Debit' },
    ]
  },
  {
    rid: 'A000000238',
    organization: 'Zapp',
    description: 'Zapp payment applications (UK)',
    applications: [
      { aid: 'A0000002381010', name: 'Zapp', description: 'Zapp Mobile Payments' },
    ]
  },
  {
    rid: 'A000000245',
    organization: 'CoGeDi',
    description: 'CoGeDi payment applications (Italy)',
    applications: [
      { aid: 'A0000002451010', name: 'CoGeDi', description: 'CoGeDi Postamat' },
    ]
  },
  {
    rid: 'A000000277',
    organization: 'easypay',
    description: 'easypay payment applications (Portugal)',
    applications: [
      { aid: 'A0000002771010', name: 'easypay', description: 'easypay MB WAY' },
    ]
  },
  {
    rid: 'A000000301',
    organization: 'Banque Populaire',
    description: 'Banque Populaire payment applications (France)',
    applications: [
      { aid: 'A0000003011010', name: 'Banque Populaire', description: 'Banque Populaire CB' },
    ]
  },
  {
    rid: 'A000000324',
    organization: 'Caisse Epargne',
    description: 'Caisse Epargne payment applications (France)',
    applications: [
      { aid: 'A0000003241010', name: 'Caisse Epargne', description: 'Caisse Epargne CB' },
    ]
  },
  {
    rid: 'A000000332',
    organization: 'Hiper',
    description: 'Hiper payment applications (Brazil)',
    applications: [
      { aid: 'A0000003321010', name: 'Hiper', description: 'Hiper Debit' },
      { aid: 'A0000003321020', name: 'Hiper', description: 'Hiper Credit' },
    ]
  },
  {
    rid: 'A000000341',
    organization: 'Elo',
    description: 'Elo payment applications (Brazil)',
    website: 'elo.com.br',
    applications: [
      { aid: 'A0000003411010', name: 'Elo Debit', description: 'Elo Debit' },
      { aid: 'A000000341101001', name: 'Elo Debit', description: 'Elo Debit (Extended)' },
      { aid: 'A0000003411020', name: 'Elo Credit', description: 'Elo Credit' },
      { aid: 'A000000341102001', name: 'Elo Credit', description: 'Elo Credit (Extended)' },
      { aid: 'A0000003415010', name: 'Elo', description: 'Elo Specific' },
    ]
  },
  {
    rid: 'A000000352',
    organization: 'Hipercard',
    description: 'Hipercard payment applications (Brazil)',
    applications: [
      { aid: 'A0000003521010', name: 'Hipercard', description: 'Hipercard' },
    ]
  },
  {
    rid: 'A000000376',
    organization: 'Banrisul',
    description: 'Banrisul (alternative)',
    applications: [
      { aid: 'A0000003761010', name: 'Banrisul', description: 'Banrisul Multibenefício' },
    ]
  },
  {
    rid: 'A000000402',
    organization: 'BTC',
    description: 'BTC payment applications',
    applications: [
      { aid: 'A0000004021010', name: 'BTC', description: 'BTC Debit' },
    ]
  },
  {
    rid: 'A000000472',
    organization: 'Altra',
    description: 'Altra payment applications',
    applications: [
      { aid: 'A0000004721010', name: 'Altra', description: 'Altra Debit' },
    ]
  },
  {
    rid: 'A000000501',
    organization: 'Bank of Athens',
    description: 'Bank of Athens payment applications',
    applications: [
      { aid: 'A0000005011010', name: 'Bank of Athens', description: 'Bank of Athens DIAS' },
    ]
  },
  {
    rid: 'A000000516',
    organization: 'Euro Alliance',
    description: 'Euro Alliance payment applications',
    applications: [
      { aid: 'A0000005161010', name: 'Euro Alliance', description: 'Euro Alliance Payment System' },
    ]
  },
  {
    rid: 'A000000527',
    organization: 'Piraeus Bank',
    description: 'Piraeus Bank payment applications',
    applications: [
      { aid: 'A0000005271010', name: 'Piraeus Bank', description: 'Piraeus Bank DIAS' },
    ]
  },
  {
    rid: 'A000000551',
    organization: 'Nets',
    description: 'Nets payment applications (Scandinavia)',
    website: 'nets.eu',
    applications: [
      { aid: 'A0000005511010', name: 'BankAxept', description: 'BankAxept (Norway)' },
      { aid: 'A0000005511020', name: 'BankAxept', description: 'BankAxept (Extended)' },
    ]
  },
  {
    rid: 'A000000559',
    organization: 'Elkort',
    description: 'Elkort payment applications (Iceland)',
    applications: [
      { aid: 'A0000005591010', name: 'Elkort', description: 'Elkort Debit' },
    ]
  },
  {
    rid: 'A000000593',
    organization: 'Julius Baer',
    description: 'Julius Baer payment applications',
    applications: [
      { aid: 'A0000005931010', name: 'Julius Baer', description: 'Julius Baer Private Banking' },
    ]
  },
  {
    rid: 'A000000636',
    organization: 'Bancomext',
    description: 'Bancomext payment applications (Mexico)',
    applications: [
      { aid: 'A0000006361010', name: 'Bancomext', description: 'Bancomext' },
    ]
  },
  {
    rid: 'A000000653',
    organization: 'Kukuru',
    description: 'Kukuru (alternative)',
    applications: [
      { aid: 'A0000006531010', name: 'Kukuru', description: 'Kukuru Bonus' },
    ]
  },
  {
    rid: 'A000000659',
    organization: 'Bcard',
    description: 'Bcard payment applications (Israel)',
    applications: [
      { aid: 'A0000006591010', name: 'Bcard', description: 'Bcard Debit' },
      { aid: 'A0000006591020', name: 'Bcard', description: 'Bcard Credit' },
    ]
  },
  {
    rid: 'A000000677',
    organization: 'Monster',
    description: 'Monster payment applications',
    applications: [
      { aid: 'A0000006771010', name: 'Monster', description: 'Monster Debit' },
    ]
  },
  {
    rid: 'A000000682',
    organization: 'Discover',
    description: 'Discover (alternative)',
    applications: [
      { aid: 'A0000006821010', name: 'Discover', description: 'Discover (Alternative)' },
    ]
  },
  {
    rid: 'A000000712',
    organization: 'Westpac',
    description: 'Westpac payment applications (Australia)',
    applications: [
      { aid: 'A0000007121010', name: 'Westpac', description: 'Westpac Debit' },
    ]
  },
  {
    rid: 'A000000744',
    organization: 'ShengHuo',
    description: 'ShengHuo payment applications (China)',
    applications: [
      { aid: 'A0000007441010', name: 'ShengHuo', description: 'ShengHuo' },
    ]
  },
  {
    rid: 'A000000791',
    organization: 'Dankort',
    description: 'Dankort payment applications (Denmark)',
    website: 'dankort.dk',
    applications: [
      { aid: 'A0000007911010', name: 'Dankort', description: 'Dankort Debit' },
      { aid: 'A0000007911020', name: 'Dankort', description: 'Dankort (Extended)' },
      { aid: 'A0000007911030', name: 'Visa/Dankort', description: 'Visa co-branded Dankort' },
    ]
  },
  {
    rid: 'A000000823',
    organization: 'Entrium',
    description: 'Entrium payment applications',
    applications: [
      { aid: 'A0000008231010', name: 'Entrium', description: 'Entrium' },
    ]
  },
  {
    rid: 'A000000828',
    organization: 'Affinity',
    description: 'Affinity payment applications',
    applications: [
      { aid: 'A0000008281010', name: 'Affinity', description: 'Affinity Debit' },
    ]
  },
  {
    rid: 'A000000832',
    organization: 'Smith',
    description: 'Smith payment applications',
    applications: [
      { aid: 'A0000008321010', name: 'Smith', description: 'Smith Debit' },
    ]
  },
  {
    rid: 'A000000857',
    organization: 'BMO',
    description: 'BMO payment applications (Canada)',
    applications: [
      { aid: 'A0000008571010', name: 'BMO', description: 'BMO Debit' },
    ]
  },
  {
    rid: 'A000000871',
    organization: 'Skrill',
    description: 'Skrill payment applications',
    website: 'skrill.com',
    applications: [
      { aid: 'A0000008711010', name: 'Skrill', description: 'Skrill Digital Wallet' },
    ]
  },
  {
    rid: 'A000000873',
    organization: 'NETS',
    description: 'NETS payment applications (Singapore)',
    website: 'nets.com.sg',
    applications: [
      { aid: 'A0000008731010', name: 'NETS', description: 'NETS Debit' },
      { aid: 'A0000008731020', name: 'NETS FlashPay', description: 'NETS FlashPay (Transit)' },
    ]
  },
  {
    rid: 'A000000901',
    organization: 'Bethink',
    description: 'Bethink (additional)',
    applications: [
      { aid: 'A0000009011010', name: 'Bethink', description: 'Bethink Specific' },
    ]
  },
  {
    rid: 'A000000918',
    organization: 'CUP',
    description: 'CUP (alternative)',
    applications: [
      { aid: 'A0000009181010', name: 'CUP', description: 'CUP (Alternative)' },
    ]
  },
  {
    rid: 'A000000969',
    organization: 'Discover',
    description: 'Discover (additional)',
    applications: [
      { aid: 'A0000009691010', name: 'Discover', description: 'Discover (Additional)' },
    ]
  },
  {
    rid: 'A000000981',
    organization: 'Elo',
    description: 'Elo (alternative)',
    applications: [
      { aid: 'A0000009811010', name: 'Elo', description: 'Elo (Alternative)' },
    ]
  },
  {
    rid: 'A000001001',
    organization: 'Chase',
    description: 'Chase payment applications (USA)',
    applications: [
      { aid: 'A0000010011010', name: 'Chase', description: 'Chase Debit' },
    ]
  },
  {
    rid: 'A000001031',
    organization: 'Alior',
    description: 'Alior payment applications (Poland)',
    applications: [
      { aid: 'A0000010311010', name: 'Alior', description: 'Alior Bank' },
    ]
  },
  {
    rid: 'A000001061',
    organization: 'Raiffeisen',
    description: 'Raiffeisen payment applications',
    applications: [
      { aid: 'A0000010611010', name: 'Raiffeisen', description: 'Raiffeisen Bank' },
    ]
  },
  {
    rid: 'A000001082',
    organization: 'R-Card',
    description: 'R-Card payment applications',
    applications: [
      { aid: 'A0000010821010', name: 'R-Card', description: 'R-Card Debit' },
    ]
  },
  {
    rid: 'A000001101',
    organization: 'Belfius',
    description: 'Belfius payment applications (Belgium)',
    applications: [
      { aid: 'A0000011011010', name: 'Belfius', description: 'Belfius Debit' },
    ]
  },
  {
    rid: 'A000001141',
    organization: 'KBC',
    description: 'KBC payment applications (Belgium)',
    applications: [
      { aid: 'A0000011411010', name: 'KBC', description: 'KBC Bank' },
      { aid: 'A0000011411020', name: 'KBC', description: 'KBC Online' },
    ]
  },
  {
    rid: 'A000001154',
    organization: 'ING',
    description: 'ING payment applications',
    website: 'ing.com',
    applications: [
      { aid: 'A0000011541010', name: 'ING', description: 'ING Debit' },
      { aid: 'A0000011541020', name: 'ING', description: 'ING (Alternative)' },
    ]
  },
  {
    rid: 'A000001201',
    organization: 'CBC',
    description: 'CBC payment applications (Belgium)',
    applications: [
      { aid: 'A0000012011010', name: 'CBC', description: 'CBC Bank' },
    ]
  },
  {
    rid: 'A000001241',
    organization: 'Argencard',
    description: 'Argencard payment applications (Argentina)',
    applications: [
      { aid: 'A0000012411010', name: 'Argencard', description: 'Argencard Debit' },
    ]
  },
  {
    rid: 'A000001254',
    organization: 'Cabral',
    description: 'Cabral payment applications (Argentina)',
    applications: [
      { aid: 'A0000012541010', name: 'Cabral', description: 'Cabral Debit' },
    ]
  },
  {
    rid: 'A000001321',
    organization: 'Procredit',
    description: 'Procredit payment applications',
    applications: [
      { aid: 'A0000013211010', name: 'Procredit', description: 'Procredit Bank' },
    ]
  },
  {
    rid: 'A000001441',
    organization: 'DinaCard',
    description: 'DinaCard payment applications (Serbia)',
    applications: [
      { aid: 'A0000014411010', name: 'DinaCard', description: 'DinaCard Debit' },
      { aid: 'A0000014411020', name: 'DinaCard', description: 'DinaCard Credit' },
    ]
  },
  {
    rid: 'A000001481',
    organization: 'Six',
    description: 'Six payment applications (UK)',
    applications: [
      { aid: 'A0000014811010', name: 'Six', description: 'Six Debit' },
    ]
  },
  {
    rid: 'A000001551',
    organization: 'N26',
    description: 'N26 payment applications',
    website: 'n26.com',
    applications: [
      { aid: 'A0000015511010', name: 'N26', description: 'N26 Debit' },
    ]
  },
  {
    rid: 'A000001581',
    organization: 'Revolut',
    description: 'Revolut payment applications',
    website: 'revolut.com',
    applications: [
      { aid: 'A0000015811010', name: 'Revolut', description: 'Revolut Debit' },
      { aid: 'A0000015811020', name: 'Revolut', description: 'Revolut (Extended)' },
    ]
  },
  {
    rid: 'A000001621',
    organization: 'Wise',
    description: 'Wise payment applications',
    website: 'wise.com',
    applications: [
      { aid: 'A0000016211010', name: 'Wise', description: 'Wise Debit' },
    ]
  },
];

const EmvRIDReference = ({ className = '' }: { className?: string }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRid, setSelectedRid] = useState<RIDEntry | null>(null);
  const [aidSearch, setAidSearch] = useState('');

  // Filter RIDs based on search
  const filteredRIDs = useMemo(() => {
    if (!searchQuery.trim()) return ridData;
    const query = searchQuery.toLowerCase();
    return ridData.filter(rid =>
      rid.rid.toLowerCase().includes(query) ||
      rid.organization.toLowerCase().includes(query) ||
      rid.description.toLowerCase().includes(query) ||
      rid.applications.some(app =>
        app.aid.toLowerCase().includes(query) ||
        app.name.toLowerCase().includes(query)
      )
    );
  }, [searchQuery]);

  // Find by AID search
  const aidResults = useMemo(() => {
    if (!aidSearch.trim()) return [];
    const query = aidSearch.replace(/\s/g, '').toUpperCase();
    const results: { rid: RIDEntry; app: RIDApplication }[] = [];

    for (const rid of ridData) {
      for (const app of rid.applications) {
        if (app.aid.includes(query)) {
          results.push({ rid, app });
        }
      }
    }
    return results;
  }, [aidSearch]);

  const handleCopyAID = useCallback((aid: string) => {
    navigator.clipboard.writeText(aid);
  }, []);

  const formatAID = (aid: string) => {
    return aid.match(/.{1,4}/g)?.join(' ') || aid;
  };

  const getCategoryColor = (org: string) => {
    const lower = org.toLowerCase();
    if (lower.includes('visa') || lower.includes('mastercard') || lower.includes('amex') ||
        lower.includes('discover') || lower.includes('jcb') || lower.includes('unionpay')) {
      return 'blue';
    }
    if (lower.includes('rupay') || lower.includes('mir') || lower.includes('elo') ||
        lower.includes('hiper') || lower.includes('hipercard')) {
      return 'purple';
    }
    if (lower.includes('debit') || lower.includes('atm') || lower.includes('interac') ||
        lower.includes('nets') || lower.includes('dankort')) {
      return 'green';
    }
    return 'slate';
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          EMV RID Reference
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Registered Application Provider Identifiers (RID) and Application Identifiers (AID)
        </p>
      </div>

      {/* Search by AID */}
      <div className="mb-6">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
          Search by AID
        </label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={aidSearch}
            onChange={(e) => setAidSearch(e.target.value)}
            placeholder="Enter AID (e.g., A000000001, A0000000031010)"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          />
        </div>
        {aidResults.length > 0 && (
          <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              Found {aidResults.length} result{aidResults.length > 1 ? 's' : ''}:
            </p>
            <div className="space-y-2">
              {aidResults.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-blue-200 dark:border-blue-800">
                  <div>
                    <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatAID(result.app.aid)}
                    </span>
                    <span className="mx-2 text-slate-400">→</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {result.app.name} ({result.rid.organization})
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyAID(result.app.aid)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Copy AID"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search by RID/Organization */}
      <div className="mb-6">
        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
          Search RID / Organization
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by RID, organization name, or application..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Selected RID Details */}
      {selectedRid && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {selectedRid.organization}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{selectedRid.description}</p>
            </div>
            <button
              onClick={() => setSelectedRid(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">RID:</span>
            <span className="ml-2 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
              {selectedRid.rid}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Applications:</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {selectedRid.applications.map((app, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {formatAID(app.aid)}
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {app.name}
                      </span>
                    </div>
                    {app.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {app.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyAID(app.aid)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-2"
                    title="Copy AID"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RID List */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing {filteredRIDs.length} of {ridData.length} RIDs
        </p>
        <div className="max-h-96 overflow-y-auto space-y-1 custom-scrollbar">
          {filteredRIDs.map((rid) => {
            const color = getCategoryColor(rid.organization);
            const colorClasses = {
              blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30',
              purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30',
              green: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
              slate: 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800',
            };

            return (
              <button
                key={rid.rid}
                onClick={() => setSelectedRid(rid)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${colorClasses[color as keyof typeof colorClasses]}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                        {rid.rid}
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {rid.organization}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {rid.description} • {rid.applications.length} application{rid.applications.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          About RID and AID
        </h3>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p><strong>RID (Registered Application Provider Identifier):</strong> 5-digit hex code identifying the payment system (e.g., A0000000 = Visa).</p>
          <p><strong>PIK (Proprietary Application Identifier):</strong> Application-specific identifier assigned by the RID owner.</p>
          <p><strong>AID (Application Identifier):</strong> RID + PIK = Complete AID (e.g., A0000000031010 = Visa Credit).</p>
          <p><strong>Usage:</strong> AID is used in EMV cards to identify which applications the card supports (PSE selection).</p>
        </div>
      </div>
    </div>
  );
};

export default EmvRIDReference;
