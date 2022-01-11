import * as React from 'react';

import SvgIcon, {SVGIconProps} from './svgIcon';

const IconMenu = React.forwardRef<SVGSVGElement, SVGIconProps>(function IconMenu(
  props: SVGIconProps,
  ref: React.Ref<SVGSVGElement>
) {
  return (
    <SvgIcon {...props} ref={ref}>
      <path d="M15.19,2.53H.81A.75.75,0,0,1,.81,1H15.19a.75.75,0,1,1,0,1.5Z" />
      <path d="M15.19,15H.81a.75.75,0,0,1,0-1.5H15.19a.75.75,0,1,1,0,1.5Z" />
      <path d="M15.19,8.75H.81a.75.75,0,1,1,0-1.5H15.19a.75.75,0,0,1,0,1.5Z" />
    </SvgIcon>
  );
});

IconMenu.displayName = 'IconMenu';

export {IconMenu};
