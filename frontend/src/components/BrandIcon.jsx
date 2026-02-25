import { SiStrava, SiGarmin } from 'react-icons/si';

/**
 * Renders a brand logo icon for Strava, Garmin, or Coros.
 * @param {'strava'|'garmin'|'coros'} brand
 * @param {number} size - pixel size (default 20)
 * @param {string} className - extra classes for the img (Coros only)
 */
const BrandIcon = ({ brand, size = 20, className = '' }) => {
  if (brand === 'strava') return <SiStrava size={size} color="#FC4C02" />;
  if (brand === 'garmin') return <SiGarmin size={size} color="#007CC3" />;
  if (brand === 'coros') {
    return (
      <img
        src="/coros.png"
        alt="Coros"
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'cover', objectPosition: 'left center' }}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }
  return null;
};

export default BrandIcon;
