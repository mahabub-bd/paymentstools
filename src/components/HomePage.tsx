import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const menuItems = [
  { id: 'bitmap', label: 'Bitmap Editor', icon: '🔢', category: 'ISO 8583', description: 'Create and edit ISO 8583 bitmaps' },
  { id: 'parser', label: 'Message Parser', icon: '📨', category: 'ISO 8583', description: 'Parse ISO 8583 messages' },
  { id: 'mtireference', label: 'MTI Reference', icon: '📋', category: 'ISO 8583', description: 'Message Type Identifier codes' },
  { id: 'maccalculator', label: 'MAC Calculator', icon: '🔐', category: 'ISO 8583', description: 'Calculate ISO 8583 MAC' },
  { id: 'thaleshsm', label: 'Thales HSM', icon: '🔒', category: 'ISO 8583', description: 'Thales HSM Commands Reference' },
  { id: 'posentry', label: 'POS Entry Mode', icon: '🖥️', category: 'ISO 8583', description: 'Decode Field 22 - POS Entry Mode' },
  { id: 'tlv', label: 'TLV Parser', icon: '📋', category: 'EMV', description: 'Parse EMV TLV data' },
  { id: 'emvtags', label: 'EMV & NFC Tags', icon: '🏷️', category: 'EMV', description: 'Complete EMV & NFC tag reference' },
  { id: 'emvrid', label: 'RID Reference', icon: '📇', category: 'EMV', description: 'Registered Application Provider IDs' },
  { id: 'emvcryptogram', label: 'Cryptogram Calc', icon: '🔐', category: 'EMV', description: 'Calculate ARQC/ARPC for EMV' },
  { id: 'tvr', label: 'TVR', icon: '🧾', category: 'EMV', description: 'Tag 95 decoder' },
  { id: 'cvmresults', label: 'CVM Results', icon: '✅', category: 'EMV', description: 'Tag 9F34 decoder' },
  { id: 'aip', label: 'AIP', icon: '🧩', category: 'EMV', description: 'Tag 82 decoder' },
  { id: 'iad', label: 'IAD', icon: '🧬', category: 'EMV', description: 'Tag 9F10 decoder' },
  { id: 'terminalcaps', label: 'Term Caps', icon: '🖲️', category: 'EMV', description: 'Tag 9F33 decoder' },
  { id: 'pinblock', label: 'PIN Block', icon: '🔐', category: 'PIN Tools', description: 'Calculate PIN blocks' },
  { id: 'pinfromblock', label: 'PIN from Block', icon: '🔓', category: 'PIN Tools', description: 'Extract PIN from PIN block' },
  { id: 'visapvv', label: 'Visa PVV', icon: '💳', category: 'PIN Tools', description: 'Visa PIN Verification Value' },
  { id: 'cvvcalc', label: 'CVV Calculator', icon: '🔢', category: 'PIN Tools', description: 'Calculate CVV/CVC values' },
  { id: 'servicecode', label: 'Service Codes', icon: '🔑', category: 'Reference', description: 'Card service codes reference' },
  { id: 'mcclist', label: 'MCC List', icon: '🏪', category: 'Reference', description: 'Merchant Category Codes' },
  { id: 'paymentkeys', label: 'Payment Keys', icon: '🔑', category: 'Reference', description: 'TMK, TPK, TAK, ZMK, ZPK, ZAK, LMK' },
  { id: 'knowledgebase', label: 'Knowledge Base', icon: '📚', category: 'Reference', description: 'Payment system articles & guides' },
  { id: 'cardgen', label: 'Card Generator', icon: '🎴', category: 'Utilities', description: 'Generate test card numbers' },
  { id: 'converter', label: 'Converters', icon: '🔄', category: 'Utilities', description: 'Hex, ASCII, Base64 converters' },
];

const categoryColors = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  purple: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600',
  slate: 'from-slate-500 to-slate-600',
};

