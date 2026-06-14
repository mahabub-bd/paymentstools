import { TOOL_CATEGORIES } from './categories';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  category: keyof typeof TOOL_CATEGORIES;
  description: string;
  shortcut: string;
}

export const menuItems: MenuItem[] = [
  // ISO 8583 Tools
  { id: 'bitmap', label: 'Bitmap Editor', icon: '🔢', category: 'iso8583', description: 'Create and edit ISO 8583 bitmaps', shortcut: '1' },
  { id: 'parser', label: 'Message Parser', icon: '📨', category: 'iso8583', description: 'Parse ISO 8583 messages', shortcut: '2' },
  { id: 'mtireference', label: 'MTI Reference', icon: '📋', category: 'iso8583', description: 'Message Type Identifier codes', shortcut: '3' },
  { id: 'thaleshsm', label: 'Thales HSM', icon: '🔒', category: 'iso8583', description: 'Thales HSM Commands Reference', shortcut: '4' },
  { id: 'posentry', label: 'POS Entry Mode', icon: '🖥️', category: 'iso8583', description: 'Decode Field 22 - POS Entry Mode', shortcut: '5' },
  { id: 'maccalculator', label: 'MAC Calculator', icon: '🔐', category: 'iso8583', description: 'Calculate ISO 8583 MAC', shortcut: 'm' },

  // EMV Tools - TLV tools together
  { id: 'tlv', label: 'TLV Parser', icon: '📋', category: 'emv', description: 'Parse EMV TLV data', shortcut: '6' },
  { id: 'tlvbuilder', label: 'TLV Builder', icon: '🔧', category: 'emv', description: 'Build EMV TLV data structures', shortcut: 'b' },
  { id: 'tlvcomparator', label: 'TLV Comparator', icon: '🔍', category: 'emv', description: 'Compare two EMV TLV messages', shortcut: 'o' },
  { id: 'emvtags', label: 'EMV & NFC Tags', icon: '🏷️', category: 'emv', description: 'Complete EMV & NFC tag reference', shortcut: '7' },
  { id: 'emvrid', label: 'RID Reference', icon: '📇', category: 'emv', description: 'Registered Application Provider IDs', shortcut: 'r' },
  { id: 'emvcryptogram', label: 'Cryptogram Calc', icon: '🔐', category: 'emv', description: 'Calculate ARQC/ARPC for EMV', shortcut: 'a' },
  { id: 'tvr', label: 'TVR', icon: '🧾', category: 'emv', description: 'Tag 95 decoder', shortcut: 'v' },
  { id: 'cvmresults', label: 'CVM Results', icon: '✅', category: 'emv', description: 'Tag 9F34 decoder', shortcut: 'y' },
  { id: 'aip', label: 'AIP', icon: '🧩', category: 'emv', description: 'Tag 82 decoder', shortcut: 'u' },
  { id: 'iad', label: 'IAD', icon: '🧬', category: 'emv', description: 'Tag 9F10 decoder', shortcut: 'd' },
  { id: 'cvr', label: 'CVR', icon: '✓', category: 'emv', description: 'Card Verification Results decoder', shortcut: 'x' },
  { id: 'terminalcaps', label: 'Terminal Capabilities', icon: '🖲️', category: 'emv', description: 'Tag 9F33 - Terminal Capabilities Decoder', shortcut: 'q' },
  { id: 'cavv', label: 'CAVV Decoder', icon: '🔐', category: 'emv', description: 'Decode Cardholder Authentication Verification Value', shortcut: 'z' },

  // PIN Tools
  { id: 'visapvv', label: 'Visa PVV', icon: '💳', category: 'pin', description: 'Visa PIN Verification Value', shortcut: '0' },
  { id: 'pinblock', label: 'PIN Block', icon: '🔐', category: 'pin', description: 'Calculate PIN blocks', shortcut: '8' },
  { id: 'pinfromblock', label: 'PIN from Block', icon: '🔓', category: 'pin', description: 'Extract PIN from PIN block', shortcut: '9' },
  { id: 'cvvcalc', label: 'CVV Calculator', icon: '🔢', category: 'pin', description: 'Calculate CVV/CVC values', shortcut: 'c' },

  // Reference
  { id: 'servicecode', label: 'Service Codes', icon: '🔑', category: 'reference', description: 'Card service codes reference', shortcut: 'w' },
  { id: 'mcclist', label: 'MCC List', icon: '🏪', category: 'reference', description: 'Merchant Category Codes', shortcut: 'e' },
  { id: 'aidlist', label: 'AID List', icon: '📋', category: 'reference', description: 'EMV Application Identifiers', shortcut: 'i' },
  { id: 'paymentkeys', label: 'Payment Keys', icon: '🔑', category: 'reference', description: 'TMK, TPK, TAK, ZMK, ZPK, ZAK, LMK', shortcut: 'k' },
  { id: 'knowledgebase', label: 'Knowledge Base', icon: '📚', category: 'reference', description: 'Payment system articles & guides', shortcut: 'l' },

  // Utilities
  { id: 'trackgen', label: 'Track Generator', icon: '💳', category: 'utilities', description: 'Generate card Track 1 & Track 2 data', shortcut: 'f' },
  { id: 'cardgen', label: 'Card Generator', icon: '🎴', category: 'utilities', description: 'Generate test card numbers', shortcut: 'g' },
  { id: 'converter', label: 'Converters', icon: '🔄', category: 'utilities', description: 'Hex, ASCII, Base64 converters', shortcut: 't' },
];
