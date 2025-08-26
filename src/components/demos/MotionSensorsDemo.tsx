import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Paper,
  Chip,
  LinearProgress,
} from "@mui/material";
import SensorsIcon from "@mui/icons-material/Sensors";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import VibrationIcon from "@mui/icons-material/Vibration";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  useMotionSensors,
  type AccelerometerData,
  type GyroscopeData,
} from "../../hooks/useMotionSensors";
// import { usePermissions } from "../../hooks/usePermissions"; // Not used in this component
import PermissionHandler from "../PermissionHandler";

const formatValue = (value: number | null): string => {
  return value !== null ? value.toFixed(2) : "0.00";
};

const getProgressValue = (value: number | null, max: number = 20): number => {
  if (value === null) return 0;
  return Math.min(Math.abs(value), max);
};

const getProgressColor = (
  value: number | null
): "primary" | "secondary" | "error" | "warning" | "info" | "success" => {
  if (value === null) return "primary";
  const abs = Math.abs(value);
  if (abs < 5) return "success";
  if (abs < 10) return "info";
  if (abs < 15) return "warning";
  return "error";
};

interface MotionVisualizationProps {
  accelerometer: AccelerometerData | null;
  gyroscope: GyroscopeData | null;
  isShaking: boolean;
}

const MotionVisualization: React.FC<MotionVisualizationProps> = ({
  accelerometer,
  gyroscope,
  isShaking,
}) => {
  return (
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
        mb: 2,
      }}
    >
      {/* Phone visualization */}
      <Box
        sx={{
          position: "relative",
          transform: gyroscope
            ? `rotateX(${gyroscope.beta}deg) rotateY(${gyroscope.gamma}deg) rotateZ(${gyroscope.alpha}deg)`
            : "none",
          transition: "transform 0.1s ease-out",
        }}
      >
        <PhoneAndroidIcon
          sx={{
            fontSize: 80,
            color: isShaking ? "error.main" : "primary.main",
            filter: isShaking ? "drop-shadow(0 0 10px red)" : "none",
            animation: isShaking ? "shake 0.5s ease-in-out" : "none",
            "@keyframes shake": {
              "0%, 100%": { transform: "translateX(0)" },
              "25%": { transform: "translateX(-5px)" },
              "75%": { transform: "translateX(5px)" },
            },
          }}
        />
      </Box>

      {/* Acceleration indicators */}
      {accelerometer && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            color: "white",
            fontSize: "0.75rem",
          }}
        >
          <Typography variant="caption" display="block">
            Acceleration
          </Typography>
          <Typography variant="caption" display="block">
            X: {formatValue(accelerometer.x)}
          </Typography>
          <Typography variant="caption" display="block">
            Y: {formatValue(accelerometer.y)}
          </Typography>
          <Typography variant="caption" display="block">
            Z: {formatValue(accelerometer.z)}
          </Typography>
        </Box>
      )}

      {/* Orientation indicators */}
      {gyroscope && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "white",
            fontSize: "0.75rem",
            textAlign: "right",
          }}
        >
          <Typography variant="caption" display="block">
            Orientation
          </Typography>
          <Typography variant="caption" display="block">
            α: {formatValue(gyroscope.alpha)}°
          </Typography>
          <Typography variant="caption" display="block">
            β: {formatValue(gyroscope.beta)}°
          </Typography>
          <Typography variant="caption" display="block">
            γ: {formatValue(gyroscope.gamma)}°
          </Typography>
        </Box>
      )}

      {/* Shake indicator */}
      {isShaking && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
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
          <VibrationIcon sx={{ fontSize: 16 }} />
          <Typography variant="body2" fontWeight="bold">
            SHAKE DETECTED!
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const MotionSensorsDemo: React.FC = () => {
  const {
    motionData,
    isListening,
    isSupported,
    permissionState,
    error,
    requestPermission,
    startListening,
    stopListening,
    resetShakeCount,
    clearError,
  } = useMotionSensors();

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Check permissions on component mount
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    // For iOS devices, we need to request permission explicitly
    if (permissionState === "unknown") {
      requestPermission();
    }
  }, [isSupported, permissionState, requestPermission]);

  const handleStartListening = async () => {
    if (permissionState === "prompt" || permissionState === "unknown") {
      try {
        await requestPermission();
      } catch (err) {
        console.error("Failed to request permission:", err);
        return;
      }
    }

    if (permissionState === "granted") {
      startListening();
    } else {
      setShowPermissionDialog(true);
    }
  };

  const handlePermissionsGranted = () => {
    setShowPermissionDialog(false);
    startListening();
  };

  if (!isSupported) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🏃 Motion Sensors Demo
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          Motion sensors are not supported on this device or browser. This
          feature requires a mobile device with accelerometer and gyroscope
          sensors.
        </Alert>

        <Paper sx={{ p: 2, bgcolor: "background.default" }}>
          <Typography variant="h6" gutterBottom>
            💡 Browser Compatibility
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Chrome Mobile</strong>: Full support for DeviceMotionEvent
            and DeviceOrientationEvent
            <br />• <strong>Safari Mobile</strong>: Requires user permission
            (iOS 13+)
            <br />• <strong>Firefox Mobile</strong>: Good support for motion
            sensors
            <br />• <strong>Desktop browsers</strong>: Limited or no support for
            motion sensors
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🏃 Motion Sensors Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Test device motion sensors including accelerometer and gyroscope data.
        This demo showcases real-time motion detection, device orientation, and
        shake gesture recognition.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {/* Motion Visualization */}
        <Box sx={{ flex: "2 1 500px", minWidth: "300px" }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Motion Visualization
              </Typography>

              <MotionVisualization
                accelerometer={motionData.accelerometer}
                gyroscope={motionData.gyroscope}
                isShaking={motionData.isShaking}
              />

              {/* Controls */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                {!isListening ? (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartListening}
                    disabled={permissionState === "denied"}
                  >
                    Start Monitoring
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<StopIcon />}
                    onClick={stopListening}
                  >
                    Stop Monitoring
                  </Button>
                )}

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={resetShakeCount}
                  disabled={!isListening}
                >
                  Reset Shake Count
                </Button>
              </Box>

              {/* Status chips */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  icon={<SensorsIcon />}
                  label={isListening ? "Monitoring" : "Stopped"}
                  color={isListening ? "success" : "default"}
                  size="small"
                />
                <Chip
                  icon={<VibrationIcon />}
                  label={`Shakes: ${motionData.shakeCount}`}
                  color={motionData.shakeCount > 0 ? "secondary" : "default"}
                  size="small"
                />
                <Chip
                  label={`Permission: ${permissionState}`}
                  color={
                    permissionState === "granted"
                      ? "success"
                      : permissionState === "denied"
                        ? "error"
                        : "warning"
                  }
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Data Display */}
        <Box sx={{ flex: "1 1 300px", minWidth: "250px" }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SensorsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Accelerometer
              </Typography>

              {motionData.accelerometer ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      X-axis: {formatValue(motionData.accelerometer.x)} m/s²
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (getProgressValue(motionData.accelerometer.x) / 20) *
                        100
                      }
                      color={getProgressColor(motionData.accelerometer.x)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Y-axis: {formatValue(motionData.accelerometer.y)} m/s²
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (getProgressValue(motionData.accelerometer.y) / 20) *
                        100
                      }
                      color={getProgressColor(motionData.accelerometer.y)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Z-axis: {formatValue(motionData.accelerometer.z)} m/s²
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (getProgressValue(motionData.accelerometer.z) / 20) *
                        100
                      }
                      color={getProgressColor(motionData.accelerometer.z)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No accelerometer data available
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <RotateRightIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Gyroscope
              </Typography>

              {motionData.gyroscope ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Alpha (Z): {formatValue(motionData.gyroscope.alpha)}°
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(Math.abs(motionData.gyroscope.alpha) / 360) * 100}
                      color="primary"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Beta (X): {formatValue(motionData.gyroscope.beta)}°
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(Math.abs(motionData.gyroscope.beta) / 180) * 100}
                      color="secondary"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Gamma (Y): {formatValue(motionData.gyroscope.gamma)}°
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(Math.abs(motionData.gyroscope.gamma) / 90) * 100}
                      color="info"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No gyroscope data available
                </Typography>
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
          • Uses <code>DeviceMotionEvent</code> for accelerometer data
          <br />• Uses <code>DeviceOrientationEvent</code> for
          gyroscope/orientation data
          <br />
          • Implements shake detection using acceleration delta calculations
          <br />• Handles iOS 13+ permission requirements with{" "}
          <code>requestPermission()</code>
          <br />
          • Real-time data visualization with progress bars and 3D phone model
          <br />• Graceful fallback for unsupported devices and browsers
        </Typography>
      </Paper>

      {/* Permission Dialog */}
      <PermissionHandler
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        requiredPermissions={[]}
        onPermissionsGranted={handlePermissionsGranted}
        title="Motion Sensor Access Required"
        description="This demo needs access to your device's motion sensors to display accelerometer and gyroscope data."
      />
    </Box>
  );
};

export default MotionSensorsDemo;
