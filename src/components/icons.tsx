
import * as React from "react";

export const StratFlowLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <circle cx="50" cy="50" r="48" fill="black" stroke="#00ff9f" strokeWidth="2" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="#00ff9f" strokeWidth="1" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="#00ff9f" strokeWidth="1" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="#00ff9f" strokeWidth="1" strokeDasharray="2,2" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="#00ff9f" strokeWidth="1" strokeDasharray="2,2" />
        <circle cx="50" cy="50" r="12" fill="none" stroke="#00ff9f" strokeWidth="1" strokeDasharray="2,2" />
    </svg>
);
