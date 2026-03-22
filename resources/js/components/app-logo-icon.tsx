import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg 
            {...props} 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Background Bar 1: Foundation */}
            <rect x="4" y="24" width="8" height="12" rx="1" fill="currentColor" opacity="0.4" />
            
            {/* Background Bar 2: Mid-level growth */}
            <rect x="16" y="16" width="8" height="20" rx="1" fill="currentColor" opacity="0.7" />
            
            {/* Background Bar 3: Peak Performance */}
            <rect x="28" y="8" width="8" height="28" rx="1" fill="currentColor" />
            
            {/* The "Progress" Arrow: Connects the growth path */}
            <path
                d="M6 22L18 14L26 18L36 6M36 6H30M36 6V12"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}