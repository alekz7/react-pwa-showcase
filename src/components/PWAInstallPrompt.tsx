import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Fab,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  Smartphone as PhoneIcon,
  Computer as DesktopIcon,
} from "@mui/icons-material";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      const isInWebAppiOS =
        (window.navigator as { standalone?: boolean }).standalone === true;
      const isInstalled = isStandalone || isInWebAppiOS;

      setIsInstalled(isInstalled);

      if (!isInstalled) {
        // Show FAB after a delay if not installed
        const timer = setTimeout(() => {
          setShowFab(true);
        }, 5000);

        return () => clearTimeout(timer);
      }
    };

    checkInstallStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      setShowFab(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowFab(false);
      setShowInstallDialog(false);
      setShowSuccessMessage(true);
      onInstall?.();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      setShowInstallDialog(true);
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
      onDismiss?.();
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowFab(false);
  };

  const handleDialogClose = () => {
    setShowInstallDialog(false);
    onDismiss?.();
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("chrome") && !userAgent.includes("edg")) {
      return {
        browser: "Chrome",
        icon: <DesktopIcon />,
        steps: [
          "Click the three dots menu (⋮) in the top right corner",
          'Select "Install React PWA Showcase..."',
          'Click "Install" in the confirmation dialog',
        ],
      };
    } else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
      return {
        browser: "Safari",
        icon: <PhoneIcon />,
        steps: [
          "Tap the Share button (□↗) at the bottom of the screen",
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top right corner',
        ],
      };
    } else if (userAgent.includes("firefox")) {
      return {
        browser: "Firefox",
        icon: <DesktopIcon />,
        steps: [
          "Click the three lines menu (☰) in the top right corner",
          'Select "Install this site as an app"',
          'Click "Install" in the confirmation dialog',
        ],
      };
    } else {
      return {
        browser: "Your Browser",
        icon: <DesktopIcon />,
        steps: [
          'Look for an install or "Add to Home Screen" option in your browser menu',
          "Follow the prompts to install the app",
          "The app will be available from your device's home screen or app menu",
        ],
      };
    }
  };

  if (isInstalled) {
    return (
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setShowSuccessMessage(false)} severity="success">
          PWA installed successfully! You can now use it offline.
        </Alert>
      </Snackbar>
    );
  }

  const instructions = getInstallInstructions();

  return (
    <>
      {/* Install FAB */}
      {showFab && (
        <Fab
          color="primary"
          aria-label="install app"
          onClick={handleInstallClick}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <InstallIcon />
        </Fab>
      )}

      {/* Install Instructions Dialog */}
      <Dialog
        open={showInstallDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={1}>
              {instructions.icon}
              <Typography variant="h6">Install PWA Showcase</Typography>
            </Box>
            <IconButton onClick={handleDialogClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Install this app on your device for the best experience. It will
            work offline and feel like a native app.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Installation steps for {instructions.browser}:
          </Typography>

          <Box component="ol" sx={{ pl: 2 }}>
            {instructions.steps.map((step, index) => (
              <Typography
                component="li"
                key={index}
                variant="body2"
                sx={{ mb: 1 }}
              >
                {step}
              </Typography>
            ))}
          </Box>

          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "primary.light",
              borderRadius: 1,
              color: "primary.contrastText",
            }}
          >
            <Typography variant="body2">
              <strong>Benefits of installing:</strong>
              <br />
              • Works offline with cached content
              <br />
              • Faster loading times
              <br />
              • Native app-like experience
              <br />• Access from home screen or app menu
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleDialogClose}>Maybe Later</Button>
          <Button variant="contained" onClick={handleDialogClose}>
            Got It
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setShowSuccessMessage(false)} severity="success">
          PWA installed successfully! You can now use it offline.
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAInstallPrompt;
