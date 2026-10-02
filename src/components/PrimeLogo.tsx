import React from 'react';

interface PrimeLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const PrimeLogo: React.FC<PrimeLogoProps> = ({
  className = '',
  size = 32,
  showText = true
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official PrimeAvtoExport Vector Logo Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <polygon fill="#068eff" points="4.16 94.9 9.92 101.86 106.35 101.86 123.84 71.45 4.16 94.9" />
        <polygon fill="#068eff" points="25.36 86.55 25.36 70.83 21.29 71.82 21.29 87.33 25.36 86.55" />
        <polygon fill="#068eff" points="51.77 81.5 51.77 64.44 41.31 66.97 41.31 83.51 51.77 81.5" />
        <polygon fill="#068eff" points="51.77 61.52 51.77 44.46 48.59 45.22 48.59 62.13 51.77 61.52" />
        <polygon fill="#068eff" points="88.78 74.41 114.3 69.52 114.3 58.39 88.78 55.48 88.78 74.41" />
        <polygon fill="#068eff" points="76.96 76.68 76.96 50.63 102.44 53.53 102.44 48.71 76.96 45.8 76.96 45.8 76.95 45.8 76.92 45.8 70.26 47.42 70.26 47.43 69.84 47.53 69.84 78.04 76.96 76.68" />
        <polygon fill="#005bdb" points="21.29 71.82 10.52 74.43 10.52 89.4 21.29 87.33 21.29 71.82" />
        <polygon fill="#005bdb" points="41.31 66.97 30.54 69.58 30.54 85.56 41.31 83.51 41.31 66.97" />
        <polygon fill="#005bdb" points="48.59 45.22 37.82 47.83 37.82 64.19 48.59 62.13 48.59 45.22" />
        <polygon fill="#005bdb" points="69.84 47.53 56.94 50.65 56.94 80.51 69.84 78.04 69.84 47.53" />
        <polygon fill="#005bdb" points="82.12 57.09 82.12 75.68 88.78 74.41 88.78 55.48 82.12 57.09" />
        <rect fill="#068eff" x="80.38" y="26.14" width="3.48" height="9.39" />
        <g>
          <polygon fill="#068eff" points="76.92 38.06 76.92 42.89 102.44 45.8 102.44 40.97 76.92 38.06" />
          <polygon fill="#005bdb" points="70.26 39.68 70.26 44.51 76.92 42.89 76.92 38.06 70.26 39.68" />
        </g>
      </svg>

      {/* Serious, high-contrast typography without rainbow accents */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-['Exo_2',sans-serif] font-extrabold tracking-wider text-base uppercase text-white leading-none">
            PRIME<span className="text-[#008fff] ml-0.5">AVTO</span>EXPORT
          </span>
          <span className="text-[9px] tracking-widest text-slate-400 uppercase font-medium mt-0.5">
            US & GLOBAL AUCTIONS
          </span>
        </div>
      )}
    </div>
  );
};
