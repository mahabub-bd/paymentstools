export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const categories: Category[] = [
  { id: 'iso8583', label: 'ISO 8583', icon: '📡', color: 'blue' },
  { id: 'emv', label: 'EMV', icon: '💳', color: 'green' },
  { id: 'pin', label: 'PIN Tools', icon: '🔐', color: 'purple' },
  { id: 'reference', label: 'Reference', icon: '📚', color: 'amber' },
  { id: 'utilities', label: 'Utilities', icon: '🔧', color: 'slate' },
];

// For HomePage - Tailwind gradient classes
export const categoryColors: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  purple: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600',
  slate: 'from-slate-500 to-slate-600',
};

// For Dashboard - solid color classes
export const toolCategoryColors: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-500',
};

// Tool categories for Dashboard (uses category IDs as keys)
export const TOOL_CATEGORIES = {
  iso8583: { id: 'iso8583', label: 'ISO 8583', icon: '📡', color: 'blue' },
  emv: { id: 'emv', label: 'EMV', icon: '💳', color: 'green' },
  pin: { id: 'pin', label: 'PIN Tools', icon: '🔐', color: 'purple' },
  reference: { id: 'reference', label: 'Reference', icon: '📚', color: 'amber' },
  utilities: { id: 'utilities', label: 'Utilities', icon: '🔧', color: 'slate' },
} as const;
