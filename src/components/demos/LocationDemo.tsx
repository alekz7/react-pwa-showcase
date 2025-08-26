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
  Fab,
  Tooltip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ClearIcon from "@mui/icons-material/Clear";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import MapIcon from "@mui/icons-material/Map";
import TimelineIcon from "@mui/icons-material/Timeline";
import SpeedIcon from "@mui/icons-material/Speed";
import ExploreIcon from "@mui/icons-material/Explore";
import TuneIcon from "@mui/icons-material/Tune";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import RouteIcon from "@mui/icons-material/Route";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from "react-leaflet";
import { Icon, type LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
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

// Fix Leaflet default markers
delete (Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationMapProps {
  location: LocationCoordinates | null;
  history: LocationCoordinates[];
  showTrail?: boolean;
  showAccuracyCircle?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({
  location,
  history,
  showTrail = true,
  showAccuracyCircle = true,
}) => {
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([51.505, -0.09]); // Default to London
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (location) {
      setMapCenter([location.latitude, location.longitude]);
      setZoom(15);
    }
  }, [location]);

  if (!location) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <MapIcon color="primary" />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Interactive Map
            </Typography>
          </Box>
          <Box
            sx={{
              height: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "grey.100",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Enable location tracking to see interactive map
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Create trail path from history
  const trailPath: LatLngTuple[] = history.map((coord) => [
    coord.latitude,
    coord.longitude,
  ]);

  // Calculate distance for the last segment
  const getLastSegmentDistance = () => {
    if (history.length < 2) return null;
    const lastTwo = history.slice(-2);
    return calculateDistance(
      lastTwo[0].latitude,
      lastTwo[0].longitude,
      lastTwo[1].latitude,
      lastTwo[1].longitude
    );
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MapIcon color="primary" />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Interactive Map
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Center on current location">
              <Fab
                size="small"
                color="primary"
                onClick={() => {
                  setMapCenter([location.latitude, location.longitude]);
                  setZoom(16);
                }}
              >
                <CenterFocusStrongIcon />
              </Fab>
            </Tooltip>
          </Box>
        </Box>

        <Box
          sx={{
            height: 400,
            borderRadius: 1,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Current location marker */}
            <Marker position={[location.latitude, location.longitude]}>
              <Popup>
                <div>
                  <strong>Current Location</strong>
                  <br />
                  Lat: {location.latitude.toFixed(6)}
                  <br />
                  Lng: {location.longitude.toFixed(6)}
                  <br />
                  Accuracy: ±{location.accuracy?.toFixed(0)}m<br />
                  {location.speed && `Speed: ${location.speed.toFixed(1)} m/s`}
                  <br />
                  Time: {new Date(location.timestamp).toLocaleTimeString()}
                </div>
              </Popup>
            </Marker>

            {/* Accuracy circle */}
            {showAccuracyCircle && location.accuracy && (
              <Circle
                center={[location.latitude, location.longitude]}
                radius={location.accuracy}
                pathOptions={{
                  color: "#2196F3",
                  fillColor: "#2196F3",
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            )}

            {/* Trail polyline */}
            {showTrail && trailPath.length > 1 && (
              <Polyline
                positions={trailPath}
                pathOptions={{
                  color: "#FF5722",
                  weight: 3,
                  opacity: 0.8,
                }}
              />
            )}

            {/* Historical markers for significant points */}
            {history.slice(-10).map((coord, index) => {
              if (index === history.length - 1) return null; // Skip current location

              // Create custom icon safely
              let customIcon;
              try {
                customIcon = new Icon({
                  iconUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                  iconSize: [20, 32],
                  iconAnchor: [10, 32],
                  popupAnchor: [0, -32],
                });
              } catch {
                // Fallback to default icon if custom icon creation fails
                customIcon = undefined;
              }

              return (
                <Marker
                  key={index}
                  position={[coord.latitude, coord.longitude]}
                  {...(customIcon && { icon: customIcon })}
                >
                  <Popup>
                    <div>
                      <strong>Point #{index + 1}</strong>
                      <br />
                      Lat: {coord.latitude.toFixed(6)}
                      <br />
                      Lng: {coord.longitude.toFixed(6)}
                      <br />
                      Time: {new Date(coord.timestamp).toLocaleTimeString()}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
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
          {trailPath.length > 1 && (
            <Chip
              size="small"
              icon={<RouteIcon />}
              label={`${getLastSegmentDistance()?.toFixed(0)}m last segment`}
              color="info"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate distance between two points
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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

interface GeofenceProps {
  currentLocation: LocationCoordinates | null;
}

const GeofenceDemo: React.FC<GeofenceProps> = ({ currentLocation }) => {
  const [geofences, setGeofences] = useState<
    Array<{
      id: string;
      name: string;
      center: { lat: number; lng: number };
      radius: number;
      isInside: boolean;
    }>
  >([]);
  const [newFenceName, setNewFenceName] = useState("");
  const [newFenceRadius, setNewFenceRadius] = useState(100);

  // Check if current location is inside any geofences
  useEffect(() => {
    if (!currentLocation) return;

    setGeofences((prev) =>
      prev.map((fence) => {
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          fence.center.lat,
          fence.center.lng
        );
        return {
          ...fence,
          isInside: distance <= fence.radius,
        };
      })
    );
  }, [currentLocation]);

  const addGeofence = () => {
    if (!currentLocation || !newFenceName.trim()) return;

    const newFence = {
      id: Date.now().toString(),
      name: newFenceName.trim(),
      center: { lat: currentLocation.latitude, lng: currentLocation.longitude },
      radius: newFenceRadius,
      isInside: true, // We're creating it at current location
    };

    setGeofences((prev) => [...prev, newFence]);
    setNewFenceName("");
  };

  const removeGeofence = (id: string) => {
    setGeofences((prev) => prev.filter((fence) => fence.id !== id));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🚧 Geofencing Demo
        </Typography>

        {!currentLocation ? (
          <Typography variant="body2" color="text.secondary">
            Enable location tracking to use geofencing features
          </Typography>
        ) : (
          <>
            {/* Add new geofence */}
            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Create Geofence at Current Location
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "end",
                }}
              >
                <TextField
                  size="small"
                  label="Fence Name"
                  value={newFenceName}
                  onChange={(e) => setNewFenceName(e.target.value)}
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  label="Radius (m)"
                  type="number"
                  value={newFenceRadius}
                  onChange={(e) => setNewFenceRadius(Number(e.target.value))}
                  sx={{ width: 100 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={addGeofence}
                  disabled={!newFenceName.trim()}
                >
                  Add Fence
                </Button>
              </Box>
            </Box>

            {/* Active geofences */}
            {geofences.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {geofences.map((fence) => (
                  <Box
                    key={fence.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: fence.isInside ? "success.main" : "grey.300",
                      borderRadius: 1,
                      bgcolor: fence.isInside
                        ? "success.light"
                        : "background.paper",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">{fence.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Center: {fence.center.lat.toFixed(4)},{" "}
                        {fence.center.lng.toFixed(4)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Radius: {fence.radius}m
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={fence.isInside ? "INSIDE" : "OUTSIDE"}
                        color={fence.isInside ? "success" : "default"}
                        size="small"
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeGeofence(fence.id)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No geofences created. Add one using your current location.
              </Typography>
            )}
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
    clearHistory,
    clearError,
    formatCoordinates,
  } = useLocation();

  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [showAccuracyCircle, setShowAccuracyCircle] = useState(true);
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

          {/* Map Display Options */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showTrail}
                  onChange={(e) => setShowTrail(e.target.checked)}
                  size="small"
                />
              }
              label="Show Trail"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showAccuracyCircle}
                  onChange={(e) => setShowAccuracyCircle(e.target.checked)}
                  size="small"
                />
              }
              label="Show Accuracy Circle"
            />
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
              showTrail={showTrail}
              showAccuracyCircle={showAccuracyCircle}
            />
          </Box>
        </Box>

        {/* Location Statistics */}
        <LocationStats history={history} currentLocation={currentLocation} />

        {/* Geofencing Demo */}
        <GeofenceDemo currentLocation={currentLocation} />
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
          • Interactive Leaflet map with markers, trails, and accuracy circles
          <br />
          • Calculates distances using Haversine formula
          <br />
          • Includes location history and statistics tracking
          <br />
          • Geofencing demonstration with custom boundaries
          <br />• Real-time trail visualization and location analytics
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
