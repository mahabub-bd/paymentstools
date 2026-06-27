import { useCallback, useMemo, useState } from 'react';

type IadResult = {
  value: string;
  bytes: string[];
  declaredLength: number | null;
  applicationType: 'vsdc' | 'mchip' | 'ccd' | 'unknown';
  // General Data
  dki: string;
  cvn: string;
  cvnDecimal: number;
  sessionKeyInfo: string;
  countersInfo: string;
  // CVR Data
  cvr: string;
  cvrBits: CvrByte[];
  dacIccDynamicNumber?: string;
  countersAccumulators?: string;
  cumulativeOfflineAmount?: string;
  consecutiveOfflineTxn?: string;
  // VSDC specific
  iadFormat?: string;
  cvrLength?: number;
  iddOptionId?: string;
  vlpAvailableFunds?: string;
  ctta?: string;
  mac?: string;
  // CCD specific
  commonCoreIdentifier?: string;
  ccdCryptogramVersion?: string;
  ccdCounters?: string;
  issuerDiscretionaryData?: string;
};

type CvrByte = {
  index: number;
  value: string;
  bits: string[];
};

type CvrBitDefinition = {
  bytePosition: number;
  bit?: number;
  bits?: number[];
  label: string;
  description: string;
  decodeValue?: (byteValue: number) => string;
};

// VSDC CVR bit definitions (4 bytes)
const VSDC_CVR_BIT_DEFINITIONS: CvrBitDefinition[] = [
  // Byte 1
  { bytePosition: 1, bit: 8, label: 'b8', description: 'Cryptogram returned in second GENERATE AC (not requested)' },
  { bytePosition: 1, bit: 7, label: 'b7', description: 'Cryptogram returned in first GENERATE AC (ARQC)' },
  { bytePosition: 1, bit: 6, label: 'b6', description: 'Issuer Authentication performed and failed' },
  { bytePosition: 1, bit: 5, label: 'b5', description: 'Offline PIN verification performed' },
  { bytePosition: 1, bit: 4, label: 'b4', description: 'Offline PIN verification failed' },
  { bytePosition: 1, bit: 3, label: 'b3', description: 'Unable to go online' },
  { bytePosition: 1, bit: 2, label: 'b2', description: 'RFU' },
  { bytePosition: 1, bit: 1, label: 'b1', description: 'RFU' },
  // Byte 2
  { bytePosition: 2, bit: 8, label: 'b8', description: 'Last online transaction not completed' },
  { bytePosition: 2, bit: 7, label: 'b7', description: 'PIN Try Limit exceeded' },
  { bytePosition: 2, bit: 6, label: 'b6', description: 'Exceeded velocity checking counters' },
  { bytePosition: 2, bit: 5, label: 'b5', description: 'New card' },
  { bytePosition: 2, bit: 4, label: 'b4', description: 'Issuer Authentication failure on last online transaction' },
  { bytePosition: 2, bit: 3, label: 'b3', description: 'Issuer Authentication not performed after online authorization' },
  { bytePosition: 2, bit: 2, label: 'b2', description: 'Application blocked by card because PIN Try Limit exceeded' },
  { bytePosition: 2, bit: 1, label: 'b1', description: 'Offline static data authentication failed on last transaction' },
  // Byte 3
  { bytePosition: 3, bit: 8, label: 'b8', description: 'Number of Issuer Script Commands bit 3 (MSB)' },
  { bytePosition: 3, bit: 7, label: 'b7', description: 'Number of Issuer Script Commands bit 2' },
  { bytePosition: 3, bit: 6, label: 'b6', description: 'Number of Issuer Script Commands bit 1' },
  { bytePosition: 3, bit: 5, label: 'b5', description: 'Number of Issuer Script Commands bit 0 (LSB)' },
  { bytePosition: 3, bit: 4, label: 'b4', description: 'Issuer Script processing failed' },
  { bytePosition: 3, bit: 3, label: 'b3', description: 'Offline dynamic data authentication failed on last transaction' },
  { bytePosition: 3, bit: 2, label: 'b2', description: 'Offline dynamic data authentication performed' },
  { bytePosition: 3, bit: 1, label: 'b1', description: 'PIN verification command not received for a PIN-Expecting card' },
  // Byte 4 (RFU)
  { bytePosition: 4, bit: 8, label: 'b8', description: 'RFU' },
  { bytePosition: 4, bit: 7, label: 'b7', description: 'RFU' },
  { bytePosition: 4, bit: 6, label: 'b6', description: 'RFU' },
  { bytePosition: 4, bit: 5, label: 'b5', description: 'RFU' },
  { bytePosition: 4, bit: 4, label: 'b4', description: 'RFU' },
  { bytePosition: 4, bit: 3, label: 'b3', description: 'RFU' },
  { bytePosition: 4, bit: 2, label: 'b2', description: 'RFU' },
  { bytePosition: 4, bit: 1, label: 'b1', description: 'RFU' },
];

