// src/theme.ts (หรือ theme provider)
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: `'Noto Sans Thai', 'Roboto', 'Helvetica', 'Arial', sans-serif`,
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  palette: {
    primary: {
      main: import.meta.env.VITE_APP_PRIMARY_COLOR || '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: "#fff",
    },
    secondary: {
      main: '#f50057',
      light: '#ff5983',
      dark: '#c51162',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#718096',
    },
    divider: '#e2e8f0',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxShadow: '4px 0 8px -2px rgba(0, 0, 0, 0.1)',
          borderRight: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          fontWeight: 600,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
            transition: 'transform 0.2s ease-in-out',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.16)',
            },
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        popper: {
          '& .MuiPaper-root': {
            transition: 'none !important',
            animation: 'none !important',
          },
        },
      },
    },
    MuiPopper: {
      styleOverrides: {
        root: {
          '& .MuiPaper-root': {
            transition: 'none !important',
            animation: 'none !important',
          },
        },
      },
    },
  },
});

export default theme;
