/* ===== NDC (NCR Direct Communication) Parser ===== */

// Core data structures
export interface NdcMessage {
  direction: 'Terminal -> Host' | 'Host -> Terminal';
  rawPrintable: string;
  msgClass: string;
  msgClassName: string;
  msgSub: string;
  msgSubName: string;
  fields: NdcField[];
  deviceRows: NdcField[];
  emvRows: EmvTlvRow[];
  issue: boolean;
  issueNotes: string[];
  classValid: boolean;
  payload: string;
}

export interface NdcField {
  label: string;
  value: string;
  description: string;
}

export interface EmvTlvRow {
  depth: number;
  tag: string;
  name: string;
  length: number;
  value: string;
}

export interface NdcTransaction {
  ts: string;
  tvn: string;
  pan: string;
  amount: number | null;
  type: string | null;
  arc: string | null;
  completed: boolean;
  hostAction: string | null;
  approval: string | null;
  verdict: string;
  notes: string[];
  funcId: string | null;
  funcName: string | null;
  funcKind: string | null;
  reqPayload: string;
  replyPayload: string | null;
}

export interface NdcAnalysis {
  transactions: NdcTransaction[];
  deviceEvents: NdcDeviceEvent[];
  counts: {
    requests: number;
    replies: number;
    solicited: number;
    unsolicited: number;
    terminalCmd: number;
    ej: number;
    dataCmd: number;
  };
  totalMsgs: number;
}

export interface NdcDeviceEvent {
  ts: string;
  dig: string;
  device: string;
  status: string;
  statusText: string;
  severity: string;
  severityText: string;
  diagnostic?: string;
}

// Constants
const FS = 0x1c; // Field Separator
const GS = 0x1d; // Group Separator

const TERMINAL_TO_HOST = 'Terminal -> Host';
const HOST_TO_TERMINAL = 'Host -> Terminal';

// Valid message classes per direction
const VALID_CLASSES = {
  [TERMINAL_TO_HOST]: ['1', '2', '5', '8'],
  [HOST_TO_TERMINAL]: ['1', '3', '4', '6', '7', '8'],
};

// Message class descriptions
const MESSAGE_CLASS: Record<string, string> = {
  [`${TERMINAL_TO_HOST}|1`]: 'Unsolicited message (Transaction Request / Unsolicited Status)',
  [`${TERMINAL_TO_HOST}|2`]: 'Solicited Status message',
  [`${TERMINAL_TO_HOST}|5`]: 'Electronic Journal (EJ) upload data',
  [`${TERMINAL_TO_HOST}|8`]: 'EMV smart-card configuration / data',
  [`${HOST_TO_TERMINAL}|1`]: 'Terminal Command',
  [`${HOST_TO_TERMINAL}|3`]: 'Data Command (Customisation Data)',
  [`${HOST_TO_TERMINAL}|4`]: 'Transaction Reply Command',
  [`${HOST_TO_TERMINAL}|6`]: 'Electronic Journal (EJ) command',
  [`${HOST_TO_TERMINAL}|7`]: 'Reserved (valid Central->SST class)',
  [`${HOST_TO_TERMINAL}|8`]: 'EMV smart-card configuration / data',
};

// Message subclass descriptions
const MESSAGE_SUBCLASS: Record<string, string> = {
  [`${TERMINAL_TO_HOST}|1|1`]: 'Transaction Request message',
  [`${TERMINAL_TO_HOST}|1|2`]: 'Unsolicited Status message',
  [`${TERMINAL_TO_HOST}|2|2`]: 'Status message',
};

// Status descriptors
const STATUS_DESCRIPTOR: Record<string, [string, string]> = {
  '8': ['Device Fault', 'An SST device reports abnormal status (also used for config-ID status). Status Information present.'],
  '9': ['Ready', 'Instruction completed successfully.'],
  'A': ['Command Reject', 'Illegal command, illegal data, or data received while not in the correct mode.'],
  'B': ['Ready', 'Transaction Reply completed successfully (separate-Ready option configured).'],
  'C': ['Specific Command Reject', 'Authentication failure, or a specific reject where \'A\' would otherwise apply. Reason in Status Information.'],
  'F': ['Terminal State', 'Response to a Terminal Command requesting supply counters, configuration information, or date/time. Status Information present.'],
};

const DESCRIPTOR_HAS_STATUS_INFO = ['8', 'B', 'C', 'F'];

