import { Link } from 'react-router-dom';

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface HomePageCategoriesProps {
  categories: Category[];
  loaded: boolean;
}

export const HomePageCategories = ({ categories, loaded }: HomePageCategoriesProps) => {
  return (
    <>
      <style>{`
        @keyframes card-entrance {
          0% { transform: translateY(20px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes gradient-border {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes icon-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-card-entrance {
          animation: card-entrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .category-card .gradient-border {
          background-size: 200% 200%;
          animation: gradient-border 3s ease infinite;
        }
        .category-card:hover .icon-float {
          animation: icon-float 0.6s ease-in-out;
        }
        .category-card .glow-effect {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .category-card {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>

      <div className="mb-5 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-[#00f0ff] to-blue-500 rounded-full"></span>
          Categories
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to="/app/bitmap"
              className={`category-card group relative overflow-hidden rounded-2xl p-4 bg-white/70 dark:bg-zinc-900/70 shadow-md hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-card-entrance ${loaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                transitionDelay: loaded ? `${index * 50}ms` : '0ms',
                opacity: loaded ? 1 : 0
              }}
            >
              {/* Gradient border effect */}
              <div className="gradient-border absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#00f0ff] via-blue-500 to-[#00f0ff] -z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-[2px] rounded-2xl bg-white/80 dark:bg-zinc-900/80" />
              </div>

              {/* Inner gradient background on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00f0ff]/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Glow effect */}
              <div className="glow-effect absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r from-[#00f0ff] to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative flex flex-col items-center text-center">
                {/* Icon container with gradient background */}
                <div className="icon-float relative w-12 h-12 sm:w-14 sm:h-14 mb-3 rounded-xl bg-gradient-to-br from-[#00f0ff]/10 to-blue-500/10 flex items-center justify-center group-hover:from-[#00f0ff]/20 group-hover:to-blue-500/20 transition-all duration-300">
                  <div className="text-2xl sm:text-3xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {category.icon}
                  </div>
                </div>

                {/* Category label */}
                <h3 className="font-semibold text-slate-800 dark:text-white text-xs sm:text-sm truncate w-full group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#00f0ff] group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">
                  {category.label}
                </h3>

                {/* Subtle underline on hover */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#00f0ff] to-blue-500 group-hover:w-full transition-all duration-300 rounded-full" />
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
