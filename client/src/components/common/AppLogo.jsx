import React from 'react';
import logo from '../../assets/logo.png';

/**
 * AppLogo - Renders the TaskFlow logo image.
 * @param {string} size - Tailwind size class (default: 'w-8 h-8')
 * @param {string} className - Extra classes
 */
export const AppLogo = ({ size = 'w-8 h-8', className = '' }) => {
  return (
    <img
      src={logo}
      alt="TaskFlow Logo"
      className={`${size} object-contain rounded-lg ${className}`}
    />
  );
};

export default AppLogo;
