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
} from "@mui/material";
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
  status: "supported" | "unsupported" | "partial";
}

const demoCards: DemoCard[] = [
  {
    title: "Camera Access",
    description: "Capture photos and record videos using device camera",
    icon: <CameraAlt />,
    path: "/camera",
    status: "supported",
  },
  {
    title: "Microphone",
    description: "Record audio and analyze sound levels in real-time",
    icon: <Mic />,
    path: "/microphone",
    status: "supported",
  },
  {
    title: "File System",
    description: "Select, preview, and download files from your device",
    icon: <FolderOpen />,
    path: "/files",
    status: "supported",
  },
  {
    title: "Motion Sensors",
    description: "Access accelerometer and gyroscope data",
    icon: <SensorsRounded />,
    path: "/motion",
    status: "partial",
  },
  {
    title: "Location Services",
    description: "Get GPS coordinates and track location changes",
    icon: <LocationOn />,
    path: "/location",
    status: "supported",
  },
  {
    title: "Real-time Communication",
    description: "WebSocket-based chat and data sharing",
    icon: <Wifi />,
    path: "/realtime",
    status: "supported",
  },
  {
    title: "PWA Features",
    description: "Installation, offline support, and push notifications",
    icon: <InstallMobile />,
    path: "/pwa",
    status: "supported",
  },
];

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
      return "Supported";
    case "partial":
      return "Partial Support";
    case "unsupported":
      return "Not Supported";
    default:
      return "Unknown";
  }
};

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          React PWA Showcase
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Explore Modern Web Capabilities
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: "auto" }}
        >
          This Progressive Web Application demonstrates various device
          capabilities and modern web APIs. Click on any demo below to explore
          what your browser and device can do.
        </Typography>
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
        {demoCards.map((demo) => (
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
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    mr: 2,
                  }}
                >
                  {demo.icon}
                </Box>
                <Box>
                  <Typography variant="h6" component="h3">
                    {demo.title}
                  </Typography>
                  <Chip
                    label={getStatusText(demo.status)}
                    color={getStatusColor(demo.status) as any}
                    size="small"
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {demo.description}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                variant="contained"
                fullWidth
                disabled={demo.status === "unsupported"}
                onClick={() => navigate(demo.path)}
              >
                {demo.status === "unsupported" ? "Not Available" : "Try Demo"}
              </Button>
            </CardActions>
          </Card>
        ))}
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
