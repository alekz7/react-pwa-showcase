import { createTheme } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";

// Custom color palette for the PWA showcase
const palette = {
  primary: {
    main: "#1976d2", // Material Blue
    light: "#42a5f5",
    dark: "#1565c0",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#dc004e", // Material Pink
    light: "#ff5983",
    dark: "#9a0036",
    contrastText: "#ffffff",
  },
  success: {
    main: "#2e7d32", // Material Green
    light: "#4caf50",
    dark: "#1b5e20",
  },
  warning: {
    main: "#ed6c02", // Material Orange
    light: "#ff9800",
    dark: "#e65100",
  },
  error: {
    main: "#d32f2f", // Material Red
    light: "#f44336",
    dark: "#c62828",
  },
  info: {
    main: "#0288d1", // Material Light Blue
    light: "#03a9f4",
    dark: "#01579b",
  },
  background: {
    default: "#fafafa",
    paper: "#ffffff",
  },
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.6)",
  },
};

// Custom typography configuration
const typography = {
  fontFamily: [
    "Roboto",
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(","),
  h1: {
    fontSize: "2.5rem",
    fontWeight: 300,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: "2rem",
    fontWeight: 300,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: "1.75rem",
    fontWeight: 400,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: "1.5rem",
    fontWeight: 400,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: "1.25rem",
    fontWeight: 400,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: 1.6,
  },
  body1: {
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  body2: {
    fontSize: "0.875rem",
    lineHeight: 1.43,
  },
  button: {
    textTransform: "none" as const,
    fontWeight: 500,
  },
};

// Custom component overrides
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: "none" as const,
        fontWeight: 500,
        padding: "8px 16px",
      },
      contained: {
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        "&:hover": {
          boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
};

// Theme configuration
const themeOptions: ThemeOptions = {
  palette,
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
};

// Create and export the theme
export const theme = createTheme(themeOptions);

// Export theme types for TypeScript
export type AppTheme = typeof theme;
