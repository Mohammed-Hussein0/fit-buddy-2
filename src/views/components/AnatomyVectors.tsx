import React from 'react';

interface VectorProps {
  className?: string;
  size?: number;
  highlightColor?: string;
}

/**
 * Detailed vector graphic of Chest / Pectoralis Major & Minor
 * Features sternum, clavicular fibers, sternocostal fibers, and ribcage contour.
 */
export function ChestVector({ className = '', size = 96, highlightColor = '#dc2626' }: VectorProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="120" height="120" rx="6" fill="#0d0d10" />
      
      {/* Background subtle anatomical grid */}
      <circle cx="60" cy="60" r="46" stroke="#1f1f26" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="60" y1="12" x2="60" y2="108" stroke="#1f1f26" strokeWidth="1" strokeDasharray="2 2" />

      {/* Clavicle Bones */}
      <path d="M22 28 C34 26, 50 32, 58 36 M98 28 C86 26, 70 32, 62 36" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" />
      {/* Sternum / Center Line */}
      <path d="M60 36 L60 84" stroke="#52525b" strokeWidth="2" strokeLinecap="round" />

      {/* Left Pec - Outer & Fill */}
      <path
        d="M24 35 C38 33, 56 38, 58 40 L58 74 C48 76, 32 72, 22 56 C20 48, 20 40, 24 35 Z"
        fill={highlightColor}
        fillOpacity="0.85"
        stroke={highlightColor}
        strokeWidth="1.5"
      />
      {/* Left Pec Fiber Lines */}
      <path d="M28 42 C40 40, 52 44, 56 46" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M25 50 C36 49, 48 54, 56 56" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M26 58 C36 60, 48 64, 56 66" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" />

      {/* Right Pec - Outer & Fill */}
      <path
        d="M96 35 C82 33, 64 38, 62 40 L62 74 C72 76, 88 72, 98 56 C100 48, 100 40, 96 35 Z"
        fill={highlightColor}
        fillOpacity="0.85"
        stroke={highlightColor}
        strokeWidth="1.5"
      />
      {/* Right Pec Fiber Lines */}
      <path d="M92 42 C80 40, 68 44, 64 46" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M95 50 C84 49, 72 54, 64 56" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M94 58 C84 60, 72 64, 64 66" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" />

      {/* Rib Cage / Serratus Accents */}
      <path d="M18 64 C22 67, 28 68, 30 70 M16 72 C22 75, 26 76, 30 78" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M102 64 C98 67, 92 68, 90 70 M104 72 C98 75, 94 76, 90 78" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />

      {/* Upper Abs preview */}
      <rect x="47" y="86" width="11" height="10" rx="2" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
      <rect x="62" y="86" width="11" height="10" rx="2" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

      {/* Label Badge */}
      <text x="60" y="110" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="800" letterSpacing="1">
        CHEST / PECTORALIS
      </text>
    </svg>
  );
}

/**
 * Detailed vector graphic of Back & Latissimus Dorsi (V-Taper)
 */
export function BackVector({ className = '', size = 96, highlightColor = '#dc2626' }: VectorProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="120" height="120" rx="6" fill="#0d0d10" />
      
      {/* Subtle Trapezius Top Diamond */}
      <path d="M60 20 L78 36 L66 60 L54 60 L42 36 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1.2" />
      
      {/* Spine / Column */}
      <line x1="60" y1="20" x2="60" y2="95" stroke="#52525b" strokeWidth="2" strokeDasharray="3 2" />

      {/* Left Lat Wing */}
      <path
        d="M56 46 C42 45, 24 55, 18 70 C24 82, 38 88, 54 84 L56 50 Z"
        fill={highlightColor}
        fillOpacity="0.85"
        stroke={highlightColor}
        strokeWidth="1.5"
      />
      {/* Lat fan lines left */}
      <path d="M54 58 C40 60, 26 70, 22 76" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M54 68 C44 70, 32 78, 30 82" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />

      {/* Right Lat Wing */}
      <path
        d="M64 46 C78 45, 96 55, 102 70 C96 82, 82 88, 66 84 L64 50 Z"
        fill={highlightColor}
        fillOpacity="0.85"
        stroke={highlightColor}
        strokeWidth="1.5"
      />
      {/* Lat fan lines right */}
      <path d="M66 58 C80 60, 94 70, 98 76" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M66 68 C76 70, 88 78, 90 82" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />

      {/* Shoulder blade scapula contours */}
      <path d="M38 38 C32 46, 34 56, 42 58" stroke="#71717a" strokeWidth="1.5" fill="none" />
      <path d="M82 38 C88 46, 86 56, 78 58" stroke="#71717a" strokeWidth="1.5" fill="none" />

      {/* Label Badge */}
      <text x="60" y="110" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="800" letterSpacing="1">
        BACK / LATS V-TAPER
      </text>
    </svg>
  );
}

/**
 * Detailed vector graphic of V-Taper Physique Silhouette with measurement caliper/arrows
 */