const categories = [
  { id: 'iso8583', label: 'ISO 8583', icon: '📡', color: 'blue' },
  { id: 'emv', label: 'EMV', icon: '💳', color: 'green' },
  { id: 'pin', label: 'PIN Tools', icon: '🔐', color: 'purple' },
  { id: 'reference', label: 'Reference', icon: '📚', color: 'amber' },
  { id: 'utilities', label: 'Utilities', icon: '🔧', color: 'slate' },
];

const HomePage = () => {
  const { theme, toggleTheme } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);

    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes float-rotate {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-10px) rotate(15deg); }
        }
        @keyframes float-rotate-reverse {
          0%, 100% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-10px) rotate(-9deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes particle-float {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-rotate { animation: float-rotate 7s ease-in-out infinite; }
        .animate-float-rotate-reverse { animation: float-rotate-reverse 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
          border-radius: inherit;
        }
        .animate-particle { animation: particle-float linear infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradient-shift 8s ease infinite; }
        .ripple-effect::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 2px solid currentColor;
          animation: ripple 2s ease-out infinite;
        }
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .hover-lift:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.2); }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-zinc-950 transition-colors duration-200 animate-gradient">
        {/* Animated background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className={`absolute top-20 left-20 w-72 h-72 bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse-glow`} />
          <div className={`absolute bottom-20 right-20 w-96 h-96 bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-3xl animate-pulse-glow`} style={{ animationDelay: '1s' }} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-400/20 dark:bg-emerald-600/15 rounded-full blur-3xl animate-pulse-glow`} style={{ animationDelay: '2s' }} />

          {/* Floating Particles */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full bg-blue-400/20 dark:bg-blue-600/10 animate-particle"
              style={{
                left: `${particle.x}%`,
                bottom: '0',
                width: particle.size,
                height: particle.size,
                animationDuration: `${particle.duration}s`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Left Side - ATM Machine */}
        <div className={`fixed left-0 xl:left-4 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none transition-all duration-1000 delay-700 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
          <div className="relative animate-float-slow -ml-20 xl:ml-0">
            <svg width="200" height="320" viewBox="0 0 200 320" className="opacity-30 dark:opacity-40">
              {/* ATM Main Body */}
              <rect x="10" y="10" width="180" height="300" rx="16" fill="currentColor" className="text-slate-700 dark:text-slate-500" />
              {/* ATM Inner Frame */}
              <rect x="20" y="20" width="160" height="280" rx="12" fill="currentColor" className="text-slate-800 dark:text-slate-600" />
              {/* Top Header Area */}
              <rect x="30" y="25" width="140" height="35" rx="4" fill="currentColor" className="text-slate-600 dark:text-slate-500" />
              {/* Bank Logo Area */}
              <circle cx="50" cy="43" r="10" fill="currentColor" className="text-blue-500 dark:text-blue-400" opacity="0.6" />
              <rect x="70" y="38" width="50" height="10" rx="2" fill="currentColor" className="text-slate-400 dark:text-slate-300" opacity="0.7" />
              {/* Large Screen */}
              <rect x="30" y="70" width="140" height="110" rx="6" fill="currentColor" className="text-slate-900 dark:text-slate-800" />
              {/* Screen Display - Welcome Message */}
              <text x="100" y="105" textAnchor="middle" fontSize="12" fill="currentColor" className="text-emerald-400" font-weight="bold">WELCOME</text>
              <text x="100" y="125" textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-400">Insert Card</text>
              {/* Screen Display - Options */}
              <rect x="45" y="140" width="50" height="25" rx="3" fill="currentColor" className="text-blue-600 dark:text-blue-500" opacity="0.7" />
              <text x="70" y="157" textAnchor="middle" fontSize="8" fill="white">Withdrawal</text>
              <rect x="105" y="140" width="50" height="25" rx="3" fill="currentColor" className="text-slate-600 dark:text-slate-500" opacity="0.7" />
              <text x="130" y="157" textAnchor="middle" fontSize="8" fill="white">Balance</text>
              {/* Keypad Area */}
              <rect x="35" y="190" width="130" height="90" rx="6" fill="currentColor" className="text-slate-600 dark:text-slate-500" />
              {/* Keypad Buttons - 3x4 Grid */}
              <circle cx="55" cy="210" r="8" fill="currentColor" className="text-slate-400 dark:text-slate-300" />
              <circle cx="100" cy="210" r="8" fill="currentColor" className="text-slate-400 dark:text-slate-300" />
              <circle cx="145" cy="210" r="8" fill="currentColor" className="text-slate-400 dark:text-slate-300" />
              <circle cx="55" cy="235" r="8" fill="currentColor" className="text-slate-400 dark:text-slate-300" />
              <circle cx="100" cy="235" r="8" fill="currentColor" className="text-slate-400 dark:text-slate-300" />
              <circle cx="145" cy="235" r="8" fill="currentColor" className="text-slate-400 dark:text-slate-300" />
              <circle cx="55" cy="260" r="8" fill="currentColor" className="text-slate-400 dark:text-slate-300" />
              <circle cx="100" cy="260" r="8" fill="currentColor" className="text-slate-400 dark:text-slate-300" />
              <circle cx="145" cy="260" r="8" fill="currentColor" className="text-slate-400 dark:text-slate-300" />
              {/* Clear & Enter Buttons */}
              <rect x="55" y="272" width="30" height="12" rx="2" fill="currentColor" className="text-red-500 dark:text-red-400" opacity="0.6" />
              <rect x="115" y="272" width="30" height="12" rx="2" fill="currentColor" className="text-emerald-500 dark:text-emerald-400" opacity="0.6" />
              {/* Cash Dispenser Slot */}
              <rect x="50" y="290" width="100" height="15" rx="4" fill="currentColor" className="text-slate-900 dark:text-slate-300" />
              <rect x="55" y="293" width="90" height="9" rx="2" fill="currentColor" className="text-slate-950 dark:text-slate-800" />
              {/* Card Reader Slot (side) */}
              <rect x="175" y="150" width="8" height="50" rx="2" fill="currentColor" className="text-slate-600 dark:text-slate-400" />
              <rect x="177" y="160" width="4" height="30" rx="1" fill="currentColor" className="text-slate-800 dark:text-slate-500" />
            </svg>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-500 dark:text-slate-400 font-medium">ATM</div>
          </div>
        </div>

        {/* Left Side - Mastercard */}
        <div className={`fixed left-8 xl:left-20 bottom-32 hidden lg:block pointer-events-none transition-all duration-1000 delay-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative animate-float-rotate-reverse w-[200px] h-[130px]">
            <svg width="200" height="130" viewBox="-10 -10 220 130" className="drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
              {/* Card Body */}
              <rect x="0" y="0" width="200" height="126" rx="12" fill="url(#mcCardGradient)" />
              {/* Card Shine Effect */}
              <rect x="0" y="0" width="200" height="126" rx="12" fill="url(#mcCardShine)" opacity="0.3" />
              {/* EMV Chip */}
              <rect x="20" y="30" width="30" height="24" rx="4" fill="url(#mcChipGradient)" />
              <line x1="25" y1="36" x2="25" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
              <line x1="30" y1="36" x2="30" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
              <line x1="35" y1="36" x2="35" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
              <line x1="40" y1="36" x2="40" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
              <line x1="45" y1="36" x2="45" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
              {/* Contactless Icon */}
              <circle cx="65" cy="42" r="10" stroke="#EB001B" strokeWidth="2" fill="none" opacity="0.5" />
              <circle cx="65" cy="42" r="6" stroke="#EB001B" strokeWidth="1.5" fill="none" opacity="0.4" />
              <circle cx="65" cy="42" r="2" fill="#EB001B" opacity="0.6" />
              {/* Card Number Area */}
              <rect x="20" y="70" width="100" height="16" rx="4" fill="currentColor" className="text-white/20" />
              {/* Mastercard Brand - Two Interlocking Circles */}
              <circle cx="145" cy="95" r="18" fill="#EB001B" opacity="0.9" />
              <circle cx="165" cy="95" r="18" fill="#F79E1B" opacity="0.9" />
              {/* Overlap effect */}
              <circle cx="155" cy="95" r="18" fill="#FF5F00" opacity="0.6" />
              {/* Mastercard Text */}
              <text x="155" y="100" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">mastercard</text>
              {/* Cardholder Name */}
              <rect x="20" y="100" width="70" height="10" rx="2" fill="currentColor" className="text-white/15" />
              {/* Expiry */}
              <rect x="130" y="115" width="45" height="10" rx="2" fill="currentColor" className="text-white/15" />
              <defs>
                <linearGradient id="mcCardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1A1A2E" />
                  <stop offset="50%" stopColor="#16213E" />
                  <stop offset="100%" stopColor="#1A1A2E" />
                </linearGradient>
                <linearGradient id="mcCardShine" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="white" stopOpacity="0" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="mcChipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C9A961" />
                  <stop offset="50%" stopColor="#E5D4A1" />
                  <stop offset="100%" stopColor="#C9A961" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Right Side - POS Terminal (Sunmi P3 style) */}
        <div className={`fixed right-0 xl:right-4 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none transition-all duration-1000 delay-700 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
          <div className="relative animate-float-slow -mr-12 xl:mr-0" style={{ animationDelay: '1s' }}>
            <svg width="140" height="280" viewBox="0 0 140 280" className="opacity-30 dark:opacity-40">
              {/* Printer Base */}
              <rect x="25" y="220" width="90" height="45" rx="6" fill="currentColor" className="text-slate-700 dark:text-slate-500" />
              {/* Paper Slot */}
              <rect x="45" y="255" width="50" height="4" rx="1" fill="currentColor" className="text-slate-900 dark:text-slate-300" />
              {/* Device Body/Tablet */}
              <rect x="20" y="20" width="100" height="200" rx="12" fill="currentColor" className="text-slate-200 dark:text-slate-700" />
              {/* Device Border/Frame */}
              <rect x="22" y="22" width="96" height="196" rx="10" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
              {/* Screen Area */}
              <rect x="28" y="35" width="84" height="150" rx="4" fill="currentColor" className="text-slate-900 dark:text-slate-800" />
              {/* Screen Header - Status Bar */}
              <rect x="30" y="37" width="80" height="12" rx="2" fill="currentColor" className="text-slate-700 dark:text-slate-700" />
              {/* Screen - App Header */}
              <rect x="30" y="52" width="80" height="20" rx="2" fill="currentColor" className="text-emerald-500 dark:text-emerald-600" />
              <text x="70" y="66" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">PAYMENT</text>
              {/* Screen - Amount Display */}
              <text x="70" y="95" textAnchor="middle" fontSize="18" fill="currentColor" className="text-emerald-400" font-weight="bold">৳2,500</text>
              {/* Screen - Payment Methods */}
              <rect x="35" y="110" width="70" height="28" rx="3" fill="currentColor" className="text-slate-800 dark:text-slate-700" />
              {/* Contactless Icon */}
              <circle cx="48" cy="124" r="6" stroke="currentColor" className="text-blue-400" strokeWidth="1.2" fill="none" />
              <circle cx="48" cy="124" r="3.5" stroke="currentColor" className="text-blue-400" strokeWidth="0.8" fill="none" />
              {/* Card Icon */}
              <rect x="62" y="118" width="14" height="10" rx="1.5" fill="currentColor" className="text-amber-500" />
              {/* Cash Icon */}
              <rect x="82" y="118" width="10" height="10" rx="1" fill="currentColor" className="text-green-500" />
              {/* Screen - Button */}
              <rect x="40" y="150" width="60" height="25" rx="4" fill="currentColor" className="text-blue-500 dark:text-blue-600" />
              <text x="70" y="167" textAnchor="middle" fontSize="9" fill="white">PAY NOW</text>
              {/* Home Button */}
              <circle cx="70" cy="198" r="6" fill="currentColor" className="text-slate-400 dark:text-slate-500" />
              {/* Camera/Speaker Top */}
              <circle cx="70" cy="28" r="2" fill="currentColor" className="text-slate-500 dark:text-slate-400" />
            </svg>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-500 dark:text-slate-400 font-medium">POS</div>
          </div>
        </div>

        {/* Credit Card - Floating */}
        <div className={`fixed right-8 xl:right-16 top-24 hidden lg:block pointer-events-none transition-all duration-1000 delay-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <div className="relative animate-float-rotate w-[220px] h-[140px]">
            <svg width="220" height="140" viewBox="-10 -10 220 140" className="drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
              {/* Card Body */}
              <rect x="0" y="0" width="200" height="126" rx="12" fill="url(#cardGradient)" />
              {/* Card Shine Effect */}
              <rect x="0" y="0" width="200" height="126" rx="12" fill="url(#cardShine)" opacity="0.3" />
              {/* EMV Chip */}
              <rect x="20" y="30" width="30" height="24" rx="4" fill="url(#chipGradient)" />
              <line x1="25" y1="36" x2="25" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
              <line x1="30" y1="36" x2="30" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
              <line x1="35" y1="36" x2="35" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
              <line x1="40" y1="36" x2="40" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
              <line x1="45" y1="36" x2="45" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
              {/* Contactless Icon */}
              <circle cx="65" cy="42" r="10" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.7" />
              <circle cx="65" cy="42" r="6" stroke="#D4AF37" strokeWidth="1.5" fill="none" opacity="0.5" />
              <circle cx="65" cy="42" r="2" fill="#D4AF37" opacity="0.7" />
              {/* Card Number Area */}
              <rect x="20" y="70" width="100" height="16" rx="4" fill="currentColor" className="text-white/20" />
              {/* Card Brand */}
              <text x="145" y="100" fontSize="22" fontWeight="bold" fill="#D4AF37" opacity="0.9">VISA</text>
              {/* Cardholder Name */}
              <rect x="20" y="105" width="80" height="10" rx="2" fill="currentColor" className="text-white/15" />
              {/* Expiry */}
              <rect x="135" y="105" width="40" height="10" rx="2" fill="currentColor" className="text-white/15" />
              <defs>
                <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E3A5F" />
                  <stop offset="50%" stopColor="#2D5A87" />
                  <stop offset="100%" stopColor="#1E3A5F" />
                </linearGradient>
                <linearGradient id="cardShine" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="white" stopOpacity="0" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="50%" stopColor="#F4D03F" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Payment System Icons - Floating with enhanced animations */}
        {/* bKash Icon */}
        <div className={`fixed left-8 top-28 hidden xl:block pointer-events-none transition-all duration-1000 delay-1200 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="relative animate-bounce-subtle hover:scale-110 transition-transform duration-300">
            <svg width="55" height="55" viewBox="0 0 60 60" className="opacity-40 dark:opacity-30 drop-shadow-lg">
              <circle cx="30" cy="30" r="28" fill="#E2136E" />
              <text x="30" y="38" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">bKash</text>
            </svg>
          </div>
        </div>

        {/* Nagad Icon */}
        <div className={`fixed right-8 top-28 hidden xl:block pointer-events-none transition-all duration-1000 delay-1300 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="relative animate-bounce-subtle hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.3s' }}>
            <svg width="55" height="55" viewBox="0 0 60 60" className="opacity-40 dark:opacity-30 drop-shadow-lg">
              <circle cx="30" cy="30" r="28" fill="#F26522" />
              <text x="30" y="36" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">Nagad</text>
            </svg>
          </div>
        </div>

        {/* PayPal Icon */}
        <div className={`fixed left-24 top-72 hidden xl:block pointer-events-none transition-all duration-1000 delay-1400 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <div className="relative animate-float hover:scale-110 transition-transform duration-300">
            <svg width="45" height="45" viewBox="0 0 50 50" className="opacity-35 dark:opacity-25 drop-shadow-lg">
              <circle cx="25" cy="25" r="23" fill="#003087" />
              <text x="25" y="30" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">PayPal</text>
            </svg>
          </div>
        </div>

        {/* Stripe Icon */}
        <div className={`fixed right-24 top-72 hidden xl:block pointer-events-none transition-all duration-1000 delay-1500 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
          <div className="relative animate-float hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.5s' }}>
            <svg width="45" height="45" viewBox="0 0 50 50" className="opacity-35 dark:opacity-25 drop-shadow-lg">
              <circle cx="25" cy="25" r="23" fill="#635BFF" />
              <text x="25" y="30" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">Stripe</text>
            </svg>
          </div>
        </div>

        {/* Apple Pay Icon */}
        <div className={`fixed left-32 bottom-20 hidden xl:block pointer-events-none transition-all duration-1000 delay-1600 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative animate-bounce-subtle hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.6s' }}>
            <svg width="50" height="50" viewBox="0 0 55 55" className="opacity-35 dark:opacity-25 drop-shadow-lg">
              <circle cx="27.5" cy="27.5" r="25" fill="black" />
              <path d="M27.5 18 C27.5 18 26 17 24 17 C22 17 20 18.5 20 21 C20 23.5 23 24 25 25 C27 26 28 27 28 29 C28 31.5 25.5 33 23 33 C20.5 33 19 31.5 19 31.5" stroke="white" strokeWidth="2" fill="none" />
              <text x="27.5" y="44" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">Pay</text>
            </svg>
          </div>
        </div>

        {/* Google Pay Icon */}
        <div className={`fixed right-32 bottom-20 hidden xl:block pointer-events-none transition-all duration-1000 delay-1700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative animate-bounce-subtle hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.8s' }}>
            <svg width="50" height="50" viewBox="0 0 55 55" className="opacity-35 dark:opacity-25 drop-shadow-lg">
              <circle cx="27.5" cy="27.5" r="25" fill="white" />
              <text x="27.5" y="32" textAnchor="middle" fontSize="8" fill="#4285F4" fontWeight="bold">G Pay</text>
            </svg>
          </div>
        </div>

        {/* QR Payment Icon - with spin */}
        <div className={`fixed left-1/4 top-16 hidden xl:block pointer-events-none transition-all duration-1000 delay-1800 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative animate-spin-slow hover:scale-110 hover:animate-none transition-transform duration-300">
            <svg width="40" height="40" viewBox="0 0 45 45" className="opacity-30 dark:opacity-20 drop-shadow-lg">
              <rect x="5" y="5" width="35" height="35" rx="4" fill="currentColor" className="text-slate-700 dark:text-slate-400" />
              <rect x="8" y="8" width="10" height="10" fill="white" />
              <rect x="27" y="8" width="10" height="10" fill="white" />
              <rect x="8" y="27" width="10" height="10" fill="white" />
              <rect x="22" y="22" width="6" height="6" fill="white" />
              <rect x="30" y="22" width="6" height="6" fill="white" />
              <rect x="22" y="30" width="6" height="6" fill="white" />
            </svg>
          </div>
        </div>

        {/* NFC Icon - with ripple */}
        <div className={`fixed right-1/4 top-16 hidden xl:block pointer-events-none transition-all duration-1000 delay-1900 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative ripple-effect text-blue-500 dark:text-blue-400 hover:scale-110 transition-transform duration-300">
            <svg width="40" height="40" viewBox="0 0 45 45" className="opacity-30 dark:opacity-20 drop-shadow-lg">
              <circle cx="22.5" cy="22.5" r="18" stroke="currentColor" className="text-blue-500 dark:text-blue-400" strokeWidth="3" fill="none" />
              <circle cx="22.5" cy="22.5" r="12" stroke="currentColor" className="text-blue-500 dark:text-blue-400" strokeWidth="2" fill="none" />
              <circle cx="22.5" cy="22.5" r="6" stroke="currentColor" className="text-blue-500 dark:text-blue-400" strokeWidth="1.5" fill="none" />
              <circle cx="22.5" cy="22.5" r="2" fill="currentColor" className="text-blue-500 dark:text-blue-400" />
            </svg>
          </div>
        </div>

        {/* Cryptocurrency Icon */}
        <div className={`fixed left-1/2 -translate-x-1/2 bottom-16 hidden xl:block pointer-events-none transition-all duration-1000 delay-2000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative animate-float hover:scale-110 transition-transform duration-300" style={{ animationDelay: '1.5s' }}>
            <svg width="45" height="45" viewBox="0 0 50 50" className="opacity-30 dark:opacity-20 drop-shadow-lg">
              <circle cx="25" cy="25" r="22" fill="#F7931A" />
              <text x="25" y="31" textAnchor="middle" fontSize="16" fill="white" fontWeight="bold">₿</text>
            </svg>
          </div>
        </div>

        {/* Rocket Icon */}
        <div className={`fixed left-8 bottom-48 hidden xl:block pointer-events-none transition-all duration-1000 delay-2100 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative animate-float hover:scale-110 transition-transform duration-300" style={{ animationDelay: '2s' }}>
            <svg width="48" height="48" viewBox="0 0 50 50" className="opacity-35 dark:opacity-25 drop-shadow-lg">
              <circle cx="25" cy="25" r="22" fill="#7C2D92" />
              <text x="25" y="30" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">Rocket</text>
            </svg>
          </div>
        </div>

        {/* Upay Icon */}
        <div className={`fixed right-8 bottom-48 hidden xl:block pointer-events-none transition-all duration-1000 delay-2200 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative animate-float hover:scale-110 transition-transform duration-300" style={{ animationDelay: '2.5s' }}>
            <svg width="48" height="48" viewBox="0 0 50 50" className="opacity-35 dark:opacity-25 drop-shadow-lg">
              <circle cx="25" cy="25" r="22" fill="#DC2626" />
              <text x="25" y="30" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">Upay</text>
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className={`max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30 animate-bounce-subtle flex-shrink-0">
                <span className="text-white text-sm sm:text-base lg:text-lg font-bold">PT</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white truncate">Payment Tools</h1>
                <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 truncate hidden xs:block">Payment Industry Developer Tools</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/app/bitmap"
                className="px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm lg:text-base font-medium rounded-lg shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-600/40 hover-lift"
              >
                <span className="hidden sm:inline">Launch App</span>
                <span className="sm:hidden">Launch</span>
              </Link>
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 lg:p-2.5 rounded-lg bg-white dark:bg-zinc-900 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-12"
                title="Toggle dark mode"
              >
                <span className="text-sm sm:text-base lg:text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pb-6 sm:pb-8 lg:pb-10">
          {/* Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to="/app/bitmap"
                className={`group relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 bg-gradient-to-br ${categoryColors[category.color]} shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover-lift animate-shimmer ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-1.5 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">{category.icon}</div>
                <h3 className="text-white text-xs sm:text-sm lg:text-base font-semibold truncate">{category.label}</h3>
              </Link>
            ))}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
            {menuItems.map((item, index) => (
              <Link
                key={item.id}
                to={`/app/${item.id}`}
                className={`group p-3 sm:p-4 lg:p-5 bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-slate-200 dark:border-zinc-800 hover-lift ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${500 + index * 50}ms` }}
              >
                <div className="text-xl sm:text-2xl lg:text-3xl mb-2 sm:mb-2 lg:mb-3 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">{item.icon}</div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm lg:text-base mb-1 sm:mb-1 truncate">{item.label}</h3>
                <p className="text-[10px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-2 lg:line-clamp-2 hidden xs:block">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className={`border-t border-slate-200 dark:border-zinc-800 py-3 sm:py-4 transition-all duration-700 delay-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">© 2026 Payment Tools</p>
            <a
              href="https://github.com/mahabub-bd/paymentstools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-xs text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 transition-colors hover:underline hover:scale-105 inline-block"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