// Severity codes
const SEVERITY: Record<string, string> = {
  '0': 'No error',
  '1': 'Routine errors have occurred',
  '2': 'Warning - investigation required',
  '3': 'Suspend - terminal in suspend state due to suspected tampering with this device',
  '4': 'Fatal error condition exists',
};

const ISSUE_SEVERITIES = ['2', '3', '4'];

// Device identifier map (DIG)
const DIG_MAP: Record<string, string> = {
  'A': 'Time-of-Day Clock',
  'B': 'Communications / Power Failure',
  'C': 'System Disk',
  'D': 'Magnetic Card Reader/Writer',
  'E': 'Cash Handler',
  'F': 'Envelope Depository',
  'G': 'Receipt Printer',
  'H': 'Journal Printer',
  'K': 'Night Safe Depository',
  'L': 'Encryptor',
  'M': 'Security Camera',
  'P': 'Sensors / TI Bins (Alarms)',
  'Q': 'Cardholder Keyboard',
  'R': 'Operator Keyboard',
  'S': 'Cardholder Display Alarm',
  'V': 'Statement Printer',
  'Y': 'Coin Dispenser',
  'Z': 'System Display',
  'f': 'Barcode Reader',
  'q': 'Cheque Processor',
  'w': 'Bunch Note Acceptor',
  'y': 'Secondary Card Reader (contactless)',
  'a': 'Voice Guidance System',
};

// Terminal commands
const TERMINAL_COMMAND: Record<string, string> = {
  '1': 'Go in-service (start-up)',
  '2': 'Go out-of-service (shut-down)',
  '3': 'Send configuration ID',
  '4': 'Send supply counters',
  '5': 'Send tally information (not supported)',
  '6': 'Send error log information (not supported)',
  '7': 'Send configuration information',
  '8': 'Send date and time information',
  '9': 'Reserved',
};

// Reply function codes
const REPLY_FUNCTION: Record<string, [string, string]> = {
  '1': ['Deposit and print', 'deposit'],
  '7': ['Deposit and print', 'deposit'],
  '2': ['Dispense and print', 'dispense'],
  '8': ['Dispense and print', 'dispense'],
  '3': ['Display and print', 'display'],
  '9': ['Display and print', 'display'],
  '4': ['Print immediate', 'print'],
  '5': ['Set next state and print', 'state'],
  '6': ['Night safe deposit and print', 'deposit'],
  'A': ['Eject card and dispense and print (card before cash)', 'dispense'],
  'B': ['Parallel dispense and print and card eject', 'dispense'],
  'C': ['Parallel dispense and print and card eject', 'dispense'],
  'E': ['Reserved (specific command reject)', 'reject'],
  'F': ['Card before parallel dispense/print', 'dispense'],
  'O': ['Reserved', 'reserved'],
  'P': ['Print statement and wait', 'statement'],
  'Q': ['Print statement and set next state', 'statement'],
  'R': ['Reserved (specific command reject)', 'reject'],
  'S': ['Reserved (specific command reject)', 'reject'],
  'T': ['Reserved (specific command reject)', 'reject'],
  '#': ['Print passbook and set next state (not supported)', 'passbook'],
  '%': ['Print passbook and wait (not supported)', 'passbook'],
  '*': ['Refund notes and print', 'refund'],
  '_': ['Deposit notes and print', 'deposit'],
  "'": ['Deposit notes and wait', 'deposit'],
  ':': ['Process cheque', 'cheque'],
};

// ARC (Authorization Response Code)
const ARC: Record<string, string> = {
  '00': 'Approved',
  '01': 'Refer to card issuer',
  '02': 'Refer to card issuer, special condition',
  '03': 'Invalid merchant',
  '04': 'Pick up card',
  '05': 'Do not honour',
  '06': 'Error',
  '07': 'Pick up card, special condition',
  '08': 'Honour with identification',
  '10': 'Approved (partial amount)',
  '12': 'Invalid transaction',
  '13': 'Invalid amount',
  '14': 'Invalid card number',
  '15': 'No such issuer',
  '30': 'Format error',
  '41': 'Lost card',
  '43': 'Stolen card',
  '51': 'Insufficient funds',
  '54': 'Expired card',
  '55': 'Incorrect PIN',
  '57': 'Transaction not permitted to cardholder',
  '58': 'Transaction not permitted to terminal',
  '59': 'Suspected fraud',
  '61': 'Exceeds withdrawal amount limit',
  '62': 'Restricted card',
  '65': 'Exceeds withdrawal frequency limit',
  '75': 'PIN tries exceeded',
  '76': 'Unable to locate previous message',
  '91': 'Issuer or switch inoperative',
  '92': 'Routing error',
  '96': 'System malfunction',
  'Z1': 'Offline declined',
  'Z3': 'Unable to go online, offline declined',
  'Y1': 'Offline approved',
  'Y3': 'Unable to go online, offline approved',
};

