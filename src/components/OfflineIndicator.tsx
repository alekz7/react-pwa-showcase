import React, { useState } from "react";
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
  Storage as CacheIcon,
  Speed as ConnectionIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useOffline } from "../hooks/useOffline";

interface OfflineIndicatorProps {
  showPersistent?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showPersistent = false,
}) => {
  const {
    isOnline,
    isOfflineReady,
    lastOnline,
    connectionType,
    checkConnection,
    getCacheSize,
    clearCache,
  } = useOffline();

  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Show alerts when connection status changes
  React.useEffect(() => {
    if (!isOnline && !showOfflineAlert) {
      setShowOfflineAlert(true);
      setShowOnlineAlert(false);
    } else if (isOnline && showOfflineAlert) {
      setShowOfflineAlert(false);
      setShowOnlineAlert(true);
    }
  }, [isOnline, showOfflineAlert]);

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    await checkConnection();
    setIsCheckingConnection(false);
  };

  const handleShowDetails = async () => {
    setShowDetailsDialog(true);
    const size = await getCacheSize();
    setCacheSize(size);
  };

  const handleClearCache = () => {
    clearCache();
    setCacheSize(0);
    setShowDetailsDialog(false);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatLastOnline = (date: Date | null): string => {
    if (!date) return "Unknown";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <>
      {/* Persistent Status Indicator */}
      {showPersistent && (
        <Box
          sx={{
            position: "fixed",
            top: 70,
            right: 16,
            zIndex: 1000,
          }}
        >
          <Chip
            icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
            label={isOnline ? "Online" : "Offline"}
            color={isOnline ? "success" : "warning"}
            variant="filled"
            onClick={handleShowDetails}
            sx={{ cursor: "pointer" }}
          />
        </Box>
      )}

      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={() => setShowOfflineAlert(false)}
      >
        <Alert
          severity="warning"
          variant="filled"
          onClose={() => setShowOfflineAlert(false)}
          action={
            <Box>
              <Button
                color="inherit"
                size="small"
                onClick={handleCheckConnection}
                disabled={isCheckingConnection}
              >
                {isCheckingConnection ? "Checking..." : "Retry"}
              </Button>
              <Button color="inherit" size="small" onClick={handleShowDetails}>
                Details
              </Button>
            </Box>
          }
        >
          You're offline.{" "}
          {isOfflineReady
            ? "Cached content is available."
            : "Limited functionality."}
        </Alert>
      </Snackbar>

      {/* Online Alert */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={() => setShowOnlineAlert(false)}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setShowOnlineAlert(false)}
        >
          You're back online! All features are now available.
        </Alert>
      </Snackbar>

      {/* Connection Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {isOnline ? (
              <OnlineIcon color="success" />
            ) : (
              <OfflineIcon color="warning" />
            )}
            Connection Status
          </Box>
        </DialogTitle>

        <DialogContent>
          <List>
            <ListItem>
              <ListItemIcon>
                {isOnline ? (
                  <OnlineIcon color="success" />
                ) : (
                  <OfflineIcon color="warning" />
                )}
              </ListItemIcon>
              <ListItemText
                primary="Network Status"
                secondary={
                  isOnline
                    ? "Connected to the internet"
                    : "No internet connection"
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CacheIcon color={isOfflineReady ? "success" : "disabled"} />
              </ListItemIcon>
              <ListItemText
                primary="Offline Ready"
                secondary={
                  isOfflineReady
                    ? "App is cached and ready for offline use"
                    : "App cache not available"
                }
              />
            </ListItem>

            {connectionType && (
              <ListItem>
                <ListItemIcon>
                  <ConnectionIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Connection Type"
                  secondary={connectionType.toUpperCase()}
                />
              </ListItem>
            )}

            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText
                primary="Last Online"
                secondary={formatLastOnline(lastOnline)}
              />
            </ListItem>

            {cacheSize !== null && (
              <ListItem>
                <ListItemIcon>
                  <CacheIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Cache Size"
                  secondary={formatBytes(cacheSize)}
                />
              </ListItem>
            )}
          </List>

          {!isOnline && isOfflineReady && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "info.light",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="info.contrastText">
                <strong>Offline Features Available:</strong>
                <br />
                • Browse cached demo pages
                <br />
                • View implementation examples
                <br />
                • Access previously loaded content
                <br />• Basic app functionality
              </Typography>
            </Box>
          )}

          {!isOnline && !isOfflineReady && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "warning.light",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="warning.contrastText">
                <strong>Limited Offline Support:</strong>
                <br />
                App cache is not available. Some features may not work properly
                while offline.
              </Typography>
            </Box>
          )}

          {isCheckingConnection && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Checking connection...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {cacheSize !== null && cacheSize > 0 && (
            <Button onClick={handleClearCache} color="warning">
              Clear Cache
            </Button>
          )}
          <Button
            onClick={handleCheckConnection}
            disabled={isCheckingConnection}
          >
            Check Connection
          </Button>
          <Button
            onClick={() => setShowDetailsDialog(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OfflineIndicator;
