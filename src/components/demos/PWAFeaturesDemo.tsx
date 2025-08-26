import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}
import {
  Container,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from "@mui/material";
import {
  InstallMobile as InstallIcon,
  CloudSync as SyncIcon,
  Notifications as NotificationIcon,
  Storage as StorageIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  serviceWorkerStatus:
    | "installing"
    | "installed"
    | "activated"
    | "redundant"
    | "none";
  notificationPermission: NotificationPermission;
  cacheSize: number;
  lastUpdate: Date | null;
}

const PWAFeaturesDemo: React.FC = () => {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    serviceWorkerStatus: "none",
    notificationPermission: "default",
    cacheSize: 0,
    lastUpdate: null,
  });

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [cacheDetails, setCacheDetails] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    checkPWAStatus();

    const setupEventListeners = () => {
      // Listen for install prompt
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        setInstallPrompt(e);
        setPwaStatus((prev) => ({ ...prev, isInstallable: true }));
      });

      // Listen for online/offline status
      window.addEventListener("online", handleOnlineStatus);
      window.addEventListener("offline", handleOnlineStatus);

      // Listen for service worker updates
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          setPwaStatus((prev) => ({ ...prev, lastUpdate: new Date() }));
        });
      }
    };

    setupEventListeners();

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  const checkPWAStatus = async () => {
    // Check if app is installed
    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    // Check service worker status
    let swStatus: PWAStatus["serviceWorkerStatus"] = "none";
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        if (registration.installing) swStatus = "installing";
        else if (registration.waiting) swStatus = "installed";
        else if (registration.active) swStatus = "activated";
      }
    }

    // Check notification permission
    const notificationPermission =
      "Notification" in window
        ? Notification.permission
        : ("denied" as NotificationPermission);

    // Estimate cache size
    let cacheSize = 0;
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        cacheSize = estimate.usage || 0;
      } catch (error) {
        console.warn("Could not estimate storage usage:", error);
      }
    }

    setPwaStatus((prev) => ({
      ...prev,
      isInstalled,
      serviceWorkerStatus: swStatus,
      notificationPermission,
      cacheSize,
    }));
  };

  const handleOnlineStatus = () => {
    setPwaStatus((prev) => ({ ...prev, isOnline: navigator.onLine }));
  };

  const handleInstallPWA = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") {
        setPwaStatus((prev) => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
        }));
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error("Installation failed:", error);
    }
    setShowInstallDialog(false);
  };

  const handleRequestNotifications = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPwaStatus((prev) => ({ ...prev, notificationPermission: permission }));

      if (permission === "granted") {
        // Send a test notification
        new Notification("PWA Showcase", {
          body: "Notifications are now enabled!",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
        });
      }
    } catch (error) {
      console.error("Notification request failed:", error);
    }
    setShowNotificationDialog(false);
  };

  const handleUpdateServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) return;

    setIsUpdating(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        setPwaStatus((prev) => ({ ...prev, lastUpdate: new Date() }));
      }
    } catch (error) {
      console.error("Service worker update failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCache = async () => {
    if (!("caches" in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // Refresh cache size
      await checkPWAStatus();

      alert("Cache cleared successfully!");
    } catch (error) {
      console.error("Cache clearing failed:", error);
      alert("Failed to clear cache");
    }
  };

  const handleViewCacheDetails = async () => {
    if (!("caches" in window)) return;

    try {
      const cacheNames = await caches.keys();
      const details: string[] = [];

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        details.push(`${name}: ${keys.length} items`);
      }

      setCacheDetails(details);
    } catch (error) {
      console.error("Failed to get cache details:", error);
      setCacheDetails(["Failed to load cache details"]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "granted":
      case "activated":
      case "installed":
        return "success";
      case "denied":
      case "redundant":
        return "error";
      case "installing":
        return "warning";
      default:
        return "default";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        PWA Features Demo
      </Typography>

      <Typography
        variant="body1"
        paragraph
        align="center"
        color="text.secondary"
      >
        Explore Progressive Web App capabilities including installation, service
        workers, notifications, and offline functionality.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
          },
          gap: 3,
        }}
      >
        {/* PWA Installation */}
        <Box>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <InstallIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">PWA Installation</Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Installation Status:
                </Typography>
                <Chip
                  label={pwaStatus.isInstalled ? "Installed" : "Not Installed"}
                  color={pwaStatus.isInstalled ? "success" : "default"}
                  icon={pwaStatus.isInstalled ? <CheckIcon /> : <InfoIcon />}
                />
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Installable:
                </Typography>
                <Chip
                  label={pwaStatus.isInstallable ? "Yes" : "No"}
                  color={pwaStatus.isInstallable ? "success" : "default"}
                />
              </Box>

              {!pwaStatus.isInstalled && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This app can be installed on your device for a native app-like
                  experience.
                </Alert>
              )}
            </CardContent>

            <CardActions>
              <Button
                variant="contained"
                onClick={() => setShowInstallDialog(true)}
                disabled={!pwaStatus.isInstallable || pwaStatus.isInstalled}
                startIcon={<InstallIcon />}
              >
                Install App
              </Button>
            </CardActions>
          </Card>
        </Box>

        {/* Service Worker Status */}
        <Box>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SyncIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Service Worker</Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status:
                </Typography>
                <Chip
                  label={pwaStatus.serviceWorkerStatus}
                  color={
                    getStatusColor(pwaStatus.serviceWorkerStatus) as
                      | "success"
                      | "warning"
                      | "error"
                      | "default"
                  }
                />
              </Box>

              {pwaStatus.lastUpdate && (
                <Box mb={2}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Last Update:
                  </Typography>
                  <Typography variant="body2">
                    {pwaStatus.lastUpdate.toLocaleString()}
                  </Typography>
                </Box>
              )}

              {isUpdating && <LinearProgress sx={{ mb: 2 }} />}
            </CardContent>

            <CardActions>
              <Button
                variant="outlined"
                onClick={handleUpdateServiceWorker}
                disabled={
                  isUpdating || pwaStatus.serviceWorkerStatus === "none"
                }
                startIcon={<SyncIcon />}
              >
                Update
              </Button>
            </CardActions>
          </Card>
        </Box>

        {/* Push Notifications */}
        <Box>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Push Notifications</Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Permission:
                </Typography>
                <Chip
                  label={pwaStatus.notificationPermission}
                  color={
                    getStatusColor(pwaStatus.notificationPermission) as
                      | "success"
                      | "warning"
                      | "error"
                      | "default"
                  }
                />
              </Box>

              {pwaStatus.notificationPermission === "denied" && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Notifications are blocked. Enable them in browser settings.
                </Alert>
              )}

              {!("Notification" in window) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  This browser does not support notifications.
                </Alert>
              )}
            </CardContent>

            <CardActions>
              <Button
                variant="contained"
                onClick={() => setShowNotificationDialog(true)}
                disabled={
                  pwaStatus.notificationPermission === "granted" ||
                  !("Notification" in window)
                }
                startIcon={<NotificationIcon />}
              >
                Enable Notifications
              </Button>
            </CardActions>
          </Card>
        </Box>

        {/* Cache Management */}
        <Box>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Cache Management</Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cache Size:
                </Typography>
                <Typography variant="body1">
                  {formatBytes(pwaStatus.cacheSize)}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Online Status:
                </Typography>
                <Chip
                  label={pwaStatus.isOnline ? "Online" : "Offline"}
                  color={pwaStatus.isOnline ? "success" : "warning"}
                  icon={pwaStatus.isOnline ? <OnlineIcon /> : <OfflineIcon />}
                />
              </Box>

              {cacheDetails.length > 0 && (
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Cache Details:
                  </Typography>
                  <List dense>
                    {cacheDetails.map((detail, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText primary={detail} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>

            <CardActions>
              <Button
                variant="outlined"
                onClick={handleViewCacheDetails}
                startIcon={<InfoIcon />}
              >
                View Details
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearCache}
                color="warning"
                startIcon={<StorageIcon />}
              >
                Clear Cache
              </Button>
            </CardActions>
          </Card>
        </Box>

        {/* Offline Functionality Demo */}
        <Box sx={{ gridColumn: "1 / -1" }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Offline Functionality Test
              </Typography>

              <Typography variant="body2" color="text.secondary" paragraph>
                Try disconnecting your internet connection to test offline
                capabilities. The app should continue to work with cached
                content.
              </Typography>

              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2">Current Status:</Typography>
                <Chip
                  label={pwaStatus.isOnline ? "Online" : "Offline"}
                  color={pwaStatus.isOnline ? "success" : "warning"}
                  icon={pwaStatus.isOnline ? <OnlineIcon /> : <OfflineIcon />}
                />
              </Box>

              {!pwaStatus.isOnline && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You're currently offline! The app is running from cached
                  content.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Install Dialog */}
      <Dialog
        open={showInstallDialog}
        onClose={() => setShowInstallDialog(false)}
      >
        <DialogTitle>Install PWA Showcase</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Install this app on your device for quick access and a native
            app-like experience.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Features when installed:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Standalone app window" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Home screen icon" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Offline functionality" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Background updates" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstallDialog(false)}>Cancel</Button>
          <Button onClick={handleInstallPWA} variant="contained">
            Install
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog
        open={showNotificationDialog}
        onClose={() => setShowNotificationDialog(false)}
      >
        <DialogTitle>Enable Notifications</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Allow notifications to receive updates and alerts from the PWA
            Showcase app.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can disable notifications at any time in your browser settings.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotificationDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleRequestNotifications} variant="contained">
            Allow
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PWAFeaturesDemo;
