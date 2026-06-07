export const HomePageDecorations = ({ loaded }: { loaded: boolean }) => {
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
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-rotate { animation: float-rotate 7s ease-in-out infinite; }
        .animate-float-rotate-reverse { animation: float-rotate-reverse 6s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>

      {/* Left Side - ATM Machine */}
      <div className={`fixed left-0 xl:left-4 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none transition-all duration-1000 delay-700 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
        <div className="relative animate-float-slow -ml-20 xl:ml-0 scale-75">
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
      <div className={`fixed left-8 xl:left-16 bottom-24 hidden lg:block pointer-events-none transition-all duration-1000 delay-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="relative animate-float-rotate-reverse w-[150px] h-[100px]">
          <svg width="200" height="130" viewBox="-10 -10 220 130" className="drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
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
            <rect x="0" y="0" width="200" height="126" rx="12" fill="url(#mcCardGradient)" />
            <rect x="0" y="0" width="200" height="126" rx="12" fill="url(#mcCardShine)" opacity="0.3" />
            <rect x="20" y="30" width="30" height="24" rx="4" fill="url(#mcChipGradient)" />
            <line x1="25" y1="36" x2="25" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
            <line x1="30" y1="36" x2="30" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
            <line x1="35" y1="36" x2="35" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
            <line x1="40" y1="36" x2="40" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
            <line x1="45" y1="36" x2="45" y2="48" stroke="#C9A961" strokeWidth="1" opacity="0.5" />
            <circle cx="65" cy="42" r="10" stroke="#EB001B" strokeWidth="2" fill="none" opacity="0.5" />
            <circle cx="65" cy="42" r="6" stroke="#EB001B" strokeWidth="1.5" fill="none" opacity="0.4" />
            <circle cx="65" cy="42" r="2" fill="#EB001B" opacity="0.6" />
            <rect x="20" y="70" width="100" height="16" rx="4" fill="currentColor" className="text-white/20" />
            <circle cx="145" cy="95" r="18" fill="#EB001B" opacity="0.9" />
            <circle cx="165" cy="95" r="18" fill="#F79E1B" opacity="0.9" />
            <circle cx="155" cy="95" r="18" fill="#FF5F00" opacity="0.6" />
            <text x="155" y="100" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">mastercard</text>
            <rect x="20" y="100" width="70" height="10" rx="2" fill="currentColor" className="text-white/15" />
            <rect x="130" y="115" width="45" height="10" rx="2" fill="currentColor" className="text-white/15" />
          </svg>
        </div>
      </div>

      {/* Right Side - POS Terminal */}
      <div className={`fixed right-0 xl:right-4 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none transition-all duration-1000 delay-700 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
        <div className="relative animate-float-slow -mr-12 xl:mr-0 scale-75" style={{ animationDelay: '1s' }}>
          <svg width="140" height="280" viewBox="0 0 140 280" className="opacity-30 dark:opacity-40">
            <rect x="25" y="220" width="90" height="45" rx="6" fill="currentColor" className="text-slate-700 dark:text-slate-500" />
            <rect x="45" y="255" width="50" height="4" rx="1" fill="currentColor" className="text-slate-900 dark:text-slate-300" />
            <rect x="20" y="20" width="100" height="200" rx="12" fill="currentColor" className="text-slate-200 dark:text-slate-700" />
            <rect x="22" y="22" width="96" height="196" rx="10" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
            <rect x="28" y="35" width="84" height="150" rx="4" fill="currentColor" className="text-slate-900 dark:text-slate-800" />
            <rect x="30" y="37" width="80" height="12" rx="2" fill="currentColor" className="text-slate-700 dark:text-slate-700" />
            <rect x="30" y="52" width="80" height="20" rx="2" fill="currentColor" className="text-emerald-500 dark:text-emerald-600" />
            <text x="70" y="66" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">PAYMENT</text>
            <text x="70" y="95" textAnchor="middle" fontSize="18" fill="currentColor" className="text-emerald-400" font-weight="bold">৳2,500</text>
            <rect x="35" y="110" width="70" height="28" rx="3" fill="currentColor" className="text-slate-800 dark:text-slate-700" />
            <circle cx="48" cy="124" r="6" stroke="currentColor" className="text-blue-400" strokeWidth="1.2" fill="none" />
            <circle cx="48" cy="124" r="3.5" stroke="currentColor" className="text-blue-400" strokeWidth="0.8" fill="none" />
            <rect x="62" y="118" width="14" height="10" rx="1.5" fill="currentColor" className="text-amber-500" />
            <rect x="82" y="118" width="10" height="10" rx="1" fill="currentColor" className="text-green-500" />
            <rect x="40" y="150" width="60" height="25" rx="4" fill="currentColor" className="text-blue-500 dark:text-blue-600" />
            <text x="70" y="167" textAnchor="middle" fontSize="9" fill="white">PAY NOW</text>
            <circle cx="70" cy="198" r="6" fill="currentColor" className="text-slate-400 dark:text-slate-500" />
            <circle cx="70" cy="28" r="2" fill="currentColor" className="text-slate-500 dark:text-slate-400" />
          </svg>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-500 dark:text-slate-400 font-medium">POS</div>
        </div>
      </div>

      {/* Credit Card - Floating */}
      <div className={`fixed right-8 xl:right-12 top-20 hidden lg:block pointer-events-none transition-all duration-1000 delay-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="relative animate-float-rotate w-[160px] h-[100px]">
          <svg width="220" height="140" viewBox="-10 -10 220 140" className="drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
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
            <rect x="0" y="0" width="200" height="126" rx="12" fill="url(#cardGradient)" />
            <rect x="0" y="0" width="200" height="126" rx="12" fill="url(#cardShine)" opacity="0.3" />
            <rect x="20" y="30" width="30" height="24" rx="4" fill="url(#chipGradient)" />
            <line x1="25" y1="36" x2="25" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
            <line x1="30" y1="36" x2="30" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
            <line x1="35" y1="36" x2="35" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
            <line x1="40" y1="36" x2="40" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
            <line x1="45" y1="36" x2="45" y2="48" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
            <circle cx="65" cy="42" r="10" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.7" />
            <circle cx="65" cy="42" r="6" stroke="#D4AF37" strokeWidth="1.5" fill="none" opacity="0.5" />
            <circle cx="65" cy="42" r="2" fill="#D4AF37" opacity="0.7" />
            <rect x="20" y="70" width="100" height="16" rx="4" fill="currentColor" className="text-white/20" />
            <text x="145" y="100" fontSize="22" fontWeight="bold" fill="#D4AF37" opacity="0.9">VISA</text>
            <rect x="20" y="105" width="80" height="10" rx="2" fill="currentColor" className="text-white/15" />
            <rect x="135" y="105" width="40" height="10" rx="2" fill="currentColor" className="text-white/15" />
          </svg>
        </div>
      </div>

      {/* Payment System Icons */}
      <PaymentSystemIcons loaded={loaded} />
    </>
  );
};

const PaymentSystemIcons = ({ loaded }: { loaded: boolean }) => {
  const icons = [
    { id: 'bkash', label: 'bKash', color: '#E2136E', left: 'left-6', top: 'top-20', delay: 'delay-1200' },
    { id: 'nagad', label: 'Nagad', color: '#F26522', right: 'right-6', top: 'top-20', delay: 'delay-1300' },
    { id: 'paypal', label: 'PayPal', color: '#003087', left: 'left-20', top: 'top-56', delay: 'delay-1400' },
    { id: 'stripe', label: 'Stripe', color: '#635BFF', right: 'right-20', top: 'top-56', delay: 'delay-1500' },
    { id: 'applepay', label: 'Apple Pay', color: 'black', left: 'left-28', bottom: 'bottom-16', delay: 'delay-1600' },
    { id: 'googlepay', label: 'G Pay', color: 'white', textCol: '#4285F4', right: 'right-28', bottom: 'bottom-16', delay: 'delay-1700' },
    { id: 'qr', label: 'QR', color: 'text-slate-700 dark:text-slate-400', left: 'left-1/4 -translate-x-1/2', top: 'top-12', delay: 'delay-1800', special: 'spin' },
    { id: 'nfc', label: 'NFC', color: 'text-blue-500 dark:text-blue-400', right: 'right-1/4 translate-x-1/2', top: 'top-12', delay: 'delay-1900', special: 'ripple' },
    { id: 'crypto', label: '₿', color: '#F7931A', left: 'left-1/2 -translate-x-1/2', bottom: 'bottom-12', delay: 'delay-2000' },
    { id: 'rocket', label: 'Rocket', color: '#7C2D92', left: 'left-6', bottom: 'bottom-36', delay: 'delay-2100' },
    { id: 'upay', label: 'Upay', color: '#DC2626', right: 'right-6', bottom: 'bottom-36', delay: 'delay-2200' },
  ];

  return (
    <>
      {icons.map((icon) => (
        <div
          key={icon.id}
          className={`fixed ${icon.left || ''} ${icon.right || ''} ${icon.top || ''} ${icon.bottom || ''} hidden xl:block pointer-events-none transition-all duration-1000 ${icon.delay} ${loaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className={`relative ${
              icon.special === 'spin' ? 'animate-spin-slow' : icon.special === 'ripple' ? 'ripple-effect' : 'animate-float'
            } hover:scale-110 hover:animate-none transition-transform duration-300 ${icon.special === 'ripple' ? icon.color : ''}`}
          >
            <svg width={icon.special ? 34 : icon.id === 'crypto' || icon.id === 'rocket' || icon.id === 'upay' ? 40 : 42} height={icon.special ? 34 : icon.id === 'crypto' || icon.id === 'rocket' || icon.id === 'upay' ? 40 : 42} viewBox="0 0 55 55" className="opacity-30 dark:opacity-20 drop-shadow-lg">
              {icon.special === 'spin' ? (
                <>
                  <rect x="5" y="5" width="35" height="35" rx="4" fill="currentColor" className={icon.color} />
                  <rect x="8" y="8" width="10" height="10" fill="white" />
                  <rect x="27" y="8" width="10" height="10" fill="white" />
                  <rect x="8" y="27" width="10" height="10" fill="white" />
                  <rect x="22" y="22" width="6" height="6" fill="white" />
                  <rect x="30" y="22" width="6" height="6" fill="white" />
                  <rect x="22" y="30" width="6" height="6" fill="white" />
                </>
              ) : icon.special === 'ripple' ? (
                <>
                  <circle cx="22.5" cy="22.5" r="18" stroke="currentColor" className={icon.color} strokeWidth="3" fill="none" />
                  <circle cx="22.5" cy="22.5" r="12" stroke="currentColor" className={icon.color} strokeWidth="2" fill="none" />
                  <circle cx="22.5" cy="22.5" r="6" stroke="currentColor" className={icon.color} strokeWidth="1.5" fill="none" />
                  <circle cx="22.5" cy="22.5" r="2" fill="currentColor" className={icon.color} />
                </>
              ) : (
                <>
                  <circle cx="27.5" cy="27.5" r="25" fill={icon.color} />
                  <text x="27.5" y={icon.id === 'googlepay' ? 32 : icon.id === 'applepay' ? 44 : icon.id === 'crypto' ? 31 : 35} textAnchor="middle" fontSize={icon.id === 'crypto' ? 16 : icon.id === 'rocket' || icon.id === 'upay' ? 10 : icon.id === 'bkash' || icon.id === 'nagad' ? 14 : 8} fill={icon.id === 'googlepay' ? icon.textCol : 'white'} fontWeight="bold">
                    {icon.label}
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>
      ))}
    </>
  );
};
