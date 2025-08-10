export function ExteriorFinishesLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="150" cy="40" r="35" fill="#B8D4F0" opacity="0.6" />
      
      {/* Main building structure */}
      <g>
        {/* Left building */}
        <rect x="20" y="60" width="40" height="45" fill="#E8F1FD" stroke="#4A90E2" strokeWidth="2" />
        <rect x="25" y="65" width="8" height="15" fill="#2C5282" />
        <rect x="35" y="65" width="8" height="15" fill="#2C5282" />
        <rect x="25" y="82" width="8" height="15" fill="#2C5282" />
        <rect x="35" y="82" width="8" height="15" fill="#2C5282" />
        
        {/* Center building */}
        <rect x="50" y="45" width="45" height="60" fill="#4A90E2" stroke="#2C5282" strokeWidth="2" />
        <rect x="55" y="50" width="10" height="20" fill="#E8F1FD" />
        <rect x="68" y="50" width="10" height="20" fill="#E8F1FD" />
        <rect x="81" y="50" width="10" height="20" fill="#E8F1FD" />
        <rect x="55" y="75" width="10" height="20" fill="#E8F1FD" />
        <rect x="68" y="75" width="10" height="20" fill="#E8F1FD" />
        <rect x="81" y="75" width="10" height="20" fill="#E8F1FD" />
        
        {/* Right building */}
        <rect x="110" y="30" width="50" height="75" fill="#2C5282" stroke="#1A365D" strokeWidth="2" />
        <rect x="115" y="35" width="12" height="25" fill="#4A90E2" />
        <rect x="130" y="35" width="12" height="25" fill="#4A90E2" />
        <rect x="145" y="35" width="12" height="25" fill="#4A90E2" />
        <rect x="115" y="65" width="12" height="25" fill="#4A90E2" />
        <rect x="130" y="65" width="12" height="25" fill="#4A90E2" />
        <rect x="145" y="65" width="12" height="25" fill="#4A90E2" />
        
        {/* Roof elements */}
        <polygon points="45,45 72.5,25 100,45" fill="#1A365D" />
        
        {/* Trees/landscaping */}
        <circle cx="15" cy="95" r="8" fill="#2C5282" />
        <circle cx="170" cy="95" r="8" fill="#2C5282" />
        <circle cx="185" cy="95" r="6" fill="#4A90E2" />
        
        {/* Base/ground */}
        <rect x="10" y="105" width="170" height="8" fill="#1A365D" rx="2" />
      </g>
    </svg>
  )
}