// Mastercard M/Chip CVR bit definitions
const MCHIP_CVR_BIT_DEFINITIONS: CvrBitDefinition[] = [
  // Byte 1
  { bytePosition: 1, bit: 8, label: 'b8', description: 'AC Returned In Second GENERATE AC (not requested)' },
  { bytePosition: 1, bit: 7, label: 'b7', description: 'AC Returned In First GENERATE AC (ARQC)' },
  { bytePosition: 1, bit: 6, label: 'b6', description: 'RFU' },
  { bytePosition: 1, bit: 5, label: 'b5', description: 'Offline PIN Verification Performed' },
  { bytePosition: 1, bit: 4, label: 'b4', description: 'Offline Encrypted PIN Verification Performed' },
  { bytePosition: 1, bit: 3, label: 'b3', description: 'Offline PIN Verification Successful' },
  { bytePosition: 1, bit: 2, label: 'b2', description: 'RFU' },
  { bytePosition: 1, bit: 1, label: 'b1', description: 'RFU' },
  // Byte 2
  { bytePosition: 2, bit: 8, label: 'b8', description: 'DDA Returned' },
  { bytePosition: 2, bit: 7, label: 'b7', description: 'Combined DDA/AC Generation Returned In First GENERATE AC' },
  { bytePosition: 2, bit: 6, label: 'b6', description: 'Combined DDA/AC Generation Returned In Second GENERATE AC' },
  { bytePosition: 2, bit: 5, label: 'b5', description: 'Issuer Authentication Performed' },
  { bytePosition: 2, bit: 4, label: 'b4', description: 'CIAC – Default Skipped On CAT3' },
  { bytePosition: 2, bit: 3, label: 'b3', description: 'RFU' },
  { bytePosition: 2, bit: 2, label: 'b2', description: 'RFU' },
  { bytePosition: 2, bit: 1, label: 'b1', description: 'RFU' },
  // Byte 3
  { bytePosition: 3, bit: 8, label: 'b8', description: 'Script Counter bit 3 (MSB)' },
  { bytePosition: 3, bit: 7, label: 'b7', description: 'Script Counter bit 2' },
  { bytePosition: 3, bit: 6, label: 'b6', description: 'Script Counter bit 1' },
  { bytePosition: 3, bit: 5, label: 'b5', description: 'Script Counter bit 0 (LSB)' },
  { bytePosition: 3, bit: 4, label: 'b4', description: 'PIN Try Counter bit 3 (MSB)' },
  { bytePosition: 3, bit: 3, label: 'b3', description: 'PIN Try Counter bit 2' },
  { bytePosition: 3, bit: 2, label: 'b2', description: 'PIN Try Counter bit 1' },
  { bytePosition: 3, bit: 1, label: 'b1', description: 'PIN Try Counter bit 0 (LSB)' },
  // Byte 4
  { bytePosition: 4, bit: 8, label: 'b8', description: 'RFU' },
  { bytePosition: 4, bit: 7, label: 'b7', description: 'Unable To Go Online Indicated' },
  { bytePosition: 4, bit: 6, label: 'b6', description: 'Offline PIN Verification Not Performed' },
  { bytePosition: 4, bit: 5, label: 'b5', description: 'Offline PIN Verification Failed' },
  { bytePosition: 4, bit: 4, label: 'b4', description: 'PTL Exceeded' },
  { bytePosition: 4, bit: 3, label: 'b3', description: 'International Transaction' },
  { bytePosition: 4, bit: 2, label: 'b2', description: 'Domestic Transaction' },
  { bytePosition: 4, bit: 1, label: 'b1', description: 'Terminal Erroneously Considers Offline PIN OK' },
  // Byte 5
  { bytePosition: 5, bit: 8, label: 'b8', description: 'Lower Consecutive Offline Limit Exceeded' },
  { bytePosition: 5, bit: 7, label: 'b7', description: 'Upper Consecutive Offline Limit Exceeded' },
  { bytePosition: 5, bit: 6, label: 'b6', description: 'Lower Cumulative Offline Limit Exceeded' },
  { bytePosition: 5, bit: 5, label: 'b5', description: 'Upper Cumulative Offline Limit Exceeded' },
  { bytePosition: 5, bit: 4, label: 'b4', description: 'Go Online On Next Transaction Was Set' },
  { bytePosition: 5, bit: 3, label: 'b3', description: 'Issuer Authentication Failed' },
  { bytePosition: 5, bit: 2, label: 'b2', description: 'Script Received' },
  { bytePosition: 5, bit: 1, label: 'b1', description: 'Script Failed' },
  // Byte 6
  { bytePosition: 6, bit: 8, label: 'b8', description: 'RFU' },
  { bytePosition: 6, bit: 7, label: 'b7', description: 'RFU' },
  { bytePosition: 6, bit: 6, label: 'b6', description: 'RFU' },
  { bytePosition: 6, bit: 5, label: 'b5', description: 'RFU' },
  { bytePosition: 6, bit: 4, label: 'b4', description: 'RFU' },
  { bytePosition: 6, bit: 3, label: 'b3', description: 'RFU' },
  { bytePosition: 6, bit: 2, label: 'b2', description: 'Match Found In Additional Check Table' },
  { bytePosition: 6, bit: 1, label: 'b1', description: 'No Match Found In Additional Check Table' },
];

