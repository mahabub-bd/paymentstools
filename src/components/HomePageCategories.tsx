import { Link } from 'react-router-dom';
import { categoryColors } from '../data';

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
        @keyframes glass-shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        .animate-card-entrance {
          animation: card-entrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .category-card:hover .glass-shine {
          animation: glass-shine 0.8s ease-in-out;
        }
        .category-card {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>

      <div className="mb-5 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></span>
          Categories
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to="/app/bitmap"
              className={`category-card group relative overflow-hidden rounded-xl p-3 bg-gradient-to-br ${categoryColors[category.color]} shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 animate-card-entrance ${loaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                transitionDelay: loaded ? `${index * 50}ms` : '0ms',
                opacity: loaded ? 1 : 0
              }}
            >
              {/* Glass shine effect */}
              <div className="glass-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full w-[200%] h-full pointer-events-none" />

              {/* Content */}
              <div className="relative">
                <div className="text-2xl sm:text-3xl mb-1.5 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                  {category.icon}
                </div>
                <h3 className="text-white font-semibold text-xs sm:text-sm truncate">
                  {category.label}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
