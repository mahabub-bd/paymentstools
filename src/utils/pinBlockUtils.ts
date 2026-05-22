import CryptoJS from 'crypto-js';

interface PinBlockResult {
  pinBlock: string;
  panBlock: string;
  xorResult: string;
  pinBlockFormatted: string;
  panBlockFormatted: string;
  xorResultFormatted: string;
}

/**
 * Calculate PIN Block Format 0 (ISO 0)
 * @param pan - Primary Account Number (card number)
 * @param pin - Personal Identification Number
 * @returns Object containing calculation steps and result
 */
export function calculatePinBlockFormat0(pan: string, pin: string): PinBlockResult {
  // Validate inputs
  if (!pan || !pin) {
    throw new Error('PAN and PIN are required');
  }

  // Remove spaces from PAN
  const cleanPan = pan.replace(/\s/g, '');

  if (cleanPan.length < 13) {
    throw new Error('PAN must be at least 13 digits');
  }

  if (!/^\d+$/.test(pin)) {
    throw new Error('PIN must contain only digits');
  }

  if (pin.length < 4 || pin.length > 12) {
    throw new Error('PIN must be between 4 and 12 digits');
  }

  // Step 1: Create PIN Block
  // Format: 0LLPPPP... (padded with F)
  const pinLength = pin.length.toString(16).padStart(2, '0').toUpperCase();
  const pinPadded = pin + 'F'.repeat(14 - pin.length);
  const pinBlock = '0' + pinLength + pinPadded;

  // Step 2: Create PAN Block
  // Remove check digit (last digit) and take rightmost 12 digits
  const panWithoutCheck = cleanPan.slice(0, -1);
  const panRight12 = panWithoutCheck.slice(-12).padStart(12, '0');
  const panBlock = '0000' + panRight12;

  // Step 3: XOR PIN Block with PAN Block
  const pinBlockInt = BigInt('0x' + pinBlock);
  const panBlockInt = BigInt('0x' + panBlock);
  const xorResult = (pinBlockInt ^ panBlockInt).toString(16).padStart(16, '0').toUpperCase();

  return {
    pinBlock: formatHex(pinBlock),
    panBlock: formatHex(panBlock),
    xorResult,
    pinBlockFormatted: formatHexBytes(pinBlock),
    panBlockFormatted: formatHexBytes(panBlock),
    xorResultFormatted: formatHexBytes(xorResult)
  };
}

/**
 * Encrypt PIN Block using 3DES (Triple DES) with PIK
 * @param pinBlockHex - PIN Block in hex format
 * @param pikHex - PIN Encryption Key in hex format (16 bytes = 32 hex chars)
 * @returns Encrypted PIN Block in hex format
 */
export function encryptPinBlock3DES(pinBlockHex: string, pikHex: string): string {
  // Validate inputs
  if (!pinBlockHex || !pikHex) {
    throw new Error('PIN Block and PIK are required');
  }

  // Clean inputs (remove spaces and convert to uppercase)
  const cleanPinBlock = pinBlockHex.replace(/\s/g, '').toUpperCase();
  const cleanPik = pikHex.replace(/\s/g, '').toUpperCase();

  if (cleanPinBlock.length !== 16) {
    throw new Error('PIN Block must be 8 bytes (16 hex characters)');
  }

  if (cleanPik.length !== 32) {
    throw new Error('PIK must be 16 bytes (32 hex characters) for 3DES');
  }

  // Convert hex to WordArray for CryptoJS
  const pinBlockWords = CryptoJS.enc.Hex.parse(cleanPinBlock);
  const pikWords = CryptoJS.enc.Hex.parse(cleanPik);

  // Perform 3DES ECB encryption
  const encrypted = CryptoJS.TripleDES.encrypt(pinBlockWords, pikWords, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.NoPadding
  });

  // Return encrypted result as hex string (uppercase)
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
}

/**
 * Decrypt PIN Block using 3DES (Triple DES) with PIK
 * @param encryptedPinBlockHex - Encrypted PIN Block in hex format
 * @param pikHex - PIN Encryption Key in hex format
 * @returns Decrypted PIN Block in hex format
 */
export function decryptPinBlock3DES(encryptedPinBlockHex: string, pikHex: string): string {
  const cleanEncrypted = encryptedPinBlockHex.replace(/\s/g, '').toUpperCase();
  const cleanPik = pikHex.replace(/\s/g, '').toUpperCase();

  const encryptedWords = CryptoJS.enc.Hex.parse(cleanEncrypted);
  const pikWords = CryptoJS.enc.Hex.parse(cleanPik);

  // Create CipherParams object for decryption
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: encryptedWords
  });

  const decrypted = CryptoJS.TripleDES.decrypt(cipherParams, pikWords, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.NoPadding
  });

  return decrypted.toString(CryptoJS.enc.Hex).toUpperCase();
}

/**
 * Format hex string with spaces for readability
 */
function formatHex(hex: string): string {
  return hex.match(/.{1,2}/g)?.join(' ') || hex;
}

/**
 * Format hex string as bytes with 0x prefix
 */
function formatHexBytes(hex: string): string {
  return hex.match(/.{1,2}/g)?.map(b => '0x' + b).join(' ') || hex;
}

/**
 * Validate PAN (Luhn algorithm)
 */
export function validatePAN(pan: string): boolean {
  const cleanPan = pan.replace(/\s/g, '');

  if (!/^\d+$/.test(cleanPan) || cleanPan.length < 13 || cleanPan.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleanPan.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanPan[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}
