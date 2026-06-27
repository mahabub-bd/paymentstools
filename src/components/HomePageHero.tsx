import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface HomePageHeroProps {
  loaded: boolean;
}

const HERO_STATS = [
  { label: 'Tool groups', value: '6' },
  { label: 'EMV utilities', value: '14+' },
  { label: 'ISO helpers', value: '8+' },
];

const QUICK_ROUTES = [
  { label: 'ISO Bitmap', to: '/app/bitmap' },
  { label: 'EMV TLV', to: '/app/tlv' },
  { label: 'PIN Block', to: '/app/pinblock' },
  { label: 'IAD 9F10', to: '/app/iad' },
];

const BRAND_LOGOS = [
  { name: 'Visa', src: '/images/visa.png' },
  { name: 'Mastercard', src: '/images/mastercard.png' },
  { name: 'TakaPay', src: '/images/takapay.png' },
  { name: 'UnionPay', src: '/images/unionpay.png' },
  { name: 'Amex', src: '/images/amex.png' },
];

const PREVIEW_ROWS = [
  ['MTI', '0200', 'Authorization request'],
  ['DE 55', '9F10', 'Issuer application data'],
  ['CVR', 'A02000', 'Active card verification flags'],
  ['KCV', '6F8A21', 'Key check value'],
];

export const HomePageHero = ({ loaded }: HomePageHeroProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <>
      <style>{`
        @keyframes hero-scan {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 0.45; }
          100% { transform: translateY(340%); opacity: 0; }
        }
        .hero-scan-line {
          animation: hero-scan 4.5s ease-in-out infinite;
        }
      `}</style>

      <section className="relative pt-20 sm:pt-24 pb-5 sm:pb-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={loaded && mounted ? 'visible' : 'hidden'}
          className="container mx-auto px-3 sm:px-4 lg:px-6"
        >
          <div className="grid min-h-[430px] items-center gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.8fr)]">
            <div className="max-w-3xl">
              <motion.div variants={itemVariants} className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Payment engineering workspace
                </span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-blue-400 dark:to-emerald-300">
                  Payment Tools
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                Practical ISO 8583, EMV, PIN, cryptogram, and reference utilities for payment testing and analysis.
              </motion.p>

              <motion.div variants={itemVariants} className="mt-6 flex flex-wrap items-center gap-2">
                <Link
                  to="/app/bitmap"
                  className="group inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-colors hover:bg-blue-700 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-100"
                >
                  Launch App
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <a
                  href="https://github.com/mahabub-bd/paymentstools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-white dark:hover:bg-zinc-800"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-6 flex flex-wrap gap-2">
                {QUICK_ROUTES.map((route) => (
                  <Link
                    key={route.to}
                    to={route.to}
                    className="rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:bg-black/40 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
                  >
                    {route.label}
                  </Link>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="mt-8 grid max-w-xl grid-cols-3 gap-2">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 dark:border-zinc-800 dark:bg-black/40">
                    <p className="font-mono text-lg font-bold text-slate-950 dark:text-white">{stat.value}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="relative">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-zinc-800 dark:bg-black dark:shadow-black/40">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">Live decode</span>
                </div>

                <div className="relative p-3">
                  <div className="hero-scan-line pointer-events-none absolute left-3 right-3 top-8 h-12 border-y border-cyan-300/30 bg-cyan-300/10 dark:border-cyan-400/20 dark:bg-cyan-400/10" />

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {BRAND_LOGOS.map((logo) => (
                      <span key={logo.name} className="inline-flex h-8 w-16 items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 dark:border-zinc-800 dark:bg-zinc-950">
                        <img src={logo.src} alt={logo.name} className="max-h-5 max-w-full object-contain" />
                      </span>
                    ))}
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-slate-100 dark:border-zinc-800">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-slate-400">message.raw</span>
                      <span className="rounded bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">VALID</span>
                    </div>
                    <p className="break-all leading-6 text-cyan-200">
                      0200 7234874168E08B02 9F2608BD06C566B23DB5D3 9F100706011203A02000
                    </p>
                  </div>

                  <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-zinc-900 dark:border-zinc-800">
                    {PREVIEW_ROWS.map(([field, value, label]) => (
                      <div key={field} className="grid grid-cols-[58px_82px_minmax(0,1fr)] items-center gap-2 bg-white px-3 py-2 dark:bg-zinc-950">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">{field}</span>
                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">{value}</span>
                        <span className="truncate text-xs text-slate-600 dark:text-zinc-300">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </>
  );
};
