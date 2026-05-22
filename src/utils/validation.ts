import { z } from 'zod';

// PAN validation helper (Luhn algorithm)
export const validatePANLuhn = (pan: string): boolean => {
  const cleanPan = pan.replace(/\s/g, '');

  if (!/^\d+$/.test(cleanPan) || cleanPan.length < 13 || cleanPan.length > 19) {
    return false;
  }

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
};

// PIK validation helper
export const validatePIK = (pik: string): boolean => {
  const cleanPik = pik.replace(/\s/g, '');

  // PIK must be 32 hex characters (16 bytes) for 3DES
  if (!/^[0-9A-Fa-f]{32}$/.test(cleanPik)) {
    return false;
  }

  return true;
};

// Zod schema for PIN Block Calculator form
export const pinBlockSchema = z.object({
  pan: z
    .string()
    .min(13, 'PAN must be at least 13 digits')
    .max(19, 'PAN must not exceed 19 digits')
    .regex(/^\d+(\s\d+)*$/, 'PAN must contain only digits and spaces')
    .refine((val) => validatePANLuhn(val), {
      message: 'Invalid PAN (failed Luhn check)',
    }),
  pin: z
    .string()
    .min(4, 'PIN must be at least 4 digits')
    .max(12, 'PIN must not exceed 12 digits')
    .regex(/^\d+$/, 'PIN must contain only digits'),
  pik: z
    .string()
    .min(32, 'PIK must be 32 hex characters (16 bytes)')
    .regex(/^[0-9A-Fa-f\s]+$/, 'PIK must contain only hexadecimal characters')
    .transform((val) => val.replace(/\s/g, '').toUpperCase())
    .refine((val) => val.length === 32, {
      message: 'PIK must be exactly 32 hex characters (16 bytes)',
    })
    .refine((val) => validatePIK(val), {
      message: 'Invalid PIK format',
    }),
});

export const defaultValues = {
  pan: '6244146000000137',
  pin: '609177',
  pik: '347302985D6D80F1466DBA08916DB3D6', // 32 hex chars, no spaces
};
