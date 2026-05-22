export const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scaleUp {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulseSlow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes bounceSlow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  .animate-fade-in { animation: fadeIn 0.5s ease-out; }
  .animate-fade-in-left { animation: fadeInLeft 0.5s ease-out; }
  .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
  .animate-slide-in { animation: slideIn 0.4s ease-out; }
  .animate-scale-up { animation: scaleUp 0.3s ease-out; }
  .animate-scale-in { animation: scaleUp 0.2s ease-out; }
  .animate-float { animation: float 3s ease-in-out infinite; }
  .animate-spin-slow { animation: spinSlow 3s linear infinite; }
  .animate-pulse-slow { animation: pulseSlow 2s ease-in-out infinite; }
  .animate-bounce-slow { animation: bounceSlow 2s ease-in-out infinite; }

  .hover\\:scale-102:hover { transform: scale(1.02); }
  .hover\\:rotate-12:hover { transform: rotate(12deg); }
  .hover\\:scale-110:hover { transform: scale(1.1); }

  /* Custom scrollbar */
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
`;