// Transaction types
const TXN_TYPE: Record<string, string> = {
  '00': 'Purchase / Goods & Services',
  '01': 'Cash withdrawal',
  '09': 'Purchase with cashback',
  '10': 'Account funding',
  '17': 'Cash disbursement',
  '20': 'Refund / Return',
  '30': 'Balance inquiry',
  '31': 'Mini-statement',
  '40': 'Transfer',
};

// EMV tag definitions (subset)
const EMV_TAGS: Record<string, [string, string]> = {
  '4F': ['Application Identifier (AID) - card', 'b'],
  '50': ['Application Label', 'an'],
  '57': ['Track 2 Equivalent Data', 'b'],
  '5A': ['Application PAN', 'cn'],
  '5F20': ['Cardholder Name', 'an'],
  '5F24': ['Application Expiry Date (YYMMDD)', 'n'],
  '5F25': ['Application Effective Date (YYMMDD)', 'n'],
  '5F28': ['Issuer Country Code', 'n'],
  '5F2A': ['Transaction Currency Code', 'n'],
  '5F34': ['PAN Sequence Number', 'n'],
  '82': ['Application Interchange Profile (AIP)', 'b'],
  '8A': ['Authorisation Response Code (ARC)', 'an'],
  '8C': ['CDOL1', 'b'],
  '8D': ['CDOL2', 'b'],
  '8E': ['CVM List', 'b'],
  '94': ['Application File Locator (AFL)', 'b'],
  '95': ['Terminal Verification Results (TVR)', 'b'],
  '9A': ['Transaction Date (YYMMDD)', 'n'],
  '9C': ['Transaction Type', 'n'],
  '9F02': ['Amount, Authorised (Numeric)', 'n'],
  '9F03': ['Amount, Other (Numeric)', 'n'],
  '9F06': ['Application Identifier (AID) - terminal', 'b'],
  '9F07': ['Application Usage Control', 'b'],
  '9F08': ['Application Version Number (ICC)', 'b'],
  '9F09': ['Application Version Number (Terminal)', 'b'],
  '9F10': ['Issuer Application Data', 'b'],
  '9F12': ['Application Preferred Name', 'an'],
  '9F1A': ['Terminal Country Code', 'n'],
  '9F1C': ['Terminal Identification', 'an'],
  '9F1E': ['IFD Serial Number', 'an'],
  '9F21': ['Transaction Time (HHMMSS)', 'n'],
  '9F26': ['Application Cryptogram (AC)', 'b'],
  '9F27': ['Cryptogram Information Data (CID)', 'b'],
  '9F33': ['Terminal Capabilities', 'b'],
  '9F34': ['CVM Results', 'b'],
  '9F35': ['Terminal Type', 'n'],
  '9F36': ['Application Transaction Counter (ATC)', 'b'],
  '9F37': ['Unpredictable Number', 'b'],
  '9F39': ['POS Entry Mode', 'n'],
  '9F4E': ['Merchant Name and Location', 'an'],
};

// Helper functions
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
  if (clean.length % 2) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function bytesToAscii(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => (b >= 0x20 && b < 0x7f) ? String.fromCharCode(b) : '.')
    .join('');
}

// Normalize input - handle hex, <FS>, <GS>, raw bytes
export function normalizeNdcInput(raw: string): string {
  let s = String(raw);

  // Replace common separator representations
  s = s.replace(/<FS>|\[FS\]|\{FS\}|<1C>|\[1C\]|\\x1c|\\u001c/gi, String.fromCharCode(FS));
  s = s.replace(/<GS>|\[GS\]|\{GS\}|<1D>|\[1D\]|\\x1d|\\u001d/gi, String.fromCharCode(GS));

  // If we already have separators, return as-is
  if (s.indexOf(String.fromCharCode(FS)) >= 0 || s.indexOf(String.fromCharCode(GS)) >= 0) {
    return s;
  }

  // Try space-separated hex format
  const tokens = s.replace(/0x/gi, ' ')
    .replace(/[ ,:\-\t\r\n]+/g, ' ')
    .trim()
    .split(' ');

  if (tokens.length > 1 && tokens.every(t => /^[0-9A-Fa-f]{1,2}$/.test(t))) {
    return tokens.map(t => String.fromCharCode(parseInt(t, 16))).join('');
  }

  // Try continuous hex string
  const continuous = s.replace(/\s+/g, '');
  if (/^[0-9A-Fa-f]+$/.test(continuous) && continuous.length % 2 === 0) {
    let out = '';
    for (let k = 0; k < continuous.length; k += 2) {
      out += String.fromCharCode(parseInt(continuous.substr(k, 2), 16));
    }
    return out;
  }

  return s;
}

