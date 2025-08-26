import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

// Skip link that's only visible when focused
const SkipLink = styled(Button)(({ theme }) => ({
  position: "absolute",
  top: -40,
  left: 6,
  zIndex: 9999,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 2),
  textDecoration: "none",
  fontSize: "0.875rem",
  fontWeight: 600,
  borderRadius: theme.shape.borderRadius,
  border: `2px solid ${theme.palette.primary.contrastText}`,

  "&:focus": {
    top: 6,
    outline: `3px solid ${theme.palette.warning.main}`,
    outlineOffset: 2,
  },

  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const AccessibilityInfo = styled(Box)(({ theme }) => ({
  position: "absolute",
  left: "-10000px",
  width: "1px",
  height: "1px",
  overflow: "hidden",

  "&:focus-within": {
    position: "static",
    width: "auto",
    height: "auto",
    overflow: "visible",
    backgroundColor: theme.palette.background.paper,
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    margin: theme.spacing(1),
  },
}));

interface AccessibilityNavigationProps {
  mainContentId?: string;
  navigationId?: string;
}

const AccessibilityNavigation: React.FC<AccessibilityNavigationProps> = ({
  mainContentId = "main-content",
  navigationId = "main-navigation",
}) => {
  const skipToMain = () => {
    const mainElement = document.getElementById(mainContentId);
    if (mainElement) {
      mainElement.focus();
      mainElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const skipToNavigation = () => {
    const navElement = document.getElementById(navigationId);
    if (navElement) {
      navElement.focus();
      navElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Skip Links */}
      <SkipLink onClick={skipToMain} tabIndex={1}>
        Skip to main content
      </SkipLink>

      <SkipLink onClick={skipToNavigation} tabIndex={2} sx={{ left: 160 }}>
        Skip to navigation
      </SkipLink>

      {/* Accessibility Information */}
      <AccessibilityInfo>
        <Typography variant="h6" gutterBottom>
          Accessibility Features
        </Typography>
        <Typography variant="body2" paragraph>
          This application includes the following accessibility features:
        </Typography>
        <ul>
          <li>Keyboard navigation support (Tab, Enter, Space, Arrow keys)</li>
          <li>Screen reader compatibility with ARIA labels and live regions</li>
          <li>High contrast mode support</li>
          <li>Reduced motion preferences respected</li>
          <li>Focus indicators and skip links</li>
        </ul>
        <Typography variant="body2" paragraph>
          <strong>Keyboard Shortcuts:</strong>
        </Typography>
        <ul>
          <li>Alt + 1: Skip to main content</li>
          <li>Alt + 2: Skip to navigation</li>
          <li>Tab: Navigate between interactive elements</li>
          <li>Enter/Space: Activate buttons and links</li>
          <li>Escape: Close dialogs and menus</li>
        </ul>
      </AccessibilityInfo>

      {/* Screen Reader Only Content */}
      <Box
        component="div"
        sx={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <Typography component="h1">
          React PWA Showcase - Accessibility Enhanced
        </Typography>
        <Typography>
          This is a demonstration application showcasing Progressive Web App
          capabilities with full accessibility support including screen reader
          compatibility, keyboard navigation, and WCAG 2.1 compliance.
        </Typography>
      </Box>
    </>
  );
};

export default AccessibilityNavigation;
