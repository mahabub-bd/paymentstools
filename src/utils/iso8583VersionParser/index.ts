/**
 * ISO 8583 Version-Aware Parser
 *
 * A comprehensive parser for ISO 8583 financial transaction messages
 * supporting versions 1987, 1993, 2003, and 2023.
 *
 * @example
 * ```ts
 * import { parseISO8583 } from './utils/iso8583VersionParser';
 *
 * const result = parseISO8583('0200322000000000000000000000000000000000012345678901234567...');
 * console.log(result.mti);           // '0200'
 * console.log(result.presentFields); // [2, 3, 4, 7, 11, 12, ...]
 * ```
 */

// Enums
export {
  FieldType,
  LengthType
} from '../iso8583VersionParser';

// Types
export type {
  FieldDefinition,
  ParseResult,
  ParsedField
} from '../iso8583VersionParser';

// EMV TLV Types
export type {
  EMVTagDefinition,
  TLVData,
  EMVParseResult
} from './emv-tlv';

// EMV TLV Enums
export {
  EMVTagCategory
} from './emv-tlv';

// Constants
export {
  ISO8583_FIELD_DEFINITIONS
} from '../iso8583VersionParser';

// EMV Constants
export {
  EMV_TAG_DEFINITIONS
} from './emv-tlv';

// Main parsing functions
export {
  parseISO8583,
  parseBitmapFields,
  createBitmapHex
} from '../iso8583VersionParser';

// EMV TLV Parsing functions
export {
  parseEMVTLV,
  formatTLVData,
  formatTLVByCategory,
  getEMVTagDefinition,
  getEMVTagName,
  getEMVTagCategory,
  isConstructTag,
  groupTLVByCategory,
  hexToAscii as emvHexToAscii,
  isHex as emvIsHex
} from './emv-tlv';

// MTI and display functions
export {
  getMTIDescription,
  formatISODisplay,
  formatBitmap
} from '../iso8583VersionParser';

// Conversion utilities
export {
  hexToAscii,
  asciiToHex
} from '../iso8583VersionParser';

// Message creation and validation
export {
  createISO8583,
  validateISO8583
} from '../iso8583VersionParser';

// KCV Calculator
export {
  calculateKCV,
  verifyKCV,
  formatKey,
  formatEncryptedBlock
} from '../kcvCalculator';

export type { KCVResult } from '../kcvCalculator';