// Strip STX/ETX frame characters
export function stripFrame(payload: string): string {
  let s = payload.indexOf('\x02');
  if (s >= 0) {
    const e = payload.indexOf('\x03', s);
    payload = e > 0 ? payload.slice(s + 1, e) : payload.slice(s + 1);
  }
  return payload;
}

// Convert to printable representation
export function toPrintable(payload: string): string {
  let out = '';
  for (const ch of payload) {
    const code = ch.charCodeAt(0);
    if (code === FS) {
      out += '<FS>';
    } else if (code === GS) {
      out += '<GS>';
    } else if (code >= 0x20 && code < 0x7f) {
      out += ch;
    } else {
      out += '<' + code.toString(16).padStart(2, '0').toUpperCase() + '>';
    }
  }
  return out;
}

// Split payload into fields
export function tokenize(payload: string): string[] {
  return payload.split(String.fromCharCode(FS));
}

// Identify direction and message class
export function identifyMessage(tok0: string, direction: string): [string, string, string] {
  const mc = tok0[0] || '';
  const ms = tok0[1] || '';

  if (direction === 'auto') {
    if (mc === '2' || mc === '5') {
      direction = TERMINAL_TO_HOST;
    } else if (['3', '4', '6', '7'].includes(mc)) {
      direction = HOST_TO_TERMINAL;
    } else if (mc === '1') {
      direction = ms === '1' || ms === '2' ? TERMINAL_TO_HOST : HOST_TO_TERMINAL;
    } else {
      direction = TERMINAL_TO_HOST;
    }
  }

  return [direction, mc, ms];
}

// Parse a single NDC message
export function parseNdcMessage(raw: string, direction = 'auto'): NdcMessage {
  const payload = stripFrame(normalizeNdcInput(raw));
  const tokens = tokenize(payload);
  const tok0 = tokens[0] || '';

  const [dir, mc, ms] = identifyMessage(tok0, direction);

  const msg: NdcMessage = {
    direction: dir as typeof msg.direction,
    rawPrintable: toPrintable(payload),
    msgClass: mc,
    msgClassName: MESSAGE_CLASS[`${dir}|${mc}`] || 'Unknown/Variable Field',
    msgSub: ms,
    msgSubName: MESSAGE_SUBCLASS[`${dir}|${mc}|${ms}`] || '',
    fields: [],
    deviceRows: [],
    emvRows: [],
    issue: false,
    issueNotes: [],
    classValid: (VALID_CLASSES[dir as keyof typeof VALID_CLASSES] || []).includes(mc),
    payload,
  };

  // Validate message class
  if (!msg.classValid) {
    msg.issue = true;
    msg.issueNotes.push(
      `Message class '${mc}' not valid for ${dir} (valid: ${(VALID_CLASSES[dir as keyof typeof VALID_CLASSES] || []).join(',')})`
    );
  }

  // Parse fields based on message type
  parseMessageFields(msg, tokens, dir, mc, ms);

  // Parse EMV data if present
  msg.emvRows = parseEmvFromPayload(payload);

  return msg;
}

