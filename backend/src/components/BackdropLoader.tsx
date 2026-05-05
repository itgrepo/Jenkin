import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';

interface BackdropLoaderProps {
  show: boolean;
}

const BackdropLoader: React.FC<BackdropLoaderProps> = ({ show }) => {
  return (
    <Backdrop
      open={show}
      sx={{
        // zIndex: (theme) => theme.zIndex.drawer + 1,
        zIndex:9999,
        color: '#fff',
      }}
    >
      <CircularProgress size={70} color="inherit" />
    </Backdrop>
  );
};

export default BackdropLoader;
