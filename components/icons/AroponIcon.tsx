import { SvgXml } from 'react-native-svg';
import { ICON_SVG, type IconName } from './aroponIconData';

export type { IconName };

interface AroponIconProps {
  name: IconName;
  size?: number;
  color?: string;
}

function tintSvg(xml: string, color: string): string {
  return xml
    .replace(/fill="[^"]*"/g, `fill="${color}"`)
    .replace(/fill='[^']*'/g, `fill="${color}"`);
}

export function AroponIcon({ name, size = 28, color }: AroponIconProps) {
  const xml = color ? tintSvg(ICON_SVG[name], color) : ICON_SVG[name];
  return <SvgXml key={color ? `${name}-${color}` : name} xml={xml} width={size} height={size} />;
}