function parseMessageFields(msg: NdcMessage, tokens: string[], dir: string, mc: string, ms: string): void {
  const at = (i: number) => i < tokens.length ? tokens[i] : null;

  if (dir === TERMINAL_TO_HOST && mc === '1' && ms === '1') {
    // Transaction Request
    msg.fields.push({ label: 'b  Message Class', value: at(0)?.[0] || '', description: "'1' Unsolicited message" });
    msg.fields.push({ label: 'c  Message Sub-Class', value: at(0)?.slice(1) || '', description: "'1' Transaction Request" });
    msg.fields.push({ label: 'd  LUNO', value: at(1) || '', description: 'Logical Unit Number (default \'000\'; 9 chars => +machine number)' });
    msg.fields.push({ label: '(empty)', value: at(2) || '', description: 'Double field separator' });
    msg.fields.push({ label: 'e  Time Variant Number', value: at(3) || '', description: '8 digits from time-of-day (0-9, A-F)' });
    const fg = at(4) || '';
    msg.fields.push({ label: 'f  Top-of-Receipt Flag', value: fg[0] || '', description: { '0': 'Do not print at top', '1': 'Print at top' }[fg[0]] || '' });
    msg.fields.push({ label: 'g  Message Coordination No.', value: fg[1] || '', description: 'MCN (host echoes)' });
    msg.fields.push({ label: 'h  Track 2 Data', value: at(5) || '', description: 'Up to 39 chars (0x30-0x3F)' });
    msg.fields.push({ label: 'k  Amount Entry', value: at(8) || '', description: 'Right-justified, leading zeros; 8 or 12 digits' });
    msg.fields.push({ label: 'l  PIN Buffer (A)', value: at(9) || '', description: 'Encrypted PIN (may be masked)' });
  } else if (dir === TERMINAL_TO_HOST && mc === '2') {
    // Solicited Status
    msg.fields.push({ label: 'b  Message Class', value: at(0)?.[0] || '', description: "'2' Solicited Status" });
    msg.fields.push({ label: 'c  Message Sub-Class', value: at(0)?.slice(1) || '', description: "'2' Status message" });
    msg.fields.push({ label: 'd  LUNO', value: at(1) || '', description: 'Logical Unit Number' });
    const desc = at(4) || '';
    const sd = STATUS_DESCRIPTOR[desc];
    msg.fields.push({ label: 'f  Status Descriptor', value: desc, description: sd ? `${sd[0]} - ${sd[1]}` : '' });

    if (['8', 'C', 'A'].includes(desc)) {
      msg.issue = true;
      msg.issueNotes.push(`Status Descriptor '${desc}' = ${sd ? sd[0] : '?'}`);
    }

    if (DESCRIPTOR_HAS_STATUS_INFO.includes(desc) && tokens.length > 5) {
      const g = tokens[5];
      if (desc === '8' && g) {
        const deviceResult = parseDeviceBlock(g[0], g.slice(1), tokens[6], tokens[7], tokens[8]);
        msg.deviceRows = deviceResult.rows;
        msg.issue = msg.issue || deviceResult.issue;
        msg.issueNotes.push(...deviceResult.notes);
      }
    }
  } else if (dir === HOST_TO_TERMINAL && mc === '1') {
    // Terminal Command
    msg.fields.push({ label: 'b  Message Class', value: at(0)?.[0] || '', description: "'1' Terminal Command" });
    let code = '';
    for (let i = 1; i < tokens.length; i++) {
      if (tokens[i]) {
        code = tokens[i][0];
        break;
      }
    }
    msg.fields.push({ label: 'f  Command Code', value: code, description: TERMINAL_COMMAND[code] || '' });
  } else if (dir === HOST_TO_TERMINAL && mc === '4') {
    // Transaction Reply
    const head = tokens[0] || '';
    msg.fields.push({ label: 'b  Message Class', value: head[0], description: "'4' Transaction Reply Command" });
    msg.fields.push({ label: 'd  LUNO', value: at(1) || '', description: 'Logical Unit Number' });
    msg.fields.push({ label: 'e  Time-Variant Number', value: at(2) || '', description: 'Echoes the request TVN' });
    msg.fields.push({ label: 'f  Next State ID', value: at(3) || '', description: 'State the SST runs after the reply' });

    if (tokens.length > 5) {
      const sf = tokens[5];
      const fid = sf.length >= 5 && /^\d{4}$/.test(sf.slice(0, 4)) ? sf[4] : null;
      if (fid) {
        const rf = REPLY_FUNCTION[fid];
        msg.fields.push({ label: 'l  Function Identifier', value: fid, description: rf ? rf[0] : '' });
        if (rf && rf[1] === 'reject') {
          msg.issue = true;
          msg.issueNotes.push(`Function ID '${fid}' reserved -> Specific Command Reject expected`);
        }
      }
    }
  } else {
    msg.fields.push({
      label: '(payload)',
      value: tokens.join(' | '),
      description: 'Message type not covered or requires manual verification'
    });
  }
}