// CCD CVR bit definitions
const CCD_CVR_BIT_DEFINITIONS: CvrBitDefinition[] = [
  // Byte 1
  { bytePosition: 1, bits: [8, 7], label: 'b8-b7', description: 'AC Returned In Second GENERATE AC (not requested)' },
  { bytePosition: 1, bits: [6, 5], label: 'b6-b5', description: 'AC Returned In First GENERATE AC (ARQC)' },
  { bytePosition: 1, bit: 4, label: 'b4', description: 'CDA Performed' },
  { bytePosition: 1, bit: 3, label: 'b3', description: 'Offline DDA Performed' },
  { bytePosition: 1, bit: 2, label: 'b2', description: 'Issuer Authentication Not Performed' },
  { bytePosition: 1, bit: 1, label: 'b1', description: 'Issuer Authentication Failed' },
  // Byte 2
  { bytePosition: 2, bits: [8, 7, 6, 5], label: 'b8-b5', description: 'PIN Try Counter', decodeValue: byteValue => ((byteValue & 0xF0) >> 4).toString() },
  { bytePosition: 2, bit: 4, label: 'b4', description: 'Offline PIN Verification Performed' },
  { bytePosition: 2, bit: 3, label: 'b3', description: 'Offline PIN Verification Performed and PIN Not Successfully Verified' },
  { bytePosition: 2, bit: 2, label: 'b2', description: 'PIN Try Limit Exceeded' },
  { bytePosition: 2, bit: 1, label: 'b1', description: 'Last Online Transaction Not Completed' },
  // Byte 3
  { bytePosition: 3, bit: 8, label: 'b8', description: 'Lower Offline Transaction Count Limit Exceeded' },
  { bytePosition: 3, bit: 7, label: 'b7', description: 'Upper Offline Transaction Count Limit Exceeded' },
  { bytePosition: 3, bit: 6, label: 'b6', description: 'Lower Cumulative Offline Amount Limit Exceeded' },
  { bytePosition: 3, bit: 5, label: 'b5', description: 'Upper Cumulative Offline Amount Limit Exceeded' },
  { bytePosition: 3, bit: 4, label: 'b4', description: 'Issuer-discretionary bit 1' },
  { bytePosition: 3, bit: 3, label: 'b3', description: 'Issuer-discretionary bit 2' },
  { bytePosition: 3, bit: 2, label: 'b2', description: 'Issuer-discretionary bit 3' },
  { bytePosition: 3, bit: 1, label: 'b1', description: 'Issuer-discretionary bit 4' },
  // Byte 4
  { bytePosition: 4, bits: [8, 7, 6, 5], label: 'b8-b5', description: 'Number of Successfully Processed Issuer Script Commands', decodeValue: byteValue => ((byteValue & 0xF0) >> 4).toString() },
  { bytePosition: 4, bit: 4, label: 'b4', description: 'Issuer Script Processing Failed' },
  { bytePosition: 4, bit: 3, label: 'b3', description: 'Offline Data Authentication Failed on Previous Transaction' },
  { bytePosition: 4, bit: 2, label: 'b2', description: 'Go Online on Next Transaction was set' },
  { bytePosition: 4, bit: 1, label: 'b1', description: 'Unable to go Online' },
  // Byte 5
  { bytePosition: 5, bit: 8, label: 'b8', description: 'RFU' },
  { bytePosition: 5, bit: 7, label: 'b7', description: 'RFU' },
  { bytePosition: 5, bit: 6, label: 'b6', description: 'RFU' },
  { bytePosition: 5, bit: 5, label: 'b5', description: 'RFU' },
  { bytePosition: 5, bit: 4, label: 'b4', description: 'RFU' },
  { bytePosition: 5, bit: 3, label: 'b3', description: 'RFU' },
  { bytePosition: 5, bit: 2, label: 'b2', description: 'RFU' },
  { bytePosition: 5, bit: 1, label: 'b1', description: 'RFU' },
];

