import CryptoJS from 'crypto-js';

export interface KCVResult {
  kcv: string;
  encryptedBlock: string;
  keyType: 'single' | 'double';
  k1?: string;
  k2?: string;
  debug?: string;
}

/**
 * Calculate Key Check Value (KCV) using 3DES encryption
 *
 * For single-length keys (8 bytes):
 * - Encrypt 8 bytes of zeros using DES ECB
 * - Return first 3 bytes
 *
 * For double-length keys (16 bytes):
 * - Split into K1 (first 8 bytes) and K2 (last 8 bytes)
 * - Encrypt 8 bytes of zeros using 3DES: E(K1) -> D(K2) -> E(K1)
 * - Return first 3 bytes
 *
 * @param keyHex - Key in hex format (8 or 16 bytes)
 * @returns KCV result with encrypted block and check value
 */
export function calculateKCV(keyHex: string): KCVResult {
  const cleanKey = keyHex.replace(/\s/g, '').toUpperCase();

  if (!/^[0-9A-Fa-f]+$/.test(cleanKey)) {
    throw new Error('Key must be valid hexadecimal');
  }

  const keyBytes = cleanKey.length / 2;

  if (keyBytes !== 8 && keyBytes !== 16 && keyBytes !== 32) {
    throw new Error('Key must be 8, 16, or 32 bytes (16, 32, or 64 hex characters)');
  }

  // Data to encrypt: 8 bytes of zeros
  const zeroBlock = '0000000000000000';
  const dataWords = CryptoJS.enc.Hex.parse(zeroBlock);

  let encrypted: CryptoJS.lib.CipherParams;
  let keyType: 'single' | 'double';
  let k1: string | undefined;
  let k2: string | undefined;

  if (keyBytes === 8) {
    // Single DES key (8 bytes)
    keyType = 'single';
    const keyWords = CryptoJS.enc.Hex.parse(cleanKey);

    encrypted = CryptoJS.DES.encrypt(dataWords, keyWords, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.NoPadding
    });
  } else if (keyBytes === 16) {
    // Double-length 3DES key (16 bytes)
    keyType = 'double';
    k1 = cleanKey.substring(0, 16);
    k2 = cleanKey.substring(16, 32);

    const keyWords = CryptoJS.enc.Hex.parse(cleanKey);

    encrypted = CryptoJS.TripleDES.encrypt(dataWords, keyWords, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.NoPadding
    });
  } else {
    // Triple-length 3DES key (32 bytes)
    // For 32-byte keys, use K1, K2, K3 with E(K1) -> D(K2) -> E(K3)
    keyType = 'double';
    k1 = cleanKey.substring(0, 16);
    k2 = cleanKey.substring(16, 32);

    // CryptoJS handles 32-byte keys as triple-length 3DES
    const keyWords = CryptoJS.enc.Hex.parse(cleanKey);

    encrypted = CryptoJS.TripleDES.encrypt(dataWords, keyWords, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.NoPadding
    });
  }

  const encryptedBlock = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
  const kcv = encryptedBlock.substring(0, 6); // First 3 bytes = 6 hex chars

  return {
    kcv,
    encryptedBlock,
    keyType,
    k1,
    k2
  };
}

/**
 * Verify a KCV against a key
 *
 * @param keyHex - Key in hex format
 * @param expectedKCV - Expected KCV value (6 hex characters)
 * @returns true if KCV matches
 */
export function verifyKCV(keyHex: string, expectedKCV: string): boolean {
  const result = calculateKCV(keyHex);
  return result.kcv === expectedKCV.toUpperCase().replace(/\s/g, '');
}

/**
 * Format key with spaces for display
 */
export function formatKey(keyHex: string): string {
  const clean = keyHex.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,2}/g)?.join(' ') || clean;
}

/**
 * Format encrypted block into bytes for display
 */
export function formatEncryptedBlock(blockHex: string): string {
  return blockHex.match(/.{1,2}/g)?.join(' ') || blockHex;
}
