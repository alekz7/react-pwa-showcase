import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Alert,
  Tooltip,
  IconButton,
} from "@mui/material";
import { Refresh, Info } from "@mui/icons-material";
import { useDeviceContext, useAppContext } from "../context";
import type { DeviceCapabilities, DevicePermissions } from "../context";
import {
  CameraAlt,
  Mic,
  FolderOpen,
  SensorsRounded,
  LocationOn,
  Wifi,
  InstallMobile,
} from "@mui/icons-material";

interface DemoCard {
  title: string;
  description: string;
  icon: React.ReactElement;
  path: string;
  capabilityKey: keyof DeviceCapabilities;
  permissionKey?: keyof DevicePermissions;
  requirements: string[];
}

const demoCards: DemoCard[] = [
  {
    title: "Camera Access",
    description: "Capture photos and record videos using device camera",
    icon: <CameraAlt />,
    path: "/camera",
    capabilityKey: "camera",
    permissionKey: "camera",
    requirements: ["MediaDevices API", "getUserMedia()"],
  },
  {
    title: "Microphone",
    description: "Record audio and analyze sound levels in real-time",
    icon: <Mic />,
    path: "/microphone",
    capabilityKey: "microphone",
    permissionKey: "microphone",
    requirements: ["MediaDevices API", "Web Audio API"],
  },
  {
    title: "File System",
    description: "Select, preview, and download files from your device",
    icon: <FolderOpen />,
    path: "/files",
    capabilityKey: "fileSystem",
    requirements: ["File API", "FileReader API", "Blob API"],
  },
  {
    title: "Motion Sensors",
    description: "Access accelerometer and gyroscope data",
    icon: <SensorsRounded />,
    path: "/motion",
    capabilityKey: "deviceMotion",
    requirements: ["DeviceMotionEvent", "DeviceOrientationEvent"],
  },
  {
    title: "Location Services",
    description: "Get GPS coordinates and track location changes",
    icon: <LocationOn />,
    path: "/location",
    capabilityKey: "geolocation",
    permissionKey: "geolocation",
    requirements: ["Geolocation API"],
  },
  {
    title: "Real-time Communication",
    description: "WebSocket-based chat and data sharing",
    icon: <Wifi />,
    path: "/realtime",
    capabilityKey: "serviceWorker", // Using serviceWorker as proxy for web capabilities
    requirements: ["WebSocket API", "Real-time messaging"],
  },
  {
    title: "PWA Features",
    description: "Installation, offline support, and push notifications",
    icon: <InstallMobile />,
    path: "/pwa",
    capabilityKey: "serviceWorker",
    permissionKey: "notifications",
    requirements: ["Service Worker", "Web App Manifest", "Cache API"],
  },
];

const getStatusFromCapability = (
  isCapable: boolean,
  permissionState?: string
): "supported" | "unsupported" | "partial" => {
  if (!isCapable) return "unsupported";
  if (permissionState === "denied") return "partial";
  return "supported";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "supported":
      return "success";
    case "partial":
      return "warning";
    case "unsupported":
      return "error";
    default:
      return "default";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "supported":
      return "Fully Supported";
    case "partial":
      return "Limited Support";
    case "unsupported":
      return "Not Available";
    default:
      return "Unknown";
  }
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { state: deviceState, refreshCapabilities } = useDeviceContext();
  const { addNotification } = useAppContext();

  const handleRefreshCapabilities = () => {
    refreshCapabilities();
    addNotification({
      type: "info",
      message: "Device capabilities refreshed",
      autoHide: true,
    });
  };

  const handleDemoClick = (demo: DemoCard) => {
    const status = getStatusFromCapability(
      deviceState.capabilities[demo.capabilityKey],
      demo.permissionKey
        ? deviceState.permissions[demo.permissionKey]
        : undefined
    );

    if (status === "unsupported") {
      addNotification({
        type: "warning",
        message: `${demo.title} is not supported on this device/browser`,
        autoHide: true,
      });
      return;
    }

    navigate(demo.path);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={2}
          mb={2}
        >
          <Typography variant="h2" component="h1">
            React PWA Showcase
          </Typography>
          <Tooltip title="Refresh device capabilities">
            <IconButton onClick={handleRefreshCapabilities} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Explore Modern Web Capabilities
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: "auto", mb: 3 }}
        >
          This Progressive Web Application demonstrates various device
          capabilities and modern web APIs. Click on any demo below to explore
          what your browser and device can do.
        </Typography>

        {/* Device Status Overview */}
        <Alert
          severity={deviceState.isOnline ? "success" : "warning"}
          sx={{ mb: 3, maxWidth: 600, mx: "auto" }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              Device Status: {deviceState.isOnline ? "Online" : "Offline"}
            </Typography>
            {deviceState.batteryLevel && (
              <Typography variant="body2">
                Battery: {Math.round(deviceState.batteryLevel)}%
              </Typography>
            )}
            {deviceState.networkType && (
              <Typography variant="body2">
                Network: {deviceState.networkType}
              </Typography>
            )}
          </Box>
        </Alert>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        {demoCards.map((demo) => {
          const status = getStatusFromCapability(
            deviceState.capabilities[demo.capabilityKey],
            demo.permissionKey
              ? deviceState.permissions[demo.permissionKey]
              : undefined
          );

          return (
            <Card
              key={demo.path}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
                opacity: status === "unsupported" ? 0.7 : 1,
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor:
                        status === "unsupported" ? "grey.400" : "primary.main",
                      color: "primary.contrastText",
                      mr: 2,
                    }}
                  >
                    {demo.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" component="h3">
                        {demo.title}
                      </Typography>
                      <Tooltip
                        title={`Requirements: ${demo.requirements.join(", ")}`}
                      >
                        <Info fontSize="small" color="action" />
                      </Tooltip>
                    </Box>
                    <Chip
                      label={getStatusText(status)}
                      color={
                        getStatusColor(status) as
                          | "success"
                          | "warning"
                          | "error"
                          | "default"
                      }
                      size="small"
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {demo.description}
                </Typography>

                {/* Permission Status */}
                {demo.permissionKey && (
                  <Box mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      Permission: {deviceState.permissions[demo.permissionKey]}
                    </Typography>
                  </Box>
                )}

                {/* Requirements List */}
                <Box mt={2}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom
                  >
                    Requirements:
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    {demo.requirements.map((req, index) => (
                      <Chip
                        key={index}
                        label={req}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem", height: 20 }}
                      />
                    ))}
                  </Stack>
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  fullWidth
                  disabled={status === "unsupported"}
                  onClick={() => handleDemoClick(demo)}
                >
                  {status === "unsupported" ? "Not Available" : "Try Demo"}
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Box>

      <Box mt={6} textAlign="center">
        <Typography variant="h6" gutterBottom>
          Browser Compatibility
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          flexWrap="wrap"
        >
          <Chip label="Chrome 86+" color="success" />
          <Chip label="Firefox 78+" color="success" />
          <Chip label="Safari 14+" color="warning" />
          <Chip label="Edge 86+" color="success" />
        </Stack>
        <Typography variant="body2" color="text.secondary" mt={2}>
          Some features may have limited support depending on your browser and
          device.
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;