const EXAMPLES = [
  { value: '06011203A000000F0300001030800000046920AE952C48', label: 'Visa VSDC (CVN 18)' },
  { value: '06000A03A08800', label: 'VSDC (CVN 10)' },
  { value: '0110A04003223000000000001126980002FF', label: 'Mastercard M/Chip 4' },
  { value: '0FA526A83100000000000001500000000F240000000000000000000000000000', label: 'CCD-Compliant' },
  { value: '9F10 06 06000A03A08800', label: 'VSDC TLV' },
];

const parseIadInput = (input: string) => {
  const hex = input.toUpperCase().replace(/[^0-9A-F]/g, '');

  if (!hex.startsWith('9F10')) {
    return {
      value: hex.slice(0, 64),
      declaredLength: null,
    };
  }

  const body = hex.slice(4);
  if (body.length < 2) {
    return { value: '', declaredLength: null };
  }

  const firstLengthByte = parseInt(body.slice(0, 2), 16);
  let length = firstLengthByte;
  let valueOffset = 2;

  if (firstLengthByte === 0x81 && body.length >= 4) {
    length = parseInt(body.slice(2, 4), 16);
    valueOffset = 4;
  } else if (firstLengthByte === 0x82 && body.length >= 6) {
    length = parseInt(body.slice(2, 6), 16);
    valueOffset = 6;
  }

  return {
    value: body.slice(valueOffset, valueOffset + length * 2),
    declaredLength: length,
  };
};

const getSessionKeyInfo = (cvn: number): string => {
  switch (cvn) {
    case 0x0A:
      return 'Mastercard Proprietary SKD session key';
    case 0x10:
      return 'Mastercard Proprietary SKD session key';
    case 0x12:
      return 'ICC Dynamic Number';
    case 0x14:
      return 'Mastercard Proprietary SKD session key';
    case 0x31:
      return 'Session key derived according to CCD specification';
    default:
      return 'Unknown';
  }
};

const getCountersInfo = (cvn: number): string => {
  switch (cvn) {
    case 0x0A:
    case 0x10:
      return 'Counters not included in AC data';
    case 0x12:
      return 'Counters included in AC data';
    case 0x14:
      return 'Counters not included in AC data';
    case 0x31:
      return 'Counters may be included';
    default:
      return 'Unknown';
  }
};

const detectApplicationType = (firstByte: string, cvn: number): 'vsdc' | 'mchip' | 'ccd' | 'unknown' => {
  // First byte indicates application type
  // 06 = VSDC, 01 = M/Chip 4, 0F = CCD-Compliant
  const firstByteNum = parseInt(firstByte, 16);
  if (firstByteNum === 0x06) return 'vsdc';
  if (firstByteNum === 0x01) return 'mchip';
  if (firstByteNum === 0x0F) return 'ccd';
  // Fallback to CVN-based detection
  if (cvn === 0x12) return 'vsdc';
  if (cvn === 0x0A || cvn === 0x10 || cvn === 0x14) return 'mchip';
  if (cvn === 0x31) return 'ccd';
  return 'unknown';
};

