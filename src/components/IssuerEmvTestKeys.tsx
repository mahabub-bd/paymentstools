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
      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-slate-100 dark:hover:bg-zinc-800"
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

  const KeyCard = ({ keys }: { keys: TestKey }) => {
    const isMasterCard = keys.issuer === 'MasterCard';
    const brandColor = isMasterCard ? 'from-orange-500 to-red-600' : 'from-blue-600 to-blue-800';
    const brandBg = isMasterCard ? 'bg-orange-50 dark:bg-orange-900/10' : 'bg-blue-50 dark:bg-blue-900/10';
    const brandBorder = isMasterCard ? 'border-orange-200 dark:border-orange-800' : 'border-blue-200 dark:border-blue-800';
    const brandIcon = isMasterCard ? '🔴' : '🔵';

    return (
      <div className={`rounded-xl border-2 ${brandBorder} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${brandColor} px-4 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{brandIcon}</span>
              <div>
                <h3 className="font-bold text-white text-base">{keys.issuer}</h3>
                <p className="text-white/90 text-xs">{keys.cardName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Keys */}
        <div className={`p-4 ${brandBg}`}>
          <div className="space-y-3">
            {[
              { label: 'Auth Key', value: keys.authKey, type: 'auth' },
              { label: 'MAC Key', value: keys.macKey, type: 'mac' },
              { label: 'Data Key', value: keys.dataKey, type: 'data' }
            ].map((key) => (
              <div key={key.type} className="flex items-center gap-2 group">
                <div className="flex-1 grid grid-cols-[100px_1fr] gap-2 items-center">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{key.label}</span>
                  <code className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded border border-slate-200 dark:border-zinc-700">
                    {key.value}
                  </code>
                </div>
                <CopyButton text={key.value} label={`${keys.issuer}-${key.type}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const KeyTypeInfo = ({ icon, title, description, color }: { icon: string; title: string; description: string; color: string }) => (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${color}`}>
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">{title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  return (
    <div className={`w-full  mx-auto bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔐</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Issuer EMV Test Keys</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm ml-11">
          Standard EMV test keys for payment card testing
        </p>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Test Keys Only</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            These keys are for development and testing purposes only. Never use production keys in test environments.
            Source: <a href="https://www.eftlab.com/knowledge-base/list-of-issuer-emv-test-keys" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline font-medium">EFTlab</a>
          </p>
        </div>
      </div>

      {/* Test Keys Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {TEST_KEYS.map((keys) => (
          <KeyCard key={keys.issuer} keys={keys} />
        ))}
      </div>

      {/* Key Types Reference */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Key Types Reference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KeyTypeInfo
            icon="🔐"
            title="Auth Key"
            description="Authentication Key - Used for card authentication and cryptogram verification (ARQC/AAC)"
            color="bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800"
          />
          <KeyTypeInfo
            icon="🔑"
            title="MAC Key"
            description="Message Authentication Code Key - Secures data integrity between card and terminal"
            color="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
          />
          <KeyTypeInfo
            icon="💾"
            title="Data Key"
            description="Data Encryption Key - Encrypts sensitive data like PIN and cardholder data"
            color="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
          />
        </div>
      </div>

      {/* Usage Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Usage
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>These keys work with EMV test card ranges</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>MasterCard MTIP keys for Test Issuer Profile</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>VISA ADVT keys for Advancement testing</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Data Source
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Keys sourced from{' '}
            <a
              href="https://www.eftlab.com/knowledge-base/list-of-issuer-emv-test-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              EFTlab Knowledge Base
            </a>
            {' '}– List of Issuer EMV Test Keys
          </p>
        </div>
      </div>
    </div>
  );
};

export default IssuerEmvTestKeys;
