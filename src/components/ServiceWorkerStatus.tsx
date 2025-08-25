import React, { useState, useEffect } from "react";
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  CloudDone as OnlineIcon,
  CloudOff as OfflineIcon,
  Update as UpdateIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from "@mui/icons-material";
import { useRegisterSW } from "virtual:pwa-register/react";

interface ServiceWorkerStatusProps {
  onUpdate?: () => void;
  onOfflineReady?: () => void;
}

export const ServiceWorkerStatus: React.FC<ServiceWorkerStatusProps> = ({
  onUpdate,
  onOfflineReady,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDetails, setShowDetails] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
    onOfflineReady() {
      console.log("App ready to work offline");
      onOfflineReady?.();
    },
    onNeedRefresh() {
      console.log("New content available, please refresh");
      onUpdate?.();
    },
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismissOfflineReady = () => {
    setOfflineReady(false);
    setInstallPromptDismissed(true);
  };

  const handleDismissUpdate = () => {
    setNeedRefresh(false);
  };

  const getConnectionStatus = () => {
    if (!isOnline) {
      return {
        color: "warning" as const,
        icon: <OfflineIcon />,
        text: "Offline Mode",
        description: "Using cached content",
      };
    }

    if (offlineReady) {
      return {
        color: "success" as const,
        icon: <OnlineIcon />,
        text: "Ready for Offline",
        description: "App cached and ready to work offline",
      };
    }

    return {
      color: "info" as const,
      icon: <OnlineIcon />,
      text: "Online",
      description: "Connected to the internet",
    };
  };

  const status = getConnectionStatus();

  return (
    <>
      {/* Connection Status Chip */}
      <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
        <Chip
          icon={status.icon}
          label={status.text}
          color={status.color}
          variant="filled"
          onClick={() => setShowDetails(!showDetails)}
          onDelete={() => setShowDetails(!showDetails)}
          deleteIcon={showDetails ? <CollapseIcon /> : <ExpandIcon />}
          sx={{ cursor: "pointer" }}
        />

        <Collapse in={showDetails}>
          <Box
            sx={{
              mt: 1,
              p: 2,
              backgroundColor: "background.paper",
              borderRadius: 1,
              boxShadow: 2,
              minWidth: 250,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {status.description}
            </Typography>

            {offlineReady && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                ✓ App is cached and ready for offline use
              </Typography>
            )}

            {needRefresh && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="warning.main">
                  ⚠ New version available
                </Typography>
                <Button
                  size="small"
                  startIcon={<UpdateIcon />}
                  onClick={handleUpdate}
                  sx={{ mt: 1 }}
                >
                  Update Now
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              <Button
                size="small"
                onClick={() => window.location.reload()}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* Offline Ready Notification */}
      <Snackbar
        open={offlineReady && !installPromptDismissed}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleDismissOfflineReady}
          severity="success"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleDismissOfflineReady}
            >
              Got it
            </Button>
          }
        >
          App is ready to work offline!
        </Alert>
      </Snackbar>

      {/* Update Available Notification */}
      <Snackbar
        open={needRefresh}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          variant="filled"
          action={
            <Box>
              <Button color="inherit" size="small" onClick={handleUpdate}>
                Update
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={handleDismissUpdate}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          }
        >
          New version available! Click update to get the latest features.
        </Alert>
      </Snackbar>
    </>
  );
};

export default ServiceWorkerStatus;
