import React from "react";

interface PlaybookIconProps {
  size?: number;
  className?: string;
}

export const PlaybookIcon: React.FC<PlaybookIconProps> = ({ 
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
    {/* Clipboard frame */}
    <rect x="4" y="3" width="16" height="18" rx="2" />
    {/* Clip at top */}
    <rect x="8" y="1" width="8" height="4" rx="1" />
    
    {/* Play symbols - simplified 2x2 grid */}
    {/* X top-left */}
    <line x1="7" y1="9" x2="9" y2="11" />
    <line x1="9" y1="9" x2="7" y2="11" />
    
    {/* O top-right */}
    <circle cx="16" cy="10" r="1.5" />
    
    {/* O bottom-left */}
    <circle cx="8" cy="16" r="1.5" />
    
    {/* X bottom-right */}
    <line x1="15" y1="15" x2="17" y2="17" />
    <line x1="17" y1="15" x2="15" y2="17" />
    
    {/* Connecting arrow */}
    <path d="M10 10 L14.5 15.5" />
    <polyline points="12,16 14.5,15.5 14,13" />
  </svg>
);
