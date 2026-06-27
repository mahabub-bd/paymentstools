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
  blue: 'from-[#00f0ff] to-blue-500',
  green: 'from-[#00f0ff] to-blue-500',
  purple: 'from-[#00f0ff] to-blue-500',
  amber: 'from-[#00f0ff] to-blue-500',
  slate: 'from-[#00f0ff] to-blue-500',
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
