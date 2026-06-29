import { useCallback, useState } from 'react';
import { getEMVTagDefinition, hexToAscii, parseEMVTLV, type TLVData } from '../utils/iso8583VersionParser/emv-tlv';

type ParsedApduCommand = {
  cla?: string;
  ins?: string;
  p1?: string;
  p2?: string;
  lc?: number;
  data?: string;
  le?: string;
  description: string;
};

type ParsedTlvRow = {
  tag: string;
  name: string;
  value: string;
  displayValue: string;
  length: number;
  depth: number;
};

type ApduEvent = {
  id: string;
  time: string;
  operation: string;
  argument?: string;
  recordNo?: string;
  sfi?: string;
  sentRaw: string;
  responseRaw: string;
  commandHex: string;
  responseData: string;
  sw?: string;
  statusText: string;
  result: 'success' | 'warning' | 'failed' | 'info';
  command: ParsedApduCommand;
  tlvRows: ParsedTlvRow[];
  aid?: string;
  scheme?: string;
  cid?: string;
  cryptogramType?: string;
};

type Summary = {
  totalEvents: number;
  selectedAid?: string;
  selectedScheme?: string;
  gpoOk: boolean;
  readRecords: number;
  firstCryptogram?: string;
  finalCryptogram?: string;
  finalResult: string;
};

type FlowStep = {
  id: string;
  label: string;
  detail?: string;
  status: 'success' | 'failed' | 'warning' | 'pending' | 'active';
};

const AID_SCHEMES: Record<string, string> = {
  A0000000031010: 'Visa',
  A0000000041010: 'Mastercard',
  A0000000043060: 'Maestro',
  A0000000046000: 'Maestro UK',
  A00000002501: 'American Express',
  A000000003801001: 'Discover',
  A000000333010101: 'UnionPay Debit',
  A000000333010102: 'UnionPay Credit',
  A000000333010103: 'UnionPay Electronic Cash',
  A00000091010: 'RuPay',
};

const STATUS_WORDS: Record<string, string> = {
  '9000': 'Success',
  '6283': 'Selected file invalidated',
  '6300': 'Authentication failed',
  '6700': 'Wrong length',
  '6982': 'Security status not satisfied',
  '6985': 'Conditions of use not satisfied',
  '6A80': 'Incorrect parameters in data field',
  '6A82': 'File or application not found',
  '6A83': 'Record not found',
  '6A86': 'Incorrect P1/P2',
  '6D00': 'Instruction code not supported',
  '6E00': 'Class not supported',
};

const SAMPLE_LOG = `Applica.. 22/06/2026 17:24:45.940 Start LOWISO_Select(A0000000031010)
Applica.. 22/06/2026 17:24:45.940 DATA SENT TO THE CARD >>>
70 2C 01 27 00 A4 04 00 07 A0 00 00 00 03 10 10 00
Applica.. 22/06/2026 17:24:46.067 DATA RECEIVED FROM THE CARD <<<
00 00 00 6A 82
Applica.. 22/06/2026 17:24:46.968 Start LOWISO_Select(A0000000041010)
Applica.. 22/06/2026 17:24:46.968 DATA SENT TO THE CARD >>>
70 2C 01 27 00 A4 04 00 07 A0 00 00 00 04 10 10 00
Applica.. 22/06/2026 17:24:47.173 DATA RECEIVED FROM THE CARD <<<
00 00 00 90 00 6F 31 84 07 A0 00 00 00 04 10 10 A5 26 50 0A 4D 61 73 74 65 72 63 61 72 64 87 01 01 5F 2D 02 65 6E BF 0C 0F 9F 4D 02 0B 0A 9F 6E 07 00 50 00 00 32 30 00
Applica.. 22/06/2026 17:24:47.482 Start LOWCAM_GetProcOpts(...)
Applica.. 22/06/2026 17:24:47.482 DATA SENT TO THE CARD >>>
70 2C 01 27 80 A8 00 00 02 83 00 00
Applica.. 22/06/2026 17:24:47.635 DATA RECEIVED FROM THE CARD <<<
00 00 00 90 00 77 0E 82 02 19 00 94 08 10 01 02 01 18 01 04 00
Applica.. 22/06/2026 17:24:58.117 Start LOWCAM_GenCrypto(...)
Applica.. 22/06/2026 17:24:58.117 DATA SENT TO THE CARD >>>
70 2C 01 27 80 AE 80 00 42 00 00 00 05 00 00 00 00
Applica.. 22/06/2026 17:24:58.479 DATA RECEIVED FROM THE CARD <<<
00 00 00 90 00 77 29 9F 27 01 80 9F 36 02 00 24 9F 26 08 E7 AF 21 FB A1 A2 39 96 9F 10 12 01 10 A0 02 01 22 04 00 00 00 FF FF FF FF FF FF FF FF
Applica.. 22/06/2026 17:24:59.723 Start LOWCAM_GenCrypto(...)
Applica.. 22/06/2026 17:24:59.723 DATA SENT TO THE CARD >>>
70 2C 01 27 80 AE 40 00 1D 7F 5F 1C A9 21 14 79 37 00 12 30 30 80 80 04 80 00 00
Applica.. 22/06/2026 17:25:00.020 DATA RECEIVED FROM THE CARD <<<
00 00 00 90 00 77 29 9F 27 01 00 9F 36 02 00 24 9F 26 08 71 08 82 D7 2D CB 3C A6 9F 10 12 01 10 20 12 01 22 04 00 00 00 FF FF FF FF FF FF FF FF`;

