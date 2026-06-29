import logoLight from '../../images/logo.png';
import logoDark from '../../images/logodark.png';
import { useTheme } from '../contexts/ThemeContext';

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo = ({ className = '' }: BrandLogoProps) => {
  const { theme } = useTheme();
  const logo = theme === 'dark' ? logoDark : logoLight;

  return (
    <img
      src={logo}
      alt="Payment Tools"
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
};
