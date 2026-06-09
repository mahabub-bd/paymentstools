import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import type { MenuItem } from '../data';
import { menuItems, TOOL_CATEGORIES } from '../data';
import { animationStyles } from './AppAnimations';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { LoadingScreen } from './LoadingScreen';

const CardGenerator = lazy(() => import('./CardGenerator'));
const ConverterTools = lazy(() => import('./ConverterTools'));
const EmvTlvParser = lazy(() => import('./EmvTlvParser'));
const EmvTlvBuilder = lazy(() => import('./EmvTlvBuilder'));
const EmvTlvComparator = lazy(() => import('./EmvTlvComparator'));
const CavvDecoder = lazy(() => import('./CavvDecoder'));
const TrackGenerator = lazy(() => import('./TrackGenerator'));
const Iso8583VersionParser = lazy(() => import('./Iso8583VersionParser'));
const IsoBitmapEditor = lazy(() => import('./IsoBitmapEditor'));
const MtiReference = lazy(() => import('./MtiReference'));
const ThalesHsmCommands = lazy(() => import('./ThalesHsmCommands'));
const EmvNfcTags = lazy(() => import('./EmvNfcTags'));
const MccList = lazy(() => import('./MccList'));
const PaymentKeysReference = lazy(() => import('./PaymentKeysReference'));
const Iso8583MacCalculator = lazy(() => import('./Iso8583MacCalculator'));
const PinBlockCalculator = lazy(() => import('./PinBlockCalculator'));
const PinFromPinBlock = lazy(() => import('./PinFromPinBlock'));
const PosEntryModeDecoder = lazy(() => import('./PosEntryModeDecoder'));
const ServiceCodeList = lazy(() => import('./ServiceCodeList'));
const VisaPVV = lazy(() => import('./VisaPVV'));
const CvvCalculator = lazy(() => import('./CvvCalculator'));
const EmvCryptogramCalculator = lazy(() => import('./EmvCryptogramCalculator'));
const EmvRIDReference = lazy(() => import('./EmvRIDReference'));
const TvrDecoder = lazy(() => import('./TvrDecoder'));
const CvmResultsDecoder = lazy(() => import('./CvmResultsDecoder'));
const AipDecoder = lazy(() => import('./AipDecoder'));
const IadDecoder = lazy(() => import('./IadDecoder'));
const CvrDecoder = lazy(() => import('./CvrDecoder'));
const TerminalCapabilitiesDecoder = lazy(() => import('./TerminalCapabilitiesDecoder'));
const KnowledgeBase = lazy(() => import('./KnowledgeBase'));
const AidList = lazy(() => import('./AidList'));

const ToolFallback = () => (
  <div className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6">
    <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse mb-4" />
    <div className="space-y-3">
      <div className="h-3 w-full bg-slate-100 dark:bg-zinc-900 rounded animate-pulse" />
      <div className="h-3 w-5/6 bg-slate-100 dark:bg-zinc-900 rounded animate-pulse" />
      <div className="h-3 w-2/3 bg-slate-100 dark:bg-zinc-900 rounded animate-pulse" />
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get active menu from URL path
  const activeMenu = useMemo(() => {
    const path = location.pathname;
    // Remove /app/ prefix to get tool ID
    const match = path.match(/^\/app\/(.+)$/);
    if (match) {
      return match[1];
    }
    return 'bitmap';
  }, [location.pathname]);

  // Initial loading animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Load sidebar state (desktop only)
  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // Save sidebar state (desktop only)
  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

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

  // Handle menu change - navigate to route
  const handleMenuChange = (menuId: string) => {
    if (menuId === activeMenu) return;
    setIsAnimating(true);
    navigate(`/app/${menuId}`);
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-zinc-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
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
          onToggleDarkMode={toggleTheme}
          onShowShortcuts={() => setShowKeyboardShortcuts(true)}
          darkMode={theme === 'dark'}
          isMobile={false}
        />
      </div>

      {/* Mobile Sidebar */}
      <AppSidebar
        isOpen={mobileSidebarOpen}
        searchQuery={searchQuery}
        collapsedCategories={collapsedCategories}
        activeMenu={activeMenu}
        groupedMenuItems={groupedMenuItems}
        toolCategories={TOOL_CATEGORIES}
        onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onSearchChange={setSearchQuery}
        onToggleCategory={toggleCategory}
        onMenuChange={handleMenuChange}
        onToggleDarkMode={toggleTheme}
        onShowShortcuts={() => setShowKeyboardShortcuts(true)}
        darkMode={theme === 'dark'}
        isMobile={true}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <AppHeader
          activeItem={activeItem}
          getCategoryColor={getCategoryColor}
          toolCategories={TOOL_CATEGORIES}
          onShortcutsClick={() => setShowKeyboardShortcuts(true)}
          onMobileMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          showMobileMenu={mobileSidebarOpen}
        />

        {/* Content Area */}
        <div className="px-4 py-6 flex-1">
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <Suspense fallback={<ToolFallback />}>
              <Routes>
                <Route path="/" element={<IsoBitmapEditor />} />
                <Route path="/bitmap" element={<IsoBitmapEditor />} />
                <Route path="/parser" element={<Iso8583VersionParser />} />
                <Route path="/mtireference" element={<MtiReference />} />
                <Route path="/maccalculator" element={<Iso8583MacCalculator />} />
                <Route path="/thaleshsm" element={<ThalesHsmCommands />} />
                <Route path="/tlv" element={<EmvTlvParser />} />
                <Route path="/tlvbuilder" element={<EmvTlvBuilder />} />
                <Route path="/tlvcomparator" element={<EmvTlvComparator />} />
                <Route path="/cavv" element={<CavvDecoder />} />
                <Route path="/emvtags" element={<EmvNfcTags />} />
                <Route path="/emvrid" element={<EmvRIDReference />} />
                <Route path="/emvcryptogram" element={<EmvCryptogramCalculator />} />
                <Route path="/tvr" element={<TvrDecoder />} />
                <Route path="/cvmresults" element={<CvmResultsDecoder />} />
                <Route path="/aip" element={<AipDecoder />} />
                <Route path="/iad" element={<IadDecoder />} />
                <Route path="/cvr" element={<CvrDecoder />} />
                <Route path="/terminalcaps" element={<TerminalCapabilitiesDecoder />} />
                <Route path="/pinblock" element={<PinBlockCalculator />} />
                <Route path="/pinfromblock" element={<PinFromPinBlock />} />
                <Route path="/visapvv" element={<VisaPVV />} />
                <Route path="/cvvcalc" element={<CvvCalculator />} />
                <Route path="/cardgen" element={<CardGenerator />} />
                <Route path="/trackgen" element={<TrackGenerator />} />
                <Route path="/servicecode" element={<ServiceCodeList />} />
                <Route path="/converter" element={<ConverterTools />} />
                <Route path="/mcclist" element={<MccList />} />
                <Route path="/aidlist" element={<AidList />} />
                <Route path="/posentry" element={<PosEntryModeDecoder />} />
                <Route path="/paymentkeys" element={<PaymentKeysReference />} />
                <Route path="/knowledgebase" element={<KnowledgeBase />} />
              </Routes>
            </Suspense>
          </div>
        </div>

        {/* Footer */}
        <AppFooter />

        {/* Home Button */}
        <Link
          to="/"
          className="fixed bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          title="Back to home"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
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

export default Dashboard;
