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
    {/* "1." numeral - bolder and full height */}
    <text
      x="3"
      y="16"
      fontSize="12"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
      fontFamily="system-ui, sans-serif"
    >
      1.
    </text>
    
    {/* Three horizontal lines representing text, equally spaced */}
    <line x1="13" y1="6" x2="21" y2="6" />
    <line x1="13" y1="12" x2="21" y2="12" />
    <line x1="13" y1="18" x2="21" y2="18" />
  </svg>
);
