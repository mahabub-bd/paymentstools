/**
 * EMV TLV (Tag-Length-Value) Parser Module
 *
 * Handles parsing and formatting of EMV data from ISO 8583 DE 55 (ICC Data)
 * Supports standard EMV tags, proprietary tags, and construct/nested tags
 */

// ============== Type Definitions ==============

/**
 * EMV tag categories for grouping and organization
 */
export enum EMVTagCategory {
  APPLICATION = 'Application',
  CARD_DATA = 'Card Data',
  TERMINAL = 'Terminal',
  TRANSACTION = 'Transaction',
  SECURITY = 'Security',
  AMOUNT = 'Amount',
  CURRENCY = 'Currency',
  CVM = 'Cardholder Verification',
  CRYPTogram = 'Cryptogram',
  RISK_MANAGEMENT = 'Risk Management',
  ISSUER_SCRIPT = 'Issuer Script',
  PIN = 'PIN',
  TRACK_DATA = 'Track Data',
  PROPRIETARY = 'Proprietary',
  ERROR_INDICATION = 'Error Indication',
  RESERVED = 'Reserved',
  UNKNOWN = 'Unknown'
}

/**
 * EMV tag definition interface
 */
export interface EMVTagDefinition {
  tag: string;
  name: string;
  category: EMVTagCategory;
  description?: string;
  format?: 'ASCII' | 'HEX' | 'NUMERIC' | 'DATE' | 'BINARY';
  isConstruct?: boolean;  // Contains nested TLV data
  maxLength?: number;
}

/**
 * Parsed TLV data structure
 */
export interface TLVData {
  tag: string;
  tagName: string;
  category: EMVTagCategory;
  length: number;
  rawValue: string;
  displayValue: string;
  valueType: 'ASCII' | 'HEX';
  isConstruct: boolean;
  children?: TLVData[];  // For construct tags
}

/**
 * Result of parsing EMV data
 */
export interface EMVParseResult {
  tags: TLVData[];
  rawHex: string;
  totalBytes: number;
  summary: {
    totalTags: number;
    byCategory: Record<EMVTagCategory, number>;
  };
}

// ============== EMV Tag Definitions ==============

/**
 * Complete EMV tag registry with categories
 * Organized by functional category for better display and filtering
 */
