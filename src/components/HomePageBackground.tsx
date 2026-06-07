import { useState, useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export const HomePageBackground = ({ loaded }: { loaded: boolean }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 15 + 20,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <>
      <style>{`
        @keyframes particle-rise {
          0% { transform: translateY(100vh) translateX(0) scale(0); opacity: 0; }
          10% { opacity: var(--opacity); transform: translateY(80vh) translateX(10px) scale(1); }
          90% { opacity: var(--opacity); }
          100% { transform: translateY(-10vh) translateX(-20px) scale(0.8); opacity: 0; }
        }
        @keyframes gradient-slow {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.5; transform: scale(1.1) translate(-20px, 20px); }
        }
        @keyframes gradient-slow-2 {
          0%, 100% { opacity: 0.25; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.45; transform: scale(1.15) translate(30px, -30px); }
        }
        @keyframes grid-pattern {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .animate-particle-rise {
          animation: particle-rise linear infinite;
        }
        .animate-gradient-slow {
          animation: gradient-slow 12s ease-in-out infinite;
        }
        .animate-gradient-slow-2 {
          animation: gradient-slow-2 15s ease-in-out infinite;
        }
        .animate-grid-pattern {
          animation: grid-pattern 20s linear infinite;
        }
      `}</style>

      {/* Main gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 dark:from-black dark:via-blue-950/20 dark:to-violet-950/20 -z-20" />

      {/* Subtle grid pattern */}
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.02] -z-10" style={{
        backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        color: 'currentColor'
      }} />

      {/* Animated gradient orbs */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Large ambient orbs */}
        <div className="absolute top-1/4 left-1/5 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-blue-600/10 dark:from-blue-500/15 dark:to-blue-700/10 rounded-full blur-3xl animate-gradient-slow" />
        <div className="absolute top-1/3 right-1/5 w-[400px] h-[400px] bg-gradient-to-br from-violet-400/20 to-violet-600/10 dark:from-violet-500/15 dark:to-violet-700/10 rounded-full blur-3xl animate-gradient-slow-2" />
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-gradient-to-br from-emerald-400/15 to-emerald-600/10 dark:from-emerald-500/12 dark:to-emerald-700/8 rounded-full blur-3xl animate-gradient-slow" style={{ animationDelay: '4s' }} />

        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-t from-blue-400/30 to-violet-400/30 dark:from-blue-500/20 dark:to-violet-500/20 animate-particle-rise"
            style={{
              left: `${particle.x}%`,
              width: particle.size,
              height: particle.size,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              '--opacity': particle.opacity,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  );
};
