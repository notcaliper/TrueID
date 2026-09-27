import { createTheme } from '@mui/material/styles';

/**
 * TrueID Modern Clean Fintech / Web3 SaaS Theme
 * Refined deep slate & navy palette with electric indigo & vibrant emerald accents.
 */

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0e17',          // Deep Midnight Slate
      paper: 'rgba(17, 24, 39, 0.75)', // Translucent Slate 900
    },
    primary: {
      main: '#6366f1',             // Electric Indigo
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#06b6d4',             // Cyber Cyan / Electric Teal
      light: '#22d3ee',
      dark: '#0891b2',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',             // Vibrant Emerald
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',             // Amber Gold
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#0f172a',
    },
    error: {
      main: '#f43f5e',             // Rose Red
      light: '#fb7185',
      dark: '#e11d48',
      contrastText: '#ffffff',
    },
    info: {
      main: '#38bdf8',             // Sky Blue
      light: '#7dd3fc',
      dark: '#0284c7',
      contrastText: '#0f172a',
    },
    text: {
      primary: '#f8fafc',          // Ultra Crisp Slate White
      secondary: '#94a3b8',        // Cool Neutral Slate
      disabled: '#475569',         // Muted Slate
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    action: {
      hover: 'rgba(255, 255, 255, 0.04)',
      selected: 'rgba(99, 102, 241, 0.12)',
      disabled: 'rgba(255, 255, 255, 0.25)',
      disabledBackground: 'rgba(255, 255, 255, 0.06)',
    },
  },

  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc', lineHeight: 1.2 },
    h2: { fontWeight: 700, letterSpacing: '-0.025em', color: '#f8fafc', lineHeight: 1.25 },
    h3: { fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc', lineHeight: 1.3 },
    h4: { fontWeight: 600, letterSpacing: '-0.015em', color: '#f8fafc', lineHeight: 1.35 },
    h5: { fontWeight: 600, letterSpacing: '-0.01em', color: '#f8fafc' },
    h6: { fontWeight: 600, letterSpacing: '-0.005em', color: '#f8fafc' },
    subtitle1: { color: '#94a3b8', fontWeight: 500, letterSpacing: '-0.01em' },
    subtitle2: { color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
    body1: { color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },

  shape: {
    borderRadius: 14,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0e17',
          color: '#f8fafc',
          scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 4,
          },
        },
      },
    },

    // Fintech Glass & Slate Card
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
        },
      },
    },

    // Clean Fintech Buttons
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          fontSize: '0.9rem',
          fontWeight: 600,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: '#ffffff',
          boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          '&:hover': {
            background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
            boxShadow: '0 4px 18px rgba(99, 102, 241, 0.5)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedSuccess: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          '&:hover': {
            background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
            boxShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
          color: '#e2e8f0',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.25)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },

    // Modern Form Inputs
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.22)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.25)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366f1',
              borderWidth: '1px',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#94a3b8',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#818cf8',
          },
        },
      },
    },

    // Top Navigation Bar
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(10, 14, 23, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: '#f8fafc',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: 'none',
        },
      },
    },

    // Drawer / Sidebar
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(10, 14, 23, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        },
      },
    },

    // List Navigation Items
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '3px 8px',
          padding: '8px 14px',
          color: '#94a3b8',
          transition: 'all 0.18s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: '#f8fafc',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            color: '#ffffff',
            borderLeft: '3px solid #6366f1',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.18)',
            },
            '& .MuiListItemIcon-root': {
              color: '#818cf8',
            },
          },
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#64748b',
          minWidth: 38,
          transition: 'color 0.18s ease',
        },
      },
    },

    // Clean Fintech Chips / Badges
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        filled: {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          color: '#cbd5e1',
        },
        filledPrimary: {
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          color: '#a5b4fc',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        },
        filledSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        },
        filledWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        },
        filledError: {
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          color: '#fda4af',
          border: '1px solid rgba(244, 63, 94, 0.3)',
        },
      },
    },

    // Fintech Data Tables
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          '& .MuiTableCell-root': {
            color: '#64748b',
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '14px 16px',
          color: '#cbd5e1',
          fontSize: '0.875rem',
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid transparent',
        },
        standardError: {
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          color: '#fda4af',
          borderColor: 'rgba(244, 63, 94, 0.25)',
          '& .MuiAlert-icon': { color: '#f43f5e' },
        },
        standardSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#6ee7b7',
          borderColor: 'rgba(16, 185, 129, 0.25)',
          '& .MuiAlert-icon': { color: '#10b981' },
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#fde68a',
          borderColor: 'rgba(245, 158, 11, 0.25)',
          '& .MuiAlert-icon': { color: '#f59e0b' },
        },
        standardInfo: {
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          color: '#7dd3fc',
          borderColor: 'rgba(56, 189, 248, 0.25)',
          '& .MuiAlert-icon': { color: '#38bdf8' },
        },
      },
    },
  },
});

export default theme;
