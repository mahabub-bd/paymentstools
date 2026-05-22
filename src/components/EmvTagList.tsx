import React, { useState, useMemo, useCallback } from 'react';

// EMV Tags organized by category
const EMV_TAG_GROUPS = [
  {
    category: 'Card & Application Management',
    range: '5A-5F',
    icon: '💳',
    tags: [
      { tag: '5A', name: 'Application Primary Account Number (PAN)', format: 'n..19', description: 'Primary account number as encoded on track 2' },
      { tag: '5F24', name: 'Application Expiration Date', format: 'n4', description: 'Expiration date of the card in YYMM format' },
      { tag: '5F25', name: 'Application Effective Date', format: 'n4', description: 'Effective date of the card in YYMM format' },
      { tag: '5F28', name: 'Issuer Country Code', format: 'n2', description: 'Country code of the issuer per ISO 3166' },
      { tag: '5F2A', name: 'Transaction Currency Code', format: 'n2', description: 'Currency code per ISO 4217' },
      { tag: '5F2D', name: 'Language Preference', format: 'ans..8', description: 'Cardholder preferred language' },
      { tag: '5F30', name: 'Service Code', format: 'n3', description: 'Service code for authorization processing' },
      { tag: '5F34', name: 'Application Primary Account Number Sequence Number', format: 'n1', description: 'Sequence number for cards with same PAN' },
      { tag: '5F36', name: 'Transaction Currency Exponent', format: 'n1', description: 'Number of decimal places for transaction currency' },
      { tag: '5F50', name: 'Issuer URL', format: 'ans', description: 'URL for issuer online services' },
      { tag: '5F52', name: 'Card Product Name', format: 'ans', description: 'Commercial name of the card product' },
      { tag: '5F53', name: 'Last four digits of ICC PIN encipherment public key', format: 'n4', description: 'Last 4 digits of ICC PIN public key for key verification' },
      { tag: '5F54', name: 'Account Type', format: 'n1', description: 'Type of account (e.g., savings, checking)' },
      { tag: '5F55', name: 'Issuer Identification Number (IIN)', format: 'n8', description: 'First 6-8 digits of PAN' },
      { tag: '5F56', name: 'Log Entry', format: 'ans..16', description: 'One log entry for offline transaction log' },
      { tag: '5F57', name: 'Issuer Identification Number (IIN) of the PIN Private Key', format: 'n8', description: 'IIN for PIN key identification' },
      { tag: '5F58', name: 'Last four digits of ICC PIN encipherment public key exponent', format: 'n3', description: 'Exponent verification value' },
      { tag: '5F59', name: 'Issuer Authentication Data', format: 'b..8', description: 'Data for issuer authentication' },
    ]
  },
  {
    category: 'Application Identifier & Selection',
    range: '4F-50',
    icon: '🔑',
    tags: [
      { tag: '4F', name: 'Application Identifier (AID)', format: 'n..16', description: 'Identifies the application as defined by the payment system' },
      { tag: '50', name: 'Application Label', format: 'ans..16', description: 'Label displayed to cardholder for application selection' },
      { tag: '9F08', name: 'Application Version Number', format: 'n2', description: 'Version of the application specification' },
      { tag: '9F09', name: 'Application Version Number', format: 'n3', description: 'Alternative application version number' },
      { tag: '9F0A', name: 'Issuer Action Code - Default', format: 'b5', description: 'Action code for transactions when TDOL not present' },
      { tag: '9F0B', name: 'Cardholder Verification Method (CVM) Results', format: 'b3', description: 'CVM results from ICC' },
      { tag: '9F0D', name: 'Issuer Action Code - Denial', format: 'b5', description: 'Action code to deny transaction' },
      { tag: '9F0E', name: 'Issuer Action Code - Online', format: 'b5', description: 'Action code for online authorization' },
      { tag: '9F0F', name: 'Application Currency Code', format: 'n2', description: 'Currency code for the application' },
      { tag: '9F10', name: 'Issuer Application Data', format: 'b..32', description: 'Proprietary data for issuer use' },
      { tag: '9F11', name: 'Issuer Code Table Index', format: 'n1', description: 'Identifies the code table used' },
      { tag: '9F12', name: 'Application Preferred Name', format: 'ans..16', description: 'Preferred name for the application' },
      { tag: '9F13', name: 'Last Online ATC Register', format: 'b4', description: 'ATC from last online transaction' },
      { tag: '9F17', name: 'Personal Identification Number (PIN) Try Counter', format: 'n1', description: 'Number of PIN tries remaining' },
      { tag: '9F1A', name: 'Terminal Country Code', format: 'n2', description: 'Country code of terminal per ISO 3166' },
      { tag: '9F1B', name: 'Terminal Floor Limit', format: 'n4', description: 'Floor limit for terminal transactions' },
      { tag: '9F1C', name: 'Terminal Identification', format: 'ans8', description: 'Unique ID assigned to terminal' },
      { tag: '9F1D', name: 'Terminal Capabilities', format: 'b3', description: 'Terminal card data input and CVM capabilities' },
      { tag: '9F1E', name: 'Interface Device (IFD) Serial Number', format: 'ans8', description: 'Unique serial number of the IFD' },
      { tag: '9F1F', name: 'Track 1 Discretionary Data', format: 'ans..', description: 'Discretionary data from track 1' },
      { tag: '9F20', name: 'Track 2 Discretionary Data', format: 'ans..', description: 'Discretionary data from track 2' },
      { tag: '9F21', name: 'Transaction Time', format: 'n3', description: 'Local transaction time on terminal in HHMMSS' },
      { tag: '9F22', name: 'Terminal Floor Limit', format: 'n4', description: 'Alternative floor limit value' },
      { tag: '9F23', name: 'Card Authentication Related Data', format: 'b..8', description: 'Data for card authentication' },
    ]
  },
  {
    category: 'Card Risk Management',
    range: '8C-8F',
    icon: '⚠️',
    tags: [
      { tag: '8C', name: 'Card Risk Management Data Object List 1 (CDOL1)', format: 'b..', description: 'Data objects required in first GENERATE AC' },
      { tag: '8D', name: 'Card Risk Management Data Object List 2 (CDOL2)', format: 'b..', description: 'Data objects required in second GENERATE AC' },
      { tag: '8E', name: 'Cardholder Verification Method (CVM) List', format: 'b..', description: 'List of CVM rules for the card' },
      { tag: '8F', name: 'Certification Authority Public Key Index', format: 'n1', description: 'Index of CA public key to use' },
      { tag: '9F32', name: 'Issuer Public Key Exponent', format: 'n3', description: 'Exponent for issuer public key' },
      { tag: '9F33', name: 'Terminal Capabilities', format: 'b3', description: 'Terminal data input and CVM capabilities' },
      { tag: '9F34', name: 'Merchant Name and Location', format: 'ans..', description: 'Merchant name and location data' },
      { tag: '9F35', name: 'Terminal Type', format: 'n1', description: 'Terminal environment and operational characteristics' },
      { tag: '9F36', name: 'Application Transaction Counter (ATC)', format: 'n2', description: 'Counter incremented for each transaction' },
      { tag: '9F37', name: 'Unpredictable Number', format: 'b4', description: 'Random number generated by terminal' },
      { tag: '9F38', name: 'Point-of-Service (POS) Entry Mode', format: 'n3', description: 'How PIN and PAN were entered' },
      { tag: '9F39', name: 'Point-of-Service (POS) Condition Codes', format: 'n2', description: 'POS condition codes' },
      { tag: '9F3A', name: 'Amount, Reference Currency', format: 'n6', description: 'Amount in reference currency' },
      { tag: '9F3B', name: 'Amount, Reference Currency Exponent', format: 'n1', description: 'Decimal places for reference currency' },
      { tag: '9F3C', name: 'Transaction Reference Currency Code', format: 'n2', description: 'Reference currency code' },
      { tag: '9F3D', name: 'Transaction Reference Currency Exponent', format: 'n1', description: 'Decimal places for reference currency' },
      { tag: '9F3E', name: 'Terminal Transaction Qualifiers', format: 'n2', description: 'Qualifiers for transaction processing' },
      { tag: '9F3F', name: 'Terminal Transaction Qualifiers', format: 'n2', description: 'Alternative transaction qualifiers' },
      { tag: '9F40', name: 'Additional Terminal Capabilities', format: 'b5', description: 'Terminal additional payment capabilities' },
    ]
  },
  {
    category: 'Security & Cryptography',
    range: '90-9F',
    icon: '🔐',
    tags: [
      { tag: '90', name: 'Issuer Public Key Certificate', format: 'b..', description: 'Certificate for issuer public key' },
      { tag: '91', name: 'Issuer Authentication Data', format: 'b8', description: 'Data for issuer authentication' },
      { tag: '92', name: 'Issuer Public Key Remainder', format: 'b..', description: 'Remaining digits of issuer public key' },
      { tag: '93', name: 'Signed Static Application Data', format: 'b..', description: 'Static application data signed by issuer' },
      { tag: '94', name: 'Application File Locator (AFL)', format: 'b..', description: 'Lists files to be read from card' },
      { tag: '95', name: 'Terminal Verification Results', format: 'b5', description: 'Results of terminal verification checks' },
      { tag: '97', name: 'Transaction Certificate Data Object List (TDOL)', format: 'b..', description: 'Data objects for transaction certificate' },
      { tag: '98', name: 'Track 1 Data', format: 'ans..', description: 'Full track 1 data' },
      { tag: '99', name: 'Track 3 Data', format: 'ans..', description: 'Full track 3 data' },
      { tag: '9A', name: 'Transaction Date', format: 'n3', description: 'Local transaction date on terminal in YYMMDD' },
      { tag: '9B', name: 'Transaction Status Information', format: 'b2', description: 'Status of the transaction processing' },
      { tag: '9C', name: 'Transaction Type', format: 'n1', description: 'Type of transaction (e.g., purchase, cash)' },
      { tag: '9D', name: 'Directory Definition File (DDF) Name', format: 'ans..', description: 'Name of DDF on card' },
    ]
  },
  {
    category: 'Amount Data',
    range: '9F02-9F04',
    icon: '💰',
    tags: [
      { tag: '9F02', name: 'Amount, Authorized (Numeric)', format: 'n6', description: 'Authorized transaction amount' },
      { tag: '9F03', name: 'Amount, Other (Numeric)', format: 'n6', description: 'Secondary amount in transaction' },
      { tag: '9F04', name: 'Amount, Other (Binary)', format: 'b4', description: 'Secondary amount in binary format' },
      { tag: '9F41', name: 'Transaction Sequence Counter', format: 'b..', description: 'Unique counter for each transaction' },
      { tag: '9F42', name: 'Application Currency Code', format: 'n2', description: 'Currency code for the application' },
      { tag: '9F43', name: 'Application Reference Currency', format: 'n2', description: 'Reference currency code' },
      { tag: '9F44', name: 'Application Currency Exponent', format: 'n1', description: 'Decimal places for application currency' },
      { tag: '9F45', name: 'Application Reference Currency Exponent', format: 'n1', description: 'Decimal places for reference currency' },
      { tag: '9F46', name: 'ICC Public Key Certificate', format: 'b..', description: 'Certificate for ICC public key' },
      { tag: '9F47', name: 'ICC Public Key Exponent', format: 'b3', description: 'Exponent for ICC public key' },
      { tag: '9F48', name: 'ICC Public Key Remainder', format: 'b..', description: 'Remaining digits of ICC public key' },
      { tag: '9F49', name: 'Dynamic Data Authentication Data Object List (DDOL)', format: 'b..', description: 'Data objects for DDA' },
      { tag: '9F4A', name: 'Static Data Authentication Tag List', format: 'b..', description: 'List of tags for SDA' },
      { tag: '9F4B', name: 'Signed Dynamic Application Data', format: 'b..', description: 'Dynamic application data signed by ICC' },
      { tag: '9F4C', name: 'ICC Public Key Certificate', format: 'b..', description: 'Alternative ICC public key certificate' },
      { tag: '9F4D', name: 'Log Entry', format: 'b..', description: 'Single log entry' },
      { tag: '9F4E', name: 'Merchant Name and Location', format: 'ans..', description: 'Merchant information' },
      { tag: '9F4F', name: 'Log Format', format: 'b1', description: 'Format of log entries' },
    ]
  },
  {
    category: 'Dedicated Files (DF) & Directory',
    range: '82-88',
    icon: '📁',
    tags: [
      { tag: '82', name: 'Application Interchange Profile', format: 'b..', description: 'Indicates application profile' },
      { tag: '84', name: 'Dedicated File (DF) Name', format: 'b..16', description: 'Identifies the dedicated file' },
      { tag: '85', name: 'Proprietary Information Elementary', format: 'b..', description: 'Proprietary information' },
      { tag: '86', name: 'Issuer Script Command', format: 'b..', description: 'Issuer script to be processed' },
      { tag: '87', name: 'Application Priority Indicator', format: 'b1', description: 'Priority of this application' },
      { tag: '88', name: 'Short File Identifier (SFI)', format: 'b1', description: 'Short identifier for file selection' },
      { tag: '89', name: 'Authorization Code', format: 'an6', description: 'Authorization code from host' },
      { tag: '8A', name: 'Authorization Response Code', format: 'n2', description: 'Response code from authorization' },
      { tag: '8B', name: 'Card Verification Results (CVR)', format: 'b..', description: 'Results of card verification' },
    ]
  },
  {
    category: 'Track Data & Cardholder Info',
    range: '57-5F20',
    icon: '💳',
    tags: [
      { tag: '57', name: 'Track 2 Equivalent Data', format: 'ans..19', description: 'Track 2 data without start/end sentinels' },
      { tag: '5F20', name: 'Cardholder Name', format: 'ans..26', description: 'Cardholder name as printed on card' },
      { tag: '5F25', name: 'Application Effective Date', format: 'n4', description: 'Date from which card is valid in YYMM' },
      { tag: '5F26', name: 'ATC Session Counter', format: 'n2', description: 'Session-based ATC counter' },
      { tag: '5F27', name: 'ATC Random Counter', format: 'n2', description: 'Random ATC counter value' },
      { tag: '5F28', name: 'Issuer Country Code', format: 'n2', description: 'Country of issuer per ISO 3166' },
      { tag: '5F29', name: 'Transaction Reference Currency Code', format: 'n2', description: 'Reference currency for transaction' },
      { tag: '5F2A', name: 'Transaction Currency Code', format: 'n2', description: 'Currency code for transaction' },
    ]
  },
  {
    category: 'Control & Processing',
    range: '9F51-9F6F',
    icon: '⚙️',
    tags: [
      { tag: '9F51', name: 'Application Currency Code', format: 'n2', description: 'Currency code for application' },
      { tag: '9F52', name: 'Currency Code', format: 'n2', description: 'General currency code' },
      { tag: '9F53', name: 'Currency Code, Reference', format: 'n2', description: 'Reference currency code' },
      { tag: '9F54', name: 'Amount Error', format: 'n1', description: 'Amount related error indicator' },
      { tag: '9F55', name: 'Merchant Country Code', format: 'n2', description: 'Merchant country per ISO 3166' },
      { tag: '9F56', name: 'Merchant Identifier', format: 'ans..15', description: 'Unique merchant ID' },
      { tag: '9F57', name: 'Electronic Cash Beneficiary Account', format: 'an..28', description: 'Beneficiary account for electronic cash' },
      { tag: '9F58', name: 'Electronic Cash Merchant Identifier', format: 'n2', description: 'Merchant ID for electronic cash' },
      { tag: '9F59', name: 'Electronic Cash System Identifier', format: 'n2', description: 'System ID for electronic cash' },
      { tag: '9F5A', name: 'Electronic Cash Currency Code', format: 'n2', description: 'Currency for electronic cash' },
      { tag: '9F5B', name: 'Merchant Identifier Extension', format: 'ans..', description: 'Extended merchant identifier' },
      { tag: '9F5C', name: 'Magnetic Stripe Data', format: 'ans..', description: 'Magnetic stripe data' },
      { tag: '9F5D', name: 'Merchant Verification', format: 'an..', description: 'Merchant verification data' },
      { tag: '9F5E', name: 'Merchant Facility Data', format: 'an..', description: 'Merchant facility information' },
      { tag: '9F5F', name: 'Data Storage Data', format: 'b..', description: 'Data storage information' },
      { tag: '9F60', name: 'Advice Data', format: 'b..', description: 'Advice-related data' },
      { tag: '9F61', name: 'Card Authentication Related Data', format: 'b..', description: 'Card authentication data' },
      { tag: '9F62', name: 'PCVC Related Data', format: 'b..', description: 'PIN Change Verification Code data' },
      { tag: '9F63', name: 'Track 1 Data', format: 'ans..', description: 'Full track 1 data' },
      { tag: '9F64', name: 'Track 2 Data', format: 'ans..', description: 'Full track 2 data' },
      { tag: '9F65', name: 'Card Value Limit', format: 'n4', description: 'Card value limit for transactions' },
      { tag: '9F66', name: 'Card Value Limit', format: 'n4', description: 'Alternative card value limit' },
      { tag: '9F67', name: 'Card Value Limit, Single', format: 'n4', description: 'Single transaction limit' },
      { tag: '9F68', name: 'Card Value Limit, Cumulative', format: 'n4', description: 'Cumulative transaction limit' },
      { tag: '9F69', name: 'Card Value Limit, Contactless Single', format: 'n4', description: 'Contactless single transaction limit' },
      { tag: '9F6A', name: 'Card Value Limit, Contactless Cumulative', format: 'n4', description: 'Contactless cumulative transaction limit' },
      { tag: '9F6B', name: 'Card Value Limit, Magnetic Stripe Single', format: 'n4', description: 'Mag stripe single transaction limit' },
      { tag: '9F6C', name: 'Card Value Limit, Magnetic Stripe Cumulative', format: 'n4', description: 'Mag stripe cumulative transaction limit' },
      { tag: '9F6D', name: 'Mobile Electronic Cash Limit', format: 'n4', description: 'Mobile electronic cash limit' },
      { tag: '9F6E', name: 'Electronic Cash Limit', format: 'n4', description: 'Electronic cash limit' },
      { tag: '9F6F', name: 'User Interface Request Data', format: 'b..', description: 'User interface request data' },
    ]
  },
  {
    category: 'Kernel & Processing',
    range: '9F70-9F7F',
    icon: '🔄',
    tags: [
      { tag: '9F70', name: 'Card Transaction Qualifiers', format: 'n2', description: 'Card transaction qualifiers' },
      { tag: '9F71', name: 'Issuer Script Results', format: 'b1', description: 'Results of issuer script processing' },
      { tag: '9F72', name: 'Consecutive Transaction Limit', format: 'n1', description: 'Limit for consecutive offline transactions' },
      { tag: '9F73', name: 'Currency Code', format: 'n2', description: 'Currency code' },
      { tag: '9F74', name: 'Currency Code', format: 'n2', description: 'Currency code' },
      { tag: '9F75', name: 'Currency Code, Reference', format: 'n2', description: 'Reference currency code' },
      { tag: '9F76', name: 'Currency Exponent', format: 'n1', description: 'Currency decimal places' },
      { tag: '9F77', name: 'Currency Exponent, Reference', format: 'n1', description: 'Reference currency decimal places' },
      { tag: '9F78', name: 'Amount, Authorized', format: 'n6', description: 'Authorized amount' },
      { tag: '9F79', name: 'Amount, Other', format: 'n6', description: 'Other amount' },
      { tag: '9F7A', name: 'Amount, Other Base', format: 'n6', description: 'Base amount for other amount' },
      { tag: '9F7B', name: 'Amount, Other Base', format: 'n6', description: 'Alternative base amount' },
      { tag: '9F7C', name: 'Device Transaction Counter', format: 'b..', description: 'Device transaction counter' },
      { tag: '9F7D', name: 'Device Transaction Counter', format: 'b..', description: 'Alternative device counter' },
      { tag: '9F7E', name: 'Mobile Support Indicator', format: 'b1', description: 'Mobile capability indicator' },
      { tag: '9F7F', name: 'Mobile Support Indicator', format: 'b1', description: 'Alternative mobile indicator' },
    ]
  },
  {
    category: 'Response & Status Codes',
    range: '9A-9F01',
    icon: '📊',
    tags: [
      { tag: '9A', name: 'Transaction Date', format: 'n3', description: 'Transaction date in YYMMDD' },
      { tag: '9B', name: 'Transaction Status Information', format: 'b2', description: 'Transaction processing status' },
      { tag: '9C', name: 'Transaction Type', format: 'n1', description: 'Transaction type indicator' },
      { tag: '9D', name: 'Directory Definition File (DDF) Name', format: 'ans..', description: 'DDF name' },
      { tag: '9E', name: 'Issuer Script Identifier', format: 'n1', description: 'Identifies issuer script' },
      { tag: '9F', name: 'Card Authentication Related Data', format: 'b..', description: 'Card authentication data' },
    ]
  },
  {
    category: 'Proprietary & Application-Specific',
    range: 'BF0C-CF00',
    icon: '🔒',
    tags: [
      { tag: 'BF0C', name: 'File Control Information (FCI) Template', format: 'b..', description: 'FCI issuer discretionary data template' },
      { tag: 'BF0D', name: 'File Control Information (FCI) Issuer Discretionary Data', format: 'b..', description: 'Issuer discretionary data' },
      { tag: 'BF0E', name: 'File Control Information (FCI) Proprietary Template', format: 'b..', description: 'Proprietary FCI template' },
      { tag: 'BF0F', name: 'Directory Discretionary Data', format: 'b..', description: 'Discretionary data for directory' },
      { tag: 'BF1C', name: 'Track 1 Data', format: 'ans..', description: 'Track 1 data' },
      { tag: 'BF1D', name: 'Track 2 Data', format: 'ans..', description: 'Track 2 data' },
      { tag: 'BF20', name: 'Track 1 Data', format: 'ans..', description: 'Alternative track 1 data' },
      { tag: 'BF21', name: 'Track 2 Data', format: 'ans..', description: 'Alternative track 2 data' },
      { tag: 'BF22', name: 'Track 3 Data', format: 'ans..', description: 'Track 3 data' },
      { tag: 'BF23', name: 'Track 3 Data', format: 'ans..', description: 'Alternative track 3 data' },
      { tag: 'BF2C', name: 'File Control Information (FCI) Issuer Discretionary Data', format: 'b..', description: 'Alternative issuer data' },
      { tag: 'BF2D', name: 'File Control Information (FCI) Proprietary Data', format: 'b..', description: 'Alternative proprietary data' },
      { tag: 'CF00', name: 'Cryptographic Information', format: 'b..', description: 'Cryptographic related information' },
    ]
  },
];

