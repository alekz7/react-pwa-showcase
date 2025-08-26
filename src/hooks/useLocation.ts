import { useState, useEffect, useCallback, useRef } from "react";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface LocationHistory {
  coordinates: LocationCoordinates[];
  distances: number[];
  totalDistance: number;
}

export interface UseLocationReturn {
  // State
  isTracking: boolean;
  hasPermission: boolean;
  currentLocation: LocationCoordinates | null;
  history: LocationHistory;
  error: string | null;
  isSupported: boolean;
  // Actions
  startTracking: (options?: PositionOptions) => Promise<void>;
  stopTracking: () => void;
  getCurrentPosition: () => Promise<LocationCoordinates>;
  requestPermission: () => Promise<boolean>;
  clearHistory: () => void;
  clearError: () => void;
  // Utilities
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => number;
  formatCoordinates: (lat: number, lon: number) => string;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000, // 1 minute
};

const HISTORY_LIMIT = 100;

// Haversine formula to calculate distance between two points
const calculateDistanceBetweenPoints = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const formatCoordinatesString = (lat: number, lon: number): string => {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  const latAbs = Math.abs(lat);
  const lonAbs = Math.abs(lon);

  const latDeg = Math.floor(latAbs);
  const latMin = Math.floor((latAbs - latDeg) * 60);
  const latSec = ((latAbs - latDeg - latMin / 60) * 3600).toFixed(2);

  const lonDeg = Math.floor(lonAbs);
  const lonMin = Math.floor((lonAbs - lonDeg) * 60);
  const lonSec = ((lonAbs - lonDeg - lonMin / 60) * 3600).toFixed(2);

  return `${latDeg}°${latMin}'${latSec}"${latDir}, ${lonDeg}°${lonMin}'${lonSec}"${lonDir}`;
};

export const useLocation = (): UseLocationReturn => {
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoordinates | null>(null);
  const [history, setHistory] = useState<LocationHistory>({
    coordinates: [],
    distances: [],
    totalDistance: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => "geolocation" in navigator);

  // Refs for tracking
  const watchIdRef = useRef<number | null>(null);
  const trackingOptionsRef = useRef<PositionOptions>(DEFAULT_OPTIONS);

  const addToHistory = useCallback((location: LocationCoordinates) => {
    setHistory((prev) => {
      const newCoordinates = [
        ...prev.coordinates.slice(-HISTORY_LIMIT + 1),
        location,
      ];
      let newDistances = [...prev.distances];
      let newTotalDistance = prev.totalDistance;

      // Calculate distance from previous location
      if (prev.coordinates.length > 0) {
        const lastLocation = prev.coordinates[prev.coordinates.length - 1];
        const distance = calculateDistanceBetweenPoints(
          lastLocation.latitude,
          lastLocation.longitude,
          location.latitude,
          location.longitude
        );
        newDistances = [...newDistances.slice(-HISTORY_LIMIT + 1), distance];
        newTotalDistance += distance;
      }

      return {
        coordinates: newCoordinates,
        distances: newDistances,
        totalDistance: newTotalDistance,
      };
    });
  }, []);

  const convertPosition = useCallback(
    (position: GeolocationPosition): LocationCoordinates => {
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };
    },
    []
  );

  const handlePositionSuccess = useCallback(
    (position: GeolocationPosition) => {
      const locationData = convertPosition(position);
      setCurrentLocation(locationData);
      addToHistory(locationData);
      setError(null);
    },
    [convertPosition, addToHistory]
  );

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = "Location error occurred";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location access denied by user";
        setHasPermission(false);
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information unavailable";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out";
        break;
      default:
        errorMessage = `Location error: ${error.message}`;
        break;
    }

    setError(errorMessage);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      if (!isSupported) {
        throw new Error("Geolocation is not supported by this browser");
      }

      // Check if permissions API is available
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permission.state === "granted") {
          setHasPermission(true);
          return true;
        } else if (permission.state === "denied") {
          setHasPermission(false);
          throw new Error("Geolocation permission denied");
        }
        // If prompt, we'll try to get position which will trigger permission request
      }

      // Try to get current position to trigger permission request
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            setHasPermission(true);
            resolve(true);
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setHasPermission(false);
              setError("Geolocation permission denied");
              resolve(false);
            } else {
              // Other errors don't necessarily mean permission denied
              setHasPermission(true);
              resolve(true);
            }
          },
          { timeout: 5000 }
        );
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to request location permission";
      setError(errorMessage);
      setHasPermission(false);
      return false;
    }
  }, [isSupported]);

  const getCurrentPosition =
    useCallback(async (): Promise<LocationCoordinates> => {
      return new Promise((resolve, reject) => {
        if (!isSupported) {
          reject(new Error("Geolocation is not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationData = convertPosition(position);
            setCurrentLocation(locationData);
            setError(null);
            resolve(locationData);
          },
          (error) => {
            handlePositionError(error);
            reject(
              new Error(`Failed to get current position: ${error.message}`)
            );
          },
          trackingOptionsRef.current
        );
      });
    }, [isSupported, convertPosition, handlePositionError]);

  const startTracking = useCallback(
    async (options?: PositionOptions) => {
      try {
        setError(null);

        if (!isSupported) {
          throw new Error("Geolocation is not supported by this browser");
        }

        // Update tracking options
        if (options) {
          trackingOptionsRef.current = { ...DEFAULT_OPTIONS, ...options };
        }

        // Request permission if needed
        const permissionGranted = await requestPermission();
        if (!permissionGranted) {
          throw new Error("Location permission denied");
        }

        // Stop any existing tracking
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        // Start watching position
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePositionSuccess,
          handlePositionError,
          trackingOptionsRef.current
        );

        setIsTracking(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to start location tracking";
        setError(errorMessage);
        throw err;
      }
    },
    [isSupported, requestPermission, handlePositionSuccess, handlePositionError]
  );

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory({
      coordinates: [],
      distances: [],
      totalDistance: 0,
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const calculateDistance = useCallback(calculateDistanceBetweenPoints, []);
  const formatCoordinates = useCallback(formatCoordinatesString, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    // State
    isTracking,
    hasPermission,
    currentLocation,
    history,
    error,
    isSupported,
    // Actions
    startTracking,
    stopTracking,
    getCurrentPosition,
    requestPermission,
    clearHistory,
    clearError,
    // Utilities
    calculateDistance,
    formatCoordinates,
  };
};
