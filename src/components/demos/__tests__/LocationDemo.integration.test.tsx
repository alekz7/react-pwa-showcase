import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LocationDemo } from "../LocationDemo";
import type { LocationCoordinates } from "../../../hooks/useLocation";

// Mock Leaflet components
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  Polyline: () => <div data-testid="polyline" />,
  Circle: () => <div data-testid="accuracy-circle" />,
}));

// Mock leaflet CSS import
vi.mock("leaflet/dist/leaflet.css", () => ({}));

// Mock leaflet Icon
vi.mock("leaflet", () => {
  const MockIcon = vi.fn().mockImplementation(() => ({
    options: {},
  }));

  // Add Default property to MockIcon
  Object.assign(MockIcon, {
    Default: {
      prototype: {
        _getIconUrl: vi.fn(),
      },
      mergeOptions: vi.fn(),
    },
  });

  return {
    Icon: MockIcon,
  };
});

// Mock the useLocation hook
const mockUseLocation = {
  isTracking: false,
  hasPermission: false,
  currentLocation: null as LocationCoordinates | null,
  history: {
    coordinates: [] as LocationCoordinates[],
    distances: [] as number[],
    totalDistance: 0,
  },
  error: null as string | null,
  isSupported: true,
  startTracking: vi.fn(),
  stopTracking: vi.fn(),
  getCurrentPosition: vi.fn(),
  clearHistory: vi.fn(),
  clearError: vi.fn(),
  formatCoordinates: vi.fn((lat: number, lon: number) => `${lat}°N ${lon}°W`),
};

vi.mock("../../../hooks/useLocation", () => ({
  useLocation: () => mockUseLocation,
}));

