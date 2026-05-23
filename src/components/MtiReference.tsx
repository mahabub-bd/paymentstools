import { useMemo, useState } from 'react';

const MTI_DATA = [
  { mti: '0100', meaning: 'Authorization Request', usage: 'Request from a point-of-sale terminal for authorization for a cardholder purchase' },
  { mti: '0110', meaning: 'Authorization Response', usage: 'Request response to a point-of-sale terminal for authorization for a cardholder purchase' },
  { mti: '0120', meaning: 'Authorization Advice', usage: 'When the point-of-sale device breaks down and you have to sign a voucher' },
  { mti: '0121', meaning: 'Authorization Advice Repeat', usage: 'If the advice times out' },
  { mti: '0130', meaning: 'Acquirer Response to Authorization Advice', usage: 'Confirmation of receipt of authorization advice' },
  { mti: '0200', meaning: 'Acquirer Financial Request', usage: 'Request for funds, typically from an ATM or pinned point-of-sale device' },
  { mti: '0210', meaning: 'Acquirer Response to Financial Request', usage: 'Issuer response to request for funds' },
  { mti: '0220', meaning: 'Acquirer Financial Advice', usage: 'e.g. Checkout at a hotel. Used to complete transaction initiated with authorization request' },
  { mti: '0221', meaning: 'Acquirer Financial Advice Repeat', usage: 'If the advice times out' },
  { mti: '0230', meaning: 'Acquirer Response to Financial Advice', usage: 'Confirmation of receipt of financial advice' },
  { mti: '0320', meaning: 'Batch Upload', usage: 'File update/transfer advice' },
  { mti: '0330', meaning: 'Batch Upload Response', usage: 'File update/transfer advice response' },
  { mti: '0400', meaning: 'Acquirer Reversal Request', usage: 'Reverses a transaction' },
  { mti: '0420', meaning: 'Acquirer Reversal Advice', usage: 'Advice for reversal transaction' },
  { mti: '0430', meaning: 'Acquirer Reversal Advice Response', usage: 'Response to reversal advice' },
  { mti: '0510', meaning: 'Batch Settlement Response', usage: 'Card acceptor reconciliation request response' },
  { mti: '0800', meaning: 'Network Management Request', usage: 'Hypercom terminals initialize request. Echo test, logon, logoff etc.' },
  { mti: '0810', meaning: 'Network Management Response', usage: 'Hypercom terminals initialize response. Echo test, logon, logoff etc.' },
  { mti: '0820', meaning: 'Network Management Advice', usage: 'Key change' },
];

const MTI_CATEGORIES = [
  { id: 'auth', label: 'Authorization (01xx)', color: 'blue' },
  { id: 'financial', label: 'Financial (02xx)', color: 'green' },
  { id: 'batch', label: 'Batch/File (03xx)', color: 'purple' },
  { id: 'reversal', label: 'Reversal (04xx)', color: 'red' },
  { id: 'settlement', label: 'Settlement (05xx)', color: 'amber' },
  { id: 'network', label: 'Network (08xx)', color: 'slate' },
];

export function MtiReference({ className = '' }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return MTI_DATA.filter(item => {
      const matchesSearch = !searchQuery.trim() ||
        item.mti.includes(searchQuery) ||
        item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.usage.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || (() => {
        const prefix = item.mti.substring(0, 2);
        switch (selectedCategory) {
          case 'auth': return prefix === '01';
          case 'financial': return prefix === '02';
          case 'batch': return prefix === '03';
          case 'reversal': return prefix === '04';
          case 'settlement': return prefix === '05';
          case 'network': return prefix === '08';
          default: return true;
        }
      })();

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      slate: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    };
    return colors[color] || colors.slate;
  };

  const getActiveCategoryStyle = (color: string) => {
    const styles: Record<string, string> = {
      blue: 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white',
      green: 'bg-green-600 text-white dark:bg-green-600 dark:text-white',
      purple: 'bg-purple-600 text-white dark:bg-purple-600 dark:text-white',
      red: 'bg-red-600 text-white dark:bg-red-600 dark:text-white',
      amber: 'bg-amber-600 text-white dark:bg-amber-600 dark:text-white',
      slate: 'bg-slate-600 text-white dark:bg-slate-600 dark:text-white',
    };
    return styles[color] || styles.slate;
  };

  const getCategoryForMti = (mti: string) => {
    const prefix = mti.substring(0, 2);
    switch (prefix) {
      case '01': return { id: 'auth', color: 'blue' };
      case '02': return { id: 'financial', color: 'green' };
      case '03': return { id: 'batch', color: 'purple' };
      case '04': return { id: 'reversal', color: 'red' };
      case '05': return { id: 'settlement', color: 'amber' };
      case '08': return { id: 'network', color: 'slate' };
      default: return { id: 'other', color: 'slate' };
    }
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          ISO 8583 MTI Reference
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Message Type Identifier (MTI) codes and their usage in ISO 8583 transactions
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by MTI, meaning, or usage..."
          className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {/* Category Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          All ({MTI_DATA.length})
        </button>
        {MTI_CATEGORIES.map(cat => {
          const count = MTI_DATA.filter(item => item.mti.startsWith(cat.id.substring(0, 2))).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? getActiveCategoryStyle(cat.color)
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Showing {filteredData.length} of {MTI_DATA.length} MTI codes
      </div>

      {/* MTI Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
              <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">MTI</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Meaning</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Usage</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => {
              const category = getCategoryForMti(item.mti);
              return (
                <tr
                  key={item.mti}
                  className="border-b border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                      {item.mti}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(category.color)}`}>
                      {category.id.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {item.meaning}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-md">
                    {item.usage}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-zinc-500">
          <p>No MTI codes found matching your search.</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">MTI Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <p><span className="font-mono font-bold">D1</span> - Version (ISO 8583:1987 = 0, 1993 = 1, 2003 = 2)</p>
            <p><span className="font-mono font-bold">D2</span> - Message Class (01xx=Auth, 02xx=Financial, etc.)</p>
          </div>
          <div>
            <p><span className="font-mono font-bold">D3</span> - Message Function (Request=0, Response=1, Advice=2)</p>
            <p><span className="font-mono font-bold">D4</span> - Originator (Acquirer=0, Acquirer Repeat=1, etc.)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MtiReference;
