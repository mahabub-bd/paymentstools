import { useEffect, useMemo, useState } from 'react';
import CardGenerator from './CardGenerator';
import ConverterTools from './ConverterTools';
import EmvTagList from './EmvTagList';
import EmvTlvParser from './EmvTlvParser';
import Iso8583Parser from './Iso8583Parser';
import IsoBitmapEditor from './IsoBitmapEditor';
import MccList from './MccList';
import PinBlockCalculator from './PinBlockCalculator';
import PinFromPinBlock from './PinFromPinBlock';
import PosEntryModeDecoder from './PosEntryModeDecoder';
import ServiceCodeList from './ServiceCodeList';
import VisaPVV from './VisaPVV';
import { LoadingScreen } from './LoadingScreen';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { AppSidebar } from './AppSidebar';
import { animationStyles } from './AppAnimations';

// Tool categories
const TOOL_CATEGORIES = {
  iso8583: { id: 'iso8583', label: 'ISO 8583', icon: '📡', color: 'blue' },
  emv: { id: 'emv', label: 'EMV', icon: '💳', color: 'green' },
  pin: { id: 'pin', label: 'PIN Tools', icon: '🔐', color: 'purple' },
  reference: { id: 'reference', label: 'Reference', icon: '📚', color: 'amber' },
  utilities: { id: 'utilities', label: 'Utilities', icon: '🔧', color: 'slate' },
} as const;

type MenuItem = {
  id: string;
  label: string;
  icon: string;
  category: string;
  description: string;
  shortcut: string;
};

// Menu items
const menuItems: MenuItem[] = [
  { id: 'bitmap', label: 'Bitmap Editor', icon: '🔢', category: 'iso8583', description: 'Create and edit ISO 8583 bitmaps', shortcut: '1' },
  { id: 'parser', label: 'Message Parser', icon: '📨', category: 'iso8583', description: 'Parse ISO 8583 messages', shortcut: '2' },
  { id: 'posentry', label: 'POS Entry Mode', icon: '🖥️', category: 'iso8583', description: 'Decode Field 22 - POS Entry Mode', shortcut: '3' },
  { id: 'tlv', label: 'TLV Parser', icon: '📋', category: 'emv', description: 'Parse EMV TLV data', shortcut: '4' },
  { id: 'emvtags', label: 'EMV Tags', icon: '🏷️', category: 'emv', description: 'EMV tag reference guide', shortcut: '5' },
  { id: 'pinblock', label: 'PIN Block', icon: '🔐', category: 'pin', description: 'Calculate PIN blocks', shortcut: '6' },
  { id: 'pinfromblock', label: 'PIN from Block', icon: '🔓', category: 'pin', description: 'Extract PIN from PIN block', shortcut: '7' },
  { id: 'visapvv', label: 'Visa PVV', icon: '💳', category: 'pin', description: 'Visa PIN Verification Value', shortcut: '8' },
  { id: 'servicecode', label: 'Service Codes', icon: '🔑', category: 'reference', description: 'Card service codes reference', shortcut: '9' },
  { id: 'mcclist', label: 'MCC List', icon: '🏪', category: 'reference', description: 'Merchant Category Codes', shortcut: '0' },
  { id: 'cardgen', label: 'Card Generator', icon: '🎴', category: 'utilities', description: 'Generate test card numbers', shortcut: 'q' },
  { id: 'converter', label: 'Converters', icon: '🔄', category: 'utilities', description: 'Hex, ASCII, Base64 converters', shortcut: 'w' },
];

const HomePage = () => {
  const [activeMenu, setActiveMenu] = useState('bitmap');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Initial loading animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Load sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle category collapse
  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Handle menu change
  const handleMenuChange = (menuId: string) => {
    if (menuId === activeMenu) return;
    setIsAnimating(true);
    setActiveMenu(menuId);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Filter menu items
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const query = searchQuery.toLowerCase();
    return menuItems.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group items by category
  const groupedMenuItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredMenuItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredMenuItems]);

  // Get active item
  const activeItem = menuItems.find(item => item.id === activeMenu);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
        return;
      }
      if (e.key === 'Escape' && showKeyboardShortcuts) {
        setShowKeyboardShortcuts(false);
        return;
      }
      const shortcutItem = menuItems.find(item => item.shortcut === e.key.toLowerCase());
      if (shortcutItem) {
        e.preventDefault();
        handleMenuChange(shortcutItem.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showKeyboardShortcuts]);

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500',
      slate: 'bg-slate-500',
    };
    return colors[color] || 'bg-slate-500';
  };

  // Loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Tool components map
  const toolComponents: Record<string, React.ReactNode> = {
    bitmap: <IsoBitmapEditor />,
    parser: <Iso8583Parser />,
    tlv: <EmvTlvParser />,
    pinblock: <PinBlockCalculator />,
    pinfromblock: <PinFromPinBlock />,
    visapvv: <VisaPVV />,
    cardgen: <CardGenerator />,
    servicecode: <ServiceCodeList />,
    converter: <ConverterTools />,
    mcclist: <MccList />,
    emvtags: <EmvTagList />,
    posentry: <PosEntryModeDecoder />,
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        isOpen={sidebarOpen}
        searchQuery={searchQuery}
        collapsedCategories={collapsedCategories}
        activeMenu={activeMenu}
        groupedMenuItems={groupedMenuItems}
        toolCategories={TOOL_CATEGORIES}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSearchChange={setSearchQuery}
        onToggleCategory={toggleCategory}
        onMenuChange={handleMenuChange}
        onToggleDarkMode={toggleDarkMode}
        onShowShortcuts={() => setShowKeyboardShortcuts(true)}
        darkMode={darkMode}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <AppHeader
          activeItem={activeItem}
          getCategoryColor={getCategoryColor}
          toolCategories={TOOL_CATEGORIES}
          onShortcutsClick={() => setShowKeyboardShortcuts(true)}
        />

        {/* Content Area */}
        <div className="px-4 py-6 flex-1">
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {toolComponents[activeMenu] || <IsoBitmapEditor />}
          </div>
        </div>

        {/* Footer */}
        <AppFooter />
      </main>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        menuItems={menuItems}
      />

      {/* Animation Styles */}
      <style>{animationStyles}</style>
    </div>
  );
};

export default HomePage;
