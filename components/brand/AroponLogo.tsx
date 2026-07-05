import Svg, {
  Rect,
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';

interface AroponLogoProps {
  size?: number;
}

/**
 * Aropon brand logo mark — a gradient khata (ledger) with coloured entry dots.
 * viewBox 100×100, scales uniformly.
 */
export function AroponLogo({ size = 92 }: AroponLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Background gradient — top-left light → bottom-right dark */}
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#3AA3D8" />
          <Stop offset="55%" stopColor="#0A6EB4" />
          <Stop offset="100%" stopColor="#074A78" />
        </LinearGradient>
        {/* Inner glow for the book */}
        <LinearGradient id="bookShine" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <Stop offset="100%" stopColor="#e8f4fc" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Background rounded square */}
      <Rect x="0" y="0" width="100" height="100" rx="22" fill="url(#bg)" />

      {/* Subtle inner highlight ring */}
      <Rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="21"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      {/* Ledger book body */}
      <Rect x="20" y="15" width="56" height="68" rx="7" fill="url(#bookShine)" />

      {/* Book spine (left strip) */}
      <Rect x="20" y="15" width="13" height="68" rx="6" fill="rgba(10,93,151,0.18)" />
      <Rect x="20" y="15" width="13" height="68" rx="6" fill="none" stroke="rgba(10,93,151,0.12)" strokeWidth="1" />

      {/* Spine vertical line */}
      <Path d="M33 15 L33 83" stroke="rgba(10,93,151,0.1)" strokeWidth="1" />

      {/* Three ledger entry rows */}
      {/* Row 1 — green dot (income / পাবেন) */}
      <Circle cx="44" cy="33" r="4" fill="#2E7D32" />
      <Rect x="51" y="31" width="18" height="4" rx="2" fill="#cde8cd" />

      {/* Row 2 — red dot (expense / দিবেন) */}
      <Circle cx="44" cy="48" r="4" fill="#D32F2F" />
      <Rect x="51" y="46" width="14" height="4" rx="2" fill="#f5cccc" />

      {/* Row 3 — blue dot (cash) */}
      <Circle cx="44" cy="63" r="4" fill="#0A6EB4" />
      <Rect x="51" y="61" width="16" height="4" rx="2" fill="#c8dff5" />

      {/* Taka symbol at bottom of book */}
      <SvgText
        x="50"
        y="81"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#0A5D97"
        opacity={0.7}
      >
        ৳
      </SvgText>

      {/* Bottom-right corner dot accent */}
      <Circle cx="81" cy="82" r="3.5" fill="rgba(255,255,255,0.25)" />
      <Circle cx="88" cy="75" r="2" fill="rgba(255,255,255,0.15)" />
    </Svg>
  );
}
