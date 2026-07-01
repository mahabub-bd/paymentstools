import { useEffect, useState } from 'react';
import { menuItems } from '../data';
import { HomePageBackground } from './HomePageBackground';
import { HomePageDecorations } from './HomePageDecorations';
import { HomePageFooter } from './HomePageFooter';
import { HomePageHeader } from './HomePageHeader';
import { HomePageHero } from './HomePageHero';
import { HomePageTools } from './HomePageTools';

const HomePage = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-200 relative">
      {/* Header with theme toggle */}
      <HomePageHeader loaded={loaded} />

      {/* Background effects */}
      <HomePageBackground loaded={loaded} />

      {/* Decorative floating elements */}
      <HomePageDecorations loaded={loaded} />

      {/* Content wrapper with z-index */}
      <div className="relative z-10 pointer-events-auto">
        {/* Hero Section */}
        <HomePageHero loaded={loaded} />

        {/* Main Content */}
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 pb-4">
          {/* Tools Grid */}
          <HomePageTools menuItems={menuItems} loaded={loaded} />
        </div>

        {/* Footer */}
        <HomePageFooter loaded={loaded} />
      </div>
    </div>
  );
};

export default HomePage;
