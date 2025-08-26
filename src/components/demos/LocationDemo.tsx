import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ClearIcon from "@mui/icons-material/Clear";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import MapIcon from "@mui/icons-material/Map";
import TimelineIcon from "@mui/icons-material/Timeline";
import SpeedIcon from "@mui/icons-material/Speed";
// import HeightIcon from "@mui/icons-material/Height"; // Unused import
import ExploreIcon from "@mui/icons-material/Explore";
import TuneIcon from "@mui/icons-material/Tune";
import { useLocation, type LocationCoordinates } from "../../hooks/useLocation";

const formatValue = (
  value: number | null,
  unit: string,
  decimals: number = 2
): string => {
  return value !== null ? `${value.toFixed(decimals)} ${unit}` : "N/A";
};

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

interface LocationDisplayProps {
  location: LocationCoordinates | null;
  title: string;
  showDetails?: boolean;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  location,
  title,
  showDetails = true,
}) => {
  if (!location) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <LocationOnIcon color="primary" />
            <Typography variant="h6" sx={{ ml: 1 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            No location data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <LocationOnIcon color="primary" />
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 200px" }}>
            <Typography variant="body2" color="text.secondary">
              Latitude
            </Typography>
            <Typography variant="h6" color="primary.main">
              {location.latitude.toFixed(6)}°
            </Typography>
          </Box>
          <Box sx={{ flex: "1 1 200px" }}>
            <Typography variant="body2" color="text.secondary">
              Longitude
            </Typography>
            <Typography variant="h6" color="primary.main">
              {location.longitude.toFixed(6)}°
            </Typography>
          </Box>
        </Box>

        {showDetails && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ flex: "1 1 120px", minWidth: "120px" }}>
                <Typography variant="body2" color="text.secondary">
                  Accuracy
                </Typography>
                <Typography variant="body1">
                  {formatValue(location.accuracy, "m", 0)}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 120px", minWidth: "120px" }}>
                <Typography variant="body2" color="text.secondary">
                  Altitude
                </Typography>
                <Typography variant="body1">
                  {formatValue(location.altitude, "m", 0)}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 120px", minWidth: "120px" }}>
                <Typography variant="body2" color="text.secondary">
                  Speed
                </Typography>
                <Typography variant="body1">
                  {formatValue(location.speed, "m/s", 1)}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 120px", minWidth: "120px" }}>
                <Typography variant="body2" color="text.secondary">
                  Heading
                </Typography>
                <Typography variant="body1">
                  {formatValue(location.heading, "°", 0)}
                </Typography>
              </Box>
            </Box>
          </>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, display: "block" }}
        >
          Last updated: {formatTimestamp(location.timestamp)}
        </Typography>
      </CardContent>
    </Card>
  );
};

interface LocationMapProps {
  location: LocationCoordinates | null;
  history: LocationCoordinates[];
}

