import { Link } from 'react-router-dom';
import { TOOL_CATEGORIES, toolCategoryColors } from '../data';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  category: keyof typeof TOOL_CATEGORIES;
  description: string;
}

interface HomePageToolsProps {
  menuItems: MenuItem[];
  loaded: boolean;
}

export const HomePageTools = ({ menuItems, loaded }: HomePageToolsProps) => {
  const getCategoryColor = (category: keyof typeof TOOL_CATEGORIES) => {
    return toolCategoryColors[TOOL_CATEGORIES[category].color];
  };

  return (
    <>
      <style>{`
        @keyframes tool-card-entrance {
          0% { transform: translateY(20px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-tool-card-entrance {
          animation: tool-card-entrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .tool-card {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>

      <div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-violet-500 to-violet-600 rounded-full"></span>
          All Tools
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
          {menuItems.map((item, index) => (
            <Link
              key={item.id}
              to={`/app/${item.id}`}
              className={`tool-card group relative overflow-hidden rounded-lg p-3 bg-white/70 dark:bg-zinc-900/70 border border-slate-200/50 dark:border-zinc-700/50 hover:border-slate-300 dark:hover:border-zinc-600 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] animate-tool-card-entrance ${loaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                transitionDelay: loaded ? `${index * 20}ms` : '0ms',
                opacity: loaded ? 1 : 0
              }}
            >
              {/* Category indicator */}
              <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${getCategoryColor(item.category)}`} />

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className="text-2xl sm:text-3xl mb-2 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  {item.icon}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.label}
                </h3>

                {/* Description */}
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 hidden xs:block">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
