import React, { useState, useCallback, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  type SelectChangeEvent,
} from "@mui/material";
import CameraIcon from "@mui/icons-material/Camera";
import StopIcon from "@mui/icons-material/Stop";
import FlipIcon from "@mui/icons-material/FlipCameraAndroid";
import SettingsIcon from "@mui/icons-material/Settings";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VideocamIcon from "@mui/icons-material/Videocam";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { usePermissions } from "../../hooks/usePermissions";
import { useCamera, type CameraSettings } from "../../hooks/useCamera";
import PermissionHandler from "../PermissionHandler";

const RESOLUTION_OPTIONS = [
  { label: "480p", width: 640, height: 480 },
  { label: "720p", width: 1280, height: 720 },
  { label: "1080p", width: 1920, height: 1080 },
];

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const CameraDemo: React.FC = () => {
  const { hasPermission } = usePermissions();
  const {
    isStreaming,
    isRecording,
    recordingTime,
    error,
    capturedMedia,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    startRecording,
    stopRecording,
    switchCamera,
    deleteMedia,
    clearError,
  } = useCamera();

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    facingMode: "user",
    resolution: RESOLUTION_OPTIONS[1], // Default to 720p
    includeAudio: false,
  });

  // Check permissions on component mount
  useEffect(() => {
    if (!hasPermission("camera")) {
      setShowPermissionDialog(true);
    }
  }, [hasPermission]);

  const handleStartCamera = useCallback(async () => {
    try {
      await startCamera(cameraSettings);
    } catch (err) {
      console.error("Failed to start camera:", err);
    }
  }, [startCamera, cameraSettings]);

  const handleSwitchCamera = useCallback(async () => {
    const newFacingMode =
      cameraSettings.facingMode === "user" ? "environment" : "user";
    setCameraSettings((prev) => ({ ...prev, facingMode: newFacingMode }));
    await switchCamera(newFacingMode);
  }, [cameraSettings.facingMode, switchCamera]);

  const handlePermissionsGranted = useCallback(() => {
    setShowPermissionDialog(false);
    handleStartCamera();
  }, [handleStartCamera]);

  const handleSettingsChange = (
    field: keyof CameraSettings,
    value: unknown
  ) => {
    setCameraSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleResolutionChange = (event: SelectChangeEvent<string>) => {
    const selectedResolution = RESOLUTION_OPTIONS.find(
      (option) => option.label === event.target.value
    );
    if (selectedResolution) {
      handleSettingsChange("resolution", selectedResolution);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📸 Camera Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Capture photos and record videos using your device's camera. This demo
        showcases camera access, live preview, photo capture, and video
        recording.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        {/* Camera Preview */}
        <Box sx={{ flex: { xs: "1", md: "2" } }}>
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

                <canvas ref={canvasRef} style={{ display: "none" }} />

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

                {/* Recording indicator */}
                {isRecording && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      bgcolor: "error.main",
                      color: "white",
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: "white",
                        borderRadius: "50%",
                        animation: "blink 1s infinite",
                        "@keyframes blink": {
                          "0%, 50%": { opacity: 1 },
                          "51%, 100%": { opacity: 0 },
                        },
                      }}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      REC {formatTime(recordingTime)}
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
                      onClick={capturePhoto}
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                      }}
                      aria-label="Take photo"
                    >
                      <PhotoCameraIcon />
                    </IconButton>

                    <IconButton
                      onClick={isRecording ? stopRecording : startRecording}
                      sx={{
                        bgcolor: isRecording
                          ? "error.main"
                          : "rgba(255, 255, 255, 0.9)",
                        color: isRecording ? "white" : "inherit",
                        "&:hover": {
                          bgcolor: isRecording
                            ? "error.dark"
                            : "rgba(255, 255, 255, 1)",
                        },
                      }}
                      aria-label={
                        isRecording ? "Stop recording" : "Start recording"
                      }
                    >
                      {isRecording ? <StopIcon /> : <VideocamIcon />}
                    </IconButton>

                    <IconButton
                      onClick={handleSwitchCamera}
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                      }}
                      aria-label="Switch camera"
                    >
                      <FlipIcon />
                    </IconButton>

                    <IconButton
                      onClick={() => setShowSettingsDialog(true)}
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                      }}
                      aria-label="Camera settings"
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
                    onClick={handleStartCamera}
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
        </Box>

        {/* Media Gallery */}
        <Box sx={{ flex: "1" }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Captured Media ({capturedMedia.length})
              </Typography>

              {capturedMedia.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body2">
                    No media captured yet. Use the camera controls to take
                    photos or record videos.
                  </Typography>
                </Box>
              ) : (
                <ImageList cols={2} gap={8}>
                  {capturedMedia.map((media) => (
                    <ImageListItem key={media.id}>
                      {media.type === "photo" ? (
                        <img
                          src={media.url}
                          alt="Captured photo"
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            height: "120px",
                            bgcolor: "black",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <video
                            src={media.url}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            sx={{
                              position: "absolute",
                              color: "white",
                              bgcolor: "rgba(0, 0, 0, 0.5)",
                            }}
                            onClick={() => {
                              const video = document.createElement("video");
                              video.src = media.url;
                              video.controls = true;
                              video.style.maxWidth = "100%";
                              video.style.maxHeight = "100%";
                              const dialog = document.createElement("dialog");
                              dialog.appendChild(video);
                              document.body.appendChild(dialog);
                              dialog.showModal();
                              dialog.onclick = () => {
                                dialog.close();
                                document.body.removeChild(dialog);
                              };
                            }}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Box>
                      )}
                      <ImageListItemBar
                        title={media.type}
                        subtitle={`${formatFileSize(media.size)} • ${media.timestamp.toLocaleTimeString()}`}
                        actionIcon={
                          <IconButton
                            sx={{ color: "rgba(255, 255, 255, 0.54)" }}
                            onClick={() => deleteMedia(media.id)}
                            aria-label="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Implementation hints */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: "background.default" }}>
        <Typography variant="h6" gutterBottom>
          💡 Implementation Hints
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Uses <code>navigator.mediaDevices.getUserMedia()</code> to access
          camera
          <br />
          • Implements photo capture using HTML5 Canvas API
          <br />
          • Video recording with MediaRecorder API and Blob handling
          <br />
          • Camera switching between front and back cameras
          <br />
          • Real-time recording timer and media gallery display
          <br />• Handles permission requests and error states gracefully
        </Typography>
      </Paper>

      {/* Permission Dialog */}
      <PermissionHandler
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        requiredPermissions={["camera"]}
        onPermissionsGranted={handlePermissionsGranted}
        title="Camera Access Required"
        description="This demo needs camera access to show live preview, capture photos, and record videos."
      />

      {/* Settings Dialog */}
      <Dialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Camera Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Resolution</InputLabel>
              <Select
                value={cameraSettings.resolution.label}
                label="Resolution"
                onChange={handleResolutionChange}
              >
                {RESOLUTION_OPTIONS.map((option) => (
                  <MenuItem key={option.label} value={option.label}>
                    {option.label} ({option.width}x{option.height})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={cameraSettings.includeAudio}
                  onChange={(e) =>
                    handleSettingsChange("includeAudio", e.target.checked)
                  }
                />
              }
              label="Include Audio in Video Recording"
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CameraDemo;