function parseDeviceBlock(
  dig: string,
  status: string,
  severity: string,
  diagnostic: string,
  supplies: string
): { rows: NdcField[]; issue: boolean; notes: string[] } {
  const rows: NdcField[] = [];
  const notes: string[] = [];
  let issue = false;

  const name = DIG_MAP[dig] || `Unknown device (DIG '${dig}')`;
  rows.push({ label: 'e1/g1  DIG (device)', value: dig, description: name });

  if (status) {
    let meaning = 'Status code requires manual verification';
    rows.push({ label: 'e2/g2  Device Status', value: status, description: meaning });
    if (status !== '0' && status !== '' && dig !== 'B') {
      issue = true;
      notes.push(`${name}: device status '${status}'`);
    }
  }

  if (severity) {
    const parts: string[] = [];
    for (const ch of severity) {
      const base = SEVERITY[ch] || '';
      if (ISSUE_SEVERITIES.includes(ch)) {
        issue = true;
        notes.push(`${name}: severity '${ch}' (${base})`);
      }
      parts.push(`byte'${ch}': ${base}`);
    }
    rows.push({ label: 'e3/g3  Error Severity', value: severity, description: parts.join('; ') });
  }

  return { rows, issue, notes };
}

// EMV TLV Parser (simplified BER-TLV)
interface EmvNode {
  tag: string;
  length: number;
  value: Uint8Array;
  name: string;
  kind: string;
  children?: EmvNode[];
}

function parseTLV(bytes: Uint8Array, depth = 0): EmvNode[] {
  const nodes: EmvNode[] = [];
  let i = 0;
  const n = bytes.length;

  while (i < n) {
    // Skip padding bytes
    if (bytes[i] === 0x00 || bytes[i] === 0xFF) {
      i++;
      continue;
    }

    let first = bytes[i++];
    const tagBytes = [first];

    // Multi-byte tag
    if ((first & 0x1F) === 0x1F) {
      while (i < n) {
        tagBytes.push(bytes[i]);
        const more = bytes[i] & 0x80;
        i++;
        if (!more) break;
      }
    }

    const tagHex = tagBytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const constructed = !!(first & 0x20);

    if (i >= n) break;

    let l0 = bytes[i++];
    let length: number;

    if (l0 & 0x80) {
      const num = l0 & 0x7F;
      if (num === 0 || i + num > n) break;
      length = 0;
      for (let k = 0; k < num; k++) {
        length = length * 256 + bytes[i++];
      }
    } else {
      length = l0;
    }

    if (i + length > n) {
      length = n - i;
    }

    const value = bytes.slice(i, i + length);
    i += length;

    const meta = EMV_TAGS[tagHex] || ['Unknown EMV tag', 'b'];
    const node: EmvNode = {
      tag: tagHex,
      length,
      value,
      name: meta[0],
      kind: meta[1],
    };

    if (constructed || meta[1] === 'tmpl') {
      try {
        node.children = parseTLV(value, depth + 1);
      } catch {
        node.children = [];
      }
    }

    nodes.push(node);
  }

  return nodes;
}

function flattenEmvNodes(nodes: EmvNode[], depth = 0): EmvTlvRow[] {
  const rows: EmvTlvRow[] = [];
  for (const node of nodes) {
    rows.push({
      depth,
      tag: node.tag,
      name: node.name,
      length: node.length,
      value: bytesToHex(node.value),
    });
    if (node.children) {
      rows.push(...flattenEmvNodes(node.children, depth + 1));
    }
  }
  return rows;
}

// Find best EMV data in payload (heuristic)
function findBestEmvPayload(payload: string): Uint8Array {
  const anchors = ['9F1A', '9F02', '9F26', '9F36', '5F2A', '9F10', '9F27', '9C01', '910A', '8A02', '9F34'];
  const positions = new Set<number>();

  for (const anchor of anchors) {
    let idx = payload.indexOf(anchor);
    while (idx >= 0) {
      positions.add(idx);
      idx = payload.indexOf(anchor, idx + 1);
    }
  }

  if (positions.size === 0) {
    return new Uint8Array(0);
  }

  let bestNodes: EmvNode[] = [];
  let bestScore = -1;

  for (const pos of Array.from(positions).sort((a, b) => a - b)) {
    const hex = payload.slice(pos).replace(/[^0-9A-Fa-f]/g, '');
    try {
      const nodes = parseTLV(hexToBytes(hex));
      let score = 0;
      const countNodes = (ns: EmvNode[]) => {
        for (const n of ns) {
          if (n.name !== 'Unknown EMV tag') score++;
          if (n.children) countNodes(n.children);
        }
      };
      countNodes(nodes);

      if (score > bestScore) {
        bestScore = score;
        bestNodes = nodes;
      }
    } catch {
      // Skip invalid parse attempts
    }
  }

  // Reconstruct from best nodes (simplified - just return first valid parse)
  if (positions.size > 0) {
    const firstPos = Math.min(...positions);
    const hex = payload.slice(firstPos).replace(/[^0-9A-Fa-f]/g, '');
    try {
      return hexToBytes(hex);
    } catch {
      return new Uint8Array(0);
    }
  }

  return new Uint8Array(0);
}