interface EmvTagListProps {
  className?: string;
}

const EmvTagList = ({ className = '' }: EmvTagListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Filter EMV tags based on search
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return EMV_TAG_GROUPS;

    return EMV_TAG_GROUPS.map(group => ({
      ...group,
      tags: group.tags.filter(tag =>
        tag.tag.includes(searchTerm.toUpperCase()) ||
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.tags.length > 0);
  }, [searchTerm]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  }, [selectedTag]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const expandAll = useCallback(() => {
    setExpandedCategories(new Set(EMV_TAG_GROUPS.map(g => g.category)));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  // Count total tags
  const totalTags = useMemo(() => {
    return EMV_TAG_GROUPS.reduce((sum, group) => sum + group.tags.length, 0);
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          EMV Tags Dictionary
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Complete EMV data element reference ({totalTags} tags)
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by tag, name, or description..."
          className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Collapse All
          </button>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {filteredGroups.length} categories
        </span>
      </div>

      {/* EMV Tag Groups */}
      <div className="space-y-3">
        {filteredGroups.map((group) => (
          <div
            key={group.category}
            className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(group.category)}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{group.icon}</span>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-800 dark:text-white">{group.category}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tags {group.range} • {group.tags.length} tags</p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  expandedCategories.has(group.category) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Tags */}
            {expandedCategories.has(group.category) && (
              <div className="divide-y divide-slate-200 dark:divide-zinc-800 max-h-96 overflow-y-auto">
                {group.tags.map((tagItem) => (
                  <div
                    key={tagItem.tag}
                    onClick={() => handleTagClick(tagItem.tag)}
                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <code className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-mono rounded min-w-[60px] text-center">
                          {tagItem.tag}
                        </code>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {tagItem.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {tagItem.description}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                          {tagItem.format}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(tagItem.tag);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-2"
                        title="Copy tag"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>

                    {/* Tag Detail */}
                    {selectedTag === tagItem.tag && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Tag:</span>
                            <span className="ml-2 font-mono font-semibold text-purple-600 dark:text-purple-400">{tagItem.tag}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Format:</span>
                            <span className="ml-2 font-mono text-slate-800 dark:text-white">{tagItem.format}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 dark:text-slate-400">Name:</span>
                            <span className="ml-2 text-slate-800 dark:text-white">{tagItem.name}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 dark:text-slate-400">Description:</span>
                            <span className="ml-2 text-slate-800 dark:text-white">{tagItem.description}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(`Tag: ${tagItem.tag}\nName: ${tagItem.name}\nFormat: ${tagItem.format}\nDescription: ${tagItem.description}`)}
                          className="mt-3 w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Copy Tag Info
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredGroups.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-zinc-500">
          <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">No EMV tags found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default EmvTagList;
