import React from 'react';

interface VwLogoProps {
  className?: string;
  inverted?: boolean;
}

export const VwLogo: React.FC<VwLogoProps> = ({ className = 'w-9 h-9', inverted = false }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0 select-none`}
      aria-label="Volkswagen Logo"
    >
      {/* Outer Rim */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke={inverted ? '#FFFFFF' : 'currentColor'}
        strokeWidth="3.6"
      />
      {/* Thin inner offset circle */}
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke={inverted ? '#FFFFFF' : 'currentColor'}
        strokeWidth="1.2"
        opacity="0.3"
      />

      {/* Top "V" paths */}
      <path
        d="M28.5 24 L45.2 50.5 L48.8 50.5 L34.8 24 H28.5Z"
        fill={inverted ? '#FFFFFF' : 'currentColor'}
      />
      <path
        d="M71.5 24 L54.8 50.5 L51.2 50.5 L65.2 24 H71.5Z"
        fill={inverted ? '#FFFFFF' : 'currentColor'}
      />

      {/* Horizontal gap divider guide line at Y=52 */}
      {/* Bottom "W" paths */}
      {/* Outer left stroke of W */}
      <path
        d="M20.2 41 L41.2 82.5 L45 82.5 L26 41 H20.2Z"
        fill={inverted ? '#FFFFFF' : 'currentColor'}
      />
      {/* Center left stroke of W */}
      <path
        d="M48 54.5 L38.5 77 L42 77 L50.2 57.5 H49.8Z"
        fill={inverted ? '#FFFFFF' : 'currentColor'}
      />
      {/* Center right stroke of W */}
      <path
        d="M52 54.5 L61.5 77 L58 77 L49.8 57.5 H50.2Z"
        fill={inverted ? '#FFFFFF' : 'currentColor'}
      />
      {/* Outer right stroke of W */}
      <path
        d="M79.8 41 L58.8 82.5 L55 82.5 L74 41 H79.8Z"
        fill={inverted ? '#FFFFFF' : 'currentColor'}
      />
    </svg>
  );
};