function parseEmvFromPayload(payload: string): EmvTlvRow[] {
  try {
    const bytes = findBestEmvPayload(payload);
    if (bytes.length === 0) return [];

    const nodes = parseTLV(bytes);
    return flattenEmvNodes(nodes);
  } catch {
    return [];
  }
}

// Full log analyzer for port dumps
const LOG_HEADER_REGEX = /^[ \t]*(\d\d\.\d\d\.\d\d\d\d \d\d:\d\d:\d\d\.\d+)\s+(<Out|In>)/;

interface LogMessage {
  ts: string;
  tag: string;
  direction: string;
  payload: string;
}

function frameLog(text: string): LogMessage[] {
  const out: LogMessage[] = [];
  const lines = text.split(/\r?\n/);
  let currentTs = '';
  let currentTag = '';
  let currentDir = '';
  let payloadLines: string[] = [];

  for (const line of lines) {
    const match = line.match(LOG_HEADER_REGEX);
    if (match) {
      // Save previous message if any
      if (payloadLines.length > 0) {
        const payload = payloadLines.join('');
        const s = payload.indexOf('\x02');
        if (s >= 0) {
          const e = payload.indexOf('\x03', s);
          out.push({
            ts: currentTs,
            tag: currentTag,
            direction: currentDir,
            payload: e > 0 ? payload.slice(s + 1, e) : payload.slice(s + 1),
          });
        }
        payloadLines = [];
      }
      currentTs = match[1];
      currentTag = match[2];
      currentDir = match[2] === 'In>' ? TERMINAL_TO_HOST : HOST_TO_TERMINAL;
    } else {
      payloadLines.push(line);
    }
  }

  // Save last message
  if (payloadLines.length > 0) {
    const payload = payloadLines.join('');
    const s = payload.indexOf('\x02');
    if (s >= 0) {
      const e = payload.indexOf('\x03', s);
      out.push({
        ts: currentTs,
        tag: currentTag,
        direction: currentDir,
        payload: e > 0 ? payload.slice(s + 1, e) : payload.slice(s + 1),
      });
    }
  }

  return out;
}

function getPayloadField(payload: string, index: number): string {
  const parts = payload.split(String.fromCharCode(FS));
  return parts[index] || '';
}

function getArcFromReply(payload: string): string | null {
  const match = payload.toUpperCase().match(/8A02([0-9A-Fa-f]{4})/);
  if (match) {
    try {
      return String.fromCharCode(
        parseInt(match[1].slice(0, 2), 16),
        parseInt(match[1].slice(2, 4), 16)
      );
    } catch {
      return null;
    }
  }
  return null;
}

function getReplyFunction(payload: string): { fid: string | null; fname: string | null; fkind: string | null } {
  const parts = payload.split(String.fromCharCode(FS));
  if (parts.length <= 5) return { fid: null, fname: null, fkind: null };

  const sf = parts[5];
  const fid = sf.length >= 5 && /^\d{4}$/.test(sf.slice(0, 4)) ? sf[4] : null;
  const rf = fid ? REPLY_FUNCTION[fid] : null;

  return {
    fid,
    fname: rf ? rf[0] : null,
    fkind: rf ? rf[1] : null,
  };
}