const decodeIad = (input: string): IadResult | null => {
  const parsed = parseIadInput(input);
  const value = parsed.value;

  if (value.length === 0 || value.length % 2 !== 0 || value.length > 64) return null;

  const bytes = value.match(/.{2}/g) || [];
  if (bytes.length < 2) return null;

  let dki: string;
  let cvn: string;
  let cvnNum: number;
  let applicationType: 'vsdc' | 'mchip' | 'ccd' | 'unknown';

  // Different parsing based on application type
  const firstByteNum = parseInt(bytes[0], 16);
  if (firstByteNum === 0x06 && bytes.length >= 3) {
    // VSDC: AppType | DKI/IADFormat | CVN | CVR length | CVR | IDD length | IDD
    applicationType = 'vsdc';
    dki = bytes[1];
    cvn = bytes[2];
    cvnNum = parseInt(cvn, 16);
  } else if (firstByteNum === 0x0F && bytes.length >= 3) {
    // CCD: AppType | Common Core Identifier | Derivation Key Index | CVR | Counters | IDD
    applicationType = 'ccd';
    dki = bytes[2];
    cvn = bytes[1];
    cvnNum = parseInt(cvn, 16);
  } else {
    // Other formats: DKI | CVN | CVR(4) | ...
    dki = bytes[0];
    cvn = bytes[1];
    cvnNum = parseInt(cvn, 16);
    applicationType = detectApplicationType(bytes[0], cvnNum);
  }

  // CVR parsing depends on application type
  let cvrBytes: string[] = [];
  let cvr = '';

  if (applicationType === 'vsdc' && bytes.length >= 4) {
    const cvrLength = parseInt(bytes[3], 16);
    cvrBytes = bytes.slice(4, Math.min(bytes.length, 4 + cvrLength));
    cvr = cvrBytes.join('');
  } else if (applicationType === 'mchip' && bytes.length >= 8) {
    // M/Chip: DKI | CVN | CVR(6) | DAC/ICC Dynamic Number(2) | Counters/Accumulators(8)
    cvrBytes = bytes.slice(2, 8);
    cvr = cvrBytes.join('');
  } else if (applicationType === 'ccd' && bytes.length >= 8) {
    // CCD: AppType | CCI | DKI | CVR(5) | Counters(8) | IDD
    cvrBytes = bytes.slice(3, 8);
    cvr = cvrBytes.join('');
  } else {
    cvrBytes = bytes.slice(2, Math.min(bytes.length, 6));
    cvr = cvrBytes.join('');
  }

  const cvrBits: CvrByte[] = cvrBytes.map((byte, index) => ({
    index: index + 1,
    value: byte,
    bits: parseInt(byte, 16).toString(2).padStart(8, '0').split(''),
  }));

  const result: IadResult = {
    value,
    bytes,
    declaredLength: parsed.declaredLength,
    applicationType,
    dki,
    cvn,
    cvnDecimal: cvnNum,
    sessionKeyInfo: getSessionKeyInfo(cvnNum),
    countersInfo: getCountersInfo(cvnNum),
    cvr,
    cvrBits,
  };

  // Parse format-specific data
  if (applicationType === 'vsdc' && bytes.length >= 4) {
    // For VSDC samples, the second byte carries both the KDI and the format value.
    result.iadFormat = (parseInt(bytes[1], 16) & 0x0F).toString(16).toUpperCase();
    result.cvrLength = parseInt(bytes[3], 16);

    const iddLengthIndex = 4 + result.cvrLength;
    if (bytes.length > iddLengthIndex) {
      const iddLength = parseInt(bytes[iddLengthIndex], 16);
      const iddStart = iddLengthIndex + 1;
      const iddBytes = bytes.slice(iddStart, Math.min(bytes.length, iddStart + iddLength));

      if (iddBytes.length > 0) {
        result.issuerDiscretionaryData = bytes.slice(iddLengthIndex, iddStart + iddLength).join('');
        result.iddOptionId = iddBytes[0];
      }

      if (iddBytes.length >= 15) {
        result.vlpAvailableFunds = iddBytes.slice(1, 6).join('');
        result.ctta = iddBytes.slice(6, 11).join('');
        result.mac = iddBytes.slice(11, 15).join('');
      }
    }
  } else if (applicationType === 'mchip' && bytes.length >= 10) {
    // M/Chip: DKI + CVN + CVR(6) + DAC/ICC Dynamic Number(2) + Counters/Accumulators(8)
    result.dacIccDynamicNumber = bytes.slice(8, 10).join('');
    if (bytes.length >= 18) {
      result.countersAccumulators = bytes.slice(10, 18).join('');
      result.cumulativeOfflineAmount = bytes.slice(10, 16).join('');
      result.consecutiveOfflineTxn = bytes[16];
    }
  } else if (applicationType === 'ccd' && bytes.length >= 16) {
    // CCD: AppType + CCI + DKI + CVR(5) + Counters(8) + IDD length + IDD
    result.commonCoreIdentifier = bytes[1];
    result.ccdCryptogramVersion = bytes[1] === 'A5' ? 'Triple DES' : bytes[1];
    result.ccdCounters = bytes.slice(8, 16).join('');
    if (bytes.length > 16) {
      const iddLength = parseInt(bytes[16], 16);
      result.issuerDiscretionaryData = bytes.slice(17, Math.min(bytes.length, 17 + iddLength)).join('');
    }
  }

  return result;
};

