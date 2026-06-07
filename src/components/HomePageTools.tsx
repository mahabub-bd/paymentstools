import { Link } from 'react-router-dom';
import { TOOL_CATEGORIES } from '../data';

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
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 lg:gap-3">
      {menuItems.map((item, index) => (
        <Link
          key={item.id}
          to={`/app/${item.id}`}
          className={`group p-2 sm:p-2.5 lg:p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-slate-200 dark:border-zinc-800 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: `${500 + index * 50}ms` }}
        >
          <div className="text-lg sm:text-xl lg:text-2xl mb-1 sm:mb-1.5 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">{item.icon}</div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-[10px] sm:text-xs lg:text-sm mb-0.5 sm:mb-1 truncate">{item.label}</h3>
          <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 hidden xs:block">{item.description}</p>
        </Link>
      ))}
    </div>
  );
};
