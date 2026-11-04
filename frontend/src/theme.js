import { createTheme } from '@mui/material/styles';

/**
 * TrueID Blockscan / Etherscan Professional Design System
 * Supports both crisp White/Light mode (default) and exact Blockscan Dark mode.
 */

export const getTheme = (mode = 'light') => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      background: {
        default: isLight ? '#f8fafc' : '#111214',
        paper: isLight ? '#ffffff' : '#181a1c',
        subtle: isLight ? '#f1f5f9' : '#1e2124',
      },
      primary: {
        main: isLight ? '#2563eb' : '#3b82f6',
        light: isLight ? '#3b82f6' : '#60a5fa',
        dark: isLight ? '#1d4ed8' : '#1d4ed8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#06b6d4',
        contrastText: '#ffffff',
      },
      success: {
        main: isLight ? '#16a34a' : '#22c55e',
        light: isLight ? '#22c55e' : '#4ade80',
        dark: '#15803d',
        contrastText: '#ffffff',
      },
      warning: {
        main: isLight ? '#d97706' : '#f59e0b',
        contrastText: '#ffffff',
      },
      error: {
        main: isLight ? '#dc2626' : '#ef4444',
        contrastText: '#ffffff',
      },
      text: {
        primary: isLight ? '#0f172a' : '#ffffff',
        secondary: isLight ? '#64748b' : '#8b949e',
        disabled: isLight ? '#94a3b8' : '#4b5563',
      },
      divider: isLight ? '#e2e8f0' : '#282a2d',
      action: {
        hover: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
        selected: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.15)',
      },
    },

    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.025em', color: isLight ? '#0f172a' : '#ffffff' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em', color: isLight ? '#0f172a' : '#ffffff' },
      h3: { fontWeight: 700, letterSpacing: '-0.015em', color: isLight ? '#0f172a' : '#ffffff' },
      h4: { fontWeight: 700, letterSpacing: '-0.01em', color: isLight ? '#0f172a' : '#ffffff' },
      h5: { fontWeight: 600, color: isLight ? '#0f172a' : '#ffffff' },
      h6: { fontWeight: 600, color: isLight ? '#0f172a' : '#ffffff' },
      subtitle1: { color: isLight ? '#475569' : '#8b949e', fontWeight: 500 },
      subtitle2: { color: isLight ? '#64748b' : '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
      body1: { color: isLight ? '#1e293b' : '#d1d5db', fontSize: '0.925rem', lineHeight: 1.6 },
      body2: { color: isLight ? '#64748b' : '#8b949e', fontSize: '0.85rem', lineHeight: 1.5 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    },

    shape: {
      borderRadius: 10,
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? '#f8fafc' : '#111214',
            color: isLight ? '#0f172a' : '#ffffff',
            margin: 0,
            padding: 0,
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            WebkitFontSmoothing: 'antialiased',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#ffffff' : '#181a1c',
            backgroundImage: 'none',
            border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
            borderRadius: 12,
            boxShadow: isLight
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)'
              : '0 4px 12px 0 rgba(0, 0, 0, 0.3)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#ffffff' : '#181a1c',
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '8px 16px',
          },
          containedPrimary: {
            backgroundColor: isLight ? '#2563eb' : '#3b82f6',
            color: '#ffffff',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: isLight ? '#1d4ed8' : '#2563eb',
              boxShadow: 'none',
            },
          },
          outlined: {
            borderColor: isLight ? '#e2e8f0' : '#282a2d',
            color: isLight ? '#334155' : '#e2e8f0',
            '&:hover': {
              borderColor: isLight ? '#cbd5e1' : '#4b5563',
              backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '0.75rem',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isLight ? '#ffffff' : '#181a1c',
            backgroundImage: 'none',
            borderRadius: 14,
            border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
            boxShadow: isLight
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isLight ? '#f1f5f9' : '#282a2d',
            padding: '14px 16px',
            fontSize: '0.875rem',
          },
          head: {
            fontWeight: 600,
            backgroundColor: isLight ? '#f8fafc' : '#141618',
            color: isLight ? '#64748b' : '#8b949e',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
  });
};

export default getTheme('light');
