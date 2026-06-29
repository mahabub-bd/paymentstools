/**
 * ISO 8583 Parser
 * Universal parser for ISO 8583 financial transaction messages
 */

import { formatTLVData, parseEMVTLV } from './iso8583VersionParser/emv-tlv';

// Field data types
export enum FieldType {
  NUMERIC = 'n',           // Numeric, right justified, zero padded
  ALPHA = 'a',             // Alphabetic
  ALPHANUMERIC = 'an',     // Alphanumeric
  ALPHANUMERIC_SPECIAL = 'ans',  // Alphanumeric with special chars
  TRACK2 = 'z',            // Track 2 data
  BINARY = 'b'             // Binary
}

// Length indicator types
export enum LengthType {
  FIXED = 'fixed',         // Fixed length
  LLVAR = 'llvar',         // 2-digit length
  LLLVAR = 'lllvar',       // 3-digit length
  LLLLVAR = 'llllvar',     // 4-digit length
  LLLLLVAR = 'lllllvar'    // 5-digit length
}

// Field definition interface
export interface FieldDefinition {
  number: number;
  name: string;
  type: FieldType;
  lengthType: LengthType;
  maxLength: number;
  minLength?: number;
}

// Parse result interface
export interface ParseResult {
  mti: string;
  mtiDescription: string;
  bitmap: string;
  primaryBitmap: string;
  secondaryBitmap?: string;
  presentFields: number[];
  fields: Record<number, ParsedField>;
  rawMessage: string;
  rawLength: number;
  hasSecondaryBitmap: boolean;
  hasTPDU: boolean;
  tpdu?: string;
  lengthPrefix?: string;
  header?: string;
  warnings: string[];
  debugInfo?: {
    bitmapBinary: string;
    positionAfterBitmap: number;
    finalPosition: number;
    messageLength: number;
    remainingData: string;
  };
}

// Parsed field interface
export interface ParsedField {
  number: number;
  name: string;
  rawValue: string;
  displayValue: string;
  length: number;
  type: FieldType;
  lengthType: LengthType;
  isPresent: boolean;
  consumedLength?: number;
}