const cleanHexTokens = (value: string, keepMasked = false) => {
  const matches = value.toUpperCase().match(/\*\*|[0-9A-F]{2}/g) || [];
  return matches.map(token => (token === '**' && !keepMasked ? '00' : token)).join('');
};

const formatHex = (hex: string) => (hex.match(/.{1,2}/g) || []).join(' ');

const stripReaderHeader = (hex: string) => {
  return hex.startsWith('702C0127') && hex.length > 8 ? hex.slice(8) : hex;
};

const extractWrappedResponse = (hex: string, operation: string) => {
  if (hex.startsWith('000000') && operation !== 'LOWISO_PowerOn') {
    const body = hex.slice(6);
    return {
      sw: body.slice(0, 4),
      data: body.slice(4),
    };
  }

  return {
    sw: undefined,
    data: hex.startsWith('000000') ? hex.slice(6) : hex,
  };
};

const describeStatus = (sw?: string) => {
  if (!sw) return 'No status word';
  return STATUS_WORDS[sw] || (sw.startsWith('61') ? 'More data available' : sw.startsWith('63') ? 'Warning' : 'Unknown status');
};

const getResult = (sw?: string): ApduEvent['result'] => {
  if (!sw) return 'info';
  if (sw === '9000') return 'success';
  if (sw.startsWith('62') || sw.startsWith('63')) return 'warning';
  return 'failed';
};

const parseCommand = (hex: string): ParsedApduCommand => {
  if (hex.length < 8) return { description: 'Raw or incomplete command' };

  const cla = hex.slice(0, 2);
  const ins = hex.slice(2, 4);
  const p1 = hex.slice(4, 6);
  const p2 = hex.slice(6, 8);
  const lcHex = hex.length >= 10 ? hex.slice(8, 10) : undefined;
  const lc = lcHex ? parseInt(lcHex, 16) : undefined;
  const dataStart = 10;
  const dataEnd = lc !== undefined ? dataStart + lc * 2 : dataStart;
  const data = lc !== undefined && hex.length >= dataEnd ? hex.slice(dataStart, dataEnd) : undefined;
  const le = hex.length > dataEnd ? hex.slice(dataEnd, dataEnd + 2) : undefined;

  const descriptions: Record<string, string> = {
    A4: 'SELECT application/file',
    A8: 'GET PROCESSING OPTIONS',
    B2: 'READ RECORD',
    AE: 'GENERATE AC',
  };

  return {
    cla,
    ins,
    p1,
    p2,
    lc,
    data,
    le,
    description: descriptions[ins] || 'APDU command',
  };
};

const flattenTlvs = (tlvs: TLVData[], depth = 0): ParsedTlvRow[] => {
  return tlvs.flatMap(tlv => {
    const tagDef = getEMVTagDefinition(tlv.tag);
    const displayValue = tagDef?.format === 'ASCII' ? hexToAscii(tlv.rawValue) : tlv.displayValue;
    return [
      {
        tag: tlv.tag,
        name: tlv.tagName,
        value: tlv.rawValue,
        displayValue,
        length: tlv.length,
        depth,
      },
      ...(tlv.children ? flattenTlvs(tlv.children, depth + 1) : []),
    ];
  });
};

const getTlvValue = (rows: ParsedTlvRow[], tag: string) => rows.find(row => row.tag === tag)?.value;

