import React from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./index";

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Custom theme provider that wraps the MUI ThemeProvider
 * and includes CssBaseline for consistent styling
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
