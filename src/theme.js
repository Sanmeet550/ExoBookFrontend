import { createTheme } from '@mui/material/styles';

/**
 * Enterprise ERP Design System Theme
 * Brand Colors:
 * - Primary: #262755 (Deep Corporate Navy)
 * - Secondary: #fdd53d (Vibrant Accent Gold)
 * Compact font sizing (~50% reduction of standard default) for high-density modern ERP interfaces.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#262755',
      light: '#37397b',
      dark: '#1b1c3d',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#fdd53d',
      light: '#fee16e',
      dark: '#e6be27',
      contrastText: '#262755',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    htmlFontSize: 16,
    h5: {
      fontWeight: 700,
      fontSize: '0.95rem', // ~50% reduced from typical 1.5-2rem
      letterSpacing: '-0.01em',
      color: '#0F172A',
    },
    h6: {
      fontWeight: 600,
      fontSize: '0.825rem',
      color: '#0F172A',
    },
    subtitle1: {
      fontSize: '0.725rem',
      fontWeight: 600,
    },
    subtitle2: {
      fontSize: '0.675rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.75rem',
    },
    body2: {
      fontSize: '0.6875rem', // Compact 11px
    },
    caption: {
      fontSize: '0.6rem', // Compact 9.5px
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.6875rem',
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 5,
          padding: '3px 10px',
          fontSize: '0.6875rem',
          minHeight: 28,
        },
        containedPrimary: {
          backgroundColor: '#262755',
          '&:hover': {
            backgroundColor: '#1b1c3d',
          },
        },
        containedSecondary: {
          backgroundColor: '#fdd53d',
          color: '#262755',
          '&:hover': {
            backgroundColor: '#e6be27',
          },
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          padding: 4,
          borderRadius: 4,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          borderRadius: 6,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8FAFC',
          '& .MuiTableCell-root': {
            fontWeight: 600,
            fontSize: '0.625rem', // 10px uppercase header
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            borderBottom: '1px solid #E2E8F0',
            padding: '6px 10px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '6px 10px', // Compact consistent spacing
          fontSize: '0.6875rem',
          borderBottom: '1px solid #F1F5F9',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(38, 39, 85, 0.03)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.6875rem',
        },
        input: {
          padding: '5px 8px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.6875rem',
        },
      },
    },
    MuiCheckbox: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          padding: 3,
          color: '#94A3B8',
          '&.Mui-checked': {
            color: '#262755',
          },
        },
      },
    },
    MuiChip: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          fontSize: '0.625rem',
          height: 20,
          fontWeight: 600,
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          fontSize: '0.6875rem',
        },
        selectLabel: {
          fontSize: '0.6875rem',
        },
        displayedRows: {
          fontSize: '0.6875rem',
        },
        select: {
          fontSize: '0.6875rem',
        },
      },
    },
  },
});
