import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Alert,
  Paper,
  Chip,
} from "@mui/material";
import CameraIcon from "@mui/icons-material/Camera";
import StopIcon from "@mui/icons-material/Stop";
import FlipIcon from "@mui/icons-material/FlipCameraAndroid";
import SettingsIcon from "@mui/icons-material/Settings";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionHandler from "../PermissionHandler";

interface CameraSettings {
  facingMode: "user" | "environment";
  resolution: { label: string; width: number; height: number };
}

const RESOLUTION_OPTIONS = [
  { label: "480p", width: 640, height: 480 },
  { label: "720p", width: 1280, height: 720 },
  { label: "1080p", width: 1920, height: 1080 },
];

export const CameraDemo: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    facingMode: "user",
    resolution: RESOLUTION_OPTIONS[1], // Default to 720p
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check permissions on component mount
  useEffect(() => {
    if (!hasPermission("camera")) {
      setShowPermissionDialog(true);
    }
  }, [hasPermission]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraSettings.facingMode,
          width: { ideal: cameraSettings.resolution.width },
          height: { ideal: cameraSettings.resolution.height },
        },
        audio: false, // No audio for basic camera interface
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to access camera";
      setError(errorMessage);
      console.error("Camera access error:", err);
    }
  }, [cameraSettings]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
  }, []);

  const switchCamera = useCallback(async () => {
    const newFacingMode =
      cameraSettings.facingMode === "user" ? "environment" : "user";
    setCameraSettings((prev) => ({ ...prev, facingMode: newFacingMode }));

    if (isStreaming) {
      stopCamera();
      // Small delay to ensure camera is properly stopped
      setTimeout(() => {
        setCameraSettings((prev) => ({ ...prev, facingMode: newFacingMode }));
      }, 100);
    }
  }, [cameraSettings.facingMode, isStreaming, stopCamera]);

  // Restart camera when settings change
  useEffect(() => {
    if (isStreaming) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [cameraSettings, isStreaming, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handlePermissionsGranted = useCallback(() => {
    setShowPermissionDialog(false);
    startCamera();
  }, [startCamera]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📸 Camera Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Access your device's camera to capture photos and record videos. This
        demo showcases camera access, live preview, and basic camera controls.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box
            sx={{
              position: "relative",
              aspectRatio: "16/9",
              bgcolor: "black",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: isStreaming ? "block" : "none",
              }}
              playsInline
              muted
            />

            {!isStreaming && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  color: "white",
                }}
              >
                <CameraIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ opacity: 0.7 }}>
                  Camera Preview
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.5, mt: 1 }}>
                  Click "Start Camera" to begin
                </Typography>
              </Box>
            )}

            {/* Camera controls overlay */}
            {isStreaming && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <IconButton
                  onClick={switchCamera}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                  }}
                >
                  <FlipIcon />
                </IconButton>

                <IconButton
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Main controls */}
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 2,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {!isStreaming ? (
              <Button
                variant="contained"
                startIcon={<CameraIcon />}
                onClick={startCamera}
                size="large"
              >
                Start Camera
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<StopIcon />}
                onClick={stopCamera}
                size="large"
              >
                Stop Camera
              </Button>
            )}
          </Box>

          {/* Camera info */}
          <Box
            sx={{
              mt: 2,
              display: "flex",
              gap: 1,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Chip
              label={`Camera: ${cameraSettings.facingMode === "user" ? "Front" : "Back"}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Resolution: ${cameraSettings.resolution.label}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={isStreaming ? "Streaming" : "Stopped"}
              size="small"
              color={isStreaming ? "success" : "default"}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Implementation hints */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: "background.default" }}>
        <Typography variant="h6" gutterBottom>
          💡 Implementation Hints
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Uses <code>navigator.mediaDevices.getUserMedia()</code> to access
          camera
          <br />
          • Implements camera switching between front and back cameras
          <br />
          • Handles permission requests and error states gracefully
          <br />
          • Provides responsive video preview with proper aspect ratio
          <br />• Next: Add photo capture and video recording functionality
        </Typography>
      </Paper>

      {/* Permission Dialog */}
      <PermissionHandler
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        requiredPermissions={["camera"]}
        onPermissionsGranted={handlePermissionsGranted}
        title="Camera Access Required"
        description="This demo needs camera access to show live preview and camera controls."
      />
    </Box>
  );
};

export default CameraDemo;
