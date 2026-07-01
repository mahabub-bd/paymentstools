import { Link } from 'react-router-dom';
import { TOOL_CATEGORIES, toolCategoryColors } from '../data';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  category: keyof typeof TOOL_CATEGORIES;
  description: string;
  shortcut?: string;
}

interface HomePageToolsProps {
  menuItems: MenuItem[];
  loaded: boolean;
}

export const HomePageTools = ({ menuItems, loaded }: HomePageToolsProps) => {
  const getCategoryColor = (category: keyof typeof TOOL_CATEGORIES) => {
    return toolCategoryColors[TOOL_CATEGORIES[category].color];
  };

  const getCategoryAccent = (category: keyof typeof TOOL_CATEGORIES) => {
    const accents: Record<keyof typeof TOOL_CATEGORIES, string> = {
      iso8583: 'from-blue-500 to-cyan-400',
      emv: 'from-emerald-500 to-teal-400',
      pin: 'from-violet-500 to-fuchsia-400',
      reference: 'from-amber-500 to-orange-400',
      utilities: 'from-slate-500 to-cyan-500',
    };

    return accents[category];
  };

  return (
    <>
      <style>{`
        @keyframes tool-card-entrance {
          0% { transform: translateY(18px) scale(0.97); opacity: 0; }
          70% { transform: translateY(-2px) scale(1.01); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes tool-shine {
          0% { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%) skewX(-18deg); }
        }
        @keyframes tool-icon-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.04); }
        }
        .animate-tool-card-entrance {
          animation: tool-card-entrance 0.62s cubic-bezier(0.16, 1, 0.3, 1) both;
          pointer-events: auto !important;
        }
        .tool-card {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          pointer-events: auto;
          position: relative;
          z-index: 1;
        }
        .tool-card:hover .tool-card-shine {
          animation: tool-shine 0.8s ease;
        }
        .tool-card:hover .tool-card-icon {
          animation: tool-icon-float 1.3s ease-in-out infinite;
        }
      `}</style>

      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Workspace</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-cyan-400 via-blue-500 to-emerald-400"></span>
              All Tools
            </h2>
          </div>
          <span className="rounded-md border border-slate-200 bg-white/70 px-2 py-1 font-mono text-[11px] font-semibold text-slate-500 dark:border-zinc-800 dark:bg-black/40 dark:text-zinc-400">
            {menuItems.length} utilities
          </span>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 relative z-10">
          {menuItems.map((item, index) => (
            <Link
              key={item.id}
              to={`/app/${item.id}`}
              className={`tool-card group relative min-h-[112px] overflow-hidden rounded-lg border border-slate-200/70 bg-white/80 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-800/80 dark:bg-zinc-950/75 dark:hover:border-blue-800 animate-tool-card-entrance ${loaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                animationDelay: loaded ? `${Math.min(index * 24, 420)}ms` : '0ms',
                transitionDelay: loaded ? `${Math.min(index * 12, 180)}ms` : '0ms',
                opacity: loaded ? 1 : 0
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="tool-card-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent dark:via-white/10" />

              <div className="relative flex h-full flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${getCategoryAccent(item.category)} text-xl shadow-sm transition-transform group-hover:scale-105`}>
                    <span className="tool-card-icon flex h-full w-full items-center justify-center rounded-md bg-white/90 dark:bg-black/90">
                      {item.icon}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getCategoryColor(item.category)}`} />
                      <span className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                        {TOOL_CATEGORIES[item.category].label}
                      </span>
                    </div>
                    <h3 className="truncate text-sm font-semibold text-slate-950 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                      {item.label}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
                  <div className={`h-full w-0 rounded-full bg-gradient-to-r ${getCategoryAccent(item.category)} transition-all duration-500 group-hover:w-full`} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
