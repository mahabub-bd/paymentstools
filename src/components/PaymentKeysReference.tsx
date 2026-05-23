import { useState, useEffect } from 'react';

// KCV Calculation Functions - Pure JavaScript DES/3DES Implementation
// =================================================================
// KCV (Key Check Value) is used to verify key integrity
// Standard: Encrypt block of 8 zero bytes with the key, take first 3-6 bytes of result

// DES S-boxes (from FIPS 46)
const SBOXES: number[][][] = [
  // S1
  [
    [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
    [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
    [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
    [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13]
  ],
  // S2
  [
    [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
    [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
    [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
    [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9]
  ],
  // S3
  [
    [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
    [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
    [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
    [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12]
  ],
  // S4
  [
    [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
    [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
    [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
    [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14]
  ],
  // S5
  [
    [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
    [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
    [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
    [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3]
  ],
  // S6
  [
    [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
    [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
    [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
    [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13]
  ],
  // S7
  [
    [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
    [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
    [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
    [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12]
  ],
  // S8
  [
    [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
    [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
    [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
    [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
  ]
];

// Permutation tables
const PC1_TABLE = [
  57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2,
  59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36, 63, 55, 47, 39,
  31, 23, 15, 7, 62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45, 37,
  29, 21, 13, 5, 28, 20, 12, 4
];

const PC2_TABLE = [
  14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4,
  26, 8, 16, 7, 27, 20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40,
  51, 45, 33, 48, 44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32
];

const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

const IP_TABLE = [
  58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7
];

const IP_INV_TABLE = [
  40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25
];

const E_TABLE = [
  32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11,
  12, 13, 12, 13, 14, 15, 16, 17, 16, 17, 18, 19, 20, 21, 20, 21,
  22, 23, 24, 25, 24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1
];

const P_TABLE = [
  16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10,
  2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25
];

// Helper functions
const permute = (input: number[], table: number[]): number[] => {
  return table.map(index => input[index - 1]);
};

const leftShift = (input: number[], shifts: number): number[] => {
  const left = input.slice(0, shifts);
  const right = input.slice(shifts);
  return [...right, ...left];
};

// Convert hex string to bit array (64 bits for DES key/block)
const hexToBits = (hex: string): number[] => {
  const cleanHex = hex.replace(/\s/g, '').toLowerCase();
  const bits: number[] = [];
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.substring(i, i + 2), 16);
    for (let j = 7; j >= 0; j--) {
      bits.push((byte >> j) & 1);
    }
  }
  return bits;
};

// Convert bit array to byte array
const bitsToBytes = (bits: number[]): number[] => {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  return bytes;
};

// Convert byte array to hex string
const bytesToHex = (bytes: number[]): string => {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
};

// DES key schedule
const desKeySchedule = (keyBits: number[]): number[][] => {
  const permutedKey = permute(keyBits, PC1_TABLE);
  let C = permutedKey.slice(0, 28);
  let D = permutedKey.slice(28);
  const subkeys: number[][] = [];

  for (let i = 0; i < 16; i++) {
    C = leftShift(C, SHIFTS[i]);
    D = leftShift(D, SHIFTS[i]);
    const combined = [...C, ...D];
    subkeys.push(permute(combined, PC2_TABLE));
  }

  return subkeys;
};

// DES F function
const desF = (R: number[], subkey: number[]): number[] => {
  const expandedR = permute(R, E_TABLE);
  const xored = expandedR.map((bit, i) => bit ^ subkey[i]);

  const output: number[] = [];
  for (let i = 0; i < 8; i++) {
    const nibble = xored.slice(i * 6, (i + 1) * 6);
    const row = (nibble[0] << 1) | nibble[5];
    const col = (nibble[1] << 3) | (nibble[2] << 2) | (nibble[3] << 1) | nibble[4];
    const sboxValue = SBOXES[i][row][col];
    for (let j = 3; j >= 0; j--) {
      output.push((sboxValue >> j) & 1);
    }
  }

  return permute(output, P_TABLE);
};

// Single DES encryption/decryption
const desCipher = (block: number[], subkeys: number[][], decrypt = false): number[] => {
  const permutedBlock = permute(block, IP_TABLE);
  let L = permutedBlock.slice(0, 32);
  let R = permutedBlock.slice(32);

  const keys = decrypt ? [...subkeys].reverse() : subkeys;

  for (let i = 0; i < 16; i++) {
    const temp = R;
    R = L.map((bit, j) => bit ^ desF(R, keys[i])[j]);
    L = temp;
  }

  const combined = [...R, ...L];
  return permute(combined, IP_INV_TABLE);
};

// Single DES KCV calculation
const calculateDES_KCV = (keyHex: string): string => {
  const cleanKey = keyHex.replace(/\s/g, '').toLowerCase();
  if (cleanKey.length !== 16) {
    throw new Error('DES key must be 16 hex digits (8 bytes)');
  }

  const keyBits = hexToBits(cleanKey);
  const subkeys = desKeySchedule(keyBits);

  // Encrypt 8 zero bytes
  const zeroBlock = new Array(64).fill(0);
  const encryptedBits = desCipher(zeroBlock, subkeys);
  const encryptedBytes = bitsToBytes(encryptedBits);

  // KCV is first 3 bytes for single DES
  return bytesToHex(encryptedBytes.slice(0, 3));
};

// Triple DES (3DES / EDE) KCV calculation
// Multiple methods for different HSM vendors:
// Method 1: Single DES with K1, 3 bytes
// Method 2: Full 3DES-EDE, 3 bytes
const calculate3DES_KCV = (keyHex: string, method: 'k1-only' | 'full-ede' = 'k1-only'): string => {
  const cleanKey = keyHex.replace(/\s/g, '').toLowerCase();

  if (cleanKey.length !== 32 && cleanKey.length !== 48) {
    throw new Error('3DES key must be 32 or 48 hex digits (16 or 24 bytes)');
  }

  // Parse key components
  const k1Hex = cleanKey.substring(0, 16);
  const k2Hex = cleanKey.substring(16, 32);
  const k3Hex = cleanKey.length === 48 ? cleanKey.substring(32, 48) : k1Hex;

  const k1Bits = hexToBits(k1Hex);
  const k2Bits = hexToBits(k2Hex);
  const k3Bits = hexToBits(k3Hex);

  const k1Subkeys = desKeySchedule(k1Bits);
  const k2Subkeys = desKeySchedule(k2Bits);
  const k3Subkeys = desKeySchedule(k3Bits);

  // Encrypt 8 zero bytes
  const zeroBlock = new Array(64).fill(0);
  let encryptedBytes: number[];

  if (method === 'k1-only') {
    // Method 1: Single DES with K1 only, 3 bytes
    const encryptedBits = desCipher(zeroBlock, k1Subkeys, false);
    encryptedBytes = bitsToBytes(encryptedBits);
    return bytesToHex(encryptedBytes.slice(0, 3));
  } else {
    // Method 2: Full 3DES-EDE, 3 bytes
    // EDE: K3(K2^-1(K1(block)))
    const stage1 = desCipher(zeroBlock, k1Subkeys, false);  // Encrypt with K1
    const stage2 = desCipher(stage1, k2Subkeys, true);       // Decrypt with K2
    const encryptedBits = desCipher(stage2, k3Subkeys, false); // Encrypt with K3
    encryptedBytes = bitsToBytes(encryptedBits);
    return bytesToHex(encryptedBytes.slice(0, 3));
  }
};

// AES KCV calculation using Web Crypto API (browser-supported)
const calculateAES_KCV = async (keyHex: string): Promise<string> => {
  const cleanKey = keyHex.replace(/\s/g, '').toLowerCase();
  const keyBytes = new Uint8Array(cleanKey.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));

  if (keyBytes.length !== 16 && keyBytes.length !== 24 && keyBytes.length !== 32) {
    throw new Error('AES key must be 16, 24, or 32 bytes (32, 48, or 64 hex digits)');
  }

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-ECB' },
      false,
      ['encrypt']
    );

    const plaintext = new Uint8Array(16);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-ECB' },
      cryptoKey,
      plaintext
    );

    const result = new Uint8Array(ciphertext);
    return bytesToHex(Array.from(result.subarray(0, 6)));
  } catch (error) {
    throw new Error('AES encryption not supported in this browser.');
  }
};

// Detect key type and calculate appropriate KCV
const calculateKCV = async (keyHex: string): Promise<{
  kcv: string;
  keyType: string;
  method: string;
  alternateMethods?: { name: string; kcv: string }[];
}> => {
  const cleanKey = keyHex.replace(/\s/g, '').toLowerCase();

  if (!/^[0-9a-f]+$/i.test(cleanKey)) {
    throw new Error('Key must be valid hexadecimal');
  }

  const length = cleanKey.length;

  if (length === 16) {
    // Single DES (8 bytes)
    const kcv = calculateDES_KCV(keyHex);
    return {
      kcv,
      keyType: 'Single DES (8 bytes)',
      method: 'DES(Key, 0x00)[0:3]'
    };
  } else if (length === 32) {
    // Double DES (16 bytes) - try multiple methods
    const kcvK1Only = calculate3DES_KCV(keyHex, 'k1-only');
    const kcvFullEde = calculate3DES_KCV(keyHex, 'full-ede');

    return {
      kcv: kcvFullEde,
      keyType: 'Double DES / 3DES (16 bytes)',
      method: '3DES-EDE(Key, 0x00)[0:3]',
      alternateMethods: [
        { name: 'Full 3DES-EDE (3 bytes)', kcv: kcvFullEde },
        { name: 'Single DES with K1 (3 bytes)', kcv: kcvK1Only }
      ]
    };
  } else if (length === 48) {
    // Triple DES (24 bytes)
    const kcvK1Only = calculate3DES_KCV(keyHex, 'k1-only');
    const kcvFullEde = calculate3DES_KCV(keyHex, 'full-ede');

    return {
      kcv: kcvFullEde,
      keyType: 'Triple DES (24 bytes)',
      method: '3DES-EDE(Key, 0x00)[0:3]',
      alternateMethods: [
        { name: 'Full 3DES-EDE (3 bytes)', kcv: kcvFullEde },
        { name: 'Single DES with K1 (3 bytes)', kcv: kcvK1Only }
      ]
    };
  } else if (length === 64) {
    // AES-256
    const kcv = await calculateAES_KCV(keyHex);
    return {
      kcv,
      keyType: 'AES-256 (32 bytes)',
      method: 'AES(Key, 0x00)[0:6]'
    };
  } else {
    throw new Error(`Unsupported key length: ${length} hex digits (${length / 2} bytes). Supported: 16 (DES), 32/48 (3DES), 64 (AES-256)`);
  }
};

type KCVDisplayResult = {
  kcv: string;
  keyType: string;
  method: string;
  error?: string;
};

type ComponentKCVResult = {
  component1?: KCVDisplayResult;
  component2?: KCVDisplayResult;
  final?: KCVDisplayResult & { combinedKey: string };
  error?: string;
};

const cleanHexInput = (value: string): string => value.replace(/\s/g, '').toUpperCase();

const sanitizeHexInput = (value: string): string => value.replace(/[^0-9A-Fa-f\s]/g, '').toUpperCase();

const getKeyLengthLabel = (value: string): string | null => {
  const length = cleanHexInput(value).length;

  if (length === 16) return 'Single DES (8 bytes)';
  if (length === 32) return 'Double DES / AES-128 (16 bytes)';
  if (length === 48) return 'Triple DES (24 bytes)';
  if (length === 64) return 'AES-256 (32 bytes)';

  return null;
};

const xorHexKeys = (leftHex: string, rightHex: string): string => {
  const left = cleanHexInput(leftHex);
  const right = cleanHexInput(rightHex);

  if (!left || !right) {
    throw new Error('Both components are required');
  }

  if (!/^[0-9A-F]+$/.test(left) || !/^[0-9A-F]+$/.test(right)) {
    throw new Error('Components must be valid hexadecimal');
  }

  if (left.length !== right.length) {
    throw new Error('Components must be the same length');
  }

  if (left.length % 2 !== 0) {
    throw new Error('Components must contain complete bytes');
  }

  let combined = '';
  for (let i = 0; i < left.length; i += 2) {
    const leftByte = parseInt(left.substring(i, i + 2), 16);
    const rightByte = parseInt(right.substring(i, i + 2), 16);
    combined += (leftByte ^ rightByte).toString(16).padStart(2, '0').toUpperCase();
  }

  return combined;
};

// Key hierarchy type
interface KeyHierarchyItem {
  name: string;
  description: string;
  level: number;
  color: string;
  keyLength: string;
  usage: string;
  flow: string;
  children?: string[];
  parents?: string[];
}

// Key hierarchy data
const KEY_HIERARCHIES: Record<string, KeyHierarchyItem> = {
  tmk: {
    name: 'TMK (Terminal Master Key)',
    description: 'Used to encrypt TPK for transmission to terminals',
    level: 1,
    color: 'from-red-500 to-red-700',
    children: ['tpk', 'tak'],
    keyLength: 'Double-length (32 hex digits / 128 bits)',
    usage: 'ATM/POS terminal key management',
    flow: 'TMK encrypts TPK during key exchange',
    parents: undefined
  },
  tpk: {
    name: 'TPK (Terminal PIN Key)',
    description: 'Working key for PIN block encryption/decryption',
    level: 2,
    color: 'from-orange-500 to-orange-700',
    parents: ['tmk'],
    keyLength: 'Single-length (16 hex) or Double-length (32 hex)',
    usage: 'PIN block encryption (0/1/6 formats)',
    flow: 'Encrypts customer PIN at terminal',
    children: undefined
  },
  tak: {
    name: 'TAK (Terminal Authentication Key)',
    description: 'Working key for MAC calculation and verification',
    level: 2,
    color: 'from-amber-500 to-amber-700',
    parents: ['tmk'],
    keyLength: 'Single-length (16 hex) or Double-length (32 hex)',
    usage: 'Message authentication (MAC)',
    flow: 'Generates MAC for transaction messages',
    children: undefined
  },
  zmk: {
    name: 'ZMK (Zone Master Key)',
    description: 'Used for key exchange between payment networks',
    level: 1,
    color: 'from-blue-500 to-blue-700',
    children: ['zpk', 'zak'],
    keyLength: 'Double-length (32 hex digits / 128 bits)',
    usage: 'Inter-network key exchange',
    flow: 'ZMK encrypts ZPK/ZAK for network transmission',
    parents: undefined
  },
  zpk: {
    name: 'ZPK (Zone PIN Key)',
    description: 'Working key for PIN block translation',
    level: 2,
    color: 'from-indigo-500 to-indigo-700',
    parents: ['zmk'],
    keyLength: 'Single-length (16 hex) or Double-length (32 hex)',
    usage: 'PIN block translation between networks',
    flow: 'Decrypts with one key, encrypts with another',
    children: undefined
  },
  zak: {
    name: 'ZAK (Zone Authentication Key)',
    description: 'Working key for network message authentication',
    level: 2,
    color: 'from-violet-500 to-violet-700',
    parents: ['zmk'],
    keyLength: 'Single-length (16 hex) or Double-length (32 hex)',
    usage: 'Network-level MAC generation/verification',
    flow: 'Secures inter-switch messages',
    children: undefined
  },
  lmk: {
    name: 'LMK (Local Master Key)',
    description: 'Master key stored in HSM for protecting other keys',
    level: 0,
    color: 'from-emerald-500 to-emerald-700',
    keyLength: 'Double-length (32 hex) or Triple-length (48 hex)',
    usage: 'HSM internal key encryption',
    flow: 'All working keys encrypted under LMK for storage',
    children: undefined,
    parents: undefined
  }
};

// Test keys from EFTlab
const TEST_KEYS = [
  {
    issuer: 'MasterCard',
    cardName: 'MTIP Test',
    authKey: '9E15204313F7318ACB79B90BD986AD29',
    macKey: '4664942FE615FB02E5D57F292AA2B3B6',
    dataKey: 'CE293B8CC12A977379EF256D76109492'
  },
  {
    issuer: 'VISA',
    cardName: 'ADVT Test',
    authKey: '2315208C9110AD402315208C9110AD40',
    macKey: '2315208C9110AD402315208C9110AD40',
    dataKey: '2315208C9110AD402315208C9110AD40'
  }
];

// Key format examples
const KEY_EXAMPLES = {
  tmk_tpk: {
    scenario: 'Terminal Key Exchange Process',
    steps: [
      '1. Host generates random TPK (working key)',
      '2. Host encrypts TPK under TMK',
      '3. Encrypted TPK sent to terminal securely',
      '4. Terminal decrypts TPK using TMK',
      '5. Terminal uses TPK for PIN encryption'
    ],
    formula: 'Enc_TPK = AES_TMK(TPK) or 3DES_TMK(TPK)'
  },
  zmk_zpk: {
    scenario: 'Network PIN Translation Process',
    steps: [
      '1. Acquiring network receives PIN block encrypted under TPK',
      '2. HSM decrypts PIN block using TPK',
      '3. HSM re-encrypts PIN block using ZPK',
      '4. PIN block forwarded to issuing network',
      '5. Issuing network decrypts using their ZPK'
    ],
    formula: 'PIN_ZPK = 3DES_ZPK(DECRYPT_3DES_TPK(PIN_TPK))'
  },
  lmk_storage: {
    scenario: 'Key Storage Under LMK',
    steps: [
      '1. Keys are encrypted under LMK before database storage',
      '2. LMK never leaves HSM (stored in secure module)',
      '3. Multiple LMK pairs (LMK 01-40) for different key types',
      '4. Working keys can be recovered by HSM using LMK',
      '5. LMK change requires re-encrypting all keys'
    ],
    formula: 'Stored_Key = 3DES_LMK(Working_Key)'
  }
};

const PaymentKeysReference = ({ className = '' }: { className?: string }) => {
  const [selectedView, setSelectedView] = useState<'hierarchy' | 'testkeys' | 'examples' | 'kcv'>('hierarchy');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [kcvInput, setKcvInput] = useState('');
  const [kcvResult, setKcvResult] = useState<KCVDisplayResult | null>(null);
  const [component1Input, setComponent1Input] = useState('');
  const [component2Input, setComponent2Input] = useState('');
  const [componentKcvResult, setComponentKcvResult] = useState<ComponentKCVResult | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCalculateKCV = async () => {
    if (!kcvInput.trim()) {
      setKcvResult(null);
      return;
    }

    try {
      const result = await calculateKCV(kcvInput);
      setKcvResult(result);
    } catch (err) {
      setKcvResult({ kcv: '', keyType: '', method: '', error: (err as Error).message });
    }
  };

  const handleCalculateComponentKCV = async () => {
    if (!component1Input.trim() && !component2Input.trim()) {
      setComponentKcvResult(null);
      return;
    }

    try {
      const component1 = component1Input.trim() ? await calculateKCV(component1Input) : undefined;
      const component2 = component2Input.trim() ? await calculateKCV(component2Input) : undefined;
      const combinedKey = xorHexKeys(component1Input, component2Input);
      const finalResult = await calculateKCV(combinedKey);

      setComponentKcvResult({
        component1,
        component2,
        final: {
          ...finalResult,
          combinedKey
        }
      });
    } catch (err) {
      setComponentKcvResult({ error: (err as Error).message });
    }
  };

  // Auto-calculate on input change
  useEffect(() => {
    if (kcvInput && selectedView === 'kcv') {
      handleCalculateKCV();
    } else if (!kcvInput) {
      setKcvResult(null);
    }
  }, [kcvInput, selectedView]);

  useEffect(() => {
    if ((component1Input || component2Input) && selectedView === 'kcv') {
      handleCalculateComponentKCV();
    } else if (!component1Input && !component2Input) {
      setComponentKcvResult(null);
    }
  }, [component1Input, component2Input, selectedView]);

  const renderHierarchy = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(KEY_HIERARCHIES).map(([id, key]) => (
          <div
            key={id}
            className={`relative overflow-hidden rounded-lg border-2 border-slate-200 dark:border-zinc-700 bg-gradient-to-br ${key.color} p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${
              selectedKey === id ? 'ring-2 ring-white ring-offset-2' : ''
            }`}
            onClick={() => setSelectedKey(selectedKey === id ? null : id)}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-white/20 backdrop-blur rounded text-xs font-bold text-white">
                  Level {key.level}
                </span>
                <h3 className="text-lg font-bold text-white">{key.name}</h3>
              </div>
              <p className="text-sm text-white/90 mb-3">{key.description}</p>
              <div className="space-y-1 text-xs text-white/80">
                <p><strong>Key Length:</strong> {key.keyLength}</p>
                <p><strong>Usage:</strong> {key.usage}</p>
              </div>
            </div>
            {selectedKey === id && (
              <div className="mt-3 pt-3 border-t border-white/30">
                <p className="text-xs text-white"><strong>Flow:</strong> {key.flow}</p>
                {key.parents && (
                  <p className="text-xs text-white mt-1"><strong>Parent:</strong> {key.parents.map(p => KEY_HIERARCHIES[p as keyof typeof KEY_HIERARCHIES]?.name).join(', ')}</p>
                )}
                {key.children && (
                  <p className="text-xs text-white mt-1"><strong>Children:</strong> {key.children.map(c => KEY_HIERARCHIES[c as keyof typeof KEY_HIERARCHIES]?.name).join(', ')}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key Flow Diagram */}
      <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Key Flow Diagram</h3>
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded font-mono">LMK</span>
            <span className="text-slate-400">→ protects all keys in HSM</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-mono">ZMK</span>
            <span className="text-slate-400">→ encrypts</span>
            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded font-mono">ZPK/ZAK</span>
            <span className="text-slate-400">→ for network transmission</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded font-mono">TMK</span>
            <span className="text-slate-400">→ encrypts</span>
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded font-mono">TPK/TAK</span>
            <span className="text-slate-400">→ for terminal distribution</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTestKeys = () => (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Test Keys Only:</strong> These keys are for testing purposes only. Never use production keys.
        </p>
      </div>
      {TEST_KEYS.map((keys, index) => (
        <div key={index} className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">
              {keys.issuer} - {keys.cardName}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between group">
              <label className="text-xs text-slate-500 dark:text-slate-400 w-24">Auth Key</label>
              <code className="flex-1 font-mono text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-black px-2 py-1 rounded border border-slate-200 dark:border-zinc-800">
                {keys.authKey}
              </code>
              <button
                onClick={() => handleCopy(keys.authKey, `auth-${index}`)}
                className="ml-2 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedKey === `auth-${index}` ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between group">
              <label className="text-xs text-slate-500 dark:text-slate-400 w-24">MAC Key</label>
              <code className="flex-1 font-mono text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-black px-2 py-1 rounded border border-slate-200 dark:border-zinc-800">
                {keys.macKey}
              </code>
              <button
                onClick={() => handleCopy(keys.macKey, `mac-${index}`)}
                className="ml-2 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedKey === `mac-${index}` ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between group">
              <label className="text-xs text-slate-500 dark:text-slate-400 w-24">Data Key</label>
              <code className="flex-1 font-mono text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-black px-2 py-1 rounded border border-slate-200 dark:border-zinc-800">
                {keys.dataKey}
              </code>
              <button
                onClick={() => handleCopy(keys.dataKey, `data-${index}`)}
                className="ml-2 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedKey === `data-${index}` ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderExamples = () => (
    <div className="space-y-4">
      {Object.entries(KEY_EXAMPLES).map(([id, example]) => (
        <div key={id} className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">{example.scenario}</h3>
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Process Flow:</p>
            <ol className="space-y-1">
              {example.steps.map((step, i) => (
                <li key={i} className="text-xs text-slate-600 dark:text-slate-300 pl-4 border-l-2 border-blue-300 dark:border-blue-700">
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="p-2 bg-black dark:bg-black rounded">
            <code className="text-xs font-mono text-green-400">{example.formula}</code>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Payment System Keys Reference
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          TMK, TPK, TAK, ZMK, ZPK, ZAK, LMK key hierarchy, usage, and KCV calculator
        </p>
      </div>

      {/* View Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedView('hierarchy')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedView === 'hierarchy'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          Key Hierarchy
        </button>
        <button
          onClick={() => setSelectedView('testkeys')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedView === 'testkeys'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          EMV Test Keys
        </button>
        <button
          onClick={() => setSelectedView('examples')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedView === 'examples'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          Usage Examples
        </button>
        <button
          onClick={() => setSelectedView('kcv')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedView === 'kcv'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          KCV Calculator
        </button>
      </div>

      {/* Content */}
      <div className="mb-6">
        {selectedView === 'hierarchy' && renderHierarchy()}
        {selectedView === 'testkeys' && renderTestKeys()}
        {selectedView === 'examples' && renderExamples()}
        {selectedView === 'kcv' && (
          <div className="space-y-4">
            {/* KCV Info Banner */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                <strong>KCV (Key Check Value)</strong> is used to verify key integrity during key exchange.
                Standard formula: Encrypt 8 zero bytes with the key, take first 3 bytes of result.
              </p>
            </div>

            {/* Input Section */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Enter Key (Hex)
              </label>
              <textarea
                value={kcvInput}
                onChange={(e) => setKcvInput(sanitizeHexInput(e.target.value))}
                placeholder="Enter your key in hex format (e.g., 0123456789ABCDEF or 0123456789ABCDEF0123456789ABCDEF)"
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[80px]"
                rows={3}
              />
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>Key length: {cleanHexInput(kcvInput).length} hex digits ({Math.floor(cleanHexInput(kcvInput).length / 2)} bytes)</span>
                {getKeyLengthLabel(kcvInput) && <span className="text-blue-600 dark:text-blue-400">{getKeyLengthLabel(kcvInput)}</span>}
              </div>
            </div>

            {/* Results */}
            {kcvResult && (
              <div className="space-y-3">
                {kcvResult.error ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      <strong>Error:</strong> {kcvResult.error}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* KCV Result */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Key Check Value (KCV)</p>
                          <p className="text-2xl font-mono font-bold text-green-700 dark:text-green-300">{kcvResult.kcv}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(kcvResult.kcv, 'kcv')}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title="Copy KCV"
                        >
                          {copiedKey === 'kcv' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Key Type and Method */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Key Type</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{kcvResult.keyType}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Calculation Method</p>
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{kcvResult.method}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Component KCV Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Two Component Final KCV</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                    Clear Component 1
                  </label>
                  <textarea
                    value={component1Input}
                    onChange={(e) => setComponent1Input(sanitizeHexInput(e.target.value))}
                    placeholder="Enter component 1 in hex"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[72px]"
                    rows={2}
                  />
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {cleanHexInput(component1Input).length} hex digits
                    {getKeyLengthLabel(component1Input) && <span className="ml-2 text-blue-600 dark:text-blue-400">{getKeyLengthLabel(component1Input)}</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                    Clear Component 2
                  </label>
                  <textarea
                    value={component2Input}
                    onChange={(e) => setComponent2Input(sanitizeHexInput(e.target.value))}
                    placeholder="Enter component 2 in hex"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 min-h-[72px]"
                    rows={2}
                  />
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {cleanHexInput(component2Input).length} hex digits
                    {getKeyLengthLabel(component2Input) && <span className="ml-2 text-blue-600 dark:text-blue-400">{getKeyLengthLabel(component2Input)}</span>}
                  </div>
                </div>
              </div>

              {componentKcvResult && (
                <div className="mt-4 space-y-3">
                  {componentKcvResult.error ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        <strong>Error:</strong> {componentKcvResult.error}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Component 1 KCV</p>
                          <p className="text-lg font-mono font-bold text-slate-700 dark:text-slate-200">{componentKcvResult.component1?.kcv || '-'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Component 2 KCV</p>
                          <p className="text-lg font-mono font-bold text-slate-700 dark:text-slate-200">{componentKcvResult.component2?.kcv || '-'}</p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Final Key KCV</p>
                              <p className="text-2xl font-mono font-bold text-green-700 dark:text-green-300">{componentKcvResult.final?.kcv}</p>
                            </div>
                            {componentKcvResult.final?.kcv && (
                              <button
                                onClick={() => handleCopy(componentKcvResult.final!.kcv, 'final-kcv')}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                title="Copy final KCV"
                              >
                                {copiedKey === 'final-kcv' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {componentKcvResult.final?.combinedKey && (
                        <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Final Clear Key (Component 1 XOR Component 2)</p>
                              <p className="font-mono text-sm text-slate-700 dark:text-slate-200 break-all">{componentKcvResult.final.combinedKey}</p>
                            </div>
                            <button
                              onClick={() => handleCopy(componentKcvResult.final!.combinedKey, 'final-key')}
                              className="shrink-0 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Copy final clear key"
                            >
                              {copiedKey === 'final-key' ? (
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* KCV Formulas Reference */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">KCV Formulas</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded font-mono text-[10px]">DES</span>
                  <div>
                    <p className="font-medium text-slate-600 dark:text-slate-400">Single DES (8 bytes)</p>
                    <code className="text-slate-500 dark:text-slate-500">KCV = DES(Key, 0x00 00 00 00 00 00 00 00)[0:3]</code>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-mono text-[10px]">3DES</span>
                  <div>
                    <p className="font-medium text-slate-600 dark:text-slate-400">Double/Triple DES (16/24 bytes)</p>
                    <code className="text-slate-500 dark:text-slate-500">KCV = 3DES(Key, 0x00 00 00 00 00 00 00 00)[0:3]</code>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded font-mono text-[10px]">AES</span>
                  <div>
                    <p className="font-medium text-slate-600 dark:text-slate-400">AES (16/32/64 bytes)</p>
                    <code className="text-slate-500 dark:text-slate-500">KCV = AES(Key, 0x00...00)[0:6]</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="font-medium text-red-600 dark:text-red-400 mb-1">TMK</p>
            <p className="text-slate-500 dark:text-slate-500">Terminal Master Key - protects keys sent to ATMs/POS</p>
          </div>
          <div>
            <p className="font-medium text-orange-600 dark:text-orange-400 mb-1">TPK/TAK</p>
            <p className="text-slate-500 dark:text-slate-500">Terminal working keys for PIN encryption & MAC</p>
          </div>
          <div>
            <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">ZMK</p>
            <p className="text-slate-500 dark:text-slate-500">Zone Master Key - inter-network key exchange</p>
          </div>
          <div>
            <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-1">LMK</p>
            <p className="text-slate-500 dark:text-slate-500">Local Master Key - HSM internal key protection</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentKeysReference;
