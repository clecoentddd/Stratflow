
import * as React from "react";

export const StratFlowLogo = (props: React.SVGProps<SVGSVGElement>) => {
  const { color = "#8B4513", ...rest } = props as React.SVGProps<SVGSVGElement> & { color?: string };
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="StratFlow"
      {...rest}
    >
      <defs>
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="55%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="50" cy="50" r="47" fill="none" stroke={color} strokeWidth="3" filter="url(#glow)" />

      <circle cx="50" cy="50" r="34" fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.85" strokeDasharray="4 5" />
      <circle cx="50" cy="50" r="20" fill="none" stroke={color} strokeWidth="1.6" strokeOpacity="0.7" strokeDasharray="3 6" />

      <line x1="50" y1="10" x2="50" y2="22" stroke={color} strokeOpacity="0.9" strokeWidth="1.5" />
      <line x1="10" y1="50" x2="22" y2="50" stroke={color} strokeOpacity="0.9" strokeWidth="1.5" />
      <line x1="78" y1="50" x2="90" y2="50" stroke={color} strokeOpacity="0.9" strokeWidth="1.5" />

      <g transform="translate(50,50)">
        <path d="M0 0 L40 0 A40 40 0 0 1 0 40 Z" fill="url(#sweep)" transform="rotate(18)" />
        <circle cx="24" cy="-18" r="3" fill={color} filter="url(#glow)" />
      </g>
    </svg>
  );
};
