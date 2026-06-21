import { useState } from 'react';

// Test keys from EFTlab - https://www.eftlab.com/knowledge-base/list-of-issuer-emv-test-keys
interface TestKey {
  issuer: string;
  cardName: string;
  authKey: string;
  macKey: string;
  dataKey: string;
}

const TEST_KEYS: TestKey[] = [
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

const IssuerEmvTestKeys = ({ className = '' }: { className?: string }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => handleCopy(text, label)}
      className="ml-2 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
      title={`Copy ${label}`}
    >
      {copiedKey === label ? (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );

  const KeyField = ({ label, value, index, keyType }: { label: string; value: string; index: number; keyType: string }) => (
    <div className="flex items-center justify-between group">
      <label className="text-xs text-slate-500 dark:text-slate-400 w-24 font-medium">{label}</label>
      <code className="flex-1 font-mono text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-zinc-950 px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 shadow-sm">
        {value}
      </code>
      <CopyButton text={value} label={`${keyType}-${index}`} />
    </div>
  );

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Issuer EMV Test Keys
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Standard EMV test keys for payment card testing (MasterCard & VISA)
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Test Keys Only</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              These keys are for development and testing purposes only. Never use production keys in test environments.
              Source: <a href="https://www.eftlab.com/knowledge-base/list-of-issuer-emv-test-keys" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">EFTlab</a>
            </p>
          </div>
        </div>
      </div>

      {/* Test Keys Table */}
      <div className="space-y-4">
        {TEST_KEYS.map((keys, index) => (
          <div key={index} className="overflow-hidden rounded-lg border-2 border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950">
            {/* Card Header */}
            <div className={`px-4 py-3 border-b border-slate-200 dark:border-zinc-800 ${
              keys.issuer === 'MasterCard'
                ? 'bg-gradient-to-r from-orange-500 to-red-600'
                : 'bg-gradient-to-r from-blue-600 to-blue-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{keys.issuer === 'MasterCard' ? '🔴' : '🔵'}</span>
                  <div>
                    <h3 className="font-bold text-white text-lg">{keys.issuer}</h3>
                    <p className="text-white/80 text-sm">{keys.cardName}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold text-white">
                  Test Keys
                </span>
              </div>
            </div>

            {/* Keys List */}
            <div className="p-4 space-y-3">
              <KeyField label="Auth Key" value={keys.authKey} index={index} keyType="auth" />
              <KeyField label="MAC Key" value={keys.macKey} index={index} keyType="mac" />
              <KeyField label="Data Key" value={keys.dataKey} index={index} keyType="data" />
            </div>
          </div>
        ))}
      </div>

      {/* Key Types Reference */}
      <div className="mt-8 p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Key Types Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-white dark:bg-zinc-950 rounded border border-slate-200 dark:border-zinc-800">
            <p className="font-semibold text-purple-600 dark:text-purple-400 mb-1">🔐 Auth Key</p>
            <p className="text-slate-600 dark:text-slate-400">Authentication Key - Used for card authentication and cryptogram verification (ARQC/AAC)</p>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-950 rounded border border-slate-200 dark:border-zinc-800">
            <p className="font-semibold text-green-600 dark:text-green-400 mb-1">🔑 MAC Key</p>
            <p className="text-slate-600 dark:text-slate-400">Message Authentication Code Key - Secures data integrity between card and terminal</p>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-950 rounded border border-slate-200 dark:border-zinc-800">
            <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">💾 Data Key</p>
            <p className="text-slate-600 dark:text-slate-400">Data Encryption Key - Encrypts sensitive data like PIN and cardholder data</p>
          </div>
        </div>
      </div>

      {/* Usage Notes */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Usage Notes</h3>
        <ul className="space-y-1.5 text-xs text-blue-600 dark:text-blue-400">
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>These keys work with EMV test card ranges provided by the payment networks</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>MasterCard MTIP keys are used for MasterCard Test Issuer Profile testing</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>VISA ADVT keys are used for VISA Advancement/Development testing</span>
          </li>
        </ul>
      </div>

      {/* Source Attribution */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Data source:{' '}
          <a
            href="https://www.eftlab.com/knowledge-base/list-of-issuer-emv-test-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            EFTlab Knowledge Base - List of Issuer EMV Test Keys
          </a>
        </p>
      </div>
    </div>
  );
};

export default IssuerEmvTestKeys;
