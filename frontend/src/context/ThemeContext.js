import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../theme';

const ColorModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  isLight: true
});

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('trueid_color_mode') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('trueid_color_mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => getTheme(mode), [mode]);

  const contextValue = useMemo(() => ({
    mode,
    toggleTheme,
    isLight: mode === 'light'
  }), [mode]);

  return (
    <ColorModeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ColorModeContext;