const APPLICATION_LABELS: Record<string, string> = {
  vsdc: 'VSDC',
  mchip: 'M/Chip 4',
  ccd: 'CCD-Compliant',
  unknown: 'Unknown Application',
};

interface IadDecoderProps {
  className?: string;
}

type TabType = 'general' | 'cvr';

const IadDecoder = ({ className = '' }: IadDecoderProps) => {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<IadResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [selectedCvrByte, setSelectedCvrByte] = useState(1);

  const parsed = parseIadInput(input);
  const byteCount = parsed.value.length / 2;
  const isComplete = parsed.value.length > 0 && parsed.value.length % 2 === 0 && parsed.value.length <= 64;

  const selectedCvrData = useMemo(() => {
    if (!decoded || decoded.cvrBits.length === 0 || selectedCvrByte > decoded.cvrBits.length) return null;
    return decoded.cvrBits[selectedCvrByte - 1];
  }, [decoded, selectedCvrByte]);

  const cvrDefinitions = useMemo(() => {
    if (decoded?.applicationType === 'mchip') return MCHIP_CVR_BIT_DEFINITIONS;
    if (decoded?.applicationType === 'ccd') return CCD_CVR_BIT_DEFINITIONS;
    return VSDC_CVR_BIT_DEFINITIONS;
  }, [decoded?.applicationType]);

  const cvrBitDefinitions = useMemo(() => {
    if (!selectedCvrData) return [];
    return cvrDefinitions.filter(def => def.bytePosition === selectedCvrByte);
  }, [selectedCvrByte, selectedCvrData, cvrDefinitions]);

  const activeCvrFlags = useMemo(() => {
    if (!decoded) return [];

    return cvrDefinitions.filter((def) => {
      const cvrByte = decoded.cvrBits[def.bytePosition - 1];
      if (!cvrByte) return false;
      const bitPositions = def.bits ?? (def.bit ? [def.bit] : []);
      return bitPositions.some(bitPosition => cvrByte.bits[8 - bitPosition] === '1');
    });
  }, [decoded, cvrDefinitions]);

  const selectedCvrFlags = useMemo(() => (
    activeCvrFlags.filter(flag => flag.bytePosition === selectedCvrByte)
  ), [activeCvrFlags, selectedCvrByte]);

  const getActiveFlagCountForByte = useCallback((bytePosition: number) => (
    activeCvrFlags.filter(flag => flag.bytePosition === bytePosition).length
  ), [activeCvrFlags]);

  const handleDecode = useCallback(() => {
    setDecoded(decodeIad(input));
    setSelectedCvrByte(1);
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setDecoded(null);
  }, []);

  const handleExample = useCallback((value: string) => {
    setInput(value);
    setDecoded(decodeIad(value));
    setSelectedCvrByte(1);
  }, []);

  const getBitValue = (bitIndex: number): boolean => {
    if (!selectedCvrData) return false;
    const bitPosition = 8 - bitIndex;
    return selectedCvrData.bits[bitPosition] === '1';
  };

  const getDefinitionBitPositions = (definition: CvrBitDefinition): number[] => (
    definition.bits ?? (definition.bit ? [definition.bit] : [])
  );

  const getDecodedDescription = (definition: CvrBitDefinition, cvrByte?: CvrByte | null): string => {
    if (!definition.decodeValue || !cvrByte) return definition.description;
    const decodedValue = definition.decodeValue(parseInt(cvrByte.value, 16));
    return `${definition.description} (${decodedValue})`;
  };

  const renderFieldRow = (label: string, value: string) => (
    <tr className="border-b border-slate-100 dark:border-zinc-900">
      <td className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400">{label}</td>
      <td className="px-3 py-2 font-mono text-sm text-slate-800 dark:text-white">{value || 'N/A'}</td>
    </tr>
  );

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Tag 9F10 - Issuer Application Data (IAD) Decoder</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          The tool attempts to decode content of Issuer Application Data (Tag 9F10). Following applications can be recognized:
        </p>
        <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
          - Visa VSDC, demo - Mastercard M/Chip 4 or M/Chip Advance, demo - CCD-Compliant Application demo
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">IAD value</label>
        <div className="flex flex-col xl:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const next = e.target.value.toUpperCase().replace(/[^0-9A-Fa-f\s]/g, '');
                setInput(next);
                setDecoded(decodeIad(next));
                setSelectedCvrByte(1);
              }}
              placeholder="06010A03A00000 or 9F10 07 06010A03A00000"
              className="w-full pl-3 pr-16 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[11px] font-mono ${
              isComplete ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
            }`}>
              {byteCount || 0}/64
            </span>
          </div>

          <div className="flex flex-wrap gap-2 xl:shrink-0">
            <button onClick={handleDecode} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">Decode</button>
            <button onClick={handleClear} className="px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm">Clear</button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {EXAMPLES.map(example => (
          <button key={example.value} onClick={() => handleExample(example.value)} title={example.label} className="px-2 py-1 text-[11px] rounded border bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors font-mono">
            {example.label}
          </button>
        ))}
      </div>

      {input && !isComplete && (
        <div className="mb-4 p-3 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs">
          Enter an even-length IAD value up to 32 bytes (64 hex chars), or paste a complete 9F10 TLV.
        </div>
      )}

      {decoded && (
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              General Data
            </button>
            <button
              onClick={() => setActiveTab('cvr')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'cvr'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
              disabled={decoded.cvrBits.length === 0}
            >
              CVR Data
            </button>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* General Data Table */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 w-1/2">Field</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderFieldRow('Application', APPLICATION_LABELS[decoded.applicationType])}
                    {decoded.iadFormat !== undefined && renderFieldRow('IAD Format', parseInt(decoded.iadFormat, 16).toString())}
                    {decoded.commonCoreIdentifier !== undefined && renderFieldRow('Common Core Identifier', decoded.commonCoreIdentifier)}
                    {decoded.ccdCryptogramVersion !== undefined && renderFieldRow('CCD Version 4.1 Cryptogram Version', decoded.ccdCryptogramVersion)}
                    {renderFieldRow(decoded.applicationType === 'ccd' ? 'Derivation Key Index' : 'Key Derivation Index', decoded.dki)}
                    {decoded.applicationType !== 'ccd' && renderFieldRow('Cryptogram Version Number', decoded.applicationType === 'mchip' ? decoded.cvn : `${decoded.cvn} (CVN ${decoded.cvnDecimal})`)}
                    {decoded.cvr && renderFieldRow('Card Verification Results (CVR)', decoded.cvr)}
                    {decoded.applicationType !== 'vsdc' && decoded.applicationType !== 'ccd' && renderFieldRow('Session key used for AC computation', decoded.sessionKeyInfo)}
                    {decoded.applicationType !== 'vsdc' && decoded.applicationType !== 'ccd' && renderFieldRow('Counters included in AC computation', decoded.countersInfo)}
                    {decoded.dacIccDynamicNumber !== undefined && renderFieldRow('DAC/ICC Dynamic Number', decoded.dacIccDynamicNumber)}
                    {decoded.countersAccumulators !== undefined && renderFieldRow('Counters/Accumulators', decoded.countersAccumulators)}
                    {decoded.cumulativeOfflineAmount !== undefined && renderFieldRow('Cumulative Offline Transaction Amount', decoded.cumulativeOfflineAmount)}
                    {decoded.consecutiveOfflineTxn !== undefined && renderFieldRow('Consecutive Offline Transactions Number', decoded.consecutiveOfflineTxn)}
                  </tbody>
                </table>
              </div>

              {/* VSDC IDD Section */}
              {decoded.applicationType === 'vsdc' && decoded.issuerDiscretionaryData && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 dark:bg-zinc-900 px-3 py-2 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Issuer Discretionary Data (IDD)</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderFieldRow('Issuer Discretionary Data (IDD)', decoded.issuerDiscretionaryData || '')}
                      {renderFieldRow('IDD Option ID', decoded.iddOptionId ? parseInt(decoded.iddOptionId, 16).toString() : '')}
                      {renderFieldRow('VLP Available Funds', decoded.vlpAvailableFunds || '')}
                      {renderFieldRow('Cumulative Total Transaction Amount (CTTA)', decoded.ctta || '')}
                      {renderFieldRow('MAC', decoded.mac || '')}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CCD IDD Section */}
              {decoded.applicationType === 'ccd' && decoded.issuerDiscretionaryData && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 dark:bg-zinc-900 px-3 py-2 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Issuer Discretionary Data</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {renderFieldRow('Counters', decoded.ccdCounters || '')}
                      {renderFieldRow('Issuer Discretionary Data', decoded.issuerDiscretionaryData || '')}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Raw Hex */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500 mb-2">Decoded IAD (hex)</p>
                <p className="font-mono text-sm text-slate-800 dark:text-white break-all">{decoded.value}</p>
              </div>
            </div>
          )}

          {activeTab === 'cvr' && decoded.cvrBits.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_180px] gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Decoded CVR</p>
                      <p className="mt-1 break-all font-mono text-lg font-bold text-slate-900 dark:text-white">{decoded.cvr}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="min-w-16 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-2 py-1.5 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Bytes</p>
                        <p className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">{decoded.cvrBits.length}</p>
                      </div>
                      <div className="min-w-16 rounded-md border border-emerald-200 dark:border-emerald-900/70 bg-white dark:bg-black px-2 py-1.5 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Active</p>
                        <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">{activeCvrFlags.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Profile</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">{APPLICATION_LABELS[decoded.applicationType]}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-zinc-500">CVN {decoded.cvn}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
                {decoded.cvrBits.map((cvrByte) => {
                  const activeCount = getActiveFlagCountForByte(cvrByte.index);
                  const isSelected = selectedCvrByte === cvrByte.index;
                  return (
                    <button
                      key={cvrByte.index}
                      onClick={() => setSelectedCvrByte(cvrByte.index)}
                      className={`min-h-[74px] rounded-lg border p-2 text-left transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-black dark:text-zinc-300 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide">Byte {cvrByte.index}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          activeCount > 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {activeCount} active
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-xl font-bold">{cvrByte.value}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-zinc-500">{cvrByte.bits.join('')}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
                <div className="flex flex-col gap-3 bg-slate-50 dark:bg-zinc-900 px-3 py-3 border-b border-slate-200 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Selected Byte</p>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                      Byte {selectedCvrByte} / {selectedCvrData?.value}
                    </h3>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {[8, 7, 6, 5, 4, 3, 2, 1].map((bitPos) => {
                      const isOn = getBitValue(bitPos);
                      return (
                        <div key={bitPos} className="text-center">
                          <p className="mb-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-500">b{bitPos}</p>
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md border font-mono text-xs font-bold ${
                            isOn
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                              : 'border-slate-200 bg-white text-slate-500 dark:border-zinc-800 dark:bg-black dark:text-zinc-400'
                          }`}>
                            {isOn ? '1' : '0'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedCvrFlags.length > 0 ? (
                  <div className="border-b border-slate-200 dark:border-zinc-800 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Active in byte {selectedCvrByte}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCvrFlags.map((flag) => (
                        <span key={`${flag.bytePosition}-${getDefinitionBitPositions(flag).join('-')}`} className="rounded border border-emerald-200 bg-white px-2 py-1 text-[11px] text-emerald-800 dark:border-emerald-900/70 dark:bg-black dark:text-emerald-200">
                          B{flag.bytePosition}.{getDefinitionBitPositions(flag).join('/')} {getDecodedDescription(flag, decoded.cvrBits[flag.bytePosition - 1])}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-b border-slate-200 dark:border-zinc-800 px-3 py-2 text-xs text-slate-500 dark:text-zinc-500">
                    No active CVR flags are set in byte {selectedCvrByte}.
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] table-fixed">
                    <thead>
                      <tr className="bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-800">
                        <th className="w-16 px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Bits</th>
                        <th className="w-16 px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Value</th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cvrBitDefinitions.map((def) => {
                        const bitPositions = getDefinitionBitPositions(def);
                        const isActive = bitPositions.some(bitPosition => getBitValue(bitPosition));
                        return (
                          <tr
                            key={`${def.bytePosition}-${bitPositions.join('-')}`}
                            className={`border-b border-slate-100 dark:border-zinc-900 ${
                              isActive ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                            }`}
                          >
                            <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300">
                              {bitPositions.map(bitPosition => `b${bitPosition}`).join('/')}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                {bitPositions.map((bitPosition) => (
                                  <span key={bitPosition} className={`inline-flex h-6 w-6 items-center justify-center rounded font-mono text-xs font-bold ${
                                    getBitValue(bitPosition)
                                      ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                      : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                                  }`}>
                                    {getBitValue(bitPosition) ? '1' : '0'}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs leading-snug text-slate-700 dark:text-zinc-300">
                              {getDecodedDescription(def, selectedCvrData)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IadDecoder;
