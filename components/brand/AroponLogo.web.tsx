import { Image } from 'react-native';

interface AroponLogoProps {
  size?: number;
}

const LOGO_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3AA3D8"/>
      <stop offset="55%" stop-color="#0A6EB4"/>
      <stop offset="100%" stop-color="#074A78"/>
    </linearGradient>
    <linearGradient id="bookShine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#e8f4fc" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="100" height="100" rx="22" fill="url(#bg)"/>
  <rect x="2" y="2" width="96" height="96" rx="21" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
  <rect x="20" y="15" width="56" height="68" rx="7" fill="url(#bookShine)"/>
  <rect x="20" y="15" width="13" height="68" rx="6" fill="rgba(10,93,151,0.18)"/>
  <rect x="20" y="15" width="13" height="68" rx="6" fill="none" stroke="rgba(10,93,151,0.12)" stroke-width="1"/>
  <path d="M33 15 L33 83" stroke="rgba(10,93,151,0.1)" stroke-width="1"/>
  <circle cx="44" cy="33" r="4" fill="#2E7D32"/>
  <rect x="51" y="31" width="18" height="4" rx="2" fill="#cde8cd"/>
  <circle cx="44" cy="48" r="4" fill="#D32F2F"/>
  <rect x="51" y="46" width="14" height="4" rx="2" fill="#f5cccc"/>
  <circle cx="44" cy="63" r="4" fill="#0A6EB4"/>
  <rect x="51" y="61" width="16" height="4" rx="2" fill="#c8dff5"/>
  <text x="50" y="81" text-anchor="middle" font-size="11" font-weight="700" fill="#0A5D97" opacity="0.7">&#2547;</text>
  <circle cx="81" cy="82" r="3.5" fill="rgba(255,255,255,0.25)"/>
  <circle cx="88" cy="75" r="2" fill="rgba(255,255,255,0.15)"/>
</svg>`;

export function AroponLogo({ size = 92 }: AroponLogoProps) {
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;
  return <Image source={{ uri }} style={{ width: size, height: size }} />;
}