const LocationMap: React.FC<LocationMapProps> = ({ location, history }) => {
  const [mapUrl, setMapUrl] = useState<string>("");

  useEffect(() => {
    if (location) {
      // Create a simple static map URL (using OpenStreetMap tiles)
      // const zoom = 15;
      // const width = 400;
      // const height = 300;

      // For demo purposes, we'll show a placeholder map
      // In a real implementation, you'd integrate with Leaflet, Google Maps, etc.
      const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
        location.longitude - 0.01
      },${location.latitude - 0.01},${location.longitude + 0.01},${
        location.latitude + 0.01
      }&layer=mapnik&marker=${location.latitude},${location.longitude}`;
      setMapUrl(osmUrl);
    }
  }, [location]);

  if (!location) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <MapIcon color="primary" />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Location Map
            </Typography>
          </Box>
          <Box
            sx={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "grey.100",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Enable location tracking to see map
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <MapIcon color="primary" />
          <Typography variant="h6" sx={{ ml: 1 }}>
            Location Map
          </Typography>
        </Box>
        <Box sx={{ height: 300, borderRadius: 1, overflow: "hidden" }}>
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            title="Location Map"
          />
        </Box>
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            size="small"
            icon={<LocationOnIcon />}
            label={`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
          />
          {location.accuracy && (
            <Chip
              size="small"
              icon={<MyLocationIcon />}
              label={`±${location.accuracy.toFixed(0)}m`}
              color="secondary"
            />
          )}
          {history.length > 1 && (
            <Chip
              size="small"
              icon={<TimelineIcon />}
              label={`${history.length} points`}
              color="success"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

interface LocationStatsProps {
  history: {
    coordinates: LocationCoordinates[];
    distances: number[];
    totalDistance: number;
  };
  currentLocation: LocationCoordinates | null;
}

const LocationStats: React.FC<LocationStatsProps> = ({
  history,
  currentLocation,
}) => {
  const getAverageSpeed = () => {
    const speedReadings = history.coordinates
      .filter((coord) => coord.speed !== null)
      .map((coord) => coord.speed!);

    if (speedReadings.length === 0) return null;
    return (
      speedReadings.reduce((sum, speed) => sum + speed, 0) /
      speedReadings.length
    );
  };

  const getMaxSpeed = () => {
    const speedReadings = history.coordinates
      .filter((coord) => coord.speed !== null)
      .map((coord) => coord.speed!);

    return speedReadings.length > 0 ? Math.max(...speedReadings) : null;
  };

  const getAverageAccuracy = () => {
    if (history.coordinates.length === 0) return null;
    const totalAccuracy = history.coordinates.reduce(
      (sum, coord) => sum + coord.accuracy,
      0
    );
    return totalAccuracy / history.coordinates.length;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 Location Statistics
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Box
            sx={{ flex: "1 1 150px", minWidth: "150px", textAlign: "center" }}
          >
            <TimelineIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h6" color="primary.main">
              {history.coordinates.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Points Tracked
            </Typography>
          </Box>
          <Box
            sx={{ flex: "1 1 150px", minWidth: "150px", textAlign: "center" }}
          >
            <ExploreIcon color="secondary" sx={{ fontSize: 32 }} />
            <Typography variant="h6" color="secondary.main">
              {history.totalDistance.toFixed(2)} km
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Distance
            </Typography>
          </Box>
          <Box
            sx={{ flex: "1 1 150px", minWidth: "150px", textAlign: "center" }}
          >
            <SpeedIcon color="success" sx={{ fontSize: 32 }} />
            <Typography variant="h6" color="success.main">
              {formatValue(getAverageSpeed(), "m/s", 1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Speed
            </Typography>
          </Box>
          <Box
            sx={{ flex: "1 1 150px", minWidth: "150px", textAlign: "center" }}
          >
            <MyLocationIcon color="warning" sx={{ fontSize: 32 }} />
            <Typography variant="h6" color="warning.main">
              {formatValue(getAverageAccuracy(), "m", 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Accuracy
            </Typography>
          </Box>
        </Box>

        {currentLocation && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Current Status
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ flex: "1 1 150px" }}>
                <Typography variant="body2" color="text.secondary">
                  Current Speed
                </Typography>
                <Typography variant="body1">
                  {formatValue(currentLocation.speed, "m/s", 1)}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 150px" }}>
                <Typography variant="body2" color="text.secondary">
                  Max Speed
                </Typography>
                <Typography variant="body1">
                  {formatValue(getMaxSpeed(), "m/s", 1)}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface HistoryDialogProps {
  open: boolean;
  onClose: () => void;
  history: LocationCoordinates[];
  formatCoordinates: (lat: number, lon: number) => string;
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({
  open,
  onClose,
  history,
  formatCoordinates,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Location History</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Coordinates</TableCell>
                <TableCell>Accuracy</TableCell>
                <TableCell>Altitude</TableCell>
                <TableCell>Speed</TableCell>
                <TableCell>Heading</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.slice(-20).map((location, index) => (
                <TableRow key={index}>
                  <TableCell>{formatTimestamp(location.timestamp)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" component="div">
                      {location.latitude.toFixed(6)},{" "}
                      {location.longitude.toFixed(6)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCoordinates(location.latitude, location.longitude)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatValue(location.accuracy, "m", 0)}
                  </TableCell>
                  <TableCell>
                    {formatValue(location.altitude, "m", 0)}
                  </TableCell>
                  <TableCell>{formatValue(location.speed, "m/s", 1)}</TableCell>
                  <TableCell>{formatValue(location.heading, "°", 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {history.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            No location history available. Start tracking to see data.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onOptionsChange: (options: PositionOptions) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  onOptionsChange,
}) => {
  const [enableHighAccuracy, setEnableHighAccuracy] = useState(true);
  const [timeout, setTimeout] = useState(10000);
  const [maximumAge, setMaximumAge] = useState(60000);

  const handleSave = () => {
    onOptionsChange({
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Location Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={enableHighAccuracy}
                onChange={(e) => setEnableHighAccuracy(e.target.checked)}
              />
            }
            label="High Accuracy"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use GPS for more accurate positioning (may consume more battery)
          </Typography>

          <TextField
            fullWidth
            label="Timeout (ms)"
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
            sx={{ mb: 2 }}
            helperText="Maximum time to wait for location"
          />

          <TextField
            fullWidth
            label="Maximum Age (ms)"
            type="number"
            value={maximumAge}
            onChange={(e) => setMaximumAge(Number(e.target.value))}
            helperText="Accept cached location if newer than this"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const LocationDemo: React.FC = () => {
  const {
    isTracking,
    hasPermission,
    currentLocation,
    history,
    error,
    isSupported,
    startTracking,
    stopTracking,
    getCurrentPosition,
    // requestPermission, // Not used directly in component
    clearHistory,
    clearError,
    formatCoordinates,
  } = useLocation();

  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [trackingOptions, setTrackingOptions] = useState<PositionOptions>({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  });

  const handleStartTracking = async () => {
    try {
      await startTracking(trackingOptions);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGetCurrentPosition = async () => {
    try {
      await getCurrentPosition();
    } catch {
      // Error is handled by the hook
    }
  };

  const handleOptionsChange = (options: PositionOptions) => {
    setTrackingOptions(options);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📍 Location Services Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Access and track your device's GPS location using the Geolocation API.
        This demo shows current coordinates, location tracking, and mapping
        capabilities.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {!isSupported && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Geolocation is not supported by this browser.
        </Alert>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Controls
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<MyLocationIcon />}
              onClick={handleGetCurrentPosition}
              disabled={!isSupported}
            >
              Get Current Location
            </Button>

            {!isTracking ? (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartTracking}
                disabled={!isSupported}
              >
                Start Tracking
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={stopTracking}
              >
                Stop Tracking
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearHistory}
              disabled={history.coordinates.length === 0}
            >
              Clear History
            </Button>

            <Button
              variant="outlined"
              startIcon={<TimelineIcon />}
              onClick={() => setShowHistory(true)}
            >
              View History
            </Button>

            <Button
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => setShowSettings(true)}
            >
              Settings
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={isSupported ? "Geolocation Supported" : "Not Supported"}
              color={isSupported ? "success" : "error"}
              variant={isSupported ? "filled" : "outlined"}
            />
            {hasPermission && (
              <Chip
                label="Permission Granted"
                color="success"
                icon={<LocationOnIcon />}
              />
            )}
            {isTracking && (
              <Chip
                label="Tracking Active"
                color="primary"
                icon={<MyLocationIcon />}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Current Location and Map */}
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <LocationDisplay
              location={currentLocation}
              title="Current Location"
              showDetails={true}
            />
          </Box>
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <LocationMap
              location={currentLocation}
              history={history.coordinates}
            />
          </Box>
        </Box>

        {/* Location Statistics */}
        <LocationStats history={history} currentLocation={currentLocation} />
      </Box>

      {/* Implementation hints */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: "background.default" }}>
        <Typography variant="h6" gutterBottom>
          💡 Implementation Hints
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Uses Geolocation API for GPS access and location tracking
          <br />
          • Implements permission handling for location services
          <br />
          • Provides real-time location updates with watchPosition
          <br />
          • Calculates distances using Haversine formula
          <br />
          • Includes location history and statistics tracking
          <br />• Integrates with OpenStreetMap for basic mapping display
        </Typography>
      </Paper>

      {/* History Dialog */}
      <HistoryDialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={history.coordinates}
        formatCoordinates={formatCoordinates}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onOptionsChange={handleOptionsChange}
      />
    </Box>
  );
};

export default LocationDemo;
