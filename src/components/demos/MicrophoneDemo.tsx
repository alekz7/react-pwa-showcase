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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  type SelectChangeEvent,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import StopIcon from "@mui/icons-material/Stop";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { usePermissions } from "../../hooks/usePermissions";
import { useMicrophone, type AudioSettings } from "../../hooks/useMicrophone";
import PermissionHandler from "../PermissionHandler";

const SAMPLE_RATE_OPTIONS = [
  { label: "8 kHz", value: 8000 },
  { label: "16 kHz", value: 16000 },
  { label: "22 kHz", value: 22050 },
  { label: "44 kHz", value: 44100 },
  { label: "48 kHz", value: 48000 },
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

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export const MicrophoneDemo: React.FC = () => {
  const { hasPermission } = usePermissions();
  const {
    isListening,
    isRecording,
    recordingTime,
    audioLevel,
    error,
    recordings,
    startListening,
    stopListening,
    startRecording,
    stopRecording,
    deleteRecording,
    clearError,
  } = useMicrophone();

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    sampleRate: 44100,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });

  // Check permissions on component mount
  useEffect(() => {
    if (!hasPermission("microphone")) {
      setShowPermissionDialog(true);
    }
  }, [hasPermission]);

  const handleStartListening = useCallback(async () => {
    try {
      await startListening(audioSettings);
    } catch (err) {
      console.error("Failed to start microphone:", err);
    }
  }, [startListening, audioSettings]);

  const handlePermissionsGranted = useCallback(() => {
    setShowPermissionDialog(false);
    handleStartListening();
  }, [handleStartListening]);

  const handleSettingsChange = (field: keyof AudioSettings, value: unknown) => {
    setAudioSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSampleRateChange = (event: SelectChangeEvent<number>) => {
    handleSettingsChange("sampleRate", event.target.value);
  };

  const handlePlayAudio = (recordingId: string, audioUrl: string) => {
    if (playingAudio === recordingId) {
      // Stop current audio
      const audioElements = document.querySelectorAll("audio");
      audioElements.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      const audioElements = document.querySelectorAll("audio");
      audioElements.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });

      // Play new audio
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudio(null);
      audio.onerror = () => setPlayingAudio(null);
      audio.play();
      setPlayingAudio(recordingId);
    }
  };

  const getAudioLevelColor = (level: number): string => {
    if (level < 20) return "#4caf50"; // Green
    if (level < 60) return "#ff9800"; // Orange
    return "#f44336"; // Red
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🎤 Microphone Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Record audio and monitor sound levels using your device's microphone.
        This demo showcases microphone access, real-time audio level
        visualization, and audio recording.
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
        {/* Audio Controls */}
        <Box sx={{ flex: { xs: "1", md: "2" } }}>
          <Card>
            <CardContent>
              {/* Audio Level Visualization */}
              <Box
                sx={{
                  position: "relative",
                  height: 200,
                  bgcolor: "black",
                  borderRadius: 1,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
                }}
              >
                {!isListening ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "white",
                    }}
                  >
                    <MicIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ opacity: 0.7 }}>
                      Audio Visualization
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.5, mt: 1 }}>
                      Click "Start Listening" to begin
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "white",
                    }}
                  >
                    {/* Audio Level Bar */}
                    <Box sx={{ width: "80%", mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, textAlign: "center" }}
                      >
                        Audio Level: {Math.round(audioLevel)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={audioLevel}
                        sx={{
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: getAudioLevelColor(audioLevel),
                            borderRadius: 10,
                          },
                        }}
                      />
                    </Box>

                    {/* Visual Audio Bars */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "end",
                        justifyContent: "center",
                        gap: 1,
                        height: 80,
                      }}
                    >
                      {Array.from({ length: 20 }, (_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 8,
                            height: Math.max(
                              4,
                              (audioLevel / 100) * 80 * Math.random()
                            ),
                            backgroundColor: getAudioLevelColor(audioLevel),
                            borderRadius: 1,
                            opacity: audioLevel > i * 5 ? 1 : 0.3,
                            transition:
                              "height 0.1s ease-out, opacity 0.1s ease-out",
                          }}
                        />
                      ))}
                    </Box>
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
                    <FiberManualRecordIcon
                      sx={{
                        fontSize: 12,
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

                {/* Settings button */}
                {isListening && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                    }}
                  >
                    <IconButton
                      onClick={() => setShowSettingsDialog(true)}
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                      }}
                      aria-label="Audio settings"
                    >
                      <SettingsIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Main controls */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                {!isListening ? (
                  <Button
                    variant="contained"
                    startIcon={<MicIcon />}
                    onClick={handleStartListening}
                    size="large"
                  >
                    Start Listening
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<MicOffIcon />}
                      onClick={stopListening}
                      size="large"
                    >
                      Stop Listening
                    </Button>

                    {!isRecording ? (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<FiberManualRecordIcon />}
                        onClick={startRecording}
                        size="large"
                      >
                        Record
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<StopIcon />}
                        onClick={stopRecording}
                        size="large"
                      >
                        Stop Recording
                      </Button>
                    )}
                  </>
                )}
              </Box>

              {/* Audio info */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  label={`Sample Rate: ${audioSettings.sampleRate / 1000}kHz`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`Channels: ${audioSettings.channelCount}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={isListening ? "Listening" : "Stopped"}
                  size="small"
                  color={isListening ? "success" : "default"}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Recordings List */}
        <Box sx={{ flex: "1" }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Audio Recordings ({recordings.length})
              </Typography>

              {recordings.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body2">
                    No recordings yet. Start listening and click "Record" to
                    capture audio.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {recordings.map((recording) => (
                    <ListItem key={recording.id} divider>
                      <ListItemText
                        primary={`Recording ${recording.id.split("-")[1]}`}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {recording.timestamp.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Duration: {formatDuration(recording.duration)} •
                              Size: {formatFileSize(recording.size)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() =>
                            handlePlayAudio(recording.id, recording.url)
                          }
                          sx={{ mr: 1 }}
                          aria-label={
                            playingAudio === recording.id ? "Pause" : "Play"
                          }
                        >
                          {playingAudio === recording.id ? (
                            <PauseIcon />
                          ) : (
                            <PlayArrowIcon />
                          )}
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => deleteRecording(recording.id)}
                          aria-label="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
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
          microphone
          <br />
          • Implements real-time audio level monitoring with Web Audio API
          <br />
          • Audio recording with MediaRecorder API and Blob handling
          <br />
          • Real-time visualization using AnalyserNode and frequency data
          <br />
          • Audio playback controls with HTML5 Audio API
          <br />• Handles permission requests and error states gracefully
        </Typography>
      </Paper>

      {/* Permission Dialog */}
      <PermissionHandler
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        requiredPermissions={["microphone"]}
        onPermissionsGranted={handlePermissionsGranted}
        title="Microphone Access Required"
        description="This demo needs microphone access to monitor audio levels and record audio."
      />

      {/* Settings Dialog */}
      <Dialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Audio Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sample Rate</InputLabel>
              <Select
                value={audioSettings.sampleRate}
                label="Sample Rate"
                onChange={handleSampleRateChange}
              >
                {SAMPLE_RATE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={audioSettings.echoCancellation}
                  onChange={(e) =>
                    handleSettingsChange("echoCancellation", e.target.checked)
                  }
                />
              }
              label="Echo Cancellation"
              sx={{ display: "block", mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={audioSettings.noiseSuppression}
                  onChange={(e) =>
                    handleSettingsChange("noiseSuppression", e.target.checked)
                  }
                />
              }
              label="Noise Suppression"
              sx={{ display: "block", mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={audioSettings.autoGainControl}
                  onChange={(e) =>
                    handleSettingsChange("autoGainControl", e.target.checked)
                  }
                />
              }
              label="Auto Gain Control"
              sx={{ display: "block" }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MicrophoneDemo;