export const EMV_TAG_DEFINITIONS: Record<string, EMVTagDefinition> = {
  // Application Related Tags
  '4F': { tag: '4F', name: 'Application Identifier (AID)', category: EMVTagCategory.APPLICATION, description: 'Identifies the application as stored in the ICC' },
  '50': { tag: '50', name: 'Application Label', category: EMVTagCategory.APPLICATION, format: 'ASCII' },
  '57': { tag: '57', name: 'Track 2 Equivalent Data', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  '5A': { tag: '5A', name: 'Application Primary Account Number (PAN)', category: EMVTagCategory.CARD_DATA, format: 'NUMERIC' },
  '5F20': { tag: '5F20', name: 'Cardholder Name', category: EMVTagCategory.CARD_DATA, format: 'ASCII' },
  '5F24': { tag: '5F24', name: 'Application Expiration Date', category: EMVTagCategory.CARD_DATA, format: 'DATE', description: 'YYMMDD' },
  '5F25': { tag: '5F25', name: 'Application Effective Date', category: EMVTagCategory.CARD_DATA, format: 'DATE', description: 'YYMMDD' },
  '5F28': { tag: '5F28', name: 'Issuer Country Code', category: EMVTagCategory.CARD_DATA, format: 'NUMERIC' },
  '5F2A': { tag: '5F2A', name: 'Transaction Currency Code', category: EMVTagCategory.CURRENCY, format: 'NUMERIC' },
  '5F2D': { tag: '5F2D', name: 'Language Preference', category: EMVTagCategory.CARD_DATA, format: 'ASCII', description: 'Cardholder preferred language(s) in ISO 639 format' },
  '5F30': { tag: '5F30', name: 'Service Code', category: EMVTagCategory.CARD_DATA, format: 'NUMERIC' },
  '5F34': { tag: '5F34', name: 'Application PAN Sequence Number', category: EMVTagCategory.CARD_DATA, format: 'NUMERIC', description: 'Differentiates cards with same PAN' },

  // Security & Cryptogram Tags
  '8A': { tag: '8A', name: 'Authorization Response Code', category: EMVTagCategory.SECURITY, format: 'ASCII' },
  '91': { tag: '91', name: 'Issuer Authentication Data', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '93': { tag: '93', name: 'Signed Static Application Data', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '9F26': { tag: '9F26', name: 'Application Cryptogram (AC)', category: EMVTagCategory.CRYPTogram, format: 'HEX', description: 'Generated cryptogram for transaction' },
  '9F27': { tag: '9F27', name: 'Cryptogram Information Data (CID)', category: EMVTagCategory.CRYPTogram, format: 'HEX', description: 'Indicates type of cryptogram' },
  '9F32': { tag: '9F32', name: 'Application Locator', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F36': { tag: '9F36', name: 'Application Transaction Counter (ATC)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '9F37': { tag: '9F37', name: 'Unpredictable Number', category: EMVTagCategory.SECURITY, format: 'HEX' },

  // Transaction Related Tags
  '9A': { tag: '9A', name: 'Transaction Date', category: EMVTagCategory.TRANSACTION, format: 'DATE', description: 'YYMMDD' },
  '9C': { tag: '9C', name: 'Transaction Type', category: EMVTagCategory.TRANSACTION, format: 'NUMERIC' },
  '9F02': { tag: '9F02', name: 'Amount, Authorized (Numeric)', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F03': { tag: '9F03', name: 'Amount, Other (Numeric)', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F04': { tag: '9F04', name: 'Amount, Cardholder Billing Conversion Rate', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F21': { tag: '9F21', name: 'Transaction Time', category: EMVTagCategory.TRANSACTION, format: 'NUMERIC', description: 'HHmmss' },
  '9F41': { tag: '9F41', name: 'Transaction Sequence Counter', category: EMVTagCategory.TRANSACTION, format: 'HEX' },

  // Terminal Related Tags
  '9F1A': { tag: '9F1A', name: 'Terminal Country Code', category: EMVTagCategory.TERMINAL, format: 'NUMERIC' },
  '9F1E': { tag: '9F1E', name: 'Interface Device (IFD) Serial Number', category: EMVTagCategory.TERMINAL, format: 'ASCII' },
  '9F22': { tag: '9F22', name: 'Terminal Country Code (repeated)', category: EMVTagCategory.TERMINAL, format: 'NUMERIC' },
  '9F33': { tag: '9F33', name: 'Terminal Capabilities', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F35': { tag: '9F35', name: 'Terminal Type', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F38': { tag: '9F38', name: 'Point-of-Service (POS) Entry Mode', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F39': { tag: '9F39', name: 'Point-of-Service (POS) Condition Code', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F3A': { tag: '9F3A', name: 'Amount, Transaction Fee', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F3B': { tag: '9F3B', name: 'Amount, Settlement Fee', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F3C': { tag: '9F3C', name: 'Amount, Transaction Processing Fee', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F3D': { tag: '9F3D', name: 'Amount, Settlement Processing Fee', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F3E': { tag: '9F3E', name: 'Amount, Credit Processing Fee', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F3F': { tag: '9F3F', name: 'Amount, Credit Processing Fee - 2', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F40': { tag: '9F40', name: 'Amount, Cash Deposit', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },

  // Cardholder Verification Method (CVM) Tags
  '8E': { tag: '8E', name: 'Cardholder Verification Method (CVM) List', category: EMVTagCategory.CVM, format: 'HEX' },
  '9F0B': { tag: '9F0B', name: 'Cardholder Verification Method (CVM) Results', category: EMVTagCategory.CVM, format: 'HEX' },
  '9F17': { tag: '9F17', name: 'Personal Identification Number (PIN) Try Counter', category: EMVTagCategory.PIN, format: 'NUMERIC' },
  '9F23': { tag: '9F23', name: 'Cardholder Verification Method (CVM) Results (repeated)', category: EMVTagCategory.CVM, format: 'HEX' },
  '9F34': { tag: '9F34', name: 'CVM Results', category: EMVTagCategory.CVM, format: 'HEX' },
  '9F4C': { tag: '9F4C', name: 'Cardholder Verification Method (CVM) (repeated)', category: EMVTagCategory.CVM, format: 'HEX' },

  // Risk Management Tags
  '8C': { tag: '8C', name: 'Card Risk Management Data Object List 1 (CDOL1)', category: EMVTagCategory.RISK_MANAGEMENT, format: 'HEX' },
  '8D': { tag: '8D', name: 'Card Risk Management Data Object List 2 (CDOL2)', category: EMVTagCategory.RISK_MANAGEMENT, format: 'HEX' },
  '94': { tag: '94', name: 'Application File Locator (AFL)', category: EMVTagCategory.RISK_MANAGEMENT, format: 'HEX' },
  '95': { tag: '95', name: 'Terminal Verification Results (TVR)', category: EMVTagCategory.RISK_MANAGEMENT, format: 'HEX' },
  '9B': { tag: '9B', name: 'Transaction Status Information (TSI)', category: EMVTagCategory.RISK_MANAGEMENT, format: 'HEX' },

  // Issuer Script Tags
  '71': { tag: '71', name: 'Issuer Script Template 1', category: EMVTagCategory.ISSUER_SCRIPT, isConstruct: true },
  '72': { tag: '72', name: 'Issuer Script Template 2', category: EMVTagCategory.ISSUER_SCRIPT, isConstruct: true },
  '86': { tag: '86', name: 'Issuer Script Command', category: EMVTagCategory.ISSUER_SCRIPT, format: 'HEX' },
  '9F18': { tag: '9F18', name: 'Issuer Script Identifier', category: EMVTagCategory.ISSUER_SCRIPT, format: 'HEX' },
  '9E': { tag: '9E', name: 'Issuer Script Identifier (repeated)', category: EMVTagCategory.ISSUER_SCRIPT, format: 'HEX' },

  // Application Template Tags (Construct)
  '01': { tag: '01', name: 'Application Template', category: EMVTagCategory.APPLICATION, isConstruct: true },

  // Currency Tags
  '5F36': { tag: '5F36', name: 'Transaction Currency Code (repeated)', category: EMVTagCategory.CURRENCY, format: 'NUMERIC' },
  '9F05': { tag: '9F05', name: 'Application Currency Code', category: EMVTagCategory.CURRENCY, format: 'NUMERIC' },
  '9F25': { tag: '9F25', name: 'Application Currency Code (repeated)', category: EMVTagCategory.CURRENCY, format: 'NUMERIC' },
  '9F42': { tag: '9F42', name: 'Application Currency Code (repeated 2)', category: EMVTagCategory.CURRENCY, format: 'NUMERIC' },
  '9F51': { tag: '9F51', name: 'Application Currency Code (repeated 3)', category: EMVTagCategory.CURRENCY, format: 'NUMERIC' },

  // Public Key / Certificate Tags
  '8F': { tag: '8F', name: 'Certification Authority Public Key Index', category: EMVTagCategory.SECURITY, format: 'NUMERIC' },
  '90': { tag: '90', name: 'Issuer Public Key Certificate', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '92': { tag: '92', name: 'Issuer Public Key Remainder', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '9F46': { tag: '9F46', name: 'Payment Account Reference (PAR) - Card', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '9F47': { tag: '9F47', name: 'Payment Account Reference (PAR) - Terminal', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F48': { tag: '9F48', name: 'Payment Account Reference (PAR) - Acquirer', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F49': { tag: '9F49', name: 'Payment Account Reference (PAR) - Forwarder', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F4A': { tag: '9F4A', name: 'Payment Account Reference (PAR) - Gateway', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F4B': { tag: '9F4B', name: 'Payment Account Reference (PAR) - Card (repeated)', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '9F4E': { tag: '9F4E', name: 'Merchant Name and Location', category: EMVTagCategory.TERMINAL, format: 'ASCII' },
  '9F4F': { tag: '9F4F', name: 'Merchant Name and Location (repeated)', category: EMVTagCategory.TERMINAL, format: 'ASCII' },
  '9F50': { tag: '9F50', name: 'Merchant Name and Location (repeated 2)', category: EMVTagCategory.TERMINAL, format: 'ASCII' },
  '9F52': { tag: '9F52', name: 'Merchant Identifier', category: EMVTagCategory.TERMINAL, format: 'ASCII' },

  // Additional Amount Tags
  '9F54': { tag: '9F54', name: 'Amount, Cash Advance', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F55': { tag: '9F55', name: 'Amount, Cash Back', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F56': { tag: '9F56', name: 'Amount, Cash Deposit', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F57': { tag: '9F57', name: 'Amount, Cash Withdrawal', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F58': { tag: '9F58', name: 'Amount, Goods and Services', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F59': { tag: '9F59', name: 'Amount, Inquiry', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F5A': { tag: '9F5A', name: 'Amount, Payment', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F5B': { tag: '9F5B', name: 'Amount, Transfer', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },

  // File System Tags
  '82': { tag: '82', name: 'Application Interchange Profile', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '84': { tag: '84', name: 'Dedicated File (DF) Name', category: EMVTagCategory.APPLICATION, format: 'HEX' },

  // Dynamic Data Tags
  '98': { tag: '98', name: 'Dynamic Number', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '99': { tag: '99', name: 'Dynamic Data Authentication Data Object (DDA/DDOL)', category: EMVTagCategory.SECURITY, format: 'HEX' },

  // Application Usage Control
  '9F07': { tag: '9F07', name: 'Application Usage Control', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F08': { tag: '9F08', name: 'Application Version Number', category: EMVTagCategory.APPLICATION, format: 'NUMERIC' },
  '9F09': { tag: '9F09', name: 'Application Version Number (repeated)', category: EMVTagCategory.APPLICATION, format: 'NUMERIC' },
  '9F0D': { tag: '9F0D', name: 'Issuer Action Code - Default', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F0E': { tag: '9F0E', name: 'Issuer Action Code - Denial', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F0F': { tag: '9F0F', name: 'Issuer Application Identifier (AIID)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F10': { tag: '9F10', name: 'Issuer Application Data (IAD)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F11': { tag: '9F11', name: 'Issuer Code Table Index', category: EMVTagCategory.APPLICATION, format: 'NUMERIC' },
  '9F12': { tag: '9F12', name: 'Application Preferred Name', category: EMVTagCategory.APPLICATION, format: 'ASCII' },

  // Risk Management - Limits
  '9F13': { tag: '9F13', name: 'Last Online ATC Register', category: EMVTagCategory.RISK_MANAGEMENT, format: 'HEX' },
  '9F14': { tag: '9F14', name: 'Lower Consecutive Offline Limit', category: EMVTagCategory.RISK_MANAGEMENT, format: 'NUMERIC' },
  '9F15': { tag: '9F15', name: 'Merchant Category Code', category: EMVTagCategory.TERMINAL, format: 'NUMERIC' },
  '9F16': { tag: '9F16', name: 'Merchant Identifier', category: EMVTagCategory.TERMINAL, format: 'ASCII' },
  '9F1B': { tag: '9F1B', name: 'Terminal Floor Limit', category: EMVTagCategory.RISK_MANAGEMENT, format: 'NUMERIC' },
  '9F1C': { tag: '9F1C', name: 'Terminal Floor Limit (repeated)', category: EMVTagCategory.RISK_MANAGEMENT, format: 'NUMERIC' },
  '9F1D': { tag: '9F1D', name: 'Terminal Transaction Qualifiers', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F1F': { tag: '9F1F', name: 'Terminal Identification', category: EMVTagCategory.TERMINAL, format: 'ASCII' },
  '9F20': { tag: '9F20', name: 'Terminal Transaction Qualifiers (repeated)', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F24': { tag: '9F24', name: 'Payment Account Reference (PAR)', category: EMVTagCategory.CARD_DATA, format: 'HEX' },

  // Network/Routing Tags
  '9F28': { tag: '9F28', name: 'Issuer Identification Number (IIN) - Acquirer', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F29': { tag: '9F29', name: 'Issuer Identification Number (IIN) - Forwarder', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F2A': { tag: '9F2A', name: 'Issuer Identification Number (IIN) - Gateway', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F2B': { tag: '9F2B', name: 'Merchant Category Code (repeated)', category: EMVTagCategory.TERMINAL, format: 'NUMERIC' },
  '9F2C': { tag: '9F2C', name: 'Payment Account Reference (PAR) (repeated)', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '9F2D': { tag: '9F2D', name: 'Point of Service (POS) Entry Mode', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F2E': { tag: '9F2E', name: 'Point of Service (POS) Condition Code', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F2F': { tag: '9F2F', name: 'Point of Service (POS) PIN Capture Code', category: EMVTagCategory.PIN, format: 'HEX' },
  '9F30': { tag: '9F30', name: 'Transaction Type (repeated)', category: EMVTagCategory.TRANSACTION, format: 'NUMERIC' },
  '9F31': { tag: '9F31', name: 'Amount, Cardholder Billing Conversion Rate (repeated)', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F43': { tag: '9F43', name: 'Amount, Cardholder Billing Conversion Rate (repeated 2)', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F44': { tag: '9F44', name: 'Application Identifier (AID) - Terminal', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F45': { tag: '9F45', name: 'Data Element List', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F53': { tag: '9F53', name: 'Transaction Category Code', category: EMVTagCategory.TRANSACTION, format: 'HEX' },

  // Additional repeated amount tags
  '9F5C': { tag: '9F5C', name: 'Amount, Transfer - 2', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F5D': { tag: '9F5D', name: 'Amount, Cash Deposit - 2', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F5E': { tag: '9F5E', name: 'Amount, Cash Withdrawal - 2', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F5F': { tag: '9F5F', name: 'Amount, Goods and Services - 2', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F60': { tag: '9F60', name: 'Amount, Inquiry - 2', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F61': { tag: '9F61', name: 'Amount, Payment - 2', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F62': { tag: '9F62', name: 'Amount, Transfer - 3', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },
  '9F63': { tag: '9F63', name: 'Amount, Transfer - 4', category: EMVTagCategory.AMOUNT, format: 'NUMERIC' },

  // DOL (Data Object List) Tags
  '97': { tag: '97', name: 'Transaction Certificate Data Object List (TDOL)', category: EMVTagCategory.RISK_MANAGEMENT, format: 'HEX' },
  '9D': { tag: '9D', name: 'Dynamic Data Authentication Data Object List (DDOL)', category: EMVTagCategory.SECURITY, format: 'HEX' },

  // Log Entry
  '9F4D': { tag: '9F4D', name: 'Log Entry', category: EMVTagCategory.APPLICATION, format: 'HEX' },

  // Proprietary Tags (DFxx)
  'DF01': { tag: 'DF01', name: 'Directory File Name', category: EMVTagCategory.PROPRIETARY, format: 'ASCII' },
  'DF02': { tag: 'DF02', name: 'Integrated Circuit Card (ICC) System Code', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF03': { tag: 'DF03', name: 'Cardholder Verification Method (CVM) Rules', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF04': { tag: 'DF04', name: 'Cardholder Verification Method (CVM) List', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF05': { tag: 'DF05', name: 'Floor Limit', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF06': { tag: 'DF06', name: 'Target Percentage to be Used for Random Selection', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF07': { tag: 'DF07', name: 'Target Percentage to be Used for Random Selection - Biased', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF08': { tag: 'DF08', name: 'Threshold Value for Biased Random Selection', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF09': { tag: 'DF09', name: 'Maximum Target Percentage to be Used for Random Selection', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF0A': { tag: 'DF0A', name: 'Cardholder Verification Method (CVM) Rules - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF0B': { tag: 'DF0B', name: 'Cardholder Verification Method (CVM) List - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF0C': { tag: 'DF0C', name: 'Cardholder Verification Method (CVM) Rules - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF0D': { tag: 'DF0D', name: 'Cardholder Verification Method (CVM) List - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF0E': { tag: 'DF0E', name: 'Floor Limit - Card', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF0F': { tag: 'DF0F', name: 'Target Percentage to be Used for Random Selection - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF10': { tag: 'DF10', name: 'Target Percentage to be Used for Random Selection - Biased - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF11': { tag: 'DF11', name: 'Threshold Value for Biased Random Selection - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF12': { tag: 'DF12', name: 'Maximum Target Percentage to be Used for Random Selection - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF13': { tag: 'DF13', name: 'Random Selection - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF14': { tag: 'DF14', name: 'Random Selection - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF15': { tag: 'DF15', name: 'Random Selection Result', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF16': { tag: 'DF16', name: 'Lower Consecutive Offline Limit - Card', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF17': { tag: 'DF17', name: 'Upper Consecutive Offline Limit - Card', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF18': { tag: 'DF18', name: 'Lower Consecutive Offline Limit - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF19': { tag: 'DF19', name: 'Upper Consecutive Offline Limit - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF1A': { tag: 'DF1A', name: 'Lower Consecutive Offline Limit - Card - Online', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF1B': { tag: 'DF1B', name: 'Upper Consecutive Offline Limit - Card - Online', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF1C': { tag: 'DF1C', name: 'Lower Consecutive Offline Limit - Terminal - Online', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF1D': { tag: 'DF1D', name: 'Upper Consecutive Offline Limit - Terminal - Online', category: EMVTagCategory.PROPRIETARY, format: 'NUMERIC' },
  'DF1E': { tag: 'DF1E', name: 'Force Online Processing', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF1F': { tag: 'DF1F', name: 'Force Online Processing - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF20': { tag: 'DF20', name: 'Force Online Processing - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF21': { tag: 'DF21', name: 'Cardholder Verification Method (CVM) Required', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF22': { tag: 'DF22', name: 'Cardholder Verification Method (CVM) Required - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF23': { tag: 'DF23', name: 'Cardholder Verification Method (CVM) Required - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF24': { tag: 'DF24', name: 'Default TDOL', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF25': { tag: 'DF25', name: 'Default TDOL - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF26': { tag: 'DF26', name: 'Default TDOL - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF27': { tag: 'DF27', name: 'Issuer Script Identifier', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF28': { tag: 'DF28', name: 'Issuer Script Identifier - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF29': { tag: 'DF29', name: 'Issuer Script Identifier - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF2A': { tag: 'DF2A', name: 'Issuer Script Format', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF2B': { tag: 'DF2B', name: 'Issuer Script Format - Card', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF2C': { tag: 'DF2C', name: 'Issuer Script Format - Terminal', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF2D': { tag: 'DF2D', name: 'Issuer Script Identifier - Card - 2', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF2E': { tag: 'DF2E', name: 'Issuer Script Identifier - Terminal - 2', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF2F': { tag: 'DF2F', name: 'Issuer Script Format - 2', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF30': { tag: 'DF30', name: 'Issuer Script Format - Card - 2', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF31': { tag: 'DF31', name: 'Issuer Script Format - Terminal - 2', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF32': { tag: 'DF32', name: 'Issuer Script Identifier - 3', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF33': { tag: 'DF33', name: 'Issuer Script Identifier - Card - 3', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF34': { tag: 'DF34', name: 'Issuer Script Identifier - Terminal - 3', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF35': { tag: 'DF35', name: 'Issuer Script Format - 3', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF36': { tag: 'DF36', name: 'Issuer Script Format - Card - 3', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF37': { tag: 'DF37', name: 'Issuer Script Format - Terminal - 3', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF38': { tag: 'DF38', name: 'Issuer Script Identifier - 4', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF39': { tag: 'DF39', name: 'Issuer Script Identifier - Card - 4', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF3A': { tag: 'DF3A', name: 'Issuer Script Identifier - Terminal - 4', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF3B': { tag: 'DF3B', name: 'Issuer Script Format - 4', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF3C': { tag: 'DF3C', name: 'Issuer Script Format - Card - 4', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF3D': { tag: 'DF3D', name: 'Issuer Script Format - Terminal - 4', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF3E': { tag: 'DF3E', name: 'Issuer Script Identifier - 5', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF3F': { tag: 'DF3F', name: 'Issuer Script Identifier - Card - 5', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF40': { tag: 'DF40', name: 'Issuer Script Identifier - Terminal - 5', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF41': { tag: 'DF41', name: 'Issuer Script Format - 5', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF42': { tag: 'DF42', name: 'Issuer Script Format - Card - 5', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF43': { tag: 'DF43', name: 'Issuer Script Format - Terminal - 5', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  'DF44': { tag: 'DF44', name: 'Track 1 Data', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF45': { tag: 'DF45', name: 'Track 1 Data - Card', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF46': { tag: 'DF46', name: 'Track 1 Data - Terminal', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF47': { tag: 'DF47', name: 'Track 2 Data', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF48': { tag: 'DF48', name: 'Track 2 Data - Card', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF49': { tag: 'DF49', name: 'Track 2 Data - Terminal', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF4A': { tag: 'DF4A', name: 'Track 1 ICC Data - Card', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF4B': { tag: 'DF4B', name: 'Track 1 ICC Data - Terminal', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF4C': { tag: 'DF4C', name: 'Track 2 ICC Data - Card', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF4D': { tag: 'DF4D', name: 'Track 2 ICC Data - Terminal', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF4E': { tag: 'DF4E', name: 'Track 1 ICC Data', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF4F': { tag: 'DF4F', name: 'Track 2 ICC Data', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF50': { tag: 'DF50', name: 'Track 1 Data (repeated)', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF51': { tag: 'DF51', name: 'Track 1 Data - Card (repeated)', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF52': { tag: 'DF52', name: 'Track 1 Data - Terminal (repeated)', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF53': { tag: 'DF53', name: 'Track 2 Data (repeated)', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF54': { tag: 'DF54', name: 'Track 2 Data - Card (repeated)', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF55': { tag: 'DF55', name: 'Track 2 Data - Terminal (repeated)', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF56': { tag: 'DF56', name: 'Track 1 ICC Data - Card - 2', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF57': { tag: 'DF57', name: 'Track 1 ICC Data - Terminal - 2', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF58': { tag: 'DF58', name: 'Track 2 ICC Data - Card - 2', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF59': { tag: 'DF59', name: 'Track 2 ICC Data - Terminal - 2', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF5A': { tag: 'DF5A', name: 'Track 1 ICC Data - 2', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF5B': { tag: 'DF5B', name: 'Track 2 ICC Data - 2', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF5C': { tag: 'DF5C', name: 'Track 1 Data - 2', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF5D': { tag: 'DF5D', name: 'Track 1 Data - Card - 2', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF5E': { tag: 'DF5E', name: 'Track 1 Data - Terminal - 2', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF5F': { tag: 'DF5F', name: 'Track 2 Data - 2', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF60': { tag: 'DF60', name: 'Track 2 Data - Card - 2', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF61': { tag: 'DF61', name: 'Track 2 Data - Terminal - 2', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF62': { tag: 'DF62', name: 'Track 1 ICC Data - Card - 3', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF63': { tag: 'DF63', name: 'Track 1 ICC Data - Terminal - 3', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF64': { tag: 'DF64', name: 'Track 2 ICC Data - Card - 3', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF65': { tag: 'DF65', name: 'Track 2 ICC Data - Terminal - 3', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF66': { tag: 'DF66', name: 'Track 1 ICC Data - 3', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF67': { tag: 'DF67', name: 'Track 2 ICC Data - 3', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF68': { tag: 'DF68', name: 'Track 1 Data - 3', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF69': { tag: 'DF69', name: 'Track 1 Data - Card - 3', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF6A': { tag: 'DF6A', name: 'Track 1 Data - Terminal - 3', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF6B': { tag: 'DF6B', name: 'Track 2 Data - 3', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF6C': { tag: 'DF6C', name: 'Track 2 Data - Card - 3', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF6D': { tag: 'DF6D', name: 'Track 2 Data - Terminal - 3', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF6E': { tag: 'DF6E', name: 'Track 1 ICC Data - Card - 4', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF6F': { tag: 'DF6F', name: 'Track 1 ICC Data - Terminal - 4', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF70': { tag: 'DF70', name: 'Track 2 ICC Data - Card - 4', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF71': { tag: 'DF71', name: 'Track 2 ICC Data - Terminal - 4', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF72': { tag: 'DF72', name: 'Track 1 ICC Data - 4', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF73': { tag: 'DF73', name: 'Track 2 ICC Data - 4', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  'DF74': { tag: 'DF74', name: 'Track 1 Data - 4', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF75': { tag: 'DF75', name: 'Track 1 Data - Card - 4', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF76': { tag: 'DF76', name: 'Track 1 Data - Terminal - 4', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF77': { tag: 'DF77', name: 'Track 2 Data - 4', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF78': { tag: 'DF78', name: 'Track 2 Data - Card - 4', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },
  'DF79': { tag: 'DF79', name: 'Track 2 Data - Terminal - 4', category: EMVTagCategory.TRACK_DATA, format: 'ASCII' },

  // Error Indication Tags (E0-FF)
  'E1': { tag: 'E1', name: 'Error Indication', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'E2': { tag: 'E2', name: 'Error Indication - Card', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'E3': { tag: 'E3', name: 'Error Indication - Terminal', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'E4': { tag: 'E4', name: 'Error Indication - 2', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'E5': { tag: 'E5', name: 'Error Indication - Card - 2', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'E6': { tag: 'E6', name: 'Error Indication - Terminal - 2', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'E7': { tag: 'E7', name: 'Error Indication - 3', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'E8': { tag: 'E8', name: 'Error Indication - Card - 3', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'E9': { tag: 'E9', name: 'Error Indication - Terminal - 3', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'EA': { tag: 'EA', name: 'Error Indication - 4', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'EB': { tag: 'EB', name: 'Error Indication - Card - 4', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'EC': { tag: 'EC', name: 'Error Indication - Terminal - 4', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'ED': { tag: 'ED', name: 'Error Indication - 5', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'EE': { tag: 'EE', name: 'Error Indication - Card - 5', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'EF': { tag: 'EF', name: 'Error Indication - Terminal - 5', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F0': { tag: 'F0', name: 'Error Indication - 6', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F1': { tag: 'F1', name: 'Error Indication - Card - 6', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F2': { tag: 'F2', name: 'Error Indication - Terminal - 6', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F3': { tag: 'F3', name: 'Error Indication - 7', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F4': { tag: 'F4', name: 'Error Indication - Card - 7', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F5': { tag: 'F5', name: 'Error Indication - Terminal - 7', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F6': { tag: 'F6', name: 'Error Indication - 8', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F7': { tag: 'F7', name: 'Error Indication - Card - 8', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F8': { tag: 'F8', name: 'Error Indication - Terminal - 8', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'F9': { tag: 'F9', name: 'Error Indication - 9', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'FA': { tag: 'FA', name: 'Error Indication - Card - 9', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'FB': { tag: 'FB', name: 'Error Indication - Terminal - 9', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'FC': { tag: 'FC', name: 'Error Indication - A', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'FD': { tag: 'FD', name: 'Error Indication - Card - A', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'FE': { tag: 'FE', name: 'Error Indication - Terminal - A', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },
  'FF': { tag: 'FF', name: 'Error Indication - B', category: EMVTagCategory.ERROR_INDICATION, format: 'HEX' },

  // Additional Reserved/Application tags
  '9F0A': { tag: '9F0A', name: 'Issuer Identification Number (IIN) - Card', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F0C': { tag: '9F0C', name: 'Issuer Identification Number (IIN) - Terminal', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F06': { tag: '9F06', name: 'Application Identifier (AID) - Card', category: EMVTagCategory.APPLICATION, format: 'HEX' },
};

// ============== Helper Functions ==============

/**
 * Get tag definition by tag value
 */
export function getEMVTagDefinition(tag: string): EMVTagDefinition | undefined {
  return EMV_TAG_DEFINITIONS[tag.toUpperCase()];
}

/**
 * Get tag name by tag value
 */
export function getEMVTagName(tag: string): string {
  const def = getEMVTagDefinition(tag);
  return def?.name || 'Unknown Tag';
}

/**
 * Get tag category by tag value
 */
export function getEMVTagCategory(tag: string): EMVTagCategory {
  const def = getEMVTagDefinition(tag);
  return def?.category || EMVTagCategory.UNKNOWN;
}

/**
 * Check if a tag is a construct (contains nested TLV data)
 */
export function isConstructTag(tag: string): boolean {
  const def = getEMVTagDefinition(tag);
  return def?.isConstruct || false;
}

/**
 * Check if a string contains only valid hex characters
 */
export function isHex(str: string): boolean {
  return /^[0-9A-Fa-f]+$/.test(str);
}

/**
 * Convert hex string to ASCII
 */
export function hexToAscii(hex: string): string {
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (code >= 32 && code <= 126) {
      result += String.fromCharCode(code);
    } else {
      result += '.';
    }
  }
  return result;
}

function isPrintableAsciiHex(hex: string): boolean {
  if (hex.length === 0 || hex.length % 2 !== 0) return false;

  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (code < 32 || code > 126) {
      return false;
    }
  }

  return true;
}

/**
 * Determine the display format for a value based on tag definition and content
 */
export function getValueDisplayFormat(rawValue: string, tagDef?: EMVTagDefinition): 'ASCII' | 'HEX' {
  // If tag definition specifies format, use it as a hint
  if (tagDef?.format === 'ASCII') {
    if (isPrintableAsciiHex(rawValue)) {
      return 'ASCII';
    }
  }

  if (tagDef?.format) {
    return 'HEX';
  }

  // Auto-detect: try to convert to ASCII and check if it's readable
  if (isPrintableAsciiHex(rawValue)) {
    return 'ASCII';
  }

  return 'HEX';
}

/**
 * Format raw value based on display format
 */
export function formatValue(rawValue: string, format: 'ASCII' | 'HEX'): string {
  if (format === 'ASCII') {
    return hexToAscii(rawValue);
  }
  return rawValue.toUpperCase();
}

function stripIsoLengthPrefix(hex: string): string {
  const cleanHex = hex.replace(/\s/g, '').toUpperCase();
  const candidates = [
    { indicatorLength: 8, value: hexToAscii(cleanHex.substring(0, 8)) },
    { indicatorLength: 6, value: hexToAscii(cleanHex.substring(0, 6)) },
    { indicatorLength: 4, value: cleanHex.substring(0, 4) },
    { indicatorLength: 3, value: cleanHex.substring(0, 3) },
  ];

  for (const candidate of candidates) {
    if (candidate.indicatorLength >= cleanHex.length) continue;
    if (!/^\d+$/.test(candidate.value)) continue;

    const declaredLength = parseInt(candidate.value, 10);
    const remainingLength = cleanHex.length - candidate.indicatorLength;

    if (declaredLength > 0 && declaredLength * 2 === remainingLength) {
      return cleanHex.substring(candidate.indicatorLength);
    }
  }

  return cleanHex;
}

// ============== TLV Parsing Functions ==============

/**
 * Parse a single tag from hex string at position
 * Returns the tag and the new position
 */
function parseTag(hex: string, pos: number): { tag: string; newPos: number } {
  let tag = hex.substring(pos, pos + 2);
  let newPos = pos + 2;

  // Check if this is a multi-byte tag (first byte indicates more bytes follow)
  // In EMV, tags with lower 5 bits = 0x1F are multi-byte tags
  const firstByte = parseInt(tag, 16);
  if ((firstByte & 0x1F) === 0x1F && newPos + 2 <= hex.length) {
    // Two-byte tag (EMV standard)
    tag += hex.substring(newPos, newPos + 2);
    newPos += 2;
  }

  return { tag, newPos };
}

/**
 * Parse length from hex string at position
 * Returns the length and new position
 */
function parseLength(hex: string, pos: number): { length: number; newPos: number } {
  let lengthByte = parseInt(hex.substring(pos, pos + 2), 16);
  let newPos = pos + 2;
  let length = lengthByte;

  // Check if extended length (length > 127)
  if (lengthByte > 127) {
    const numLengthBytes = lengthByte & 0x7F;
    length = 0;
    for (let i = 0; i < numLengthBytes && newPos + 2 <= hex.length; i++) {
      length = length * 256 + parseInt(hex.substring(newPos, newPos + 2), 16);
      newPos += 2;
    }
  }

  return { length, newPos };
}

/**
 * Parse a single TLV structure
 */
function parseTLV(hex: string, pos: number): { tlv: TLVData; newPos: number } | null {
  if (pos + 4 > hex.length) return null;

  // Parse Tag
  const { tag, newPos: afterTag } = parseTag(hex, pos);
  let currentPos = afterTag;

  // Get tag definition
  const tagDef = getEMVTagDefinition(tag);

  // Parse Length
  if (currentPos + 2 > hex.length) return null;
  const { length, newPos: afterLength } = parseLength(hex, currentPos);
  currentPos = afterLength;

  // Extract Value
  if (currentPos + length * 2 > hex.length) return null;
  const rawValue = hex.substring(currentPos, currentPos + length * 2);
  currentPos += length * 2;

  // Determine display format
  const displayFormat = getValueDisplayFormat(rawValue, tagDef);
  const displayValue = formatValue(rawValue, displayFormat);

  // Check if this is a construct tag (may contain nested TLV)
  const isConstruct = tagDef?.isConstruct || false;
  let children: TLVData[] | undefined;

  if (isConstruct && rawValue.length > 0) {
    // Try to parse nested TLV data
    children = [];
    let childPos = 0;
    while (childPos < rawValue.length) {
      const childResult = parseTLV(rawValue, childPos);
      if (childResult) {
        children.push(childResult.tlv);
        childPos = childResult.newPos;
      } else {
        break;
      }
    }
    // If no children found, it's not really a construct
    if (children.length === 0) {
      children = undefined;
    }
  }

  const tlv: TLVData = {
    tag,
    tagName: tagDef?.name || 'Unknown Tag',
    category: tagDef?.category || EMVTagCategory.UNKNOWN,
    length,
    rawValue,
    displayValue,
    valueType: displayFormat,
    isConstruct,
    children
  };

  return { tlv, newPos: currentPos };
}

/**
 * Parse EMV TLV data from hex string
 * Main entry point for TLV parsing
 */
export function parseEMVTLV(hex: string): EMVParseResult {
  const tags: TLVData[] = [];
  const cleanHex = stripIsoLengthPrefix(hex);
  let pos = 0;

  while (pos < cleanHex.length) {
    const result = parseTLV(cleanHex, pos);
    if (result) {
      tags.push(result.tlv);
      pos = result.newPos;
    } else {
      // Skip invalid bytes
      pos += 2;
    }
  }

  // Calculate summary statistics
  const summary = {
    totalTags: tags.length,
    byCategory: {} as Record<EMVTagCategory, number>
  };

  // Initialize all categories to 0
  Object.values(EMVTagCategory).forEach(cat => {
    summary.byCategory[cat] = 0;
  });

  // Count tags by category
  tags.forEach(tlv => {
    summary.byCategory[tlv.category]++;
  });

  return {
    tags,
    rawHex: cleanHex,
    totalBytes: cleanHex.length / 2,
    summary
  };
}

/**
 * Format EMV TLV data for display (legacy format)
 * Maintains backward compatibility with existing code
 */
export function formatTLVData(hex: string): string {
  const result = parseEMVTLV(hex);
  const lines: string[] = [];

  result.tags.forEach(tlv => {
    if (tlv.children && tlv.children.length > 0) {
      // Construct tag - format with nested tags
      lines.push(`${tlv.tag} | ${tlv.tagName} | Len: ${tlv.length} | CONSTRUCT`);
      tlv.children.forEach(child => {
        lines.push(`  └─ ${child.tag} | ${child.tagName} | Len: ${child.length} ${child.valueType} | ${child.displayValue}`);
      });
    } else {
      // Simple tag
      lines.push(`${tlv.tag} | ${tlv.tagName} | Len: ${tlv.length} ${tlv.valueType} | ${tlv.displayValue}`);
    }
  });

  return lines.length > 0 ? lines.join('\n') : hex;
}

/**
 * Group TLV data by category for organized display
 */
export function groupTLVByCategory(parseResult: EMVParseResult): Map<EMVTagCategory, TLVData[]> {
  const grouped = new Map<EMVTagCategory, TLVData[]>();

  // Initialize all categories
  Object.values(EMVTagCategory).forEach(cat => {
    grouped.set(cat, []);
  });

  // Group tags by category
  parseResult.tags.forEach(tlv => {
    const current = grouped.get(tlv.category) || [];
    current.push(tlv);
    grouped.set(tlv.category, current);
  });

  return grouped;
}

/**
 * Format EMV TLV data grouped by category
 */
export function formatTLVByCategory(hex: string): string {
  const result = parseEMVTLV(hex);
  const grouped = groupTLVByCategory(result);
  const lines: string[] = [];

  // Display categories with tags
  grouped.forEach((tags, category) => {
    if (tags.length === 0) return;

    lines.push(`\n=== ${category} (${tags.length} tags) ===`);
    tags.forEach(tlv => {
      const childrenStr = tlv.children ? ` [${tlv.children.length} nested]` : '';
      lines.push(`  ${tlv.tag} | ${tlv.tagName}${childrenStr}`);
      lines.push(`    Len: ${tlv.length} | ${tlv.valueType}: ${tlv.displayValue}`);
    });
  });

  return lines.join('\n');
}

/**
 * Search for tags by category
 */
export function getTagsByCategory(parseResult: EMVParseResult, category: EMVTagCategory): TLVData[] {
  return parseResult.tags.filter(tlv => tlv.category === category);
}

/**
 * Find a specific tag by its tag value
 */
export function findTag(parseResult: EMVParseResult, tag: string): TLVData | undefined {
  return parseResult.tags.find(tlv => tlv.tag.toUpperCase() === tag.toUpperCase());
}

/**
 * Get all construct tags (tags containing nested TLV data)
 */
export function getConstructTags(parseResult: EMVParseResult): TLVData[] {
  return parseResult.tags.filter(tlv => tlv.isConstruct && tlv.children && tlv.children.length > 0);
}