function extractPan(payload: string): string {
  const match = payload.match(/CARD NO:\s*([0-9*#]{6,})/);
  if (match) return match[1];

  const trackMatch = payload.match(/[;B]?([0-9]{6}[\*#]+[0-9]{3,4})=/);
  if (trackMatch) return trackMatch[1];

  // Look for Track 2 field (field h in transaction request)
  const parts = payload.split(String.fromCharCode(FS));
  const track2 = parts[5]; // Field 'h' is at index 5
  if (track2) {
    // Extract PAN from track 2 (starts after start sentinel ';', before '=')
    const panMatch = track2.match(/[;B]?\s*(\d{6,}\*?\d*)=/);
    if (panMatch) return panMatch[1];
  }

  return '';
}

// Main analyzer for full transaction logs
export function analyzeNdcLog(text: string): NdcAnalysis {
  const messages = frameLog(text);
  const transactions: NdcTransaction[] = [];
  const deviceEvents: NdcDeviceEvent[] = [];

  const counts = {
    requests: 0,
    replies: 0,
    solicited: 0,
    unsolicited: 0,
    terminalCmd: 0,
    ej: 0,
    dataCmd: 0,
  };

  let pending: Partial<NdcTransaction> | null = null;

  for (const msg of messages) {
    const firstField = getPayloadField(msg.payload, 0);
    const mc = firstField[0] || '';
    const ms = firstField[1] || '';

    if (msg.direction === TERMINAL_TO_HOST && mc === '1' && ms === '1') {
      // Transaction Request
      counts.requests++;

      if (pending) {
        finalizeTransaction(pending as NdcTransaction);
        transactions.push(pending as NdcTransaction);
      }

      pending = {
        ts: msg.ts,
        tvn: getPayloadField(msg.payload, 3), // Time Variant Number
        pan: extractPan(msg.payload),
        amount: null,
        type: null,
        arc: null,
        completed: false,
        hostAction: null,
        approval: null,
        verdict: 'INCOMPLETE - no Transaction Reply seen',
        notes: [],
        funcId: null,
        funcName: null,
        funcKind: null,
        reqPayload: msg.payload,
        replyPayload: null,
      };
    } else if (msg.direction === HOST_TO_TERMINAL && mc === '4') {
      // Transaction Reply
      counts.replies++;

      if (pending) {
        const repTvn = getPayloadField(msg.payload, 2);
        if (!pending.tvn || repTvn === pending.tvn) {
          pending.arc = getArcFromReply(msg.payload);
          pending.replyPayload = msg.payload;

          const replyFunc = getReplyFunction(msg.payload);
          pending.funcId = replyFunc.fid;
          pending.funcName = replyFunc.fname;
          pending.funcKind = replyFunc.fkind;

          const approvalMatch = msg.payload.match(/APPROVAL CODE:[ \t]*([0-9]+)/i);
          if (approvalMatch) {
            pending.approval = approvalMatch[1];
          }

          const panMatch = msg.payload.match(/CARD NO:\s*([0-9*#]{6,})/);
          if (panMatch) {
            pending.pan = panMatch[1];
          }

          const up = msg.payload.toUpperCase();
          if (up.includes('WITHDRAWAL')) {
            pending.hostAction = 'withdrawal';
          } else if (up.includes('BALANCE')) {
            pending.hostAction = 'balance';
          } else if (up.includes('TRANSFER')) {
            pending.hostAction = 'transfer';
          }
        }
      }
    } else if (msg.direction === TERMINAL_TO_HOST && mc === '2') {
      // Solicited Status
      counts.solicited++;

      const desc = getPayloadField(msg.payload, 4);
      if (pending && (desc === '9' || desc === 'B')) {
        pending.completed = true;
        finalizeTransaction(pending as NdcTransaction);
        transactions.push(pending as NdcTransaction);
        pending = null;
      } else if (pending && ['8', 'A', 'C'].includes(desc)) {
        pending.notes?.push(`Solicited descriptor '${desc}' during transaction`);
      }
    } else if (msg.direction === TERMINAL_TO_HOST && mc === '1' && ms === '2') {
      // Unsolicited Status (device event)
      counts.unsolicited++;

      const e0 = getPayloadField(msg.payload, 3);
      const dig = e0[0] || '';
      const status = e0.slice(1);
      const severity = getPayloadField(msg.payload, 4);

      deviceEvents.push({
        ts: msg.ts,
        dig,
        device: DIG_MAP[dig] || `Unknown device (DIG '${dig}')`,
        status,
        statusText: `Status '${status}'`,
        severity,
        severityText: `Severity '${severity}'`,
      });
    } else if (msg.direction === HOST_TO_TERMINAL && mc === '1') {
      counts.terminalCmd++;
    } else if (mc === '6') {
      counts.ej++;
    } else if (msg.direction === HOST_TO_TERMINAL && mc === '3') {
      counts.dataCmd++;
    }
  }

  // Finalize pending transaction
  if (pending) {
    finalizeTransaction(pending as NdcTransaction);
    transactions.push(pending as NdcTransaction);
  }

  return {
    transactions,
    deviceEvents,
    counts,
    totalMsgs: messages.length,
  };
}

function finalizeTransaction(txn: NdcTransaction): void {
  const arc = txn.arc;
  if (arc === null || arc === undefined) {
    txn.verdict = 'INCOMPLETE - no Transaction Reply seen';
    return;
  }

  const arcDesc = ARC[arc] || 'Unknown response code';

  if (arc === '00') {
    txn.verdict = txn.completed
      ? `APPROVED & COMPLETED (${arcDesc})`
      : `APPROVED but completion not confirmed (${arcDesc})`;
  } else {
    txn.verdict = `DECLINED - ARC '${arc}' = ${arcDesc}`;
  }
}