const decodeCid = (cid?: string) => {
  if (!cid) return undefined;
  const value = parseInt(cid, 16);
  const cryptogramBits = value & 0xc0;
  if (cryptogramBits === 0x00) return 'AAC - declined';
  if (cryptogramBits === 0x40) return 'TC - approved';
  if (cryptogramBits === 0x80) return 'ARQC - online request';
  if (cryptogramBits === 0xc0) return 'AAR - referral';
  return 'Unknown cryptogram';
};

const parseApduLog = (log: string): ApduEvent[] => {
  const lines = log.split(/\r?\n/);
  const events: ApduEvent[] = [];
  let current: Partial<ApduEvent> | null = null;
  let capture: 'sent' | 'received' | null = null;
  let sentLines: string[] = [];
  let receivedLines: string[] = [];

  const finish = () => {
    if (!current) return;

    const sentRaw = sentLines.join(' ');
    const responseRaw = receivedLines.join(' ');
    const commandHex = stripReaderHeader(cleanHexTokens(sentRaw));
    const responseHex = cleanHexTokens(responseRaw);
    const { sw, data } = extractWrappedResponse(responseHex, current.operation || '');
    const command = parseCommand(commandHex);

    const isEmvTlvResponse = current.operation !== 'LOWISO_PowerOn' && ['A4', 'A8', 'B2', 'AE'].includes(command.ins || '');
    let tlvRows: ParsedTlvRow[] = [];
    if (isEmvTlvResponse && data && data.length >= 4) {
      try {
        tlvRows = flattenTlvs(parseEMVTLV(data).tags);
      } catch {
        tlvRows = [];
      }
    }

    const aid = command.ins === 'A4' ? current.argument || command.data : undefined;
    const cid = getTlvValue(tlvRows, '9F27');

    events.push({
      id: `${current.time}-${events.length}`,
      time: current.time || '',
      operation: current.operation || 'Unknown',
      argument: current.argument,
      recordNo: current.recordNo,
      sfi: current.sfi,
      sentRaw,
      responseRaw,
      commandHex,
      responseData: data,
      sw,
      statusText: describeStatus(sw),
      result: getResult(sw),
      command,
      tlvRows,
      aid,
      scheme: aid ? AID_SCHEMES[aid] : undefined,
      cid,
      cryptogramType: decodeCid(cid),
    });

    current = null;
    sentLines = [];
    receivedLines = [];
    capture = null;
  };

  lines.forEach(line => {
    const startMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s+Start\s+([^(]+)\(([^)]*)\)/);
    if (startMatch) {
      finish();
      current = {
        id: '',
        time: startMatch[1],
        operation: startMatch[2].trim(),
        argument: startMatch[3] && startMatch[3] !== '...' ? startMatch[3] : undefined,
      };
      return;
    }

    if (!current) return;

    const recordMatch = line.match(/Record No\s*:\s*(\d+),\s*SFI\s*:\s*(\d+)/i);
    if (recordMatch) {
      current.recordNo = recordMatch[1];
      current.sfi = recordMatch[2];
      return;
    }

    if (line.includes('DATA SENT TO THE CARD')) {
      capture = 'sent';
      return;
    }

    if (line.includes('DATA RECEIVED FROM THE CARD')) {
      capture = 'received';
      return;
    }

    if (/Stop\s+/.test(line)) {
      finish();
      return;
    }

    if (capture === 'sent' && /(\*\*|[0-9A-Fa-f]{2})/.test(line)) sentLines.push(line);
    if (capture === 'received' && /(\*\*|[0-9A-Fa-f]{2})/.test(line)) receivedLines.push(line);
  });

  finish();
  return events;
};

const parseAfl = (afl?: string) => {
  if (!afl) return [];
  const bytes = afl.match(/.{8}/g) || [];
  return bytes.map(entry => {
    const firstByte = parseInt(entry.slice(0, 2), 16);
    return {
      raw: entry,
      sfi: firstByte >> 3,
      firstRecord: parseInt(entry.slice(2, 4), 16),
      lastRecord: parseInt(entry.slice(4, 6), 16),
      offlineAuthRecords: parseInt(entry.slice(6, 8), 16),
    };
  });
};

