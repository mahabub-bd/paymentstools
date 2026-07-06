import { TOOL_CATEGORIES } from './categories';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  category: keyof typeof TOOL_CATEGORIES;
  group?: string;
  description: string;
  shortcut: string;
}

export const menuItems: MenuItem[] = [
  // ISO 8583 Tools
  { id: 'bitmap', label: 'Bitmap Editor', icon: '🔢', category: 'iso8583', group: 'Message Tools', description: 'Create and edit ISO 8583 bitmaps', shortcut: '1' },
  { id: 'parser', label: 'Message Parser', icon: '📨', category: 'iso8583', group: 'Message Tools', description: 'Parse ISO 8583 messages', shortcut: '2' },
  { id: 'mtireference', label: 'MTI Reference', icon: '📋', category: 'iso8583', group: 'References', description: 'Message Type Identifier codes', shortcut: '3' },
  { id: 'posentry', label: 'POS Entry Mode', icon: '🖥️', category: 'iso8583', group: 'POS & ATM', description: 'Decode Field 22 - POS Entry Mode', shortcut: '5' },
  { id: 'poscondition', label: 'POS Condition', icon: '📍', category: 'iso8583', group: 'POS & ATM', description: 'Decode Field 25 - POS Condition Code', shortcut: 'p' },
  { id: 'ndcparser', label: 'NDC Parser', icon: '🏧', category: 'iso8583', group: 'POS & ATM', description: 'Parse NDC+ messages and transaction logs', shortcut: 'x' },
  { id: 'maccalculator', label: 'MAC Calculator', icon: '🔐', category: 'iso8583', group: 'Security', description: 'Calculate ISO 8583 MAC', shortcut: 'm' },
  { id: 'thaleshsm', label: 'Thales HSM', icon: '🔒', category: 'iso8583', group: 'Security', description: 'Thales HSM Commands Reference', shortcut: '4' },

  // EMV Tools
  { id: 'tlv', label: 'TLV Parser', icon: '📋', category: 'emv', group: 'TLV & APDU', description: 'Parse EMV TLV data', shortcut: '6' },
  { id: 'apduparser', label: 'APDU Parser', icon: '💬', category: 'emv', group: 'TLV & APDU', description: 'Parse EMV APDU transaction logs', shortcut: 'n' },
  { id: 'tlvbuilder', label: 'TLV Builder', icon: '🔧', category: 'emv', group: 'TLV & APDU', description: 'Build EMV TLV data structures', shortcut: 'b' },
  { id: 'tlvcomparator', label: 'TLV Comparator', icon: '🔍', category: 'emv', group: 'TLV & APDU', description: 'Compare two EMV TLV messages', shortcut: 'o' },
  { id: 'emvtags', label: 'EMV & NFC Tags', icon: '🏷️', category: 'emv', group: 'References', description: 'Complete EMV & NFC tag reference', shortcut: '7' },
  { id: 'emvrid', label: 'RID Reference', icon: '📇', category: 'emv', group: 'References', description: 'Registered Application Provider IDs', shortcut: 'r' },
  { id: 'emvcryptogram', label: 'Cryptogram Calc', icon: '🔐', category: 'emv', group: 'Cryptography', description: 'Calculate ARQC/ARPC for EMV', shortcut: 'a' },
  { id: 'cavv', label: 'CAVV Decoder', icon: '🔐', category: 'emv', group: 'Cryptography', description: 'Decode Cardholder Authentication Verification Value', shortcut: 'z' },
  { id: 'tvr', label: 'TVR', icon: '🧾', category: 'emv', group: 'Data Decoders', description: 'Tag 95 decoder', shortcut: 'v' },
  { id: 'cvmresults', label: 'CVM Results', icon: '✅', category: 'emv', group: 'Data Decoders', description: 'Tag 9F34 decoder', shortcut: 'y' },
  { id: 'aip', label: 'AIP', icon: '🧩', category: 'emv', group: 'Data Decoders', description: 'Tag 82 decoder', shortcut: 'u' },
  { id: 'iad', label: 'IAD', icon: '🧬', category: 'emv', group: 'Data Decoders', description: 'Tag 9F10 decoder', shortcut: 'd' },
  { id: 'cvr', label: 'CVR', icon: '✓', category: 'emv', group: 'Data Decoders', description: 'Card Verification Results decoder', shortcut: 'x' },
  { id: 'terminalcaps', label: 'Terminal Capabilities', icon: '🖲️', category: 'emv', group: 'Data Decoders', description: 'Tag 9F33 - Terminal Capabilities', shortcut: 'q' },
  { id: 'tsi', label: 'TSI Decoder', icon: '📊', category: 'emv', group: 'Data Decoders', description: 'Tag 9B - Transaction Status Information', shortcut: 's' },

  // PIN Tools
  { id: 'pinblock', label: 'PIN Block', icon: '🔐', category: 'pin', group: 'PIN Blocks', description: 'Calculate PIN blocks', shortcut: '8' },
  { id: 'pinfromblock', label: 'PIN from Block', icon: '🔓', category: 'pin', group: 'PIN Blocks', description: 'Extract PIN from PIN block', shortcut: '9' },
  { id: 'visapvv', label: 'Visa PVV', icon: '💳', category: 'pin', group: 'Verification Values', description: 'Visa PIN Verification Value', shortcut: '0' },
  { id: 'cvvcalc', label: 'CVV Calculator', icon: '🔢', category: 'pin', group: 'Verification Values', description: 'Calculate CVV/CVC values', shortcut: 'c' },

  // Reference
  { id: 'servicecode', label: 'Service Codes', icon: '🔑', category: 'reference', group: 'Card References', description: 'Card service codes reference', shortcut: 'w' },
  { id: 'mcclist', label: 'MCC List', icon: '🏪', category: 'reference', group: 'Card References', description: 'Merchant Category Codes', shortcut: 'e' },
  { id: 'aidlist', label: 'AID List', icon: '📋', category: 'reference', group: 'Card References', description: 'EMV Application Identifiers', shortcut: 'i' },
  { id: 'paymentkeys', label: 'Payment Keys', icon: '🔑', category: 'reference', group: 'Key References', description: 'TMK, TPK, TAK, ZMK, ZPK, ZAK, LMK', shortcut: 'k' },
  { id: 'emvtestkeys', label: 'EMV Test Keys', icon: '🔐', category: 'reference', group: 'Key References', description: 'Issuer EMV test keys', shortcut: 'j' },
  { id: 'knowledgebase', label: 'Knowledge Base', icon: '📚', category: 'reference', group: 'Learning', description: 'Payment system articles & guides', shortcut: 'l' },

  // Utilities
  { id: 'trackgen', label: 'Track Generator', icon: '💳', category: 'utilities', group: 'Generators', description: 'Generate card Track 1 & Track 2 data', shortcut: 'f' },
  { id: 'cardgen', label: 'Card Generator', icon: '🎴', category: 'utilities', group: 'Generators', description: 'Generate test card numbers', shortcut: 'g' },
  { id: 'converter', label: 'Converters', icon: '🔄', category: 'utilities', group: 'Converters', description: 'Hex, ASCII, Base64 converters', shortcut: 't' },
];