export function VTaperGraphicVector({ className = '', size = 120 }: VectorProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="140" height="140" rx="8" fill="#0f0f13" stroke="#26262a" strokeWidth="1" />

      {/* Grid crosshairs */}
      <line x1="70" y1="10" x2="70" y2="130" stroke="#1f1f26" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="10" y1="70" x2="130" y2="70" stroke="#1f1f26" strokeWidth="1" strokeDasharray="3 3" />

      {/* Athletic V-Taper Torso Silhouette */}
      <path
        d="M26 34 Q70 28 114 34 Q106 62 88 88 Q70 92 52 88 Q34 62 26 34 Z"
        fill="#1a1a22"
        stroke="#3f3f46"
        strokeWidth="1.5"
      />

      {/* Highlighted Shoulders / Delts */}
      <ellipse cx="26" cy="36" rx="9" ry="8" fill="#dc2626" fillOpacity="0.85" />
      <ellipse cx="114" cy="36" rx="9" ry="8" fill="#dc2626" fillOpacity="0.85" />

      {/* Chest line */}
      <path d="M38 42 Q70 48 102 42" stroke="#52525b" strokeWidth="1.5" fill="none" />

      {/* Lat taper arrows */}
      <path d="M26 44 L54 84" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" />
      <path d="M114 44 L86 84" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" />

      {/* Shoulder Width Measurement Dimension Bar */}
      <line x1="20" y1="22" x2="120" y2="22" stroke="#facc15" strokeWidth="1.5" />
      <line x1="20" y1="18" x2="20" y2="26" stroke="#facc15" strokeWidth="1.5" />
      <line x1="120" y1="18" x2="120" y2="26" stroke="#facc15" strokeWidth="1.5" />
      <text x="70" y="18" textAnchor="middle" fill="#facc15" fontSize="8" fontWeight="bold">
        SHOULDERS (WIDE)
      </text>

      {/* Waist Dimension Bar */}
      <line x1="50" y1="96" x2="90" y2="96" stroke="#4ade80" strokeWidth="1.5" />
      <line x1="50" y1="92" x2="50" y2="100" stroke="#4ade80" strokeWidth="1.5" />
      <line x1="90" y1="92" x2="90" y2="100" stroke="#4ade80" strokeWidth="1.5" />
      <text x="70" y="108" textAnchor="middle" fill="#4ade80" fontSize="8" fontWeight="bold">
        WAIST (LEAN)
      </text>

      {/* Golden Ratio indicator */}
      <rect x="25" y="116" width="90" height="16" rx="3" fill="#18181b" stroke="#27272a" />
      <text x="70" y="128" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" letterSpacing="0.5">
        TARGET RATIO: ≥ 1.618
      </text>
    </svg>
  );
}

/**
 * Allometric Strength / Force Barbell Vector
 */
export function StrengthScaleVector({ className = '', size = 96 }: VectorProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="120" height="120" rx="6" fill="#0d0d10" />

      {/* Barbell Bar */}
      <line x1="15" y1="60" x2="105" y2="60" stroke="#d4d4d8" strokeWidth="3" strokeLinecap="round" />
      {/* Knurling accents */}
      <line x1="38" y1="58" x2="48" y2="58" stroke="#71717a" strokeWidth="1" />
      <line x1="72" y1="58" x2="82" y2="58" stroke="#71717a" strokeWidth="1" />

      {/* Left Heavy Plate 1 */}
      <rect x="24" y="32" width="6" height="56" rx="2" fill="#dc2626" stroke="#ef4444" strokeWidth="1" />
      {/* Left Heavy Plate 2 */}
      <rect x="18" y="38" width="5" height="44" rx="2" fill="#b91c1c" stroke="#dc2626" strokeWidth="1" />
      {/* Left Collar */}
      <rect x="31" y="52" width="3" height="16" rx="1" fill="#71717a" />

      {/* Right Heavy Plate 1 */}
      <rect x="90" y="32" width="6" height="56" rx="2" fill="#dc2626" stroke="#ef4444" strokeWidth="1" />
      {/* Right Heavy Plate 2 */}
      <rect x="97" y="38" width="5" height="44" rx="2" fill="#b91c1c" stroke="#dc2626" strokeWidth="1" />
      {/* Right Collar */}
      <rect x="86" y="52" width="3" height="16" rx="1" fill="#71717a" />

      {/* Upward Force Arrow */}
      <path d="M60 48 L60 22 M52 30 L60 22 L68 30" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Allometric Formula text */}
      <rect x="20" y="88" width="80" height="20" rx="3" fill="#18181b" stroke="#27272a" />
      <text x="60" y="102" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" letterSpacing="0.5">
        1RM / BW^0.67
      </text>
    </svg>
  );
}

/**
 * Volume Load / Progressive Overload Stack Vector
 */
export function VolumeStackVector({ className = '', size = 96 }: VectorProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="120" height="120" rx="6" fill="#0d0d10" />

      {/* Progressive Step Bars */}
      <rect x="18" y="74" width="16" height="22" rx="2" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
      <rect x="38" y="62" width="16" height="34" rx="2" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />
      <rect x="58" y="48" width="16" height="48" rx="2" fill="#b91c1c" stroke="#dc2626" strokeWidth="1" />
      <rect x="78" y="32" width="16" height="64" rx="2" fill="#dc2626" stroke="#ef4444" strokeWidth="1" />

      {/* Trend progression arrow */}
      <path
        d="M26 66 L46 54 L66 40 L86 22 M76 22 L86 22 L86 32"
        stroke="#4ade80"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Overload formula tag */}
      <text x="60" y="110" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="800" letterSpacing="1">
        SETS × REPS × LOAD
      </text>
    </svg>
  );
}

/**
 * Muscle Group Quick Badge Icon (for chips, tabs, headers)
 */
export function MuscleIcon({ muscle, size = 20 }: { muscle: string; size?: number }) {
  const m = muscle.toLowerCase();
  if (m.includes('chest') || m.includes('pec')) {
    return <ChestVector size={size} />;
  }
  if (m.includes('back') || m.includes('lat')) {
    return <BackVector size={size} />;
  }
  return <VTaperGraphicVector size={size} />;
}
