import React, { forwardRef, ReactNode } from 'react';
import { Fade, Grow, Box } from '@mui/material';

// ==============================|| TRANSITIONS (TS) ||============================== //

type TransitionType = 'grow' | 'fade' | 'collapse' | 'slide' | 'zoom';
type TransitionPosition = 'top-left' | 'top-right' | 'top' | 'bottom-left' | 'bottom-right' | 'bottom';

interface TransitionsProps {
  children: ReactNode;
  type?: TransitionType;
  position?: TransitionPosition;
  // อื่น ๆ ที่มากับ MUI transition เช่น "in", "timeout", "style", ฯลฯ
  [key: string]: any;
}

const Transitions = forwardRef<HTMLDivElement, TransitionsProps>(
  ({ children, position = 'top-left', type = 'grow', ...others }, ref) => {
    let positionSX: React.CSSProperties = {
      transformOrigin: '0 0 0'
    };

    switch (position) {
      case 'top-right':
      case 'top':
      case 'bottom-left':
      case 'bottom-right':
      case 'bottom':
      case 'top-left':
      default:
        positionSX = {
          transformOrigin: '0 0 0'
        };
        break;
    }

    return (
      <Box ref={ref}>
        {type === 'grow' && (
          <Grow {...others}>
            <Box sx={positionSX}>{children}</Box>
          </Grow>
        )}
        {type === 'fade' && (
          <Fade
            {...others}
            timeout={{
              appear: 0,
              enter: 300,
              exit: 150
            }}
          >
            <Box sx={positionSX}>{children}</Box>
          </Fade>
        )}
      </Box>
    );
  }
);

export default Transitions;