describe("LocationDemo Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockUseLocation.isTracking = false;
    mockUseLocation.hasPermission = false;
    mockUseLocation.currentLocation = null;
    mockUseLocation.history = {
      coordinates: [],
      distances: [],
      totalDistance: 0,
    };
    mockUseLocation.error = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders location demo with all components", () => {
    render(<LocationDemo />);

    expect(screen.getByText("📍 Location Services Demo")).toBeInTheDocument();
    expect(screen.getByText("Get Current Location")).toBeInTheDocument();
    expect(screen.getByText("Start Tracking")).toBeInTheDocument();
    expect(screen.getByText("Interactive Map")).toBeInTheDocument();
    expect(screen.getByText("📊 Location Statistics")).toBeInTheDocument();
    expect(screen.getByText("🚧 Geofencing Demo")).toBeInTheDocument();
  });

  it("shows map placeholder when no location is available", () => {
    render(<LocationDemo />);

    expect(
      screen.getByText("Enable location tracking to see interactive map")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enable location tracking to use geofencing features")
    ).toBeInTheDocument();
  });

  it("displays interactive map when location is available", () => {
    mockUseLocation.currentLocation = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: Date.now(),
    };

    render(<LocationDemo />);

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
    expect(screen.getByTestId("marker")).toBeInTheDocument();
  });

  it("shows location trail when history is available", () => {
    const mockHistory = [
      {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: Date.now() - 60000,
      },
      {
        latitude: 37.775,
        longitude: -122.4195,
        accuracy: 8,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: 1.5,
        timestamp: Date.now(),
      },
    ];

    mockUseLocation.currentLocation = mockHistory[1];
    mockUseLocation.history = {
      coordinates: mockHistory,
      distances: [15.2],
      totalDistance: 0.015,
    };

    render(<LocationDemo />);

    expect(screen.getByTestId("polyline")).toBeInTheDocument();
    expect(screen.getByText("2 points")).toBeInTheDocument();
  });

  it("handles location tracking start/stop", async () => {
    render(<LocationDemo />);

    const startButton = screen.getByText("Start Tracking");
    fireEvent.click(startButton);

    expect(mockUseLocation.startTracking).toHaveBeenCalledWith({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });

    // Simulate tracking started
    mockUseLocation.isTracking = true;

    render(<LocationDemo />);
    const stopButton = screen.getByText("Stop Tracking");
    fireEvent.click(stopButton);

    expect(mockUseLocation.stopTracking).toHaveBeenCalled();
  });

  it("handles get current position", async () => {
    render(<LocationDemo />);

    const getCurrentButton = screen.getByText("Get Current Location");
    fireEvent.click(getCurrentButton);

    expect(mockUseLocation.getCurrentPosition).toHaveBeenCalled();
  });

  it("displays location statistics correctly", () => {
    const mockHistory = [
      {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: 2.0,
        timestamp: Date.now() - 120000,
      },
      {
        latitude: 37.775,
        longitude: -122.4195,
        accuracy: 8,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: 1.5,
        timestamp: Date.now() - 60000,
      },
      {
        latitude: 37.7751,
        longitude: -122.4196,
        accuracy: 12,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: 1.8,
        timestamp: Date.now(),
      },
    ];

    mockUseLocation.currentLocation = mockHistory[2];
    mockUseLocation.history = {
      coordinates: mockHistory,
      distances: [15.2, 12.8],
      totalDistance: 0.028,
    };

    render(<LocationDemo />);

    expect(screen.getByText("3")).toBeInTheDocument(); // Points tracked
    expect(screen.getByText("0.03 km")).toBeInTheDocument(); // Total distance
  });

  it("handles geofencing functionality", async () => {
    mockUseLocation.currentLocation = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: Date.now(),
    };

    render(<LocationDemo />);

    // Add a geofence
    const nameInput = screen.getByLabelText("Fence Name");
    const radiusInput = screen.getByLabelText("Radius (m)");
    const addButton = screen.getByText("Add Fence");

    fireEvent.change(nameInput, { target: { value: "Test Fence" } });
    fireEvent.change(radiusInput, { target: { value: "50" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Test Fence")).toBeInTheDocument();
      expect(screen.getByText("INSIDE")).toBeInTheDocument();
    });
  });

  it("toggles map display options", () => {
    mockUseLocation.currentLocation = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: Date.now(),
    };

    render(<LocationDemo />);

    const trailSwitch = screen.getByLabelText("Show Trail");
    const accuracySwitch = screen.getByLabelText("Show Accuracy Circle");

    expect(trailSwitch).toBeChecked();
    expect(accuracySwitch).toBeChecked();

    fireEvent.click(trailSwitch);
    fireEvent.click(accuracySwitch);

    expect(trailSwitch).not.toBeChecked();
    expect(accuracySwitch).not.toBeChecked();
  });

  it("opens and closes history dialog", async () => {
    const mockHistory = [
      {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: Date.now(),
      },
    ];

    mockUseLocation.history = {
      coordinates: mockHistory,
      distances: [],
      totalDistance: 0,
    };

    render(<LocationDemo />);

    const historyButton = screen.getByText("View History");
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(screen.getByText("Location History")).toBeInTheDocument();
    });

    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Location History")).not.toBeInTheDocument();
    });
  });

  it("opens and closes settings dialog", async () => {
    render(<LocationDemo />);

    const settingsButton = screen.getByText("Settings");
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText("Location Settings")).toBeInTheDocument();
      expect(screen.getByLabelText("High Accuracy")).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("Location Settings")).not.toBeInTheDocument();
    });
  });

  it("handles errors gracefully", () => {
    mockUseLocation.error = "Location access denied";

    render(<LocationDemo />);

    expect(screen.getByText("Location access denied")).toBeInTheDocument();
  });

  it("shows unsupported browser message", () => {
    mockUseLocation.isSupported = false;

    render(<LocationDemo />);

    expect(
      screen.getByText("Geolocation is not supported by this browser.")
    ).toBeInTheDocument();
    expect(screen.getByText("Not Supported")).toBeInTheDocument();
  });

  it("clears location history", () => {
    mockUseLocation.history = {
      coordinates: [
        {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          timestamp: Date.now(),
        },
      ],
      distances: [],
      totalDistance: 0,
    };

    render(<LocationDemo />);

    const clearButton = screen.getByText("Clear History");
    fireEvent.click(clearButton);

    expect(mockUseLocation.clearHistory).toHaveBeenCalled();
  });
});