const buildSummary = (events: ApduEvent[]): Summary => {
  const selected = events.find(event => event.command.ins === 'A4' && event.sw === '9000');
  const cryptograms = events.filter(event => event.command.ins === 'AE');
  const finalCryptogram = cryptograms.at(-1)?.cryptogramType;

  return {
    totalEvents: events.length,
    selectedAid: selected?.aid,
    selectedScheme: selected?.scheme,
    gpoOk: events.some(event => event.command.ins === 'A8' && event.sw === '9000'),
    readRecords: events.filter(event => event.command.ins === 'B2' && event.sw === '9000').length,
    firstCryptogram: cryptograms[0]?.cryptogramType,
    finalCryptogram,
    finalResult: finalCryptogram?.startsWith('TC') ? 'Approved' : finalCryptogram?.startsWith('AAC') ? 'Declined' : 'Review required',
  };
};

const getFlowStepClasses = (status: FlowStep['status']) => {
  const styles: Record<FlowStep['status'], string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200',
    failed: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200',
    pending: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
    active: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-200',
  };

  return styles[status];
};

const buildFlowSteps = (events: ApduEvent[], summary: Summary): { main: FlowStep[]; branches: FlowStep[]; aidAttempts: FlowStep[] } => {
  const powerOn = events.find(event => event.operation === 'LOWISO_PowerOn');
  const selectEvents = events.filter(event => event.command.ins === 'A4');
  const firstGenAc = events.find(event => event.command.ins === 'AE');
  const finalGenAc = events.filter(event => event.command.ins === 'AE').at(-1);
  const aidAttempts: FlowStep[] = [];

  const main: FlowStep[] = [
    {
      id: 'power-on',
      label: 'Power On',
      detail: powerOn ? powerOn.time : 'Waiting for ATR',
      status: powerOn ? 'success' : 'pending',
    },
    {
      id: 'atr',
      label: 'ATR Received',
      detail: powerOn?.responseData ? formatHex(powerOn.responseData.slice(0, 12)) : 'No ATR parsed',
      status: powerOn?.responseData ? 'success' : 'pending',
    },
    ...selectEvents.map((event, index) => ({
      id: `select-${event.id}`,
      label: `${event.sw === '9000' ? 'Select' : 'Try'} ${event.scheme || event.aid || 'AID'}`,
      detail: event.sw === '9000' ? 'Found' : event.sw === '6A82' ? 'Not Found' : event.statusText,
      status: event.sw === '9000' ? 'success' : 'failed',
    } as FlowStep)),
    {
      id: 'gpo',
      label: 'GPO',
      detail: summary.gpoOk ? 'AIP/AFL returned' : 'Not completed',
      status: summary.gpoOk ? 'success' : 'pending',
    },
    {
      id: 'records',
      label: 'Read Records',
      detail: summary.readRecords ? `${summary.readRecords} records read` : 'No records read',
      status: summary.readRecords ? 'success' : 'pending',
    },
    {
      id: 'gen-ac-1',
      label: 'GENERATE AC #1',
      detail: firstGenAc?.cryptogramType || 'No cryptogram',
      status: firstGenAc?.cryptogramType?.startsWith('ARQC') ? 'active' : firstGenAc ? 'warning' : 'pending',
    },
    {
      id: 'online-auth',
      label: 'Online Authorization',
      detail: firstGenAc?.cryptogramType?.startsWith('ARQC') ? 'ISO 8583 sent to issuer' : 'Waiting for ARQC',
      status: firstGenAc?.cryptogramType?.startsWith('ARQC') ? 'active' : 'pending',
    },
  ];

  const approved = summary.finalResult === 'Approved';
  const declined = summary.finalResult === 'Declined';
  const branches: FlowStep[] = [
    {
      id: 'approved-branch',
      label: 'Issuer Approves',
      detail: approved ? finalGenAc?.cryptogramType || 'TC expected' : 'Would complete with 9F27 = 40',
      status: approved ? 'success' : 'pending',
    },
    {
      id: 'declined-branch',
      label: 'Issuer Declines',
      detail: declined ? finalGenAc?.cryptogramType || 'AAC returned' : 'Would complete with 9F27 = 00',
      status: declined ? 'failed' : 'pending',
    },
  ];

  return { main, branches, aidAttempts };
};

interface ApduTransactionParserProps {
  className?: string;
}