// ISO 8583 Field definitions for all versions
export const ISO8583_FIELD_DEFINITIONS: Record<number, FieldDefinition> = {
  2: { number: 2, name: 'Primary Account Number (PAN)', type: FieldType.NUMERIC, lengthType: LengthType.LLVAR, maxLength: 19 },
  3: { number: 3, name: 'Processing Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 6 },
  4: { number: 4, name: 'Transaction Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  5: { number: 5, name: 'Settlement Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  6: { number: 6, name: 'Billing Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  7: { number: 7, name: 'Transmission Date & Time', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  8: { number: 8, name: 'Billing Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 8 },
  9: { number: 9, name: 'Conversion Rate, Settlement', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 8 },
  10: { number: 10, name: 'Conversion Rate, Cardholder Billing', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 8 },
  11: { number: 11, name: 'System Trace Audit Number (STAN)', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 6 },
  12: { number: 12, name: 'Processing Time (Local)', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 6 },
  13: { number: 13, name: 'Local Transaction Date', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 4 },
  14: { number: 14, name: 'Expiration Date', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 4 },
  15: { number: 15, name: 'Date Settlement', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 6 },
  16: { number: 16, name: 'Conversion Date', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 4 },
  17: { number: 17, name: 'Capture Date', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 4 },
  18: { number: 18, name: 'Merchant Category Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 4 },
  19: { number: 19, name: 'Acquirer Institution Country Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  20: { number: 20, name: 'PAN Country Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  21: { number: 21, name: 'Forwarding Institution Country Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  22: { number: 22, name: 'Point of Service Entry Mode', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  23: { number: 23, name: 'Card Sequence Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  24: { number: 24, name: 'Function Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  25: { number: 25, name: 'Point of Service Condition Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 2 },
  26: { number: 26, name: 'Point of Service PIN Capture Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 2 },
  27: { number: 27, name: 'Authorization Identification Response Length', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 1 },
  28: { number: 28, name: 'Amount Transaction Fee', type: FieldType.ALPHANUMERIC, lengthType: LengthType.FIXED, maxLength: 9 },
  29: { number: 29, name: 'Reconciliation Indicator', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  30: { number: 30, name: 'Amounts Original', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 24 },
  31: { number: 31, name: 'Security Additional Data - Private', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  32: { number: 32, name: 'Acquiring Institution ID', type: FieldType.NUMERIC, lengthType: LengthType.LLVAR, maxLength: 11 },
  33: { number: 33, name: 'Forwarding Institution ID', type: FieldType.NUMERIC, lengthType: LengthType.LLVAR, maxLength: 11 },
  34: { number: 34, name: 'PAN Extended', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLVAR, maxLength: 28 },
  35: { number: 35, name: 'Track 2 Data', type: FieldType.TRACK2, lengthType: LengthType.LLVAR, maxLength: 37 },
  36: { number: 36, name: 'Track 3 Data', type: FieldType.ALPHANUMERIC, lengthType: LengthType.LLLVAR, maxLength: 104 },
  37: { number: 37, name: 'Retrieval Reference Number', type: FieldType.ALPHANUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  38: { number: 38, name: 'Authorization Identification Response', type: FieldType.ALPHANUMERIC, lengthType: LengthType.FIXED, maxLength: 6 },
  39: { number: 39, name: 'Response Code', type: FieldType.ALPHANUMERIC, lengthType: LengthType.FIXED, maxLength: 2 },
  40: { number: 40, name: 'Service Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  41: { number: 41, name: 'Card Acceptor Terminal ID', type: FieldType.ALPHANUMERIC, lengthType: LengthType.FIXED, maxLength: 8 },
  42: { number: 42, name: 'Card Acceptor ID Code', type: FieldType.ALPHANUMERIC, lengthType: LengthType.FIXED, maxLength: 15 },
  43: { number: 43, name: 'Card Acceptor Name', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.FIXED, maxLength: 40 },
  44: { number: 44, name: 'Additional Response Data', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLVAR, maxLength: 99 },
  45: { number: 45, name: 'Track 1 Data', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLVAR, maxLength: 75 },
  46: { number: 46, name: 'Amounts Fees', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 206 },
  47: { number: 47, name: 'Additional Data', type: FieldType.BINARY, lengthType: LengthType.LLLVAR, maxLength: 999 },
  48: { number: 48, name: 'Additional Data', type: FieldType.BINARY, lengthType: LengthType.LLLVAR, maxLength: 999 },
  49: { number: 49, name: 'Transaction Currency Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  50: { number: 50, name: 'Settlement Currency Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  51: { number: 51, name: 'Cardholder Billing Currency Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  52: { number: 52, name: 'PIN Data', type: FieldType.BINARY, lengthType: LengthType.FIXED, maxLength: 8 },
  53: { number: 53, name: 'Security Related Control Information', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 16 },
  54: { number: 54, name: 'Additional Amounts', type: FieldType.ALPHANUMERIC, lengthType: LengthType.LLLVAR, maxLength: 120 },
  55: { number: 55, name: 'ICC Related Data', type: FieldType.BINARY, lengthType: LengthType.LLLVAR, maxLength: 255 },
  56: { number: 56, name: 'Original Data Elements', type: FieldType.NUMERIC, lengthType: LengthType.LLVAR, maxLength: 35 },
  57: { number: 57, name: 'Reserved ISO', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  58: { number: 58, name: 'Reserved ISO', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  59: { number: 59, name: 'Additional Data', type: FieldType.BINARY, lengthType: LengthType.LLLVAR, maxLength: 999 },
  60: { number: 60, name: 'Operation Specific Data', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  61: { number: 61, name: 'Long Additional Data', type: FieldType.BINARY, lengthType: LengthType.LLLLLVAR, maxLength: 15000 },
  62: { number: 62, name: 'Secure Reference', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  63: { number: 63, name: 'Additional Data', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  64: { number: 64, name: 'MAC', type: FieldType.BINARY, lengthType: LengthType.FIXED, maxLength: 4 },
  65: { number: 65, name: 'MAC (Message Authentication Code)', type: FieldType.BINARY, lengthType: LengthType.LLLVAR, maxLength: 999 },
  66: { number: 66, name: 'Settlement Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 1 },
  67: { number: 67, name: 'Extended Payment Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 2 },
  68: { number: 68, name: 'Receiving Institution Country Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  69: { number: 69, name: 'Settlement Institution Country Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  70: { number: 70, name: 'Network Management Information Code', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 3 },
  71: { number: 71, name: 'Message Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 1 },
  72: { number: 72, name: 'Message Number Last', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 1 },
  73: { number: 73, name: 'Date Action', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 6 },
  74: { number: 74, name: 'Credits Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  75: { number: 75, name: 'Credits Reversal Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  76: { number: 76, name: 'Debits Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  77: { number: 77, name: 'Debits Reversal Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  78: { number: 78, name: 'Transfer Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  79: { number: 79, name: 'Transfer Reversal Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  80: { number: 80, name: 'Inquiries Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  81: { number: 81, name: 'Inquiries Reversal Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  82: { number: 82, name: 'Payment Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  83: { number: 83, name: 'Payment Reversal Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  84: { number: 84, name: 'Fee Collections Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  85: { number: 85, name: 'Fee Collections Reversal Number', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 10 },
  86: { number: 86, name: 'Credits Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  87: { number: 87, name: 'Credits Reversal Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  88: { number: 88, name: 'Debits Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  89: { number: 89, name: 'Debits Reversal Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  90: { number: 90, name: 'Transfer Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  91: { number: 91, name: 'Transfer Reversal Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  92: { number: 92, name: 'Inquiries Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  93: { number: 93, name: 'Inquiries Reversal Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  94: { number: 94, name: 'Payment Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  95: { number: 95, name: 'Payment Reversal Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  96: { number: 96, name: 'Fee Collections Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  97: { number: 97, name: 'Fee Collections Reversal Amount', type: FieldType.NUMERIC, lengthType: LengthType.FIXED, maxLength: 12 },
  98: { number: 98, name: 'Receiving Institution ID Code', type: FieldType.ALPHANUMERIC, lengthType: LengthType.LLLVAR, maxLength: 999 },
  99: { number: 99, name: 'Settlement Institution ID Code', type: FieldType.ALPHANUMERIC, lengthType: LengthType.LLLVAR, maxLength: 999 },
  100: { number: 100, name: 'Receiving Institution ID Code', type: FieldType.ALPHANUMERIC, lengthType: LengthType.LLLVAR, maxLength: 999 },
  101: { number: 101, name: 'File Name', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  102: { number: 102, name: 'Account ID 1', type: FieldType.ALPHANUMERIC, lengthType: LengthType.LLLVAR, maxLength: 999 },
  103: { number: 103, name: 'Account ID 2', type: FieldType.ALPHANUMERIC, lengthType: LengthType.LLLVAR, maxLength: 999 },
  104: { number: 104, name: 'Transaction Description', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  105: { number: 105, name: 'Reserved ISO', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  106: { number: 106, name: 'Reserved ISO', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  107: { number: 107, name: 'Reserved ISO', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  108: { number: 108, name: 'Reserved ISO', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  109: { number: 109, name: 'Reserved ISO', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  110: { number: 110, name: 'Reserved ISO', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  111: { number: 111, name: 'Reserved ISO', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  112: { number: 112, name: 'Reserved National', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  113: { number: 113, name: 'Reserved National', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  114: { number: 114, name: 'Reserved National', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  115: { number: 115, name: 'Reserved National', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  116: { number: 116, name: 'Reserved National', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  117: { number: 117, name: 'Reserved National', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  118: { number: 118, name: 'Reserved National', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  119: { number: 119, name: 'Reserved National', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  120: { number: 120, name: 'Reserved Private', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  121: { number: 121, name: 'Reserved Private', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  122: { number: 122, name: 'Reserved Private', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  123: { number: 123, name: 'Reserved Private', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  124: { number: 124, name: 'Reserved Private', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  125: { number: 125, name: 'Reserved Private', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  126: { number: 126, name: 'Reserved Private', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  127: { number: 127, name: 'Reserved Private', type: FieldType.ALPHANUMERIC_SPECIAL, lengthType: LengthType.LLLVAR, maxLength: 999 },
  128: { number: 128, name: 'MAC 2', type: FieldType.BINARY, lengthType: LengthType.FIXED, maxLength: 16 }
};

/**
 * Parse bitmap to get present field numbers
 * ISO 8583 bitmap: bytes are big-endian, bits within each byte can be LSB to MSB or MSB to LSB
 */
export function parseBitmapFields(bitmapHex: string, msbFirst: boolean = false): number[] {
  const cleanHex = bitmapHex.replace(/\s/g, '');
  const fields: number[] = [];

  for (let byteIndex = 0; byteIndex < cleanHex.length / 2; byteIndex++) {
    const byteValue = parseInt(cleanHex.substring(byteIndex * 2, byteIndex * 2 + 2), 16);

    if (msbFirst) {
      // MSB first: bit 7 of byte = field (byteIndex * 8) + 1, bit 0 = field (byteIndex * 8) + 8
      for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
        if ((byteValue & (1 << (7 - bitIndex))) !== 0) {
          const fieldNumber = byteIndex * 8 + bitIndex + 1;
          fields.push(fieldNumber);
        }
      }
    } else {
      // LSB first: bit 0 of byte = field (byteIndex * 8) + 1, bit 7 = field (byteIndex * 8) + 8
      for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
        if ((byteValue & (1 << bitIndex)) !== 0) {
          const fieldNumber = byteIndex * 8 + bitIndex + 1;
          fields.push(fieldNumber);
        }
      }
    }
  }

  return fields;
}

/**
 * Create bitmap hex from field array
 * ISO 8583 bitmap: bytes are big-endian, bits within each byte are LSB to MSB
 */
export function createBitmapHex(fields: number[]): string {
  const bytes: number[] = [];
  const maxField = Math.max(...fields, 0);
  const numBytes = Math.ceil(maxField / 8);

  // Initialize all bytes to 0
  for (let i = 0; i < Math.max(numBytes, 8); i++) {
    bytes.push(0);
  }

  // Set bits for each field
  fields.forEach(field => {
    const byteIndex = Math.floor((field - 1) / 8);
    const bitIndex = (field - 1) % 8;
    bytes[byteIndex] |= (1 << bitIndex);
  });

  // Convert to hex string (minimum 16 bytes = 128 bits for primary + secondary bitmap)
  while (bytes.length < 16) {
    bytes.push(0);
  }

  return bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
}

/**
 * Get MTI description
 */
export function getMTIDescription(mti: string): string {
  if (mti.length !== 4) return 'Invalid MTI';

  // Specific MTI descriptions with full details
  const mtiDescriptions: Record<string, string> = {
    // Authorization Messages (01xx)
    '0100': 'Authorization Request - Request from POS for authorization for cardholder purchase',
    '0110': 'Authorization Response - Request response to POS for authorization',
    '0120': 'Authorization Advice - When POS device breaks down and you have to sign a voucher',
    '0121': 'Authorization Advice Repeat - If the advice times out',
    '0130': 'Acquirer Response to Authorization Advice - Confirmation of receipt of authorization advice',

    // Financial Messages (02xx)
    '0200': 'Acquirer Financial Request - Request for funds from ATM or pinned POS device',
    '0210': 'Acquirer Financial Response - Issuer response to request for funds',
    '0220': 'Acquirer Financial Advice - Complete transaction initiated with authorization request (e.g. hotel checkout)',
    '0221': 'Acquirer Financial Advice Repeat - If the advice times out',
    '0230': 'Acquirer Response to Financial Advice - Confirmation of receipt of financial advice',

    // File Actions Messages (03xx)
    '0320': 'Batch Upload - File update/transfer advice',
    '0330': 'Batch Upload Response - File update/transfer advice response',

    // Reversal Messages (04xx)
    '0400': 'Acquirer Reversal Request - Reverses a transaction',
    '0420': 'Acquirer Reversal Advice',
    '0430': 'Acquirer Reversal Advice Response',

    // Reconciliation Messages (05xx)
    '0510': 'Batch Settlement Response - Card acceptor reconciliation request response',

    // Network Management Messages (08xx)
    '0800': 'Network Management Request - Terminal initialize, echo test, logon, logoff',
    '0810': 'Network Management Response - Terminal initialize response',
    '0820': 'Network Management Advice - Key change'
  };

  // Check if we have a specific description for this MTI
  if (mtiDescriptions[mti]) {
    return mtiDescriptions[mti];
  }

  // Fallback to generic description based on first and second digit
  const firstDigit = parseInt(mti[0]);
  const secondDigit = parseInt(mti[1]);

  const classMap: Record<number, string> = {
    0: 'Authorization/Reserved',
    1: 'Authorization',
    2: 'Financial',
    3: 'File Actions',
    4: 'Reversal/Chargeback',
    5: 'Reconciliation',
    6: 'Administrative',
    7: 'Network Management',
    8: 'Network Management'
  };

  const functionMap: Record<number, string> = {
    0: 'Request',
    1: 'Response',
    2: 'Advice',
    3: 'Advice Response',
    4: 'Notification',
    5: 'Notification Acknowledgement'
  };

  const messageClass = classMap[firstDigit] || 'Unknown';
  const messageFunction = functionMap[secondDigit] || 'Unknown';

  return `${messageClass} - ${messageFunction}`;
}

/**
 * Parse ISO 8583 message
 */
export function parseISO8583(
  message: string,
  options?: {
    hasTPDU?: boolean;        // Message has TPDU (network) header
    tpduLength?: number;      // TPDU length in bytes (default 5)
    msbFirstBitmap?: boolean; // Bitmap uses MSB-first bit order within each byte
  }
): ParseResult {
  const cleanHex = message.replace(/\s/g, '');
  const hasTPDU = options?.hasTPDU === true;
  const tpduLength = options?.tpduLength || 5; // Default TPDU is 5 bytes (10 hex chars)
  const msbFirstBitmap = options?.msbFirstBitmap === true;

  const result: ParseResult = {
    mti: '',
    mtiDescription: '',
    bitmap: '',
    primaryBitmap: '',
    presentFields: [],
    fields: {},
    rawMessage: cleanHex,
    rawLength: cleanHex.length,
    hasSecondaryBitmap: false,
    hasTPDU: hasTPDU,
    tpdu: undefined,
    warnings: []
  };

  try {
    let pos = 0;

    // Handle TPDU (Network Header) if present
    if (hasTPDU) {
      const tpduHex = cleanHex.substring(pos, pos + tpduLength * 2);
      if (tpduHex.length < tpduLength * 2) {
        throw new Error(`Message too short for TPDU (expected ${tpduLength * 2} hex chars)`);
      }
      result.tpdu = tpduHex;
      result.fields[-1] = {
        number: -1,
        name: 'TPDU (Network Header)',
        rawValue: tpduHex,
        displayValue: tpduHex,
        length: tpduLength,
        type: FieldType.NUMERIC,
        lengthType: LengthType.FIXED,
        isPresent: true
      };
      pos += tpduLength * 2;
    }

    // Check minimum message length (MTI 4 chars + bitmap 16 chars = 20 hex chars)
    if (cleanHex.length < pos + 20) {
      throw new Error('Message too short (minimum 20 hex characters required after TPDU)');
    }

    // Parse MTI (4 chars, could be hex "0200" or hex-encoded ASCII "31313030")
    let mtiHex = cleanHex.substring(pos, pos + 4);
    let mtiDecoded = mtiHex;

    // Check if MTI is hex-encoded ASCII (8 chars = 4 bytes in hex format)
    if (cleanHex.length >= pos + 8 && /^3[0-9]{3}$/.test(cleanHex.substring(pos, pos + 4))) {
      // Check if the next 4 chars also look like hex-encoded ASCII
      const next4 = cleanHex.substring(pos + 4, pos + 8);
      if (/^3[0-9]{3}$/.test(next4)) {
        // This is hex-encoded ASCII format (e.g., "31313030" = "1100")
        mtiHex = cleanHex.substring(pos, pos + 8);
        mtiDecoded = hexToAscii(mtiHex);
        pos += 8;
      } else {
        pos += 4;
      }
    } else {
      // Standard hex format (4 chars)
      pos += 4;
    }

    result.mti = mtiDecoded;
    result.mtiDescription = getMTIDescription(mtiDecoded);
    result.fields[0] = {
      number: 0,
      name: 'Message Type Indicator (MTI)',
      rawValue: mtiHex,
      displayValue: mtiDecoded,
      length: mtiHex.length / 2,
      type: FieldType.NUMERIC,
      lengthType: LengthType.FIXED,
      isPresent: true
    };

    // Parse Primary Bitmap (16 hex chars = 8 bytes)
    const bitmapLength = 16;
    if (cleanHex.length < pos + bitmapLength) {
      throw new Error('Missing primary bitmap');
    }
    const primaryBitmap = cleanHex.substring(pos, pos + bitmapLength);
    result.primaryBitmap = primaryBitmap;
    result.bitmap = primaryBitmap;
    pos += bitmapLength;

    // Check for secondary bitmap (bit 1 of primary bitmap)
    const hasSecondary = (BigInt('0x' + primaryBitmap) & BigInt(1)) !== BigInt(0);
    result.hasSecondaryBitmap = hasSecondary;

    if (hasSecondary) {
      if (cleanHex.length < pos + bitmapLength) {
        throw new Error('Missing secondary bitmap');
      } else {
        const secondaryBitmap = cleanHex.substring(pos, pos + bitmapLength);
        result.secondaryBitmap = secondaryBitmap;
        result.bitmap = primaryBitmap + secondaryBitmap;
        pos += bitmapLength;
      }
    }

    // Parse present fields from bitmap
    result.presentFields = parseBitmapFields(result.bitmap, msbFirstBitmap);

    // Detect if message is in mixed format (hex structure + ASCII data)
    const mixedFormat = isMixedFormat(cleanHex);

    const dataFields = result.presentFields.filter(field => field > 1);
    const lastDataField = dataFields[dataFields.length - 1];

    // Parse each data field
    for (const fieldNum of result.presentFields) {
      if (fieldNum <= 1) continue; // Skip bitmap field

      const fieldDef = ISO8583_FIELD_DEFINITIONS[fieldNum];

      if (!fieldDef) {
        // Unknown/reserved field - try to extract remaining data
        const remaining = cleanHex.substring(pos);
        if (remaining.length > 0) {
          result.fields[fieldNum] = {
            number: fieldNum,
            name: 'Reserved/Unknown',
            rawValue: remaining,
            displayValue: remaining,
            length: remaining.length,
            type: FieldType.ALPHANUMERIC,
            lengthType: LengthType.LLLVAR,
            isPresent: true
          };
          pos = cleanHex.length; // Consume all remaining
        }
        continue;
      }

      try {
        // Special handling for DE35 (Track 2) - variable length with '=' or 'D' separator
        if (fieldNum === 35) {
          const track2Data = parseTrack2Data(cleanHex, pos);
          result.fields[fieldNum] = track2Data;
          pos += track2Data.rawValue.length;
          continue;
        }

        // Special handling for DE55 (ICC data) - EMV TLV format
        if (fieldNum === 55) {
          const iccData = parseICCData(cleanHex, pos);
          result.fields[fieldNum] = iccData;
          pos += iccData.rawValue.length;
          continue;
        }

        let parsedField = parseFieldMixed(cleanHex, pos, fieldDef, mixedFormat);

        if (fieldNum === 60 && fieldNum === lastDataField) {
          parsedField = absorbPrintableTrailingData(cleanHex, pos, parsedField);
        }

        result.fields[fieldNum] = parsedField;
        pos += parsedField.consumedLength ?? parsedField.rawValue.length;
      } catch (e) {
        const errorMsg = (e as Error).message;
        result.warnings.push(`Field ${fieldNum}: ${errorMsg} at position ${pos}`);

        // Try to estimate field length to continue parsing
        let estimatedLength = 0;
        if (fieldDef.lengthType === LengthType.FIXED) {
          estimatedLength = fieldDef.maxLength;
        } else if (fieldDef.lengthType === LengthType.LLVAR) {
          // Try to read length from message
          try {
            const lenHex = cleanHex.substring(pos, pos + 4);
            if (/^[0-9A-Fa-f]{4}$/.test(lenHex)) {
              estimatedLength = parseInt(lenHex, 16) + 2; // data + length indicator
            }
          } catch {
            // Use default estimation
            estimatedLength = 10;
          }
        } else if (fieldDef.lengthType === LengthType.LLLVAR) {
          try {
            const lenHex = cleanHex.substring(pos, pos + 6);
            if (/^[0-9A-Fa-f]{6}$/.test(lenHex)) {
              estimatedLength = parseInt(lenHex, 16) + 3; // data + length indicator
            }
          } catch {
            estimatedLength = 20;
          }
        } else if (fieldDef.lengthType === LengthType.LLLLVAR || fieldDef.lengthType === LengthType.LLLLLVAR) {
          try {
            const digits = fieldDef.lengthType === LengthType.LLLLLVAR ? 5 : 4;
            const { length, dataStartOffset } = parseVariableLengthPrefix(cleanHex, pos, digits);
            estimatedLength = length + dataStartOffset / 2;
          } catch {
            estimatedLength = 20;
          }
        }

        // Only skip if we can estimate the length
        if (estimatedLength > 0 && pos + estimatedLength * 2 <= cleanHex.length) {
          pos += estimatedLength * 2;
        }

        // Mark field as having error
        result.fields[fieldNum] = {
          ...fieldDef,
          rawValue: '',
          displayValue: `<Parse error: ${errorMsg}>`,
          length: 0,
          isPresent: true
        };
      }
    }

    // Add debug info
    result.debugInfo = {
      bitmapBinary: primaryBitmap.split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join(' '),
      positionAfterBitmap: 4 + bitmapLength,
      finalPosition: pos,
      messageLength: cleanHex.length,
      remainingData: pos < cleanHex.length ? cleanHex.substring(pos) : ''
    };

    // If we have remaining data, try to parse it as additional fields
    if (pos < cleanHex.length && cleanHex.length - pos > 4) {
      result.warnings.push(`${cleanHex.length - pos} hex chars remaining after parsing all bitmap fields`);
      // Try to extract DE55 (EMV data) if present and not already parsed
      if (!result.fields[55] && cleanHex.substring(pos).includes('9F')) {
        try {
          const remaining = cleanHex.substring(pos);
          if (remaining.length >= 6) {
            const lengthHex = remaining.substring(0, 6);
            const length = parseInt(lengthHex, 16);
            if (length * 2 + 6 <= remaining.length) {
              const iccData = parseICCData(cleanHex, pos);
              result.fields[55] = iccData;
              result.warnings.push('DE55 found in remaining data and extracted');
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }

  } catch (e) {
    result.warnings.push(`Parse error: ${(e as Error).message}`);
  }

  return result;
}

/**
 * Parse individual field from message
 */
function parseField(
  message: string,
  pos: number,
  fieldDef: FieldDefinition
): ParsedField {
  if (pos >= message.length) {
    throw new Error('Unexpected end of message');
  }

  let dataLength = 0;
  let rawValue = '';
  let lengthIndicator = '';

  // Parse length if variable
  if (fieldDef.lengthType === LengthType.LLVAR) {
    // 2-digit length (4 hex chars)
    lengthIndicator = message.substring(pos, pos + 4);

    // For numeric fields with BCD length (decimal digits only)
    if (fieldDef.type === FieldType.NUMERIC && !/[A-Fa-f]/.test(lengthIndicator)) {
      const length = parseInt(lengthIndicator, 10); // BCD: number of digits
      dataLength = length; // 1 digit = 1 hex char in this format
      rawValue = lengthIndicator + message.substring(pos + 4, pos + 4 + dataLength);
    } else {
      // For alphanumeric or hex length indicators
      const length = parseInt(lengthIndicator, 16); // Hex: number of bytes
      dataLength = length * 2; // 1 byte = 2 hex chars
      rawValue = lengthIndicator + message.substring(pos + 4, pos + 4 + dataLength);
    }
  } else if (fieldDef.lengthType === LengthType.LLLVAR) {
    const parsedLength = parseVariableLengthPrefix(message, pos, 3);
    lengthIndicator = parsedLength.lengthIndicator;
    dataLength = parsedLength.length * 2;
    rawValue = lengthIndicator + message.substring(
      pos + parsedLength.dataStartOffset,
      pos + parsedLength.dataStartOffset + dataLength
    );
  } else if (fieldDef.lengthType === LengthType.LLLLVAR || fieldDef.lengthType === LengthType.LLLLLVAR) {
    const digits = fieldDef.lengthType === LengthType.LLLLLVAR ? 5 : 4;
    const parsedLength = parseVariableLengthPrefix(message, pos, digits);
    lengthIndicator = parsedLength.lengthIndicator;
    dataLength = parsedLength.length * 2;
    rawValue = lengthIndicator + message.substring(
      pos + parsedLength.dataStartOffset,
      pos + parsedLength.dataStartOffset + dataLength
    );
  } else {
    // Fixed length
    if (fieldDef.type === FieldType.NUMERIC) {
      // For numeric fixed-length fields, check if data is hex-encoded ASCII
      // Hex-encoded ASCII: each digit is 1 byte (2 hex chars), e.g., "3030" = "00"
      // BCD: each digit is 1 nibble (1 hex char), e.g., "00" = "00"
      dataLength = getFixedNumericDataLength(message, pos, fieldDef.maxLength);
      rawValue = message.substring(pos, pos + dataLength);
    } else {
      // Other types
      dataLength = fieldDef.maxLength * 2;
      rawValue = '';
    }
  }

  // Extract data (only if rawValue is not already set)
  if (rawValue.length === 0) {
    if (pos + dataLength > message.length) {
      // Truncated field - take what's available
      rawValue = message.substring(pos, message.length);
    } else {
      rawValue = message.substring(pos, pos + dataLength);
    }
  }

  // Convert to display value
  const displayValue = convertToDisplayValue(rawValue, fieldDef.type, fieldDef.lengthType, fieldDef.number);

  return {
    number: fieldDef.number,
    name: fieldDef.name,
    rawValue: rawValue,
    displayValue: displayValue,
    length: rawValue.length / 2, // bytes
    type: fieldDef.type,
    lengthType: fieldDef.lengthType,
    isPresent: true
  };
}

/**
 * Parse Track 2 data (DE35)
 * Track 2 format: LLVAR + PAN + "=" + service code + expiration + discretionary data
 */
function parseTrack2Data(message: string, pos: number): ParsedField {
  // Parse length indicator - can be 2-char ASCII or 4-char hex
  let lengthHex: string;
  let length: number;
  let dataStartOffset: number;

  const twoCharLen = message.substring(pos, pos + 2);
  if (/^[0-9]{2}$/.test(twoCharLen)) {
    // ASCII length format (e.g., "20" = 20 chars)
    length = parseInt(twoCharLen, 10);
    lengthHex = twoCharLen;
    dataStartOffset = 2;
  } else {
    // Hex length format (4 hex chars = 2 bytes)
    lengthHex = message.substring(pos, pos + 4);
    length = parseInt(lengthHex, 16);
    dataStartOffset = 4;
  }

  // Extract Track 2 data
  const track2Hex = message.substring(pos + dataStartOffset, pos + dataStartOffset + length * 2);

  // Try to convert to ASCII for display
  let displayValue = track2Hex;
  try {
    const asciiValue = hexToAscii(track2Hex);
    // If it looks like valid Track 2 data, use ASCII
    if (/^\d{10,19}[=D]\d{4}/.test(asciiValue) || asciiValue.includes(';') || asciiValue.includes('=')) {
      displayValue = asciiValue;
    }
  } catch {
    // Keep hex
  }

  return {
    number: 35,
    name: 'Track 2 Data',
    rawValue: lengthHex + track2Hex,
    displayValue: displayValue,
    length: length,
    type: FieldType.TRACK2,
    lengthType: LengthType.LLVAR,
    isPresent: true
  };
}

function parseVariableLengthPrefix(
  message: string,
  pos: number,
  digits: 2 | 3 | 4 | 5
): { lengthIndicator: string; length: number; dataStartOffset: number } {
  if (digits === 3) {
    const binaryLengthCandidate = message.substring(pos, pos + 4);
    const binaryLength = parseInt(binaryLengthCandidate, 16);
    const availableDataLength = message.length - pos - 4;

    if (
      /^00[0-9A-Fa-f]{2}$/.test(binaryLengthCandidate) &&
      binaryLength > 0 &&
      binaryLength <= 999 &&
      binaryLength * 2 <= availableDataLength
    ) {
      return {
        lengthIndicator: binaryLengthCandidate,
        length: binaryLength,
        dataStartOffset: 4
      };
    }
  }

  const asciiHexLength = digits * 2;
  const asciiHexCandidate = message.substring(pos, pos + asciiHexLength);
  const decodedAsciiLength = hexToAscii(asciiHexCandidate);

  if (/^\d+$/.test(decodedAsciiLength) && decodedAsciiLength.length === digits) {
    return {
      lengthIndicator: asciiHexCandidate,
      length: parseInt(decodedAsciiLength, 10),
      dataStartOffset: asciiHexLength
    };
  }

  if (digits === 3) {
    const binaryLengthCandidate = message.substring(pos, pos + 4);
    const binaryLength = parseInt(binaryLengthCandidate, 16);
    const availableDataLength = message.length - pos - 4;

    if (
      /^[0-9A-Fa-f]{4}$/.test(binaryLengthCandidate) &&
      binaryLength > 0 &&
      binaryLength <= 999 &&
      binaryLength * 2 <= availableDataLength
    ) {
      return {
        lengthIndicator: binaryLengthCandidate,
        length: binaryLength,
        dataStartOffset: 4
      };
    }
  }

  const bcdCandidate = message.substring(pos, pos + digits);
  if (/^\d+$/.test(bcdCandidate) && bcdCandidate.length === digits) {
    return {
      lengthIndicator: bcdCandidate,
      length: parseInt(bcdCandidate, 10),
      dataStartOffset: digits
    };
  }

  const hexLengthChars = digits * 2;
  const hexCandidate = message.substring(pos, pos + hexLengthChars);
  if (/^[0-9A-Fa-f]+$/.test(hexCandidate) && hexCandidate.length === hexLengthChars) {
    return {
      lengthIndicator: hexCandidate,
      length: parseInt(hexCandidate, 16),
      dataStartOffset: hexLengthChars
    };
  }

  throw new Error(`Invalid ${digits}-digit variable length indicator`);
}

function absorbPrintableTrailingData(
  message: string,
  pos: number,
  parsedField: ParsedField
): ParsedField {
  const nextPos = pos + parsedField.rawValue.length;
  const trailingHex = message.substring(nextPos);

  if (!trailingHex || !isPrintableAsciiHex(trailingHex)) {
    return parsedField;
  }

  try {
    const { dataStartOffset } = parseVariableLengthPrefix(parsedField.rawValue + trailingHex, 0, 3);
    const rawValue = parsedField.rawValue + trailingHex;
    const dataHex = rawValue.substring(dataStartOffset);

    if (!isPrintableAsciiHex(dataHex)) {
      return parsedField;
    }

    return {
      ...parsedField,
      rawValue,
      displayValue: hexToAscii(dataHex),
      length: rawValue.length
    };
  } catch {
    return parsedField;
  }
}

/**
 * Parse ICC/EMV data (DE55)
 * Format: LLLVAR + TLV tags
 */
function parseICCData(message: string, pos: number): ParsedField {
  const { lengthIndicator, length, dataStartOffset } = parseVariableLengthPrefix(message, pos, 3);
  const availableDataLength = Math.max(0, message.length - pos - dataStartOffset);
  const dataLength = Math.min(length * 2, availableDataLength);
  const iccHex = message.substring(pos + dataStartOffset, pos + dataStartOffset + dataLength);

  return {
    number: 55,
    name: 'ICC Related Data',
    rawValue: lengthIndicator + iccHex,
    displayValue: formatTLVData(iccHex),
    length,
    type: FieldType.BINARY,
    lengthType: LengthType.LLLVAR,
    isPresent: true
  };
}

/**
 * Check if a string contains only valid hex characters
 */
function isHex(str: string): boolean {
  return /^[0-9A-Fa-f]+$/.test(str);
}

/**
 * Detect if the message is in mixed format (hex structure + ASCII data)
 */
function isMixedFormat(message: string): boolean {
  // Skip TPDU (10 chars) + MTI (4 chars) + Bitmap (16 chars) = 30 chars
  const dataStart = 30;
  if (message.length <= dataStart) return false;

  // Check if the data portion contains non-hex characters
  const dataPortion = message.substring(dataStart);
  return !isHex(dataPortion);
}

/**
 * Parse field from message, handling both hex and mixed formats
 */
function parseFieldMixed(
  message: string,
  pos: number,
  fieldDef: FieldDefinition,
  isMixed: boolean
): ParsedField {
  if (pos >= message.length) {
    throw new Error('Unexpected end of message');
  }

  let dataLength = 0;
  let rawValue = '';
  let lengthIndicator = '';

  if (fieldDef.number === 63) {
    const shiftedLengthIndicator = message.substring(pos + 2, pos + 6);
    const shiftedLength = parseInt(shiftedLengthIndicator, 16);
    const availableDataLength = message.length - pos - 6;

    if (
      isPrintableAsciiHex(message.substring(pos, pos + 2)) &&
      /^00[0-9A-Fa-f]{2}$/.test(shiftedLengthIndicator) &&
      shiftedLength > 0 &&
      shiftedLength <= 999 &&
      shiftedLength * 2 <= availableDataLength
    ) {
      const valueHex = message.substring(pos + 6, pos + 6 + shiftedLength * 2);
      const rawValue = shiftedLengthIndicator + valueHex;

      return {
        number: fieldDef.number,
        name: fieldDef.name,
        rawValue,
        displayValue: hexToAscii(valueHex),
        length: rawValue.length,
        type: fieldDef.type,
        lengthType: fieldDef.lengthType,
        isPresent: true,
        consumedLength: 2 + rawValue.length
      };
    }
  }

  if (fieldDef.number === 41) {
    const possibleLength = parseInt(message.substring(pos, pos + 2), 10);
    const possibleValue = message.substring(pos + 2, pos + 2 + possibleLength * 2);

    if (
      possibleLength > fieldDef.maxLength &&
      possibleLength <= 16 &&
      possibleValue.length === possibleLength * 2 &&
      isPrintableAsciiHex(possibleValue)
    ) {
      const rawValue = message.substring(pos, pos + 2 + possibleLength * 2);

      return {
        number: fieldDef.number,
        name: fieldDef.name,
        rawValue,
        displayValue: hexToAscii(possibleValue),
        length: rawValue.length,
        type: fieldDef.type,
        lengthType: LengthType.LLVAR,
        isPresent: true
      };
    }
  }

  // Parse length if variable
  if (fieldDef.lengthType === LengthType.LLVAR) {
    // Handle different field types for LLVAR (2-byte length indicator)
    if (isMixed && (fieldDef.type === FieldType.ALPHANUMERIC || fieldDef.type === FieldType.ALPHANUMERIC_SPECIAL)) {
      // Mixed format ALPHANUMERIC/ALPHANUMERIC_SPECIAL: length is in ASCII (2 chars)
      lengthIndicator = message.substring(pos, pos + 2);
      const length = parseInt(lengthIndicator, 10);
      const asciiData = message.substring(pos + 2, pos + 2 + length);
      rawValue = lengthIndicator + asciiData;
      return {
        number: fieldDef.number,
        name: fieldDef.name,
        rawValue: rawValue,
        displayValue: asciiData,
        length: rawValue.length,
        type: fieldDef.type,
        lengthType: fieldDef.lengthType,
        isPresent: true
      };
    } else if (fieldDef.type === FieldType.ALPHANUMERIC || fieldDef.type === FieldType.ALPHANUMERIC_SPECIAL) {
      // ALPHANUMERIC/ALPHANUMERIC_SPECIAL: check if length is in ASCII (2 digits) or hex (4 chars) format
      // First, check for hex-encoded ASCII length (4 hex chars = 2 ASCII bytes)
      if (message.length >= pos + 4) {
        const fourCharLen = message.substring(pos, pos + 4);
        const decodedFourChars = hexToAscii(fourCharLen);
        if (/^\d{2}$/.test(decodedFourChars)) {
          // Length is hex-encoded ASCII (e.g., "3230" = "20" = 20 bytes)
          const length = parseInt(decodedFourChars, 10);
          dataLength = length * 2; // Data is also hex-encoded ASCII
          lengthIndicator = fourCharLen;
          const actualDataLength = Math.min(dataLength, message.length - pos - 4);
          rawValue = lengthIndicator + message.substring(pos + 4, pos + 4 + actualDataLength);
        } else {
          // Check regular ASCII length (2 chars) or hex length (4 chars)
          const twoCharLen = message.substring(pos, pos + 2);
          if (/^[0-9]{2}$/.test(twoCharLen)) {
            // ASCII length format (e.g., "09" = 9 chars)
            const length = parseInt(twoCharLen, 10);
            // Check if the data looks like hex-encoded ASCII
            const sampleData = message.substring(pos + 2, pos + 2 + Math.min(4, message.length - pos - 2));
            if (/^(30|31|32|33|34|35|36|37|38|39|41|42|43|44|45|46|47|48|49|4A|4B|4C|4D|4E|4F|50|51|52|53|54|55|56|57|58|59|5A|61|62|63|64|65|66|67|68|69|6A|6B|6C|6D|6E|6F|70|71|72|73|74|75|76|77|78|79|7A)+$/i.test(sampleData)) {
              // Hex-encoded ASCII data: extract length * 2 hex chars
              dataLength = length * 2;
              lengthIndicator = twoCharLen;
              const actualDataLength = Math.min(dataLength, message.length - pos - 2);
              rawValue = lengthIndicator + message.substring(pos + 2, pos + 2 + actualDataLength);
            } else {
              // Plain ASCII data: extract length chars directly
              const actualLength = Math.min(length, message.length - pos - 2);
              const asciiData = message.substring(pos + 2, pos + 2 + actualLength);
              rawValue = twoCharLen + asciiData;
              return {
                number: fieldDef.number,
                name: fieldDef.name,
                rawValue: rawValue,
                displayValue: asciiData,
                length: rawValue.length,
                type: fieldDef.type,
                lengthType: fieldDef.lengthType,
                isPresent: true
              };
            }
          } else {
            // Hex length format (4 hex chars = 2 bytes)
            lengthIndicator = message.substring(pos, pos + 4);
            const length = parseInt(lengthIndicator, 16);
            dataLength = length * 2;
            rawValue = lengthIndicator + message.substring(pos + 4, pos + 4 + dataLength);
          }
        }
      } else {
        // Not enough data for length indicator
        rawValue = message.substring(pos);
      }
    } else if (fieldDef.type === FieldType.NUMERIC) {
      // NUMERIC: check if length is in ASCII (2 digits) or BCD/hex (4 chars) format
      const twoCharLen = message.substring(pos, pos + 2);
      if (/^[0-9]{2}$/.test(twoCharLen)) {
        // ASCII length format (e.g., "16" = 16 digits)
        const length = parseInt(twoCharLen, 10);
        dataLength = length * 2; // Data is hex-encoded ASCII (2 hex chars per digit)
        lengthIndicator = twoCharLen;
        // Don't read beyond message length
        const actualDataLength = Math.min(dataLength, message.length - pos - 2);
        rawValue = lengthIndicator + message.substring(pos + 2, pos + 2 + actualDataLength);
      } else {
        // BCD or hex length format (4 hex chars)
        lengthIndicator = message.substring(pos, pos + 4);
        if (/^[0-9A-Fa-f]{4}$/.test(lengthIndicator)) {
          const length = parseInt(lengthIndicator, 16);
          dataLength = length * 2;
          // Don't read beyond message length
          const actualDataLength = Math.min(dataLength, message.length - pos - 4);
          rawValue = lengthIndicator + message.substring(pos + 4, pos + 4 + actualDataLength);
        } else {
          throw new Error('Invalid length indicator format');
        }
      }
    } else {
      // Other types: length is in hex (4 hex chars = 2 bytes)
      lengthIndicator = message.substring(pos, pos + 4);
      const length = parseInt(lengthIndicator, 16);
      dataLength = length * 2;
      rawValue = lengthIndicator + message.substring(pos + 4, pos + 4 + dataLength);
    }
  } else if (fieldDef.lengthType === LengthType.LLLVAR) {
    // For numeric fields in this format, length is often 3 ASCII chars
    if (fieldDef.type === FieldType.NUMERIC) {
      // Check if length is in ASCII format (3 decimal digits)
      const threeCharLen = message.substring(pos, pos + 3);
      if (/^[0-9]{3}$/.test(threeCharLen)) {
        // ASCII length format (e.g., "091" = 91 digits)
        const length = parseInt(threeCharLen, 10);
        dataLength = length * 2; // Data is hex-encoded ASCII (2 hex chars per digit)
        lengthIndicator = threeCharLen;
        rawValue = lengthIndicator + message.substring(pos + 3, pos + 3 + dataLength);
      } else {
        // BCD or hex length format (6 hex chars)
        lengthIndicator = message.substring(pos, pos + 6);
        if (/^[0-9A-Fa-f]{6}$/.test(lengthIndicator)) {
          const length = parseInt(lengthIndicator, 16);
          dataLength = length * 2;
          rawValue = lengthIndicator + message.substring(pos + 6, pos + 6 + dataLength);
        } else {
          throw new Error('Invalid length indicator format');
        }
      }
    } else if (isMixed && fieldDef.type === FieldType.ALPHANUMERIC) {
      // Mixed format: length is in ASCII (3 chars)
      lengthIndicator = message.substring(pos, pos + 3);
      const length = parseInt(lengthIndicator, 10);
      const asciiData = message.substring(pos + 3, pos + 3 + length);
      rawValue = lengthIndicator + asciiData;
      return {
        number: fieldDef.number,
        name: fieldDef.name,
        rawValue: rawValue,
        displayValue: asciiData,
        length: rawValue.length,
        type: fieldDef.type,
        lengthType: fieldDef.lengthType,
        isPresent: true
      };
    } else {
      const parsedLength = parseVariableLengthPrefix(message, pos, 3);
      lengthIndicator = parsedLength.lengthIndicator;
      dataLength = parsedLength.length * 2;
      rawValue = lengthIndicator + message.substring(
        pos + parsedLength.dataStartOffset,
        pos + parsedLength.dataStartOffset + dataLength
      );
    }
  } else if (fieldDef.lengthType === LengthType.LLLLVAR || fieldDef.lengthType === LengthType.LLLLLVAR) {
    const digits = fieldDef.lengthType === LengthType.LLLLLVAR ? 5 : 4;
    const parsedLength = parseVariableLengthPrefix(message, pos, digits);
    lengthIndicator = parsedLength.lengthIndicator;
    dataLength = parsedLength.length * 2;
    rawValue = lengthIndicator + message.substring(
      pos + parsedLength.dataStartOffset,
      pos + parsedLength.dataStartOffset + dataLength
    );
  } else {
    // Fixed length
    if (isMixed && fieldDef.type === FieldType.ALPHANUMERIC) {
      // Mixed format: extract ASCII directly
      dataLength = fieldDef.maxLength;
      const asciiData = message.substring(pos, pos + dataLength);
      rawValue = asciiData;
      return {
        number: fieldDef.number,
        name: fieldDef.name,
        rawValue: rawValue,
        displayValue: asciiData,
        length: rawValue.length,
        type: fieldDef.type,
        lengthType: fieldDef.lengthType,
        isPresent: true
      };
    } else if (fieldDef.type === FieldType.NUMERIC) {
      // For numeric fixed-length fields, determine if data is hex-encoded ASCII or BCD
      // Hex-encoded ASCII: each digit is 1 byte (2 hex chars), e.g., "3030" = "00"
      // BCD: each digit is 1 nibble (1 hex char), e.g., "00" = "00"

      dataLength = getFixedNumericDataLength(message, pos, fieldDef.maxLength, isMixed);
      rawValue = message.substring(pos, pos + dataLength);
    } else {
      // Hex format for other types
      dataLength = fieldDef.maxLength * 2;
      rawValue = message.substring(pos, pos + dataLength);
    }
  }

  // Convert to display value
  const displayValue = convertToDisplayValue(rawValue, fieldDef.type, fieldDef.lengthType, fieldDef.number);

  return {
    number: fieldDef.number,
    name: fieldDef.name,
    rawValue: rawValue,
    displayValue: displayValue,
    length: rawValue.length,
    type: fieldDef.type,
    lengthType: fieldDef.lengthType,
    isPresent: true
  };
}

/**
 * Convert raw hex to display value based on field type
 * Handles both pure hex and mixed ASCII/hex formats
 */
function convertToDisplayValue(
  hex: string,
  type: FieldType,
  lengthType: LengthType,
  fieldNumber?: number
): string {
  if (!hex) return '';

  // Remove length indicator for display
  let dataHex = hex;
  if (lengthType === LengthType.LLVAR && hex.length > 2) {
    let len: number;
    let lenBytes: number; // How many bytes the length indicator takes

    if (type === FieldType.NUMERIC) {
      // For numeric fields, length can be 2-char ASCII (e.g., "16") or 4-char BCD/hex
      const twoCharLen = hex.substring(0, 2);
      if (/^[0-9]{2}$/.test(twoCharLen)) {
        // 2-char ASCII length
        len = parseInt(twoCharLen, 10);
        lenBytes = 2;
        dataHex = hex.substring(2, 2 + len * 2); // Data is hex-encoded ASCII (2 hex per digit)
      } else {
        // 4-char BCD/hex length
        const lenHex = hex.substring(0, 4);
        if (!/[A-Fa-f]/.test(lenHex)) {
          len = parseInt(lenHex, 10); // BCD: number of digits
        } else {
          len = parseInt(lenHex, 16); // Hex: number of digits
        }
        lenBytes = 4;
        dataHex = hex.substring(4, 4 + len * 2);
      }
    } else {
      // Alphanumeric: check if length is hex-encoded ASCII (4 chars), 2-char ASCII, or 4-char hex
      const fourCharLen = hex.substring(0, 4);
      const decodedFourChars = hexToAscii(fourCharLen);
      if (/^\d{2}$/.test(decodedFourChars)) {
        // Hex-encoded ASCII length (e.g., "3230" = "20" = 20 bytes)
        len = parseInt(decodedFourChars, 10);
        lenBytes = 4;
        dataHex = hex.substring(4, 4 + len * 2); // Data is also hex-encoded ASCII
      } else {
        const twoCharLen = hex.substring(0, 2);
        if (/^[0-9]{2}$/.test(twoCharLen)) {
          // 2-char ASCII length (e.g., "09" = 9 chars)
          len = parseInt(twoCharLen, 10);
          lenBytes = 2;
          // Check if data is hex-encoded ASCII (2 hex chars per char) or plain ASCII
          const sampleData = hex.substring(2, 2 + Math.min(4, hex.length - 2));
          if (/^(30|31|32|33|34|35|36|37|38|39)+$/i.test(sampleData)) {
            // Hex-encoded ASCII: data is 2 hex chars per char
            dataHex = hex.substring(2, 2 + len * 2);
          } else {
            const hexEncodedData = hex.substring(2, 2 + len * 2);
            if (hexEncodedData.length === len * 2 && isPrintableAsciiHex(hexEncodedData)) {
              dataHex = hexEncodedData;
            } else {
              // Plain ASCII: data is 1 char per char
              dataHex = hex.substring(2, 2 + len);
            }
          }
        } else {
          // 4-char hex length
          const lenHex = hex.substring(0, 4);
          len = parseInt(lenHex, 16); // Hex: number of bytes
          lenBytes = 4;
          dataHex = hex.substring(4, 4 + len * 2);
        }
      }
    }
  } else if (lengthType === LengthType.LLLVAR && hex.length > 3) {
    let len: number;
    let lenBytes: number; // How many bytes the length indicator takes

    if (type === FieldType.NUMERIC) {
      // For numeric fields, length can be 3-char ASCII (e.g., "091") or 6-char BCD/hex
      const threeCharLen = hex.substring(0, 3);
      if (/^[0-9]{3}$/.test(threeCharLen)) {
        // 3-char ASCII length
        len = parseInt(threeCharLen, 10);
        lenBytes = 3;
        dataHex = hex.substring(3, 3 + len * 2); // Data is hex-encoded ASCII (2 hex per digit)
      } else {
        // 6-char BCD/hex length
        const lenHex = hex.substring(0, 6);
        if (!/[A-Fa-f]/.test(lenHex)) {
          len = parseInt(lenHex, 10); // BCD: number of digits
        } else {
          len = parseInt(lenHex, 16); // Hex: number of digits
        }
        lenBytes = 6;
        dataHex = hex.substring(6, 6 + len * 2);
      }
    } else {
      const parsedLength = parseVariableLengthPrefix(hex, 0, 3);
      len = parsedLength.length;
      lenBytes = parsedLength.dataStartOffset;
      dataHex = hex.substring(lenBytes, lenBytes + len * 2);
    }
  } else if (lengthType === LengthType.LLLLVAR && hex.length > 4) {
    const parsedLength = parseVariableLengthPrefix(hex, 0, 4);
    dataHex = hex.substring(parsedLength.dataStartOffset, parsedLength.dataStartOffset + parsedLength.length * 2);
  } else if (lengthType === LengthType.LLLLLVAR && hex.length > 5) {
    const parsedLength = parseVariableLengthPrefix(hex, 0, 5);
    dataHex = hex.substring(parsedLength.dataStartOffset, parsedLength.dataStartOffset + parsedLength.length * 2);
  }

  // Special handling for Track 2 data (DE35)
  if (fieldNumber === 35) {
    // Try to convert to ASCII if it looks like ASCII data
    if (!isHex(dataHex)) {
      return dataHex; // Already ASCII
    }
    const asciiValue = hexToAscii(dataHex);
    if (asciiValue.includes(';') || asciiValue.includes('=') || /^\d+[=D]/.test(asciiValue)) {
      return asciiValue;
    }
    return dataHex;
  }

  // Special handling for ICC data (DE55) - EMV TLV data
  if (fieldNumber === 55) {
    return formatTLVData(dataHex);
  }

  if (type === FieldType.NUMERIC) {
    // Numeric fields can be:
    // 1. BCD format (each hex char = 1 digit) - return as is
    // 2. Hex-encoded ASCII (2 hex chars = 1 digit) - convert to ASCII
    // Check if data is hex-encoded ASCII (pairs of hex chars that decode to digits '0'-'9')
    if (dataHex.length % 2 === 0 && /^[0-9A-Fa-f]+$/.test(dataHex)) {
      // Try to decode as ASCII and check if result is all digits
      const asciiValue = hexToAscii(dataHex);
      if (/^[0-9]+$/.test(asciiValue)) {
        dataHex = asciiValue; // Convert to decoded ASCII digits
        // Truncate to correct length for fixed-length fields
        if (lengthType === LengthType.FIXED) {
          // ISO 8583 fixed-length numeric field lengths
          const fixedLengths: Record<number, number> = {
            3: 6,   // Processing Code
            4: 12,  // Transaction Amount
            5: 12,  // Settlement Amount
            6: 12,  // Billing Amount
            7: 10,  // Transmission Date & Time
            8: 8,   // Billing Amount
            9: 8,   // Conversion Rate
            10: 8,  // Conversion Rate
            11: 6,  // STAN
            12: 6,   // Processing Time (Local)
            13: 4,  // Local Transaction Date
            14: 4,  // Expiration Date
            15: 6,  // Date Settlement
            16: 4,  // Conversion Date
            17: 4,  // Capture Date
            18: 4,  // Merchant Type
            22: 3,  // POS Entry Mode
            25: 2,  // POS Condition Code
            26: 2,  // POS PIN Capture Code
            32: 11, // Acquiring Institution ID Code
            33: 11, // Forwarding Institution ID Code
            35: 37, // Track 2 Data (max length)
            36: 104, // Track 3 Data (max length)
            37: 12, // Retrieval Reference Number
            38: 6,  // Authorization Code
            39: 2,  // Response Code
            40: 3,  // Service Code
            41: 8,  // Card Acceptor Terminal ID
            42: 15, // Card Acceptor ID Code
            43: 40, // Card Acceptor Name/Location
            44: 99, // Additional Response Data
            45: 75, // Track 1 Data (max length)
            48: 999, // Additional Data - Private (max length)
            49: 3,  // Currency Code
            50: 3,  // Currency Code
            51: 3,  // Currency Code
            52: 16, // PIN Data
            53: 16, // Security Related Control Information
            54: 120, // Additional Amounts (max length)
            55: 255, // ICC Related Data (max length)
            56: 35,  // Original Data Elements
            57: 999, // Reserved (max length)
            58: 100, // Reserved (max length)
            59: 999, // Reserved (max length)
            60: 999, // Reserved (max length)
            61: 15000, // Long Additional Data
            62: 999, // Reserved (max length)
            63: 999, // Reserved (max length)
            64: 8    // Message Authentication Code (MAC), displayed as 8 hex chars / 4 bytes
          };
          if (fieldNumber && fixedLengths[fieldNumber]) {
            dataHex = dataHex.substring(0, fixedLengths[fieldNumber]);
          }
        }
      }
    }

    // Special handling for Processing Code (DE3) - after numeric conversion
    if (fieldNumber === 3) {
      const desc = getProcessingCodeDescription(dataHex);
      return desc ? `${dataHex} (${desc})` : dataHex;
    }

    return dataHex;
  } else if (type === FieldType.BINARY) {
    return dataHex.toUpperCase();
  } else if (type === FieldType.ALPHANUMERIC || type === FieldType.ALPHANUMERIC_SPECIAL) {
    // For alphanumeric fields, check if it's already ASCII or needs hex-to-ASCII conversion
    if (!isHex(dataHex)) {
      return dataHex; // Already in ASCII format
    }
    // Convert hex to ASCII
    return hexToAscii(dataHex);
  } else if (type === FieldType.TRACK2) {
    // Track2 data - try ASCII first
    if (!isHex(dataHex)) {
      return dataHex;
    }
    return hexToAscii(dataHex);
  }

  return dataHex;
}

/**
 * Get description for ISO 8583 Processing Code (DE3)
 * Format: XXYYZZ where:
 *   XX = Transaction type (e.g., 00=Purchase, 31=Refund)
 *   YY = From account (e.g., 00=Cardholder, 10=Savings)
 *   ZZ = To account (e.g., 00=Cardholder, 10=Savings)
 */
function getProcessingCodeDescription(code: string): string {
  if (!code || code.length < 6) return '';

  const transactionType = code.substring(0, 2);
  const fromAccount = code.substring(2, 4);
  const toAccount = code.substring(4, 6);

  const transactionTypes: Record<string, string> = {
    '00': 'Purchase/Goods and Services',
    '01': 'Cash Advance',
    '02': 'Cashback',
    '03': 'Return/Refund',
    '10': 'Account Verification',
    '11': 'Quasi Cash',
    '20': 'Payment',
    '21': 'Payment Account Verification',
    '28': 'Prepaid Activation',
    '30': 'Balance Inquiry',
    '31': 'Refund',
    '40': 'Cash Deposit',
    '45': 'Cash Withdrawal',
    '52': 'PIN Change',
    '58': 'Reload',
    '70': 'Inquiry',
    '71': 'Transfer',
    '78': 'Card Activation',
    '79': 'Card Deactivation',
    '84': 'Lodging',
    '89': 'Card Replacement',
    '94': 'Credit Adjustment'
  };

  const accountTypes: Record<string, string> = {
    '00': 'Cardholder/Default',
    '10': 'Savings',
    '20': 'Checking',
    '30': 'Credit',
    '40': 'Universal',
    '50': 'Investment'
  };

  const transDesc = transactionTypes[transactionType];
  const fromDesc = accountTypes[fromAccount];
  const toDesc = accountTypes[toAccount];

  if (transDesc && fromDesc && toDesc) {
    return `${transDesc} (From: ${fromDesc}, To: ${toDesc})`;
  } else if (transDesc) {
    return transDesc;
  }

  return '';
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
  if (!hex || hex.length % 2 !== 0 || !/^[0-9A-Fa-f]+$/.test(hex)) return false;

  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (code < 32 || code > 126) {
      return false;
    }
  }

  return true;
}

function isAsciiNumericHex(hex: string): boolean {
  if (!hex || hex.length % 2 !== 0 || !/^[0-9A-Fa-f]+$/.test(hex)) return false;
  return /^[0-9]+$/.test(hexToAscii(hex));
}

function getFixedNumericDataLength(
  message: string,
  pos: number,
  digitLength: number,
  forceAscii: boolean = false
): number {
  const asciiHexLength = digitLength * 2;
  const asciiCandidate = message.substring(pos, pos + asciiHexLength);

  if (forceAscii || (asciiCandidate.length === asciiHexLength && isAsciiNumericHex(asciiCandidate))) {
    return asciiHexLength;
  }

  return digitLength;
}

/**
 * Convert ASCII to hex
 */
export function asciiToHex(ascii: string): string {
  let result = '';
  for (let i = 0; i < ascii.length; i++) {
    result += ascii.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
  }
  return result;
}

/**
 * Format ISO 8583 message for display
 */
export function formatISODisplay(result: ParseResult): string {
  const lines: string[] = [];

  lines.push(`MTI: ${result.mti} - ${result.mtiDescription}`);
  lines.push(`Primary Bitmap: ${formatBitmap(result.primaryBitmap)}`);

  if (result.secondaryBitmap) {
    lines.push(`Secondary Bitmap: ${formatBitmap(result.secondaryBitmap)}`);
  }

  lines.push(`Present Fields: ${result.presentFields.filter(f => f > 1).join(', ')}`);
  lines.push('');

  // Fields
  for (const fieldNum of result.presentFields) {
    if (fieldNum <= 1) continue;

    const field = result.fields[fieldNum];
    if (field) {
      lines.push(`[${String(fieldNum).padStart(3, '0')}] ${field.name}`);
      lines.push(`    Value: ${field.displayValue || '<empty>'}`);
      lines.push(`    Raw: ${field.rawValue}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format bitmap for display (space-separated bytes)
 */
export function formatBitmap(bitmap: string): string {
  return bitmap.match(/.{1,2}/g)?.join(' ') || bitmap;
}

/**
 * Create ISO 8583 message
 */
export function createISO8583(
  mti: string,
  fields: Record<number, string>
): string {
  // Build field list
  const fieldNumbers = Object.keys(fields).map(Number).filter(n => n > 0);

  // Create bitmap
  const bitmapHex = createBitmapHex(fieldNumbers);

  // Start message
  let message = mti + bitmapHex;

  // Add fields in order
  for (const fieldNum of fieldNumbers.sort((a, b) => a - b)) {
    const fieldDef = ISO8583_FIELD_DEFINITIONS[fieldNum];
    const value = fields[fieldNum];

    if (!fieldDef) continue;

    // Add length indicator if variable
    if (fieldDef.lengthType === LengthType.LLVAR) {
      const len = fieldDef.type === FieldType.BINARY ? Math.ceil(value.length / 2) : value.length;
      message += len.toString().padStart(2, '0');
    } else if (fieldDef.lengthType === LengthType.LLLVAR) {
      const len = fieldDef.type === FieldType.BINARY ? Math.ceil(value.length / 2) : value.length;
      message += len.toString().padStart(3, '0');
    } else if (fieldDef.lengthType === LengthType.LLLLVAR) {
      const len = Math.ceil(value.length / 2);
      message += len.toString().padStart(4, '0');
    } else if (fieldDef.lengthType === LengthType.LLLLLVAR) {
      const len = fieldDef.type === FieldType.BINARY ? Math.ceil(value.length / 2) : value.length;
      message += len.toString().padStart(5, '0');
    }

    // Add value
    message += value;
  }

  return message;
}

/**
 * Validate ISO 8583 message structure
 */
export function validateISO8583(
  message: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const cleanHex = message.replace(/\s/g, '');

  if (cleanHex.length < 20) {
    errors.push('Message too short');
  }

  // Check MTI format
  const mti = cleanHex.substring(0, 4);
  if (!/^[0-9A-Fa-f]{4}$/.test(mti)) {
    errors.push('Invalid MTI format');
  }

  // Check bitmap format
  const bitmap = cleanHex.substring(4, 20);
  if (!/^[0-9A-Fa-f]{16}$/.test(bitmap)) {
    errors.push('Invalid bitmap format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create ISO 8583 message
 */
