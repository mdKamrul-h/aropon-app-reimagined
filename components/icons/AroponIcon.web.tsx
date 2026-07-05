import { createElement } from 'react';
import { ICON_SVG, type IconName } from './aroponIconData';

export type { IconName };

interface AroponIconProps {
  name: IconName;
  size?: number;
}

/** Web: render inline SVG — SvgXml leaks `xml` onto the DOM and distorts complex paths. */
export function AroponIcon({ name, size = 28 }: AroponIconProps) {
  const svg = ICON_SVG[name].replace('<svg', `<svg width="${size}" height="${size}"`);

  return createElement('span', {
    style: {
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
      flexShrink: 0,
    },
    'aria-hidden': true,
    dangerouslySetInnerHTML: { __html: svg },
  });
}
