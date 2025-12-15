import React from "react";

interface ClauseIconProps {
  size?: number;
  className?: string;
}

export const ClauseIcon: React.FC<ClauseIconProps> = ({ 
  size = 24, 
  className = "" 
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* "1." numeral */}
    <text
      x="4"
      y="11"
      fontSize="8"
      fontWeight="600"
      fill="currentColor"
      stroke="none"
      fontFamily="system-ui, sans-serif"
    >
      1.
    </text>
    
    {/* Two horizontal lines representing text */}
    <line x1="12" y1="8" x2="20" y2="8" />
    <line x1="12" y1="13" x2="20" y2="13" />
  </svg>
);
