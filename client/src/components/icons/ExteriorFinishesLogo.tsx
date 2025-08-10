export function ExteriorFinishesLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 450 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Large background circle - light blue */}
      <circle cx="320" cy="60" r="65" fill="#B8D4F0" opacity="0.5" />
      
      {/* Small dark circles */}
      <circle cx="90" cy="125" r="12" fill="#2C3E50" />
      <circle cx="380" cy="125" r="12" fill="#2C3E50" />
      
      {/* Left white building */}
      <g>
        <rect x="30" y="90" width="70" height="80" fill="#FFFFFF" stroke="#4A6FA5" strokeWidth="2" />
        {/* Windows - vertical lines pattern */}
        <rect x="35" y="95" width="2" height="70" fill="#2C3E50" />
        <rect x="42" y="95" width="2" height="70" fill="#2C3E50" />
        <rect x="49" y="95" width="2" height="70" fill="#2C3E50" />
        <rect x="56" y="95" width="2" height="70" fill="#2C3E50" />
        <rect x="63" y="95" width="2" height="70" fill="#2C3E50" />
        <rect x="70" y="95" width="2" height="70" fill="#2C3E50" />
        <rect x="77" y="95" width="2" height="70" fill="#2C3E50" />
        <rect x="84" y="95" width="2" height="70" fill="#2C3E50" />
        <rect x="91" y="95" width="2" height="70" fill="#2C3E50" />
        <rect x="95" y="95" width="2" height="70" fill="#2C3E50" />
      </g>
      
      {/* Center light blue building */}
      <g>
        <rect x="110" y="70" width="85" height="100" fill="#A8C8EC" stroke="#4A6FA5" strokeWidth="2" />
        {/* Large windows */}
        <rect x="120" y="80" width="18" height="35" fill="#FFFFFF" />
        <rect x="143" y="80" width="18" height="35" fill="#FFFFFF" />
        <rect x="166" y="80" width="18" height="35" fill="#FFFFFF" />
        <rect x="120" y="125" width="18" height="35" fill="#FFFFFF" />
        <rect x="143" y="125" width="18" height="35" fill="#FFFFFF" />
        <rect x="166" y="125" width="18" height="35" fill="#FFFFFF" />
      </g>
      
      {/* Angular roof connecting element */}
      <polygon points="100,70 152,40 205,70" fill="#2C3E50" />
      
      {/* Right dark navy building */}
      <g>
        <rect x="220" y="40" width="85" height="130" fill="#2C3E50" stroke="#1A252F" strokeWidth="2" />
        {/* Large windows */}
        <rect x="230" y="50" width="18" height="35" fill="#4A6FA5" />
        <rect x="253" y="50" width="18" height="35" fill="#4A6FA5" />
        <rect x="276" y="50" width="18" height="35" fill="#4A6FA5" />
        <rect x="230" y="95" width="18" height="35" fill="#4A6FA5" />
        <rect x="253" y="95" width="18" height="35" fill="#4A6FA5" />
        <rect x="276" y="95" width="18" height="35" fill="#4A6FA5" />
        <rect x="230" y="140" width="18" height="20" fill="#4A6FA5" />
        <rect x="253" y="140" width="18" height="20" fill="#4A6FA5" />
        <rect x="276" y="140" width="18" height="20" fill="#4A6FA5" />
      </g>
      
      {/* Base ground line */}
      <rect x="20" y="170" width="410" height="8" fill="#2C3E50" rx="4" />
    </svg>
  )
}