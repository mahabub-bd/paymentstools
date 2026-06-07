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
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
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
      `}</style>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 lg:gap-3 mb-3 sm:mb-4 lg:mb-5">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            to="/app/bitmap"
            className={`group relative overflow-hidden rounded-lg sm:rounded-xl p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br ${categoryColors[category.color]} shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 animate-shimmer ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-lg sm:text-xl lg:text-2xl mb-0.5 sm:mb-1 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">{category.icon}</div>
            <h3 className="text-white text-[10px] sm:text-xs lg:text-sm font-semibold truncate">{category.label}</h3>
          </Link>
        ))}
      </div>
    </>
  );
};
