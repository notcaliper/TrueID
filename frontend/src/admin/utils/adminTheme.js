/**
 * Unified Admin Portal Theming Utilities
 * Provides responsive color tokens and style helpers for both
 * crisp White/Light mode and Blockscan Dark mode.
 */

export const getAdminThemeTokens = (isLight) => ({
  isLight,
  bg: isLight ? '#f8fafc' : '#111214',
  paper: isLight ? '#ffffff' : '#181a1c',
  surfaceSubtle: isLight ? '#f8fafc' : '#141518',
  surfaceHover: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)',
  border: isLight ? '#e2e8f0' : '#282a2d',
  borderSubtle: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
  
  // Typography
  textPrimary: isLight ? '#0f172a' : '#f8fafc',
  textSecondary: isLight ? '#475569' : '#cbd5e1',
  textMuted: isLight ? '#64748b' : '#94a3b8',
  
  // Primary brand / accent
  primary: isLight ? '#2563eb' : '#3b82f6',
  primaryLight: isLight ? '#3b82f6' : '#60a5fa',
  primaryDark: isLight ? '#1d4ed8' : '#1e40af',
  primaryBg: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.12)',
  primaryBorder: isLight ? 'rgba(37, 99, 235, 0.25)' : 'rgba(59, 130, 246, 0.3)',
  
  // Status colors
  success: isLight ? '#10b981' : '#34d399',
  successText: isLight ? '#047857' : '#34d399',
  successBg: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.12)',
  successBorder: isLight ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.3)',
  
  warning: isLight ? '#f59e0b' : '#fbbf24',
  warningText: isLight ? '#b45309' : '#fbbf24',
  warningBg: isLight ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.12)',
  warningBorder: isLight ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.3)',
  
  error: isLight ? '#ef4444' : '#f87171',
  errorText: isLight ? '#b91c1c' : '#f87171',
  errorBg: isLight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.12)',
  errorBorder: isLight ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.3)',
});

export const getCardStyle = (isLight, extra = {}) => ({
  borderRadius: 3,
  bgcolor: isLight ? '#ffffff' : '#181a1c',
  border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
  boxShadow: isLight 
    ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)'
    : '0 4px 14px 0 rgba(0, 0, 0, 0.35)',
  transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
  ...extra
});

export const getBannerStyle = (isLight, extra = {}) => ({
  mb: 3.5,
  borderRadius: 3,
  background: isLight
    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, #ffffff 100%)'
    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, #181a1c 100%)',
  border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
  boxShadow: isLight 
    ? '0 2px 6px 0 rgba(0, 0, 0, 0.04)'
    : '0 8px 24px 0 rgba(0, 0, 0, 0.3)',
  p: { xs: 2.5, md: 3.5 },
  ...extra
});

export const getInputStyle = (isLight) => ({
  bgcolor: isLight ? '#f8fafc' : '#141518',
  borderRadius: 2,
  color: isLight ? '#0f172a' : '#f8fafc',
  '& fieldset': { 
    borderColor: isLight ? '#e2e8f0' : '#282a2d' 
  },
  '&:hover fieldset': { 
    borderColor: isLight ? '#94a3b8' : '#3b82f6' 
  },
  '&.Mui-focused fieldset': { 
    borderColor: isLight ? '#2563eb' : '#3b82f6' 
  }
});
