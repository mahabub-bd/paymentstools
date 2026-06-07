import { useEffect, useState } from 'react';
import { HomePageBackground } from './HomePageBackground';
import { HomePageCategories } from './HomePageCategories';
import { HomePageDecorations } from './HomePageDecorations';
import { HomePageFooter } from './HomePageFooter';
import { HomePageHeader } from './HomePageHeader';
import { HomePageTools } from './HomePageTools';
import { menuItems, categories } from '../data';

const HomePage = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-zinc-950 transition-colors duration-200">
      {/* Background effects */}
      <HomePageBackground loaded={loaded} />

      {/* Decorative floating elements */}
      <HomePageDecorations loaded={loaded} />

      {/* Header */}
      <HomePageHeader loaded={loaded} totalVisibleTools={menuItems.length} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pb-4 sm:pb-5 lg:pb-6">
        {/* Categories */}
        <HomePageCategories categories={categories} loaded={loaded} />

        {/* Tools Grid */}
        <HomePageTools menuItems={menuItems} loaded={loaded} />
      </div>

      {/* Footer */}
      <HomePageFooter loaded={loaded} />
    </div>
  );
};

export default HomePage;
