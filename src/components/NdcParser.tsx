import { useCallback, useState } from 'react';
import {
  analyzeNdcLog,
  parseNdcMessage,
  toPrintable,
  type NdcAnalysis,
  type NdcMessage,
  type NdcTransaction,
  type NdcDeviceEvent,
} from '../utils/ndcParser';

type TabId = 'input' | 'analysis';

const SAMPLE_LOG = `12.07.2024 14:32:15.123 <Out
\x021\x01\x1c000\x1c12345678\x1c1\x1c\x1c\x1c\x1c000000010000\x1c\x1c\x1c\x03
12.07.2024 14:32:15.456 In>
\x024\x1c000\x1c12345678\x1c\x1c0001\x1c000000010100\x1c00\x1c\x03
12.07.2024 14:32:15.789 <Out
\x022\x02\x1c000\x1c12345678\x1c9\x1c\x03`;

const SAMPLE_SINGLE = `0211000012345678 1C 00000000 1C 1C 1C 1C 000000005000 1C 1C 1C 03`;

const NdcParser = () => {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('input');
  const [direction, setDirection] = useState<'auto' | 'Terminal -> Host' | 'Host -> Terminal'>('auto');
  const [parsedMessage, setParsedMessage] = useState<NdcMessage | null>(null);
  const [logAnalysis, setLogAnalysis] = useState<NdcAnalysis | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  const handleParse = useCallback(() => {
    try {
      // Check if this looks like a full log (has timestamp markers)
      const hasLogMarkers = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}\.\d{3}/i.test(input.trim());

      if (hasLogMarkers) {
        const analysis = analyzeNdcLog(input);
        setLogAnalysis(analysis);
        setParsedMessage(null);
        setActiveTab('analysis');
      } else {
        // Single message parse
        const msg = parseNdcMessage(input, direction);
        setParsedMessage(msg);
        setLogAnalysis(null);
        setActiveTab('analysis');
      }
    } catch (error) {
      console.error('Parse error:', error);
      // Show error in UI would be good
    }
  }, [input, direction]);

  const handleLoadSample = useCallback((type: 'log' | 'single') => {
    if (type === 'log') {
      setInput(SAMPLE_LOG);
    } else {
      setInput(SAMPLE_SINGLE);
    }
    setParsedMessage(null);
    setLogAnalysis(null);
    setSelectedTransactionId(null);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setParsedMessage(null);
    setLogAnalysis(null);
    setSelectedTransactionId(null);
  }, []);

  const selectedTransaction = logAnalysis?.transactions.find(
    (_, idx) => idx === selectedTransactionId
  ) || logAnalysis?.transactions[0];

  return (
    <div className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">NDC+ Parser</h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          APTRA Advance NDC message parser and full transaction log analyzer. Decodes fields, EMV TLV data, and device status.
        </p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('input')}
          className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${
            activeTab === 'input'
              ? 'bg-[#1f3a5f] text-white'
              : 'bg-[#dfe5ee] text-[#1f3a5f] hover:bg-[#cdd6e4]'
          }`}
        >
          Input
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${
            activeTab === 'analysis'
              ? 'bg-[#1f3a5f] text-white'
              : 'bg-[#dfe5ee] text-[#1f3a5f] hover:bg-[#cdd6e4]'
          }`}
        >
          Analysis
        </button>
      </div>

      {/* Input Tab */}
      {activeTab === 'input' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-700 dark:text-slate-300 font-medium">Direction:</span>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="direction"
                value="auto"
                checked={direction === 'auto'}
                onChange={() => setDirection('auto')}
                className="accent-blue-600"
              />
              <span className="text-slate-600 dark:text-slate-400">Auto-detect</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="direction"
                value="Terminal -> Host"
                checked={direction === 'Terminal -> Host'}
                onChange={() => setDirection('Terminal -> Host')}
                className="accent-blue-600"
              />
              <span className="text-slate-600 dark:text-slate-400">Terminal → Host</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="direction"
                value="Host -> Terminal"
                checked={direction === 'Host -> Terminal'}
                onChange={() => setDirection('Host -> Terminal')}
                className="accent-blue-600"
              />
              <span className="text-slate-600 dark:text-slate-400">Host → Terminal</span>
            </label>
            <div className="flex-1" />
            <button
              onClick={handleClear}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
              Clear
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-zinc-500">
            Raw NDC data (single message, or a full port log with timestamp/direction lines). Separators may be raw bytes, hex, or &lt;FS&gt;/&lt;GS&gt; tokens.
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste raw NDC message or port log here..."
            rows={12}
            className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleParse}
              className="px-4 py-2 bg-[#1f3a5f] text-white rounded-md hover:bg-[#2e75b6] transition-colors text-sm font-bold"
            >
              ▶ Analyze
            </button>
            <button
              onClick={() => handleLoadSample('log')}
              className="px-3 py-2 bg-[#2e75b6] text-white rounded-md hover:bg-[#1f3a5f] transition-colors text-sm font-medium"
            >
              Load Log Sample
            </button>
            <button
              onClick={() => handleLoadSample('single')}
              className="px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
              Load Message Sample
            </button>
            <span className="text-xs text-slate-500 dark:text-zinc-500 self-center">
              Auto-detects single message vs. full log.
            </span>
          </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          {/* Summary */}
          {!logAnalysis && !parsedMessage && (
            <div className="p-4 bg-[#eef2f8] dark:bg-zinc-900 text-[#1f3a5f] dark:text-slate-300 rounded-md">
              No analysis yet. Go to Input tab to parse NDC data.
            </div>
          )}

          {/* Single Message Analysis */}
          {parsedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Message Info */}
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Message Information</h3>
                  </div>
                  <div className="p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-500">Direction</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{parsedMessage.direction}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-500">Message Class</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {parsedMessage.msgClass} - {parsedMessage.msgClassName}
                      </span>
                    </div>
                    {parsedMessage.msgSub && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-500">Sub-Class</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {parsedMessage.msgSub} - {parsedMessage.msgSubName || 'N/A'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-500">Class Valid</span>
                      <span className={`font-semibold ${parsedMessage.classValid ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
                        {parsedMessage.classValid ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {parsedMessage.issue && (
                      <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                        <span className="text-red-600 dark:text-red-300 text-xs">Issues:</span>
                        <ul className="text-xs text-red-600 dark:text-red-300 list-disc list-inside">
                          {parsedMessage.issueNotes.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw Payload */}
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Raw Payload (Printable)</h3>
                  </div>
                  <div className="p-3">
                    <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all block max-h-32 overflow-auto">
                      {parsedMessage.rawPrintable}
                    </code>
                  </div>
                </div>
              </div>

              {/* Decoded Fields */}
              {parsedMessage.fields.length > 0 && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Decoded Fields</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-zinc-900/70">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Field</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Value</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                        {parsedMessage.fields.map((field, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-mono text-xs text-blue-700 dark:text-blue-300">{field.label}</td>
                            <td className="px-3 py-2">
                              <code className="text-xs text-slate-700 dark:text-slate-300">{field.value || '-'}</code>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-zinc-400">{field.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Device Rows */}
              {parsedMessage.deviceRows.length > 0 && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Device Status Block</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-zinc-900/70">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Field</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Value</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                        {parsedMessage.deviceRows.map((field, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-mono text-xs text-blue-700 dark:text-blue-300">{field.label}</td>
                            <td className="px-3 py-2">
                              <code className="text-xs text-slate-700 dark:text-slate-300">{field.value || '-'}</code>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-zinc-400">{field.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EMV TLV */}
              {parsedMessage.emvRows.length > 0 && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">EMV TLV Data</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-zinc-900/70">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Tag</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Length</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Value (Hex)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                        {parsedMessage.emvRows.map((row, idx) => (
                          <tr key={idx} className={row.depth > 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''}>
                            <td className="px-3 py-2">
                              <code className="font-mono text-xs text-blue-700 dark:text-blue-300">
                                {row.depth > 0 ? '→ ' : ''}{row.tag}
                              </code>
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-200">{row.name}</td>
                            <td className="px-3 py-2 text-xs text-slate-500 dark:text-zinc-500">{row.length}</td>
                            <td className="px-3 py-2">
                              <code className="text-xs text-slate-700 dark:text-slate-300 truncate block max-w-xs">{row.value}</code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Log Analysis */}
          {logAnalysis && (
            <div className="space-y-4">
              {/* Analysis Summary */}
              <div className="p-4 bg-[#eef2f8] dark:bg-zinc-900 rounded-md text-sm">
                <div className="flex flex-wrap gap-4 text-[#1f3a5f] dark:text-slate-300">
                  <span>Total Messages: <strong>{logAnalysis.totalMsgs}</strong></span>
                  <span>Transactions: <strong className="text-emerald-600 dark:text-emerald-300">{logAnalysis.transactions.length}</strong></span>
                  <span>Device Events: <strong className="text-amber-600 dark:text-amber-300">{logAnalysis.deviceEvents.length}</strong></span>
                  <span>Requests: <strong>{logAnalysis.counts.requests}</strong></span>
                  <span>Replies: <strong>{logAnalysis.counts.replies}</strong></span>
                </div>
              </div>

              {/* Transaction List */}
              {logAnalysis.transactions.length > 0 && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Transactions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#1f3a5f] text-white">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-bold">#</th>
                          <th className="px-3 py-2 text-left text-xs font-bold">Time</th>
                          <th className="px-3 py-2 text-left text-xs font-bold">PAN</th>
                          <th className="px-3 py-2 text-left text-xs font-bold">TVN</th>
                          <th className="px-3 py-2 text-left text-xs font-bold">ARC</th>
                          <th className="px-3 py-2 text-left text-xs font-bold">Function</th>
                          <th className="px-3 py-2 text-left text-xs font-bold">Verdict</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                        {logAnalysis.transactions.map((txn, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedTransactionId(idx)}
                            className={`cursor-pointer transition-colors ${
                              selectedTransactionId === idx
                                ? 'bg-blue-50 dark:bg-blue-950/30'
                                : 'hover:bg-slate-50 dark:hover:bg-zinc-900/70'
                            } ${
                              txn.verdict.startsWith('APPROVED')
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/10'
                                : txn.verdict.startsWith('DECLINED')
                                ? 'bg-red-50/50 dark:bg-red-950/10'
                                : ''
                            }`}
                          >
                            <td className="px-3 py-2 text-slate-600 dark:text-zinc-400">{idx + 1}</td>
                            <td className="px-3 py-2 text-xs font-mono text-slate-600 dark:text-zinc-400">{txn.ts}</td>
                            <td className="px-3 py-2">
                              <code className="text-xs text-slate-700 dark:text-slate-300">{txn.pan || '-'}</code>
                            </td>
                            <td className="px-3 py-2 text-xs font-mono text-slate-600 dark:text-zinc-400">{txn.tvn || '-'}</td>
                            <td className="px-3 py-2">
                              {txn.arc ? (
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white dark:bg-zinc-800">
                                  {txn.arc}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-zinc-400">
                              {txn.funcName || '-'}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`text-xs font-semibold ${
                                  txn.verdict.startsWith('APPROVED')
                                    ? 'text-emerald-600 dark:text-emerald-300'
                                    : txn.verdict.startsWith('DECLINED')
                                    ? 'text-red-600 dark:text-red-300'
                                    : 'text-amber-600 dark:text-amber-300'
                                }`}
                              >
                                {txn.verdict}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Transaction Detail */}
              {selectedTransaction && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Transaction Detail</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-zinc-500 text-xs">Time</span>
                        <p className="font-mono text-slate-900 dark:text-white">{selectedTransaction.ts}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-zinc-500 text-xs">TVN</span>
                        <p className="font-mono text-slate-900 dark:text-white">{selectedTransaction.tvn || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-zinc-500 text-xs">ARC</span>
                        <p className="font-mono text-slate-900 dark:text-white">{selectedTransaction.arc || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-zinc-500 text-xs">Approval Code</span>
                        <p className="font-mono text-slate-900 dark:text-white">{selectedTransaction.approval || '-'}</p>
                      </div>
                    </div>
                    {selectedTransaction.funcId && (
                      <div className="text-sm">
                        <span className="text-slate-500 dark:text-zinc-500 text-xs">Function</span>
                        <p className="text-slate-900 dark:text-white">
                          <span className="font-mono bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded mr-2">
                            {selectedTransaction.funcId}
                          </span>
                          {selectedTransaction.funcName}
                        </p>
                      </div>
                    )}
                    {selectedTransaction.notes && selectedTransaction.notes.length > 0 && (
                      <div className="text-sm">
                        <span className="text-slate-500 dark:text-zinc-500 text-xs">Notes</span>
                        <ul className="text-amber-600 dark:text-amber-300 text-xs list-disc list-inside">
                          {selectedTransaction.notes.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Device Events */}
              {logAnalysis.deviceEvents.length > 0 && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Device Events</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-zinc-900/70">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Time</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Device</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">DIG</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500 dark:text-zinc-500">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                        {logAnalysis.deviceEvents.map((event, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-xs font-mono text-slate-600 dark:text-zinc-400">{event.ts}</td>
                            <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-200">{event.device}</td>
                            <td className="px-3 py-2">
                              <code className="text-xs text-slate-700 dark:text-slate-300">{event.dig}</code>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-zinc-400">{event.status}</td>
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-zinc-400">{event.severity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NdcParser;