const ApduTransactionParser = ({ className = '' }: ApduTransactionParserProps) => {
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState<{ events: ApduEvent[]; summary: Summary; flowSteps: { main: FlowStep[]; branches: FlowStep[]; aidAttempts: FlowStep[] } } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = parsedData?.events.find(event => event.id === selectedEventId) || parsedData?.events.find(event => event.tlvRows.length > 0) || parsedData?.events[0];
  const selectedAfl = selectedEvent ? getTlvValue(selectedEvent.tlvRows, '94') : undefined;
  const aflRows = parseAfl(selectedAfl);

  const handleSubmit = useCallback(() => {
    const events = parseApduLog(input);
    const summary = buildSummary(events);
    const flowSteps = buildFlowSteps(events, summary);
    setParsedData({ events, summary, flowSteps });
    setSelectedEventId(null);
  }, [input]);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_LOG);
    setParsedData(null);
    setSelectedEventId(null);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setParsedData(null);
    setSelectedEventId(null);
  }, []);

  const summary = parsedData?.summary;
  const events = parsedData?.events || [];
  const flowSteps = parsedData?.flowSteps;

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">EMV APDU Transaction Parser</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          Paste card-reader APDU logs to decode SELECT, GPO, READ RECORD, GENERATE AC, TLV tags, AFL, and final cryptogram result.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 mb-4">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">APDU log</label>
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setSelectedEventId(null);
            }}
            placeholder="Paste APDU transaction log here..."
            rows={10}
            className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={handleSubmit} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">Parse APDU</button>
            <button onClick={handleLoadSample} className="px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm">Load Example</button>
            <button onClick={handleClear} className="px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm">Clear</button>
          </div>
        </div>

        {summary && (
          <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Transaction Summary</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-zinc-400">Events</span><span className="font-semibold text-slate-900 dark:text-white">{summary.totalEvents}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-zinc-400">Selected App</span><span className="font-semibold text-slate-900 dark:text-white text-right">{summary.selectedScheme || 'None'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-zinc-400">AID</span><span className="font-mono text-xs text-slate-900 dark:text-white text-right">{summary.selectedAid || '-'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-zinc-400">GPO</span><span className={summary.gpoOk ? 'text-emerald-600 dark:text-emerald-300 font-semibold' : 'text-slate-500 dark:text-zinc-400'}>{summary.gpoOk ? 'Success' : 'Not found'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500 dark:text-zinc-400">Records Read</span><span className="font-semibold text-slate-900 dark:text-white">{summary.readRecords}</span></div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                <p className="text-[11px] text-slate-500 dark:text-zinc-500">First GENERATE AC</p>
                <p className="font-semibold text-slate-900 dark:text-white">{summary.firstCryptogram || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500">Final Result</p>
                <p className={`font-bold ${summary.finalResult === 'Declined' ? 'text-red-600 dark:text-red-300' : summary.finalResult === 'Approved' ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>{summary.finalResult}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!parsedData && input.trim() && (
        <div className="mb-4 p-3 rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 text-xs">
          Click "Parse APDU" to decode the transaction log.
        </div>
      )}

      {!parsedData && input.trim() === '' && (
        <div className="mb-4 p-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 text-xs">
          Paste APDU transaction log above and click "Parse APDU" to see results.
        </div>
      )}

      {parsedData && events.length === 0 && (
        <div className="mb-4 p-3 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs">
          No APDU events found. The parser expects log lines with Start, DATA SENT TO THE CARD, and DATA RECEIVED FROM THE CARD markers.
        </div>
      )}

      {parsedData && events.length > 0 && (
        <div className="space-y-4">
          <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">EMV ATM Transaction Flow</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${summary?.finalResult === 'Declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : summary?.finalResult === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                {summary?.finalResult}
              </span>
            </div>

            <div className="p-2.5 sm:p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
                {flowSteps?.main.map((step, index: number) => (
                  <div key={step.id} className={`min-h-[58px] rounded-md border px-2.5 py-2 ${getFlowStepClasses(step.status)}`}>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 rounded bg-white/70 dark:bg-black/30 px-1.5 py-0.5 font-mono text-[10px]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold leading-4">{step.label}</p>
                        {step.detail && <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 opacity-80">{step.detail}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {flowSteps?.aidAttempts && flowSteps.aidAttempts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-500">AID</span>
                  {flowSteps.aidAttempts.map(step => (
                    <span key={step.id} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${step.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {step.label}: {step.detail}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {flowSteps?.branches.map(step => (
                  <div key={step.id} className={`rounded-md border px-2.5 py-2 ${getFlowStepClasses(step.status)}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{step.label}</p>
                        <p className="text-[11px] opacity-80">{step.detail}</p>
                      </div>
                      <span className="rounded bg-white/65 px-2 py-1 text-[11px] font-semibold dark:bg-black/25">
                        {step.id === 'approved-branch' ? '9F27=40 TC' : '9F27=00 AAC'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead className="bg-slate-50 dark:bg-zinc-900">
                  <tr>
                    {['Time', 'Operation', 'Command', 'AID/SFI', 'SW', 'Result'].map(header => (
                      <th key={header} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-500">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                  {events.map((event: ApduEvent) => (
                    <tr
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`cursor-pointer transition-colors ${selectedEvent?.id === event.id ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/70'}`}
                    >
                      <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-zinc-400">{event.time}</td>
                      <td className="px-3 py-2 text-sm font-medium text-slate-900 dark:text-white">{event.operation}</td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-slate-800 dark:text-slate-200">{event.command.description}</div>
                        <code className="text-[11px] text-slate-500 dark:text-zinc-500">{event.command.ins ? `${event.command.cla} ${event.command.ins} ${event.command.p1} ${event.command.p2}` : 'Raw'}</code>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600 dark:text-zinc-400">
                        {event.aid ? <span>{event.scheme || 'AID'} <code className="font-mono">{event.aid}</code></span> : event.sfi ? <span>SFI {event.sfi}, Record {event.recordNo}</span> : '-'}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{event.sw || '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${event.result === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : event.result === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : event.result === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                          {event.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedEvent && (
            <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
              <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Decoded TLV</h3>
                  <span className="text-xs text-slate-500 dark:text-zinc-500">{selectedEvent.operation} {selectedEvent.sw || ''}</span>
                </div>
                {selectedEvent.tlvRows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead className="bg-slate-50 dark:bg-zinc-900/70">
                        <tr>
                          {['Tag', 'Name', 'Length', 'Value'].map(header => (
                            <th key={header} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-500">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                        {selectedEvent.tlvRows.map((row, index) => (
                          <tr key={`${row.tag}-${index}`} className={row.depth > 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''}>
                            <td className="px-3 py-2">
                              <code className="font-mono text-xs text-blue-700 dark:text-blue-300">{row.depth > 0 ? '↳ ' : ''}{row.tag}</code>
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-200">{row.name}</td>
                            <td className="px-3 py-2 text-xs text-slate-500 dark:text-zinc-500">{row.length}</td>
                            <td className="px-3 py-2">
                              <code className="block max-w-[420px] truncate font-mono text-xs text-slate-700 dark:text-slate-300" title={row.value}>{row.displayValue}</code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-sm text-slate-500 dark:text-zinc-400">No TLV response data decoded for this event.</div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 p-3">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">APDU Detail</h3>
                  <div className="space-y-2 text-xs">
                    <div><span className="text-slate-500 dark:text-zinc-500">Command</span><code className="mt-1 block break-all font-mono text-slate-800 dark:text-slate-200">{formatHex(selectedEvent.commandHex) || '-'}</code></div>
                    <div><span className="text-slate-500 dark:text-zinc-500">Response Data</span><code className="mt-1 block break-all font-mono text-slate-800 dark:text-slate-200">{formatHex(selectedEvent.responseData) || '-'}</code></div>
                    {selectedEvent.cryptogramType && <div><span className="text-slate-500 dark:text-zinc-500">CID</span><p className="font-semibold text-slate-900 dark:text-white">{selectedEvent.cid} - {selectedEvent.cryptogramType}</p></div>}
                  </div>
                </div>

                {aflRows.length > 0 && (
                  <div className="rounded-lg border border-slate-200 dark:border-zinc-800 p-3">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">AFL Interpretation</h3>
                    <div className="space-y-2">
                      {aflRows.map(row => (
                        <div key={row.raw} className="rounded-md bg-slate-50 dark:bg-zinc-900 p-2 text-xs">
                          <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-zinc-500">SFI</span><span className="font-semibold text-slate-900 dark:text-white">{row.sfi}</span></div>
                          <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-zinc-500">Records</span><span className="font-semibold text-slate-900 dark:text-white">{row.firstRecord} to {row.lastRecord}</span></div>
                          <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-zinc-500">Offline Auth</span><span className="font-semibold text-slate-900 dark:text-white">{row.offlineAuthRecords > 0 ? 'Yes' : 'No'}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApduTransactionParser;
