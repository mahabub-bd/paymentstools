export const HomePageDecorations = ({ loaded }: { loaded: boolean }) => {
  return (
    <>
      <style>{`
        @keyframes float-decoration {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.02); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(5px); }
        }
        .animate-float-decoration {
          animation: float-decoration 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-pulse-soft {
          animation: pulse-soft 4s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle decorative elements */}
      <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top left accent */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-full blur-2xl animate-pulse-soft" />

        {/* Bottom right accent */}
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-tl from-emerald-500/10 to-blue-500/10 rounded-full blur-2xl animate-pulse-soft" style={{ animationDelay: '2s' }} />

        {/* Floating payment icons - positioned away from content areas */}
        {/* Card icon - upper left, well below header */}
        <div className="fixed left-6 top-48 hidden lg:block animate-float-slow opacity-15">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600 dark:text-blue-400">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
        </div>

        {/* Info icon - lower left, well above footer */}
        <div className="fixed left-6 bottom-48 hidden lg:block animate-float-slow opacity-15" style={{ animationDelay: '3s' }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor" className="text-violet-600 dark:text-violet-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>

        {/* Lock icon - upper right, well below header */}
        <div className="fixed right-6 top-48 hidden lg:block animate-float-slow opacity-15" style={{ animationDelay: '5s' }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600 dark:text-emerald-400">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>

        {/* Shield icon - lower right, well above footer */}
        <div className="fixed right-6 bottom-48 hidden lg:block animate-float-slow opacity-15" style={{ animationDelay: '7s' }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor" className="text-amber-600 dark:text-amber-400">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
        </div>
      </div>
    </>
  );
};
