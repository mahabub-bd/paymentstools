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
  '9F04': { tag: '9F04', name: 'Amount, Other (Binary)', category: EMVTagCategory.AMOUNT, format: 'HEX' },
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

  // ========== MISSING TAGS FROM paymentcardtools.com (201 tags) ==========

  // File System and Structure Tags
  '06': { tag: '06', name: 'Object Identifier (OID)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '41': { tag: '41', name: 'Country code and national data', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '42': { tag: '42', name: 'Issuer Identification Number (IIN)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '43': { tag: '43', name: 'Card service data', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '44': { tag: '44', name: 'Initial access data', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '45': { tag: '45', name: 'Card issuer\'s data', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '46': { tag: '46', name: 'Pre-issuing data', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '47': { tag: '47', name: 'Card capabilities', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '48': { tag: '48', name: 'Status information', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '4D': { tag: '4D', name: 'Extended header list', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '51': { tag: '51', name: 'Path', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '52': { tag: '52', name: 'Command to perform', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '53': { tag: '53', name: 'Discretionary data, discretionary template', category: EMVTagCategory.PROPRIETARY, format: 'HEX', isConstruct: true },
  '58': { tag: '58', name: 'Track 3 Equivalent Data', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  '59': { tag: '59', name: 'Card expiration date', category: EMVTagCategory.CARD_DATA, format: 'DATE' },
  '5B': { tag: '5B', name: 'Name of an individual', category: EMVTagCategory.CARD_DATA, format: 'ASCII' },
  '5C': { tag: '5C', name: 'Tag list', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '5E': { tag: '5E', name: 'Proprietary login data', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },

  // Additional Cardholder and Card Data Tags
  '5F21': { tag: '5F21', name: 'Track 1, identical to the data coded', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  '5F22': { tag: '5F22', name: 'Track 2, identical to the data coded', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  '5F23': { tag: '5F23', name: 'Track 3, identical to the data coded', category: EMVTagCategory.TRACK_DATA, format: 'HEX' },
  '5F26': { tag: '5F26', name: 'Date, Card Effective', category: EMVTagCategory.CARD_DATA, format: 'DATE' },
  '5F27': { tag: '5F27', name: 'Interchange control', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '5F29': { tag: '5F29', name: 'Interchange profile', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '5F2B': { tag: '5F2B', name: 'Date of birth', category: EMVTagCategory.CARD_DATA, format: 'DATE' },
  '5F2C': { tag: '5F2C', name: 'Cardholder nationality', category: EMVTagCategory.CARD_DATA, format: 'ASCII' },
  '5F2E': { tag: '5F2E', name: 'Cardholder biometric data', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '5F2F': { tag: '5F2F', name: 'PIN usage policy', category: EMVTagCategory.PIN, format: 'HEX' },
  '5F32': { tag: '5F32', name: 'Transaction counter', category: EMVTagCategory.TRANSACTION, format: 'HEX' },
  '5F33': { tag: '5F33', name: 'Date, Transaction', category: EMVTagCategory.TRANSACTION, format: 'DATE' },
  '5F35': { tag: '5F35', name: 'Sex (ISO 5218)', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '5F37': { tag: '5F37', name: 'Static internal authentication (one-step)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F38': { tag: '5F38', name: 'Static internal authentication - first associated data', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F39': { tag: '5F39', name: 'Static internal authentication - second associated data', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F3A': { tag: '5F3A', name: 'Dynamic internal authentication', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F3B': { tag: '5F3B', name: 'Dynamic external authentication', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F3C': { tag: '5F3C', name: 'Transaction Reference Currency Code', category: EMVTagCategory.CURRENCY, format: 'NUMERIC' },
  '5F3D': { tag: '5F3D', name: 'Transaction Reference Currency Exponent', category: EMVTagCategory.CURRENCY, format: 'NUMERIC' },
  '5F40': { tag: '5F40', name: 'Cardholder portrait image', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '5F41': { tag: '5F41', name: 'Element list', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '5F42': { tag: '5F42', name: 'Address', category: EMVTagCategory.CARD_DATA, format: 'ASCII' },
  '5F43': { tag: '5F43', name: 'Cardholder handwritten signature image', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '5F44': { tag: '5F44', name: 'Application image', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '5F45': { tag: '5F45', name: 'Display message', category: EMVTagCategory.APPLICATION, format: 'ASCII' },
  '5F46': { tag: '5F46', name: 'Timer', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '5F47': { tag: '5F47', name: 'Message reference', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '5F48': { tag: '5F48', name: 'Cardholder private key', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F49': { tag: '5F49', name: 'Cardholder public key', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F4A': { tag: '5F4A', name: 'Public key of certification authority', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F4C': { tag: '5F4C', name: 'Certificate holder authorization', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F4D': { tag: '5F4D', name: 'Integrated circuit manufacturer identifier', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '5F4E': { tag: '5F4E', name: 'Certificate content', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '5F50': { tag: '5F50', name: 'Issuer Uniform resource locator (URL)', category: EMVTagCategory.APPLICATION, format: 'ASCII' },
  '5F53': { tag: '5F53', name: 'International Bank Account Number (IBAN)', category: EMVTagCategory.CARD_DATA, format: 'ASCII' },
  '5F54': { tag: '5F54', name: 'Bank Identifier Code (BIC)', category: EMVTagCategory.APPLICATION, format: 'ASCII' },
  '5F55': { tag: '5F55', name: 'Issuer Country Code (alpha2 format)', category: EMVTagCategory.CARD_DATA, format: 'ASCII' },
  '5F56': { tag: '5F56', name: 'Issuer Country Code (alpha3 format)', category: EMVTagCategory.CARD_DATA, format: 'ASCII' },
  '5F57': { tag: '5F57', name: 'Account Type', category: EMVTagCategory.CARD_DATA, format: 'HEX' },

  // Template and Authentication Tags
  '60': { tag: '60', name: 'Template, Dynamic Authentication', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '6080': { tag: '6080', name: 'Commitment', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '6081': { tag: '6081', name: 'Challenge', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '6082': { tag: '6082', name: 'Response', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '6083': { tag: '6083', name: 'Committed challenge', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '6084': { tag: '6084', name: 'Authentication code', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '6085': { tag: '6085', name: 'Exponential', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '60A0': { tag: '60A0', name: 'Template, Identification data', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '61': { tag: '61', name: 'Application Template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '62': { tag: '62', name: 'File Control Parameters (FCP) Template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '6280': { tag: '6280', name: 'Number of data bytes in the file, excluding structural information', category: EMVTagCategory.APPLICATION, format: 'NUMERIC' },
  '6281': { tag: '6281', name: 'Number of data bytes in the file, including structural information if any', category: EMVTagCategory.APPLICATION, format: 'NUMERIC' },
  '6282': { tag: '6282', name: 'File descriptor byte', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '6283': { tag: '6283', name: 'File identifier', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '6284': { tag: '6284', name: 'DF name', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '6285': { tag: '6285', name: 'Proprietary information, primitive encoding', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  '6286': { tag: '6286', name: 'Security attribute in proprietary format', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '6287': { tag: '6287', name: 'Identifier of an EF containing an extension of the file control information', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '6288': { tag: '6288', name: 'Short EF identifier', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '628A': { tag: '628A', name: 'Life cycle status byte (LCS)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '628B': { tag: '628B', name: 'Security attribute referencing the expanded format', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '628C': { tag: '628C', name: 'Security attribute in compact format', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '628D': { tag: '628D', name: 'Identifier of an EF containing security environment templates', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '62A0': { tag: '62A0', name: 'Template, Security attribute for data objects', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '62A1': { tag: '62A1', name: 'Template, Security attribute for physical interfaces', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '62A2': { tag: '62A2', name: 'One or more pairs of data objects, short EF identifier (tag 88) - absolute or relative path (tag 51)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '62A5': { tag: '62A5', name: 'Proprietary information, constructed encoding', category: EMVTagCategory.PROPRIETARY, format: 'HEX', isConstruct: true },
  '62AB': { tag: '62AB', name: 'Security attribute in expanded format', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '62AC': { tag: '62AC', name: 'Identifier of a cryptographic mechanism', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '63': { tag: '63', name: 'Wrapper', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '64': { tag: '64', name: 'Template, File Management Data (FMD)', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '65': { tag: '65', name: 'Cardholder related data', category: EMVTagCategory.CARD_DATA, format: 'HEX' },
  '66': { tag: '66', name: 'Template, Card data', category: EMVTagCategory.CARD_DATA, format: 'HEX', isConstruct: true },
  '67': { tag: '67', name: 'Template, Authentication data', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '68': { tag: '68', name: 'Special user requirements', category: EMVTagCategory.APPLICATION, format: 'HEX' },

  // Login and Communication Tags
  '6A': { tag: '6A', name: 'Template, Login', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '6A80': { tag: '6A80', name: 'Qualifier', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '6A81': { tag: '6A81', name: 'Telephone Number', category: EMVTagCategory.CARD_DATA, format: 'ASCII' },
  '6A82': { tag: '6A82', name: 'Text', category: EMVTagCategory.APPLICATION, format: 'ASCII' },
  '6A83': { tag: '6A83', name: 'Delay indicators, for detecting an end of message', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '6A84': { tag: '6A84', name: 'Delay indicators, for detecting an absence of response', category: EMVTagCategory.APPLICATION, format: 'HEX' },

  // Name and Identification Tags
  '6B': { tag: '6B', name: 'Template, Qualified name', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '6B06': { tag: '6B06', name: 'Qualified name', category: EMVTagCategory.APPLICATION, format: 'ASCII' },
  '6B80': { tag: '6B80', name: 'Name', category: EMVTagCategory.APPLICATION, format: 'ASCII' },
  '6BA0': { tag: '6BA0', name: 'Name', category: EMVTagCategory.APPLICATION, format: 'ASCII' },

  // Image and Template Tags
  '6C': { tag: '6C', name: 'Template, Cardholder image', category: EMVTagCategory.CARD_DATA, format: 'HEX', isConstruct: true },
  '6D': { tag: '6D', name: 'Template, Application image', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '6E': { tag: '6E', name: 'Application related data', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '6F': { tag: '6F', name: 'File Control Information (FCI) Template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '6FA5': { tag: '6FA5', name: 'Template, FCI A5', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },

  // Response and Script Tags
  '70': { tag: '70', name: 'READ RECORD Response Message Template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '7186': { tag: '7186', name: 'Issuer Script Command', category: EMVTagCategory.ISSUER_SCRIPT, format: 'HEX' },
  '719F18': { tag: '719F18', name: 'Issuer Script Identifier', category: EMVTagCategory.ISSUER_SCRIPT, format: 'HEX' },
  '73': { tag: '73', name: 'Directory Discretionary Template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '77': { tag: '77', name: 'Response Message Template Format 2', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '78': { tag: '78', name: 'Compatible Tag Allocation Authority', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '79': { tag: '79', name: 'Coexistent Tag Allocation Authority', category: EMVTagCategory.APPLICATION, format: 'HEX' },

  // Security Support Tags
  '7A': { tag: '7A', name: 'Template, Security Support (SS)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7A80': { tag: '7A80', name: 'Card session counter', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7A81': { tag: '7A81', name: 'Session identifier', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7A82': { tag: '7A82', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A83': { tag: '7A83', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A84': { tag: '7A84', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A85': { tag: '7A85', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A86': { tag: '7A86', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A87': { tag: '7A87', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A88': { tag: '7A88', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A89': { tag: '7A89', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A8A': { tag: '7A8A', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A8B': { tag: '7A8B', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A8C': { tag: '7A8C', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A8D': { tag: '7A8D', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A8E': { tag: '7A8E', name: 'File selection counter', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '7A93': { tag: '7A93', name: 'Digital signature counter', category: EMVTagCategory.SECURITY, format: 'HEX' },

  // Security Environment Tags
  '7B': { tag: '7B', name: 'Template, Security Environment (SE)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7B80': { tag: '7B80', name: 'SEID byte, mandatory', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7B8A': { tag: '7B8A', name: 'LCS byte, optional', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7BA4': { tag: '7BA4', name: 'Control reference template (CRT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7BAA': { tag: '7BAA', name: 'Control reference template (CRT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7BAC': { tag: '7BAC', name: 'Cryptographic mechanism identifier template, optional', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7BB4': { tag: '7BB4', name: 'Control reference template (CRT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7BB6': { tag: '7BB6', name: 'Control reference template (CRT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7BB8': { tag: '7BB8', name: 'Control reference template (CRT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },

  // Secure Messaging Tags
  '7D': { tag: '7D', name: 'Template, Secure Messaging (SM)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7D80': { tag: '7D80', name: 'Plain value not coded in BER-TLV', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D81': { tag: '7D81', name: 'Plain value not coded in BER-TLV', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D82': { tag: '7D82', name: 'Cryptogram (plain value coded in BER-TLV and including secure messaging data objects)', category: EMVTagCategory.CRYPTogram, format: 'HEX' },
  '7D83': { tag: '7D83', name: 'Cryptogram (plain value coded in BER-TLV and including secure messaging data objects)', category: EMVTagCategory.CRYPTogram, format: 'HEX' },
  '7D84': { tag: '7D84', name: 'Cryptogram (plain value coded in BER-TLV, but not including secure messaging data objects)', category: EMVTagCategory.CRYPTogram, format: 'HEX' },
  '7D85': { tag: '7D85', name: 'Cryptogram (plain value coded in BER-TLV, but not including secure messaging data objects)', category: EMVTagCategory.CRYPTogram, format: 'HEX' },
  '7D86': { tag: '7D86', name: 'Padding-content indicator byte followed by cryptogram (plain value not coded in BER-TLV)', category: EMVTagCategory.CRYPTogram, format: 'HEX' },
  '7D87': { tag: '7D87', name: 'Padding-content indicator byte followed by cryptogram (plain value not coded in BER-TLV)', category: EMVTagCategory.CRYPTogram, format: 'HEX' },
  '7D8E': { tag: '7D8E', name: 'Cryptographic checksum (at least four bytes)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D90': { tag: '7D90', name: 'Hash-code', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D91': { tag: '7D91', name: 'Hash-code', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D92': { tag: '7D92', name: 'Certificate (not BER-TLV coded data)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D93': { tag: '7D93', name: 'Certificate (not BER-TLV coded data)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D94': { tag: '7D94', name: 'Security environment identifier', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D95': { tag: '7D95', name: 'Security environment identifier', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D96': { tag: '7D96', name: 'Number Le in the unsecured command APDU (one or two bytes)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D97': { tag: '7D97', name: 'Number Le in the unsecured command APDU (one or two bytes)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D99': { tag: '7D99', name: 'Processing status of the secured response APDU (new SW1-SW2, two bytes)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D9A': { tag: '7D9A', name: 'Input data element for the computation of a digital signature (the value field is signed)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D9B': { tag: '7D9B', name: 'Input data element for the computation of a digital signature (the value field is signed)', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D9C': { tag: '7D9C', name: 'Public key', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D9D': { tag: '7D9D', name: 'Public key', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7D9E': { tag: '7D9E', name: 'Digital signature', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7DA0': { tag: '7DA0', name: 'Input template for the computation of a hash-code (the template is hashed)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DA1': { tag: '7DA1', name: 'Input template for the computation of a hash-code (the template is hashed)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DA2': { tag: '7DA2', name: 'Input template for the verification of a cryptographic checksum (the template is integrated)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DA4': { tag: '7DA4', name: 'Control reference template for authentication (AT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DA5': { tag: '7DA5', name: 'Control reference template for authentication (AT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DA8': { tag: '7DA8', name: 'Input template for the verification of a digital signature (the template is signed)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DAA': { tag: '7DAA', name: 'Template, Control reference for hash-code (HT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DAB': { tag: '7DAB', name: 'Template, Control reference for hash-code (HT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DAC': { tag: '7DAC', name: 'Input template for the computation of a digital signature (the concatenated value fields are signed)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DAD': { tag: '7DAD', name: 'Input template for the computation of a digital signature (the concatenated value fields are signed)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DAE': { tag: '7DAE', name: 'Input template for the computation of a certificate (the concatenated value fields are certified)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DAF': { tag: '7DAF', name: 'Input template for the computation of a certificate (the concatenated value fields are certified)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DB0': { tag: '7DB0', name: 'Plain value coded in BER-TLV and including secure messaging data objects', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7DB1': { tag: '7DB1', name: 'Plain value coded in BER-TLV and including secure messaging data objects', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7DB2': { tag: '7DB2', name: 'Plain value coded in BER-TLV, but not including secure messaging data objects', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7DB3': { tag: '7DB3', name: 'Plain value coded in BER-TLV, but not including secure messaging data objects', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7DB4': { tag: '7DB4', name: 'Control reference template for cryptographic checksum (CCT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DB5': { tag: '7DB5', name: 'Control reference template for cryptographic checksum (CCT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DB6': { tag: '7DB6', name: 'Control reference template for digital signature (DST)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DB7': { tag: '7DB7', name: 'Control reference template for digital signature (DST)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DB8': { tag: '7DB8', name: 'Control reference template for confidentiality (CT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DB9': { tag: '7DB9', name: 'Control reference template for confidentiality (CT)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DBA': { tag: '7DBA', name: 'Response descriptor template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '7DBB': { tag: '7DBB', name: 'Response descriptor template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '7DBC': { tag: '7DBC', name: 'Input template for the computation of a digital signature (the template is signed)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DBD': { tag: '7DBD', name: 'Input template for the computation of a digital signature (the template is signed)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7DBE': { tag: '7DBE', name: 'Input template for the verification of a certificate (the template is certified)', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },

  // Additional Template Tags
  '7E': { tag: '7E', name: 'Template, Nesting Interindustry data objects', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '7F20': { tag: '7F20', name: 'Display control template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '7F21': { tag: '7F21', name: 'Cardholder certificate', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7F2E': { tag: '7F2E', name: 'Biometric data template', category: EMVTagCategory.CARD_DATA, format: 'HEX', isConstruct: true },
  '7F49': { tag: '7F49', name: 'Template, Cardholder public key', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7F4980': { tag: '7F4980', name: 'Algorithm reference as used in control reference data objects for secure messaging', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7F4981': { tag: '7F4981', name: 'RSA Modulus', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7F4982': { tag: '7F4982', name: 'RSA Public exponent', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7F4983': { tag: '7F4983', name: 'DSA Basis', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7F4984': { tag: '7F4984', name: 'DSA Public key', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7F4985': { tag: '7F4985', name: 'ECDSA Order', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7F4986': { tag: '7F4986', name: 'ECDSA Public key', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7F4C': { tag: '7F4C', name: 'Template, Certificate Holder Authorization', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7F4E': { tag: '7F4E', name: 'Certificate Body', category: EMVTagCategory.SECURITY, format: 'HEX', isConstruct: true },
  '7F4E42': { tag: '7F4E42', name: 'Certificate Authority Reference', category: EMVTagCategory.SECURITY, format: 'ASCII' },
  '7F4E65': { tag: '7F4E65', name: 'Certificate Extensions', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '7F60': { tag: '7F60', name: 'Template, Biometric information', category: EMVTagCategory.CARD_DATA, format: 'HEX', isConstruct: true },

  // Response and Amount Tags
  '80': { tag: '80', name: 'Response Message Template Format 1', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '81': { tag: '81', name: 'Amount, Authorised (Binary)', category: EMVTagCategory.AMOUNT, format: 'HEX' },
  '83': { tag: '83', name: 'Command Template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  '87': { tag: '87', name: 'Application Priority Indicator', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '88': { tag: '88', name: 'Short File Identifier (SFI)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '89': { tag: '89', name: 'Authorisation Code', category: EMVTagCategory.TRANSACTION, format: 'ASCII' },

  // Additional Missing Tags from paymentcardtools.com
  // Only tags that don't already exist in the file above
  '9F66': { tag: '9F66', name: 'Terminal Transaction Qualifiers (TTQ)', category: EMVTagCategory.TERMINAL, format: 'HEX' },
  '9F67': { tag: '9F67', name: 'MSD Offset', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F68': { tag: '9F68', name: 'Card Additional Processes', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F69': { tag: '9F69', name: 'Card Authentication Related Data', category: EMVTagCategory.SECURITY, format: 'HEX' },
  '9F6E': { tag: '9F6E', name: 'Third Party Data / Form Factor Indicator', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  '9F7C': { tag: '9F7C', name: 'Customer Exclusive Data (CED)', category: EMVTagCategory.PROPRIETARY, format: 'HEX' },
  '9F7D': { tag: '9F7D', name: 'DS Summary 1', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F7E': { tag: '9F7E', name: 'Mobile Support Indicator', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  '9F7F': { tag: '9F7F', name: 'DS Unpredictable Number', category: EMVTagCategory.SECURITY, format: 'HEX' },

  // FCI Proprietary Template Tags
  'A5': { tag: 'A5', name: 'File Control Information (FCI) Proprietary Template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  'BF0C': { tag: 'BF0C', name: 'File Control Information (FCI) Issuer Discretionary Data', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },
  'BF50': { tag: 'BF50', name: 'Visa Fleet - CDO', category: EMVTagCategory.PROPRIETARY, format: 'HEX', isConstruct: true },
  'BF60': { tag: 'BF60', name: 'Integrated Data Storage Record Update Template', category: EMVTagCategory.APPLICATION, format: 'HEX', isConstruct: true },

  // Card Issuer Action Code Tags
  'C3': { tag: 'C3', name: 'Card issuer action code -decline', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'C4': { tag: 'C4', name: 'Card issuer action code -default', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'C5': { tag: 'C5', name: 'Card issuer action code online', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'C6': { tag: 'C6', name: 'PIN Try Limit', category: EMVTagCategory.PIN, format: 'NUMERIC' },
  'C7': { tag: 'C7', name: 'CDOL 1 Related Data Length', category: EMVTagCategory.RISK_MANAGEMENT, format: 'NUMERIC' },
  'C8': { tag: 'C8', name: 'Card risk management country code', category: EMVTagCategory.RISK_MANAGEMENT, format: 'NUMERIC' },
  'C9': { tag: 'C9', name: 'Card risk management currency code', category: EMVTagCategory.RISK_MANAGEMENT, format: 'NUMERIC' },
  'CA': { tag: 'CA', name: 'Lower cummulative offline transaction amount', category: EMVTagCategory.RISK_MANAGEMENT, format: 'NUMERIC' },
  'CB': { tag: 'CB', name: 'Upper cumulative offline transaction amount', category: EMVTagCategory.RISK_MANAGEMENT, format: 'NUMERIC' },
  'CD': { tag: 'CD', name: 'Card Issuer Action Code (PayPass) - Default', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'CE': { tag: 'CE', name: 'Card Issuer Action Code (PayPass) - Online', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'CF': { tag: 'CF', name: 'Card Issuer Action Code (PayPass) - Decline', category: EMVTagCategory.APPLICATION, format: 'HEX' },

  // Data Storage and Application Control Tags
  'D1': { tag: 'D1', name: 'Currency conversion table', category: EMVTagCategory.CURRENCY, format: 'HEX' },
  'D2': { tag: 'D2', name: 'Integrated Data Storage Directory (IDSD)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'D3': { tag: 'D3', name: 'Additional check table', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'D5': { tag: 'D5', name: 'Application Control', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'D6': { tag: 'D6', name: 'Default ARPC response code', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'D7': { tag: 'D7', name: 'Application Control (PayPass)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'D8': { tag: 'D8', name: 'AIP (PayPass)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'D9': { tag: 'D9', name: 'AFL (PayPass)', category: EMVTagCategory.APPLICATION, format: 'HEX' },
  'DA': { tag: 'DA', name: 'Static CVC3-TRACK1', category: EMVTagCategory.SECURITY, format: 'HEX' },
  'DB': { tag: 'DB', name: 'Static CVC3-TRACK2', category: EMVTagCategory.SECURITY, format: 'HEX' },
  'DC': { tag: 'DC', name: 'IVCVC3-TRACK1', category: EMVTagCategory.SECURITY, format: 'HEX' },
  'DD': { tag: 'DD', name: 'IVCVC3-TRACK2', category: EMVTagCategory.SECURITY, format: 'HEX' },
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
